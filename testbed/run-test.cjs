/**
 * Hair Style Generation Test Bed
 *
 * Tests hair style prompts by sending user photo + prompt to Gemini API
 * Supports both direct Gemini calls and n8n webhook (parallel).
 *
 * Usage:
 *   node testbed/run-test.cjs --photo test-photos/my-photo.jpg
 *   node testbed/run-test.cjs --photo test-photos/my-photo.jpg --styles m-가르마펌,m-댄디컷
 *   node testbed/run-test.cjs --photo test-photos/my-photo.jpg --gender male --limit 5
 *   node testbed/run-test.cjs --photo test-photos/my-photo.jpg --via n8n
 *   node testbed/run-test.cjs --photo test-photos/my-photo.jpg --model gemini-2.5-flash-image
 *   node testbed/run-test.cjs --photo test-photos/my-photo.jpg --model gemini-3-pro-image
 */
const fs = require('fs');
const path = require('path');

// ─── Config ────────────────────────────────────────────────────────
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const N8N_WEBHOOK = process.env.VITE_N8N_URL
  ? `${process.env.VITE_N8N_URL}/webhook/hair-style-generate`
  : 'http://192.168.50.88:5678/webhook/hair-style-generate';

const CONCURRENCY = 3; // parallel API calls
const RESULTS_DIR = path.join(__dirname, 'results');

// ─── Parse Args ────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}
function hasFlag(name) {
  return args.includes(`--${name}`);
}

const photoPath = getArg('photo');
const filterStyles = getArg('styles')?.split(',') || null;
const filterGender = getArg('gender');
const limit = parseInt(getArg('limit') || '0', 10);
const via = getArg('via') || 'gemini'; // 'gemini' or 'n8n'
const modelArg = getArg('model') || 'gemini-2.5-flash-image';
const dryRun = hasFlag('dry-run');

if (!photoPath) {
  console.error(`
Usage: node testbed/run-test.cjs --photo <path-to-photo> [options]

Options:
  --photo <path>      Test photo (required). Relative to testbed/ or absolute.
  --styles <ids>      Comma-separated style IDs to test (e.g., m-가르마펌,m-댄디컷)
  --gender <m/f>      Filter by gender: male or female
  --limit <n>         Max number of styles to test
  --via <method>      'gemini' (direct API) or 'n8n' (webhook)
  --model <name>      Gemini model: gemini-2.5-flash-image, gemini-3-pro-image
  --dry-run           Show what would be tested without calling API

Examples:
  node testbed/run-test.cjs --photo test-photos/my-face.jpg --gender male --limit 3
  node testbed/run-test.cjs --photo test-photos/my-face.jpg --styles m-가르마펌 --model gemini-3-pro-image
`);
  process.exit(1);
}

// ─── Helpers ───────────────────────────────────────────────────────

function loadTestPhoto(photoArg) {
  let fullPath = photoArg;
  if (!path.isAbsolute(fullPath)) {
    fullPath = path.join(__dirname, fullPath);
  }
  if (!fs.existsSync(fullPath)) {
    // Try relative to project root
    fullPath = path.join(__dirname, '..', photoArg);
  }
  if (!fs.existsSync(fullPath)) {
    console.error(`Photo not found: ${photoArg}`);
    process.exit(1);
  }
  const buffer = fs.readFileSync(fullPath);
  const ext = path.extname(fullPath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return {
    base64: buffer.toString('base64'),
    dataUrl: `data:${mime};base64,${buffer.toString('base64')}`,
    mime,
    path: fullPath,
  };
}

function buildPrompt(style) {
  return `You are a photo editing AI. Your task is to COPY this photo exactly and ONLY change the hair.

STEP 1: Copy every pixel of this photo exactly as-is.
STEP 2: Replace ONLY the hair with: ${style.nameKo} (${style.name})

HAIR DETAILS:
- Style: ${style.description}
- Volume: natural volume
- Part: left side part

NEVER CHANGE (copy exactly):
- Face (eyes, nose, mouth, ears, chin, cheeks, forehead, eyebrows)
- Skin color and texture
- Facial expression
- Neck and body
- Clothes
- Background
- Lighting
- Camera angle

The output must be the SAME PERSON with ONLY different hair. This is a hair salon preview - the person stays identical, only hair changes.`;
}

async function callGemini(photo, prompt, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [{
      parts: [
        { inline_data: { mime_type: photo.mime, data: photo.base64 } },
        { text: prompt },
      ],
    }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
      temperature: 0.1,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API ${res.status}: ${errText.substring(0, 200)}`);
  }

  const data = await res.json();

  if (data.candidates?.[0]?.content?.parts) {
    for (const part of data.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  }
  throw new Error('No image in Gemini response');
}

async function callN8n(photo, prompt, style) {
  const body = {
    prompt,
    image: photo.dataUrl,
    style: {
      id: style.styleId,
      name: style.name,
      nameKo: style.nameKo,
    },
    settings: { color: 'natural', volume: 'natural', parting: 'left' },
    model: 'gemini',
  };

  const res = await fetch(N8N_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`n8n webhook ${res.status}: ${errText.substring(0, 200)}`);
  }

  const data = await res.json();
  if (data.image) {
    return data.image.startsWith('data:') ? data.image : `data:image/png;base64,${data.image}`;
  }
  if (data.url) return data.url;
  throw new Error('No image in n8n response');
}

function saveResult(styleId, imageData) {
  const sanitizedId = styleId.replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const fileName = `${sanitizedId}_${timestamp}.png`;
  const filePath = path.join(RESULTS_DIR, fileName);

  if (imageData.startsWith('data:')) {
    const base64 = imageData.split('base64,')[1];
    fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
  } else {
    fs.writeFileSync(filePath, Buffer.from(imageData, 'base64'));
  }

  return fileName;
}

// Parallel execution with concurrency control
async function runParallel(tasks, concurrency) {
  const results = [];
  let idx = 0;

  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('  Hair Style Generation Test Bed');
  console.log('='.repeat(60));

  // Load config
  const configPath = path.join(__dirname, 'test-config.json');
  if (!fs.existsSync(configPath)) {
    console.log('Config not found. Running extract-prompts first...');
    require('child_process').execSync('node testbed/extract-prompts.cjs', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
    });
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  // Filter styles
  let styles = config.styles;
  if (filterStyles) {
    styles = styles.filter(s => filterStyles.includes(s.styleId));
  }
  if (filterGender) {
    styles = styles.filter(s => s.gender === filterGender);
  }
  if (limit > 0) {
    styles = styles.slice(0, limit);
  }

  console.log(`\nTest photo: ${photoPath}`);
  console.log(`Model: ${modelArg}`);
  console.log(`Method: ${via}`);
  console.log(`Styles to test: ${styles.length}`);
  console.log(`Concurrency: ${CONCURRENCY}`);

  if (styles.length === 0) {
    console.error('\nNo styles matched your filters.');
    process.exit(1);
  }

  // Show what will be tested
  console.log('\nStyles:');
  styles.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.styleId} - ${s.nameKo} (${s.name})`);
    if (s.referenceImage) console.log(`     ref: ${s.referenceImage}`);
  });

  if (dryRun) {
    console.log('\n[DRY RUN] Would test the above styles. Exiting.');
    // Also print prompt for first style
    const prompt = buildPrompt(styles[0]);
    console.log(`\nSample prompt for ${styles[0].nameKo}:\n`);
    console.log(prompt);
    process.exit(0);
  }

  // Load test photo
  console.log('\nLoading test photo...');
  const photo = loadTestPhoto(photoPath);
  console.log(`  Photo: ${photo.path} (${photo.mime})`);

  // Ensure results dir
  if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });

  // Build run ID for this test session
  const runId = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const runDir = path.join(RESULTS_DIR, `run_${runId}`);
  fs.mkdirSync(runDir, { recursive: true });

  // Copy test photo to results
  fs.copyFileSync(photo.path, path.join(runDir, `_input${path.extname(photo.path)}`));

  // Run tests
  console.log(`\nStarting generation (${via})...\n`);
  const startTime = Date.now();
  const testResults = [];

  const tasks = styles.map((style, idx) => async () => {
    const styleNum = `[${idx + 1}/${styles.length}]`;
    console.log(`${styleNum} Generating: ${style.nameKo} (${style.name})...`);
    const prompt = buildPrompt(style);
    const t0 = Date.now();

    try {
      let resultImage;
      if (via === 'n8n') {
        resultImage = await callN8n(photo, prompt, style);
      } else {
        resultImage = await callGemini(photo, prompt, modelArg);
      }

      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`${styleNum} ✅ ${style.nameKo} - ${elapsed}s`);

      // Save result
      const sanitizedId = style.styleId.replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
      const fileName = `${sanitizedId}.png`;
      const filePath = path.join(runDir, fileName);

      if (resultImage.startsWith('data:')) {
        const base64 = resultImage.split('base64,')[1];
        fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
      }

      testResults.push({
        styleId: style.styleId,
        name: style.name,
        nameKo: style.nameKo,
        description: style.description,
        referenceImage: style.referenceImage,
        resultFile: fileName,
        success: true,
        elapsed: parseFloat(elapsed),
        prompt,
      });
    } catch (err) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.error(`${styleNum} ❌ ${style.nameKo} - ${elapsed}s - ${err.message}`);
      testResults.push({
        styleId: style.styleId,
        name: style.name,
        nameKo: style.nameKo,
        description: style.description,
        referenceImage: style.referenceImage,
        resultFile: null,
        success: false,
        error: err.message,
        elapsed: parseFloat(elapsed),
        prompt: buildPrompt(style),
      });
    }
  });

  await runParallel(tasks, CONCURRENCY);

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const successCount = testResults.filter(r => r.success).length;
  const failCount = testResults.filter(r => !r.success).length;

  console.log('\n' + '='.repeat(60));
  console.log(`  Results: ${successCount} success, ${failCount} failed (${totalElapsed}s total)`);
  console.log(`  Output: ${runDir}`);
  console.log('='.repeat(60));

  // Save results manifest
  const manifest = {
    runId,
    timestamp: new Date().toISOString(),
    model: modelArg,
    method: via,
    testPhoto: path.basename(photo.path),
    totalStyles: styles.length,
    success: successCount,
    failed: failCount,
    totalElapsed: parseFloat(totalElapsed),
    results: testResults,
  };

  fs.writeFileSync(
    path.join(runDir, '_manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );

  // Generate comparison HTML
  generateComparisonHtml(runDir, manifest);

  console.log(`\nOpen comparison: ${path.join(runDir, 'comparison.html')}`);
}

// ─── HTML Comparison Generator ─────────────────────────────────────

function generateComparisonHtml(runDir, manifest) {
  const refBase = path.join(__dirname, '..', 'public');

  const styleCards = manifest.results.map(r => {
    // Copy reference image to run dir if exists
    let refSrc = null;
    if (r.referenceImage) {
      const refFullPath = path.join(refBase, r.referenceImage);
      if (fs.existsSync(refFullPath)) {
        const refFileName = `ref_${path.basename(r.referenceImage)}`;
        fs.copyFileSync(refFullPath, path.join(runDir, refFileName));
        refSrc = refFileName;
      }
    }

    return `
    <div class="card ${r.success ? '' : 'failed'}">
      <div class="card-header">
        <h3>${r.nameKo} <small>(${r.name})</small></h3>
        <span class="badge ${r.success ? 'success' : 'error'}">${r.success ? `${r.elapsed}s` : 'FAILED'}</span>
      </div>
      <p class="desc">${r.description}</p>
      <div class="images">
        <div class="img-box">
          <label>Reference</label>
          ${refSrc ? `<img src="${refSrc}" alt="Reference" />` : '<div class="no-img">No reference</div>'}
        </div>
        <div class="img-box">
          <label>Input</label>
          <img src="_input${path.extname(manifest.testPhoto)}" alt="Input" />
        </div>
        <div class="img-box">
          <label>Result (${manifest.model})</label>
          ${r.resultFile ? `<img src="${r.resultFile}" alt="Result" />` : `<div class="no-img">${r.error || 'Error'}</div>`}
        </div>
      </div>
      <details>
        <summary>Prompt</summary>
        <pre>${escapeHtml(r.prompt)}</pre>
      </details>
    </div>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hair Style Test - ${manifest.runId}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e0e0e0; padding: 20px; }
  h1 { margin-bottom: 8px; }
  .meta { color: #888; margin-bottom: 24px; font-size: 14px; }
  .meta span { margin-right: 16px; }
  .stats { display: flex; gap: 12px; margin-bottom: 24px; }
  .stat { background: #1a1a1a; border-radius: 12px; padding: 16px 20px; flex: 1; text-align: center; }
  .stat .num { font-size: 28px; font-weight: bold; }
  .stat .label { font-size: 12px; color: #888; margin-top: 4px; }
  .stat.ok .num { color: #4ade80; }
  .stat.fail .num { color: #f87171; }
  .stat.time .num { color: #60a5fa; }
  .grid { display: flex; flex-direction: column; gap: 20px; }
  .card { background: #1a1a1a; border-radius: 16px; padding: 20px; border: 1px solid #333; }
  .card.failed { border-color: #7f1d1d; }
  .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .card-header h3 { font-size: 18px; }
  .card-header small { color: #888; font-weight: normal; }
  .badge { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .badge.success { background: #064e3b; color: #4ade80; }
  .badge.error { background: #7f1d1d; color: #f87171; }
  .desc { font-size: 13px; color: #aaa; margin-bottom: 12px; line-height: 1.4; }
  .images { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .img-box { text-align: center; }
  .img-box label { display: block; font-size: 11px; color: #888; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  .img-box img { width: 100%; aspect-ratio: 3/4; object-fit: cover; border-radius: 10px; background: #222; }
  .no-img { width: 100%; aspect-ratio: 3/4; background: #222; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #666; font-size: 13px; }
  details { margin-top: 12px; }
  summary { cursor: pointer; color: #60a5fa; font-size: 13px; }
  pre { margin-top: 8px; background: #111; padding: 12px; border-radius: 8px; font-size: 12px; overflow-x: auto; white-space: pre-wrap; color: #bbb; }
</style>
</head>
<body>
  <h1>Hair Style Generation Test</h1>
  <div class="meta">
    <span>Run: ${manifest.runId}</span>
    <span>Model: ${manifest.model}</span>
    <span>Method: ${manifest.method}</span>
  </div>
  <div class="stats">
    <div class="stat"><div class="num">${manifest.totalStyles}</div><div class="label">Total Styles</div></div>
    <div class="stat ok"><div class="num">${manifest.success}</div><div class="label">Success</div></div>
    <div class="stat fail"><div class="num">${manifest.failed}</div><div class="label">Failed</div></div>
    <div class="stat time"><div class="num">${manifest.totalElapsed}s</div><div class="label">Total Time</div></div>
  </div>
  <div class="grid">
    ${styleCards}
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(runDir, 'comparison.html'), html, 'utf-8');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Run ───────────────────────────────────────────────────────────
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

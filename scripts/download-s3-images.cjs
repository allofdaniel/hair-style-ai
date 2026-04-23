/**
 * Downloads all S3-hosted hairstyle thumbnails to local public/hairstyles/ directory
 * and updates hairStyles.ts to use local paths instead of S3 URLs.
 *
 * Usage: node scripts/download-s3-images.cjs
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const HAIR_STYLES_PATH = path.join(__dirname, '..', 'src', 'data', 'hairStyles.ts');
const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'hairstyles');

// Extract all S3 URLs and their line context from hairStyles.ts
function extractS3Urls(content) {
  const entries = [];
  const regex = /thumbnail:\s*'(https:\/\/hairstyle-ai-references\.s3[^']+)'/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const url = match[1];
    // Decode the URL-encoded Korean filename
    const decodedUrl = decodeURIComponent(url);
    const filename = decodedUrl.split('/').pop();
    entries.push({ url, decodedFilename: filename });
  }
  return entries;
}

// Parse Korean filename to determine gender and generate a clean local filename
function parseFilename(decodedFilename) {
  // Filenames are like "남자 아이리쉬펌.jpg" or "여자 kpop 아이돌.jpg"
  const isMale = decodedFilename.startsWith('남자');
  const isFemale = decodedFilename.startsWith('여자');
  const gender = isMale ? 'male' : isFemale ? 'female' : 'unknown';

  // Remove gender prefix and clean up
  let cleanName = decodedFilename
    .replace(/^(남자|여자)\s*/, '')
    .replace(/\.jpg$/i, '')
    .trim();

  // Convert Korean name to a URL-safe slug
  // Keep the Korean characters but replace spaces with hyphens
  const slug = cleanName
    .replace(/\s+/g, '-')
    .toLowerCase();

  return { gender, slug, localPath: `/hairstyles/${gender}/${slug}.jpg` };
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Skip if already exists
    if (fs.existsSync(destPath)) {
      const stat = fs.statSync(destPath);
      if (stat.size > 1000) {
        resolve('skipped');
        return;
      }
    }

    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(destPath);
        downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve('downloaded');
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('  Download S3 Hairstyle Images & Update Local Paths');
  console.log('='.repeat(60));

  const content = fs.readFileSync(HAIR_STYLES_PATH, 'utf-8');
  const entries = extractS3Urls(content);

  console.log(`\nFound ${entries.length} S3-hosted thumbnails\n`);

  // Build replacement map: S3 URL -> local path
  const replacements = new Map();
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const { gender, slug, localPath } = parseFilename(entry.decodedFilename);
    const destPath = path.join(PUBLIC_DIR, gender, `${slug}.jpg`);

    process.stdout.write(`[${i + 1}/${entries.length}] ${entry.decodedFilename} ... `);

    try {
      const result = await downloadFile(entry.url, destPath);
      if (result === 'skipped') {
        console.log('SKIPPED (exists)');
        skipped++;
      } else {
        const stat = fs.statSync(destPath);
        console.log(`OK (${(stat.size / 1024).toFixed(1)}KB)`);
        downloaded++;
      }
      replacements.set(entry.url, localPath);
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDownloads: ${downloaded} new, ${skipped} skipped, ${failed} failed`);

  // Update hairStyles.ts with local paths
  if (replacements.size > 0) {
    console.log(`\nUpdating hairStyles.ts with ${replacements.size} local paths...`);
    let updated = content;
    for (const [s3Url, localPath] of replacements) {
      updated = updated.replace(s3Url, localPath);
    }

    fs.writeFileSync(HAIR_STYLES_PATH, updated, 'utf-8');
    console.log('  hairStyles.ts updated!');
  }

  // Also regenerate test-config.json
  console.log('\nRegenerating test-config.json...');
  try {
    require('child_process').execSync('node testbed/extract-prompts.cjs', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
    });
  } catch (e) {
    console.log('  Warning: Could not regenerate test-config.json:', e.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('  Done!');
  console.log('='.repeat(60));
}

main().catch(console.error);

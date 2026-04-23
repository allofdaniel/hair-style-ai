/**
 * Extract all hair styles into a testable JSON config.
 * PRIMARY SOURCE: hairStyles.ts (has all styles with thumbnails)
 * ENHANCEMENT: detailedHairPrompts.ts (adds rich descriptions for some styles)
 *
 * Usage: node testbed/extract-prompts.cjs
 * Output: testbed/test-config.json
 */
const fs = require('fs');
const path = require('path');

// ============ Parse hairStyles.ts (PRIMARY) ============
const hairStylesFile = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'data', 'hairStyles.ts'),
  'utf-8'
);

function parseHairStyles(content) {
  const styles = [];
  const blocks = content.split(/\{/).slice(1);

  for (const block of blocks) {
    const idMatch = block.match(/id:\s*'([^']+)'/);
    const nameMatch = block.match(/name:\s*'([^']+)'/);
    const nameKoMatch = block.match(/nameKo:\s*'([^']+)'/);
    const categoryMatch = block.match(/category:\s*'([^']+)'/);
    const genderMatch = block.match(/gender:\s*'(male|female)'/);
    const thumbnailMatch = block.match(/thumbnail:\s*'([^']+)'/);

    if (idMatch && nameMatch && nameKoMatch && genderMatch) {
      // Only include actual hair styles (must have gender = male|female)
      // This filters out category entries like {id:'all', name:'All', ...}
      styles.push({
        id: idMatch[1],
        name: nameMatch[1],
        nameKo: nameKoMatch[1],
        category: categoryMatch?.[1] || 'unknown',
        gender: genderMatch[1],
        thumbnail: thumbnailMatch?.[1] || null,
      });
    }
  }
  return styles;
}

const allStyles = parseHairStyles(hairStylesFile);

// ============ Parse detailedHairPrompts.ts (ENHANCEMENT) ============
const promptsFile = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'data', 'detailedHairPrompts.ts'),
  'utf-8'
);

function parsePrompts(content) {
  const entries = {};
  const regex = /'([^']+)':\s*\{[^}]*styleId:\s*'([^']+)'[^}]*description:\s*'([^']*(?:\\.[^']*)*)'[^}]*keywords:\s*\[([^\]]*)\]/g;

  let match;
  while ((match = regex.exec(content)) !== null) {
    const [, , styleId, description, keywordsStr] = match;
    const keywords = keywordsStr
      .split(',')
      .map(k => k.trim().replace(/^'|'$/g, ''))
      .filter(Boolean);

    entries[styleId] = {
      description: description.replace(/\\'/g, "'"),
      keywords,
    };
  }
  return entries;
}

const detailedPrompts = parsePrompts(promptsFile);

// ============ Build fuzzy ID matcher ============
// Some IDs in detailedHairPrompts don't exactly match hairStyles
// e.g., 'm-사이드-스웹' vs 'm-사이드-스웹트'
function normalizeId(id) {
  return id.replace(/^[mf]-/, '').replace(/-/g, '').toLowerCase();
}

function findDetailedPrompt(styleId) {
  // Exact match first
  if (detailedPrompts[styleId]) return detailedPrompts[styleId];

  // Fuzzy match by normalized ID
  const normalized = normalizeId(styleId);
  for (const [pid, prompt] of Object.entries(detailedPrompts)) {
    const pNorm = normalizeId(pid);
    if (pNorm === normalized || normalized.includes(pNorm) || pNorm.includes(normalized)) {
      return prompt;
    }
  }
  return null;
}

// ============ Map reference images ============
const refDir = path.join(__dirname, '..', 'public', 'hair-references');
const refFiles = fs.existsSync(refDir)
  ? fs.readdirSync(refDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'))
  : [];

function findRefImage(styleId) {
  const normalized = normalizeId(styleId);
  for (const f of refFiles) {
    const baseName = f.replace(/\.(png|jpg)$/, '');
    const baseNorm = normalizeId(baseName);
    if (baseNorm === normalized || normalized.includes(baseNorm) || baseNorm.includes(normalized)) {
      return `/hair-references/${f}`;
    }
  }
  return null;
}

// ============ Build test config ============
const testStyles = [];
const seenIds = new Set();

// Add ALL styles from hairStyles.ts (primary source)
for (const style of allStyles) {
  if (seenIds.has(style.id)) continue;
  seenIds.add(style.id);

  const detailed = findDetailedPrompt(style.id);
  const refImage = findRefImage(style.id);

  testStyles.push({
    styleId: style.id,
    name: style.name,
    nameKo: style.nameKo,
    gender: style.gender,
    category: style.category,
    description: detailed?.description || `${style.name} (${style.nameKo}) hairstyle`,
    keywords: detailed?.keywords || [],
    thumbnail: style.thumbnail,
    referenceImage: refImage,
    hasDetailedPrompt: !!detailed,
  });
}

// Add any detailed prompts not in hairStyles.ts
for (const [pid, prompt] of Object.entries(detailedPrompts)) {
  if (seenIds.has(pid)) continue;
  seenIds.add(pid);

  const gender = pid.startsWith('f-') ? 'female' : 'male';
  const refImage = findRefImage(pid);

  testStyles.push({
    styleId: pid,
    name: pid,
    nameKo: pid,
    gender,
    category: 'unknown',
    description: prompt.description,
    keywords: prompt.keywords,
    thumbnail: null,
    referenceImage: refImage,
    hasDetailedPrompt: true,
    unmatchedId: true,
  });
}

// Sort: detailed prompts first, then by gender/category
testStyles.sort((a, b) => {
  if (a.hasDetailedPrompt !== b.hasDetailedPrompt) return a.hasDetailedPrompt ? -1 : 1;
  if (a.gender !== b.gender) return a.gender === 'male' ? -1 : 1;
  return a.category.localeCompare(b.category);
});

const config = {
  generatedAt: new Date().toISOString(),
  totalStyles: testStyles.length,
  stylesWithThumbnails: testStyles.filter(s => s.thumbnail).length,
  stylesWithDetailedPrompts: testStyles.filter(s => s.hasDetailedPrompt).length,
  stylesWithRefs: testStyles.filter(s => s.referenceImage).length,
  geminiModel: 'gemini-2.0-flash-exp',
  styles: testStyles,
};

const configJson = JSON.stringify(config, null, 2);

// Output to testbed/ (for local dev)
const outPath = path.join(__dirname, 'test-config.json');
fs.writeFileSync(outPath, configJson, 'utf-8');

// Also output to public/testbed/ (for Vercel deployment)
const publicTestbedDir = path.join(__dirname, '..', 'public', 'testbed');
if (!fs.existsSync(publicTestbedDir)) {
  fs.mkdirSync(publicTestbedDir, { recursive: true });
}
const publicOutPath = path.join(publicTestbedDir, 'test-config.json');
fs.writeFileSync(publicOutPath, configJson, 'utf-8');

// Copy index.html to public/testbed/ as well
const srcHtml = path.join(__dirname, 'index.html');
const destHtml = path.join(publicTestbedDir, 'index.html');
if (fs.existsSync(srcHtml)) {
  fs.copyFileSync(srcHtml, destHtml);
}

console.log(`✅ Extracted ${testStyles.length} styles`);
console.log(`   - With thumbnails: ${config.stylesWithThumbnails}`);
console.log(`   - With detailed prompts: ${config.stylesWithDetailedPrompts}`);
console.log(`   - With reference images: ${config.stylesWithRefs}`);
console.log(`   - Male: ${testStyles.filter(s => s.gender === 'male').length}`);
console.log(`   - Female: ${testStyles.filter(s => s.gender === 'female').length}`);
console.log(`   - Unmatched IDs: ${testStyles.filter(s => s.unmatchedId).length}`);
console.log(`\nSaved to: ${outPath}`);
console.log(`Also copied to: ${publicOutPath}`);

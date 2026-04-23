const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://ugzsuswrazaimvpyloqw.supabase.co';
const BUCKET_NAME = 'hairstyles';
const BASE_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`;

// Load the file mapping
const mappingPath = path.join(__dirname, 'supabase-file-mapping.json');
const fileMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

// Read hairStyles.ts
const hairStylesPath = path.join(__dirname, '..', 'src', 'data', 'hairStyles.ts');
let content = fs.readFileSync(hairStylesPath, 'utf8');

// Create reverse mapping for thumbnails (from local path to Supabase URL)
// Thumbnails: /hairstyles/male/xxx.jpg -> thumbnails/male/xxx.jpg
// GIFs: /hairstyles/gif/xxx.gif -> need mapping

// Build thumbnail URL replacements
const thumbnailReplacements = [];
const gifReplacements = [];

// Process mappings
for (const [originalPath, safePath] of Object.entries(fileMapping)) {
  if (originalPath.startsWith('thumbnails/')) {
    // Thumbnail files - transform /hairstyles/xxx to Supabase URL
    const localPath = originalPath.replace('thumbnails/', '/hairstyles/');
    const supabaseUrl = `${BASE_URL}/${safePath}`;
    thumbnailReplacements.push({ from: localPath, to: supabaseUrl });
  } else if (originalPath.startsWith('gif/')) {
    // GIF files - these have Korean names encoded
    // We need to match based on the nameKo field in hairStyles
    const supabaseUrl = `${BASE_URL}/${safePath}`;
    gifReplacements.push({ original: originalPath, safePath, supabaseUrl });
  }
}

console.log(`Found ${thumbnailReplacements.length} thumbnail mappings`);
console.log(`Found ${gifReplacements.length} GIF mappings`);

// Replace thumbnail paths with Supabase URLs
let replacedCount = 0;
for (const { from, to } of thumbnailReplacements) {
  // Escape special regex characters
  const escapedFrom = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`'${escapedFrom}'`, 'g');
  const matches = content.match(regex);
  if (matches) {
    content = content.replace(regex, `'${to}'`);
    replacedCount += matches.length;
  }
}
console.log(`Replaced ${replacedCount} thumbnail paths`);

// For GIFs, we need to create a mapping from style nameKo to the GIF URL
// The GIF files are named like "남자 360 웨이브.gif" which matches nameKo
const gifMapping = {};
for (const { original, supabaseUrl } of gifReplacements) {
  // Extract Korean name from original path (e.g., "gif/남자 360 웨이브.gif" -> "360 웨이브")
  const filename = original.replace('gif/', '').replace('.gif', '');
  // Remove gender prefix (남자/여자)
  const parts = filename.split(' ');
  const gender = parts[0]; // 남자 or 여자
  const styleName = parts.slice(1).join(' '); // rest is style name
  gifMapping[filename] = supabaseUrl;
}

// Now we need to update the gif paths in hairStyles.ts
// The current paths are like '/hairstyles/gif/m-360-wave.gif' but we need to map them to Korean names

// Extract all style definitions and match them to GIF files
const styleRegex = /\{[\s\S]*?id:\s*'([^']+)'[\s\S]*?nameKo:\s*'([^']+)'[\s\S]*?gender:\s*'(male|female)'[\s\S]*?(?:gif:\s*'([^']+)')?[\s\S]*?\}/g;

let match;
const styleToGif = {};
const tempContent = content;
while ((match = styleRegex.exec(tempContent)) !== null) {
  const [, id, nameKo, gender, currentGif] = match;
  const genderKo = gender === 'male' ? '남자' : '여자';
  const fullKoreanName = `${genderKo} ${nameKo}`;

  if (gifMapping[fullKoreanName]) {
    styleToGif[id] = gifMapping[fullKoreanName];
  }
}

console.log(`Mapped ${Object.keys(styleToGif).length} styles to GIF URLs`);

// Replace gif paths
let gifReplacedCount = 0;
for (const [styleId, gifUrl] of Object.entries(styleToGif)) {
  // Find the style block and update the gif path
  const styleBlockRegex = new RegExp(
    `(\\{[\\s\\S]*?id:\\s*'${styleId}'[\\s\\S]*?)(gif:\\s*'[^']*')(\\s*,?[\\s\\S]*?\\})`,
    'g'
  );

  const beforeLength = content.length;
  content = content.replace(styleBlockRegex, (match, before, gifPart, after) => {
    return `${before}gif: '${gifUrl}'${after}`;
  });

  if (content.length !== beforeLength || content.includes(gifUrl)) {
    gifReplacedCount++;
  }
}

console.log(`Updated ${gifReplacedCount} GIF paths`);

// Write the updated file
fs.writeFileSync(hairStylesPath, content);
console.log('\nhairStyles.ts has been updated with Supabase URLs!');
console.log(`Base URL: ${BASE_URL}`);

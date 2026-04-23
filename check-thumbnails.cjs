const fs = require('fs');
const path = require('path');

// Read the test-config.json file
const configPath = path.join(__dirname, 'testbed', 'test-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const styles = config.styles || [];
const publicDir = path.join(__dirname, 'public');

console.log('🔍 Analyzing hairstyle thumbnails...\n');

// Categories for tracking
const validThumbnails = [];
const nullOrEmptyThumbnails = [];
const brokenThumbnails = [];

// Check each style
styles.forEach((style) => {
  const { styleId, name, nameKo, thumbnail } = style;

  // Check if thumbnail is null or empty
  if (!thumbnail || thumbnail.trim() === '') {
    nullOrEmptyThumbnails.push({
      styleId,
      name,
      nameKo,
      thumbnail: thumbnail || '(null)'
    });
    return;
  }

  // Check if thumbnail starts with /hairstyles/
  if (thumbnail.startsWith('/hairstyles/')) {
    // Remove leading slash and check if file exists
    const relativePath = thumbnail.substring(1); // Remove leading /
    const fullPath = path.join(publicDir, relativePath);

    if (fs.existsSync(fullPath)) {
      validThumbnails.push({
        styleId,
        name,
        thumbnail
      });
    } else {
      brokenThumbnails.push({
        styleId,
        name,
        nameKo,
        thumbnail,
        expectedPath: fullPath
      });
    }
  } else {
    // Thumbnail doesn't start with /hairstyles/ - might be external URL or different path
    validThumbnails.push({
      styleId,
      name,
      thumbnail,
      note: 'Non-hairstyles path (might be external URL)'
    });
  }
});

// Generate report
console.log('═══════════════════════════════════════════════════════════');
console.log('📊 THUMBNAIL ANALYSIS REPORT');
console.log('═══════════════════════════════════════════════════════════\n');

console.log(`📈 Total styles: ${styles.length}`);
console.log(`✅ Styles with valid thumbnails: ${validThumbnails.length}`);
console.log(`⚠️  Styles with null/empty thumbnails: ${nullOrEmptyThumbnails.length}`);
console.log(`❌ Styles with broken thumbnails: ${brokenThumbnails.length}\n`);

if (nullOrEmptyThumbnails.length > 0) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('⚠️  STYLES WITH NULL/EMPTY THUMBNAILS');
  console.log('═══════════════════════════════════════════════════════════\n');

  nullOrEmptyThumbnails.forEach((style, idx) => {
    console.log(`${idx + 1}. Style ID: ${style.styleId}`);
    console.log(`   Name: ${style.name}`);
    console.log(`   Name (KO): ${style.nameKo}`);
    console.log(`   Thumbnail: ${style.thumbnail}`);
    console.log('');
  });
}

if (brokenThumbnails.length > 0) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('❌ STYLES WITH BROKEN THUMBNAILS (Path set but file missing)');
  console.log('═══════════════════════════════════════════════════════════\n');

  brokenThumbnails.forEach((style, idx) => {
    console.log(`${idx + 1}. Style ID: ${style.styleId}`);
    console.log(`   Name: ${style.name}`);
    console.log(`   Name (KO): ${style.nameKo}`);
    console.log(`   Thumbnail path: ${style.thumbnail}`);
    console.log(`   Expected file: ${style.expectedPath}`);
    console.log('');
  });
}

// Summary
console.log('═══════════════════════════════════════════════════════════');
console.log('📝 SUMMARY');
console.log('═══════════════════════════════════════════════════════════\n');

const totalIssues = nullOrEmptyThumbnails.length + brokenThumbnails.length;
const healthPercentage = ((validThumbnails.length / styles.length) * 100).toFixed(2);

console.log(`Health Status: ${healthPercentage}% (${validThumbnails.length}/${styles.length})`);
console.log(`Total Issues: ${totalIssues}`);
console.log(`  - Null/Empty: ${nullOrEmptyThumbnails.length}`);
console.log(`  - Broken Links: ${brokenThumbnails.length}\n`);

// Save detailed report to file
const reportPath = path.join(__dirname, 'thumbnail-report.json');
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalStyles: styles.length,
    validThumbnails: validThumbnails.length,
    nullOrEmpty: nullOrEmptyThumbnails.length,
    brokenLinks: brokenThumbnails.length,
    healthPercentage: parseFloat(healthPercentage)
  },
  nullOrEmptyThumbnails,
  brokenThumbnails,
  validThumbnails: validThumbnails.slice(0, 10) // Only include first 10 for brevity
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`📄 Detailed report saved to: ${reportPath}\n`);

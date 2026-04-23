const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sourceIcon = path.join(__dirname, '..', 'newappicon2.png');
const androidResDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

// Android mipmap sizes
const sizes = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

// Foreground sizes for adaptive icons (108dp safe zone)
const foregroundSizes = [
  { folder: 'mipmap-mdpi', size: 108 },
  { folder: 'mipmap-hdpi', size: 162 },
  { folder: 'mipmap-xhdpi', size: 216 },
  { folder: 'mipmap-xxhdpi', size: 324 },
  { folder: 'mipmap-xxxhdpi', size: 432 },
];

async function generateIcons() {
  console.log('Generating Android icons from:', sourceIcon);

  // Get source image metadata
  const metadata = await sharp(sourceIcon).metadata();
  console.log(`Source image: ${metadata.width}x${metadata.height}`);

  // Generate regular icons (ic_launcher.png) - fit width exactly, crop top/bottom if needed
  for (const { folder, size } of sizes) {
    const outputPath = path.join(androidResDir, folder, 'ic_launcher.png');
    await sharp(sourceIcon)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toFile(outputPath);
    console.log(`Created: ${folder}/ic_launcher.png (${size}x${size})`);

    // Also create round version
    const roundOutputPath = path.join(androidResDir, folder, 'ic_launcher_round.png');
    await sharp(sourceIcon)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toFile(roundOutputPath);
    console.log(`Created: ${folder}/ic_launcher_round.png (${size}x${size})`);
  }

  // Generate foreground icons for adaptive icons
  // These need padding (icon should be ~66% of total size for safe zone)
  // Background color matches ic_launcher_background.xml (#E91E63)
  const bgColor = { r: 191, g: 100, b: 86, alpha: 255 }; // #BF6456 warm rose-gold midpoint

  for (const { folder, size } of foregroundSizes) {
    const outputPath = path.join(androidResDir, folder, 'ic_launcher_foreground.png');
    const innerSize = Math.round(size * 0.72); // 72% of size for safe zone
    const padding = Math.round((size - innerSize) / 2);

    // Create the icon with cover fit (width matches exactly)
    const resizedIcon = await sharp(sourceIcon)
      .resize(innerSize, innerSize, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toBuffer();

    // Create canvas with pink background (same as adaptive icon background)
    // This fills any transparent corners from the rounded source icon
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: bgColor
      }
    })
      .composite([{
        input: resizedIcon,
        left: padding,
        top: padding
      }])
      .png()
      .toFile(outputPath);

    console.log(`Created: ${folder}/ic_launcher_foreground.png (${size}x${size}, inner: ${innerSize}x${innerSize})`);
  }

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);

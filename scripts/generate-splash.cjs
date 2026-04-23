const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sourceIcon = path.join(__dirname, '..', 'app_icon.png');
const androidResDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

// Splash screen sizes (portrait)
const portraitSizes = [
  { folder: 'drawable-port-mdpi', width: 320, height: 480 },
  { folder: 'drawable-port-hdpi', width: 480, height: 800 },
  { folder: 'drawable-port-xhdpi', width: 720, height: 1280 },
  { folder: 'drawable-port-xxhdpi', width: 1080, height: 1920 },
  { folder: 'drawable-port-xxxhdpi', width: 1440, height: 2560 },
];

// Landscape sizes
const landscapeSizes = [
  { folder: 'drawable-land-mdpi', width: 480, height: 320 },
  { folder: 'drawable-land-hdpi', width: 800, height: 480 },
  { folder: 'drawable-land-xhdpi', width: 1280, height: 720 },
  { folder: 'drawable-land-xxhdpi', width: 1920, height: 1080 },
  { folder: 'drawable-land-xxxhdpi', width: 2560, height: 1440 },
];

// Generic sizes
const genericSizes = [
  { folder: 'drawable', width: 480, height: 800 },
  { folder: 'drawable-hdpi', width: 480, height: 800 },
  { folder: 'drawable-xhdpi', width: 720, height: 1280 },
  { folder: 'drawable-xxhdpi', width: 1080, height: 1920 },
  { folder: 'drawable-xxxhdpi', width: 1440, height: 2560 },
  { folder: 'drawable-land', width: 800, height: 480 },
];

// Background color matching app icon (pink)
const bgColor = { r: 233, g: 30, b: 99 }; // #E91E63

async function generateSplash() {
  console.log('Generating splash screens from:', sourceIcon);

  const allSizes = [...portraitSizes, ...landscapeSizes, ...genericSizes];

  for (const { folder, width, height } of allSizes) {
    const outputPath = path.join(androidResDir, folder, 'splash.png');

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Calculate icon size (about 30% of the smaller dimension)
    const iconSize = Math.round(Math.min(width, height) * 0.35);

    // Resize the icon
    const resizedIcon = await sharp(sourceIcon)
      .resize(iconSize, iconSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();

    // Create splash with gradient background and centered icon
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: bgColor
      }
    })
      .composite([{
        input: resizedIcon,
        left: Math.round((width - iconSize) / 2),
        top: Math.round((height - iconSize) / 2)
      }])
      .png()
      .toFile(outputPath);

    console.log(`Created: ${folder}/splash.png (${width}x${height})`);
  }

  console.log('\nAll splash screens generated successfully!');
}

generateSplash().catch(console.error);

const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'store-graphics');

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Color scheme matching the app icon
const colors = {
  gradientStart: '#7B68EE', // Medium slate blue
  gradientEnd: '#9370DB',   // Medium purple
  accent: '#E6E6FA',        // Lavender
  white: '#FFFFFF',
  darkPurple: '#4B0082'
};

// Draw sparkle/star shape
function drawSparkle(ctx, x, y, size, color = colors.white) {
  ctx.fillStyle = color;
  ctx.beginPath();

  // 4-pointed star
  const innerRadius = size * 0.15;
  const outerRadius = size;

  for (let i = 0; i < 8; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / 4 - Math.PI / 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }

  ctx.closePath();
  ctx.fill();
}

// Draw sparkle with circle center
function drawSparkleWithCenter(ctx, x, y, size, color = colors.white) {
  drawSparkle(ctx, x, y, size, color);
  ctx.beginPath();
  ctx.arc(x, y, size * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = colors.gradientStart;
  ctx.fill();
}

// Create gradient background
function createGradient(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#6B5CE7');
  gradient.addColorStop(0.5, '#8B6FD9');
  gradient.addColorStop(1, '#9B6FCB');
  return gradient;
}

// 1. App Icon 512x512 (already exists, but creating backup)
async function createAppIcon() {
  const canvas = createCanvas(512, 512);
  const ctx = canvas.getContext('2d');

  // Background gradient
  ctx.fillStyle = createGradient(ctx, 512, 512);
  ctx.fillRect(0, 0, 512, 512);

  // Main large sparkle
  drawSparkle(ctx, 180, 230, 100);

  // Medium sparkle with center
  drawSparkleWithCenter(ctx, 320, 180, 55);

  // Small sparkle with center
  drawSparkleWithCenter(ctx, 300, 330, 45);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outputDir, 'app-icon-512.png'), buffer);
  console.log('Created: app-icon-512.png');
}

// 2. Feature Graphic 1024x500
async function createFeatureGraphic() {
  const canvas = createCanvas(1024, 500);
  const ctx = canvas.getContext('2d');

  // Background gradient
  ctx.fillStyle = createGradient(ctx, 1024, 500);
  ctx.fillRect(0, 0, 1024, 500);

  // Decorative sparkles
  drawSparkle(ctx, 100, 100, 40, 'rgba(255,255,255,0.3)');
  drawSparkle(ctx, 900, 80, 30, 'rgba(255,255,255,0.25)');
  drawSparkle(ctx, 950, 400, 35, 'rgba(255,255,255,0.3)');
  drawSparkle(ctx, 80, 420, 25, 'rgba(255,255,255,0.2)');

  // Main sparkles group (left side)
  drawSparkle(ctx, 200, 250, 80);
  drawSparkleWithCenter(ctx, 320, 180, 45);
  drawSparkleWithCenter(ctx, 300, 320, 35);

  // App name
  ctx.fillStyle = colors.white;
  ctx.font = 'bold 72px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BeforeCut', 650, 220);

  // Tagline
  ctx.font = '32px Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('AI Hairstyle Preview', 650, 280);

  // Subtitle
  ctx.font = '24px Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('See your new look before you cut', 650, 340);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outputDir, 'feature-graphic-1024x500.png'), buffer);
  console.log('Created: feature-graphic-1024x500.png');
}

// 3. Phone Screenshots 1080x1920 (9:16)
async function createPhoneScreenshots() {
  const width = 1080;
  const height = 1920;

  // Screenshot 1: Welcome/Hero
  const canvas1 = createCanvas(width, height);
  const ctx1 = canvas1.getContext('2d');

  ctx1.fillStyle = createGradient(ctx1, width, height);
  ctx1.fillRect(0, 0, width, height);

  // Sparkles
  drawSparkle(ctx1, 540, 500, 150);
  drawSparkleWithCenter(ctx1, 750, 380, 80);
  drawSparkleWithCenter(ctx1, 700, 620, 60);

  // Text
  ctx1.fillStyle = colors.white;
  ctx1.font = 'bold 80px Arial, sans-serif';
  ctx1.textAlign = 'center';
  ctx1.fillText('BeforeCut', 540, 950);

  ctx1.font = '40px Arial, sans-serif';
  ctx1.fillStyle = 'rgba(255,255,255,0.9)';
  ctx1.fillText('AI Hairstyle Preview', 540, 1020);

  ctx1.font = '32px Arial, sans-serif';
  ctx1.fillStyle = 'rgba(255,255,255,0.7)';
  ctx1.fillText('Try new hairstyles with AI', 540, 1100);
  ctx1.fillText('before your haircut', 540, 1150);

  // Feature boxes
  const features = [
    '✨ AI-Powered Preview',
    '💇 50+ Hairstyles',
    '📸 Instant Results',
    '🎨 Men & Women Styles'
  ];

  ctx1.font = '36px Arial, sans-serif';
  ctx1.fillStyle = colors.white;
  features.forEach((feature, i) => {
    ctx1.fillText(feature, 540, 1350 + i * 70);
  });

  fs.writeFileSync(path.join(outputDir, 'screenshot-1-hero.png'), canvas1.toBuffer('image/png'));
  console.log('Created: screenshot-1-hero.png');

  // Screenshot 2: Features
  const canvas2 = createCanvas(width, height);
  const ctx2 = canvas2.getContext('2d');

  ctx2.fillStyle = createGradient(ctx2, width, height);
  ctx2.fillRect(0, 0, width, height);

  ctx2.fillStyle = colors.white;
  ctx2.font = 'bold 64px Arial, sans-serif';
  ctx2.textAlign = 'center';
  ctx2.fillText('How It Works', 540, 300);

  // Steps
  const steps = [
    { num: '1', text: 'Take a selfie or', text2: 'upload your photo' },
    { num: '2', text: 'Choose from 50+', text2: 'trendy hairstyles' },
    { num: '3', text: 'AI generates your', text2: 'new look instantly' },
    { num: '4', text: 'Save & share with', text2: 'friends' }
  ];

  steps.forEach((step, i) => {
    const y = 500 + i * 320;

    // Circle with number
    ctx2.beginPath();
    ctx2.arc(250, y, 60, 0, Math.PI * 2);
    ctx2.fillStyle = 'rgba(255,255,255,0.2)';
    ctx2.fill();

    ctx2.fillStyle = colors.white;
    ctx2.font = 'bold 48px Arial, sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText(step.num, 250, y + 18);

    // Text
    ctx2.font = '40px Arial, sans-serif';
    ctx2.textAlign = 'left';
    ctx2.fillText(step.text, 350, y - 10);
    ctx2.fillStyle = 'rgba(255,255,255,0.8)';
    ctx2.fillText(step.text2, 350, y + 40);
    ctx2.fillStyle = colors.white;
  });

  fs.writeFileSync(path.join(outputDir, 'screenshot-2-howto.png'), canvas2.toBuffer('image/png'));
  console.log('Created: screenshot-2-howto.png');

  // Screenshot 3: Styles
  const canvas3 = createCanvas(width, height);
  const ctx3 = canvas3.getContext('2d');

  ctx3.fillStyle = createGradient(ctx3, width, height);
  ctx3.fillRect(0, 0, width, height);

  ctx3.fillStyle = colors.white;
  ctx3.font = 'bold 64px Arial, sans-serif';
  ctx3.textAlign = 'center';
  ctx3.fillText('50+ Hairstyles', 540, 300);

  ctx3.font = '36px Arial, sans-serif';
  ctx3.fillStyle = 'rgba(255,255,255,0.8)';
  ctx3.fillText('For Men & Women', 540, 370);

  // Style categories
  const menStyles = ['Two Block', 'Undercut', 'Comma Hair', 'Fade Cut', 'Pomade Style'];
  const womenStyles = ['Bob Cut', 'Pixie Cut', 'Wave Perm', 'Layered', 'Bangs'];

  // Men section
  ctx3.fillStyle = colors.white;
  ctx3.font = 'bold 44px Arial, sans-serif';
  ctx3.fillText("👨 Men's Styles", 540, 550);

  ctx3.font = '32px Arial, sans-serif';
  menStyles.forEach((style, i) => {
    ctx3.fillText(`• ${style}`, 540, 630 + i * 55);
  });

  // Women section
  ctx3.font = 'bold 44px Arial, sans-serif';
  ctx3.fillText("👩 Women's Styles", 540, 1050);

  ctx3.font = '32px Arial, sans-serif';
  womenStyles.forEach((style, i) => {
    ctx3.fillText(`• ${style}`, 540, 1130 + i * 55);
  });

  // Sparkle decoration
  drawSparkle(ctx3, 150, 700, 40, 'rgba(255,255,255,0.3)');
  drawSparkle(ctx3, 930, 1200, 35, 'rgba(255,255,255,0.3)');

  fs.writeFileSync(path.join(outputDir, 'screenshot-3-styles.png'), canvas3.toBuffer('image/png'));
  console.log('Created: screenshot-3-styles.png');

  // Screenshot 4: CTA
  const canvas4 = createCanvas(width, height);
  const ctx4 = canvas4.getContext('2d');

  ctx4.fillStyle = createGradient(ctx4, width, height);
  ctx4.fillRect(0, 0, width, height);

  // Large sparkles
  drawSparkle(ctx4, 540, 600, 200);
  drawSparkleWithCenter(ctx4, 800, 450, 100);
  drawSparkleWithCenter(ctx4, 750, 750, 80);

  ctx4.fillStyle = colors.white;
  ctx4.font = 'bold 72px Arial, sans-serif';
  ctx4.textAlign = 'center';
  ctx4.fillText('Try It Now!', 540, 1150);

  ctx4.font = '40px Arial, sans-serif';
  ctx4.fillStyle = 'rgba(255,255,255,0.9)';
  ctx4.fillText('Discover your perfect', 540, 1250);
  ctx4.fillText('hairstyle today', 540, 1310);

  // Download button look
  ctx4.fillStyle = 'rgba(255,255,255,0.2)';
  ctx4.roundRect(340, 1420, 400, 80, 40);
  ctx4.fill();

  ctx4.fillStyle = colors.white;
  ctx4.font = 'bold 36px Arial, sans-serif';
  ctx4.fillText('Download Free', 540, 1475);

  fs.writeFileSync(path.join(outputDir, 'screenshot-4-cta.png'), canvas4.toBuffer('image/png'));
  console.log('Created: screenshot-4-cta.png');
}

// 4. Tablet Screenshots 1200x1920 (for 7-inch) and 1600x2560 (for 10-inch)
async function createTabletScreenshots() {
  // 7-inch tablet (1200x1920)
  const canvas7 = createCanvas(1200, 1920);
  const ctx7 = canvas7.getContext('2d');

  ctx7.fillStyle = createGradient(ctx7, 1200, 1920);
  ctx7.fillRect(0, 0, 1200, 1920);

  // Sparkles
  drawSparkle(ctx7, 600, 500, 180);
  drawSparkleWithCenter(ctx7, 850, 380, 100);
  drawSparkleWithCenter(ctx7, 800, 650, 70);

  ctx7.fillStyle = colors.white;
  ctx7.font = 'bold 96px Arial, sans-serif';
  ctx7.textAlign = 'center';
  ctx7.fillText('BeforeCut', 600, 1000);

  ctx7.font = '48px Arial, sans-serif';
  ctx7.fillStyle = 'rgba(255,255,255,0.9)';
  ctx7.fillText('AI Hairstyle Preview', 600, 1080);

  ctx7.font = '36px Arial, sans-serif';
  ctx7.fillStyle = 'rgba(255,255,255,0.7)';
  ctx7.fillText('Try 50+ hairstyles before your haircut', 600, 1180);

  const features7 = [
    '✨ AI-Powered Technology',
    '💇 Men & Women Styles',
    '📸 Instant Results',
    '🎨 Easy to Use'
  ];

  ctx7.font = '40px Arial, sans-serif';
  ctx7.fillStyle = colors.white;
  features7.forEach((feature, i) => {
    ctx7.fillText(feature, 600, 1400 + i * 80);
  });

  fs.writeFileSync(path.join(outputDir, 'tablet-7inch-screenshot.png'), canvas7.toBuffer('image/png'));
  console.log('Created: tablet-7inch-screenshot.png');

  // 10-inch tablet (1600x2560)
  const canvas10 = createCanvas(1600, 2560);
  const ctx10 = canvas10.getContext('2d');

  ctx10.fillStyle = createGradient(ctx10, 1600, 2560);
  ctx10.fillRect(0, 0, 1600, 2560);

  // Sparkles
  drawSparkle(ctx10, 800, 700, 240);
  drawSparkleWithCenter(ctx10, 1150, 520, 130);
  drawSparkleWithCenter(ctx10, 1100, 900, 100);

  ctx10.fillStyle = colors.white;
  ctx10.font = 'bold 120px Arial, sans-serif';
  ctx10.textAlign = 'center';
  ctx10.fillText('BeforeCut', 800, 1350);

  ctx10.font = '60px Arial, sans-serif';
  ctx10.fillStyle = 'rgba(255,255,255,0.9)';
  ctx10.fillText('AI Hairstyle Preview', 800, 1450);

  ctx10.font = '44px Arial, sans-serif';
  ctx10.fillStyle = 'rgba(255,255,255,0.7)';
  ctx10.fillText('Try 50+ hairstyles before your haircut', 800, 1580);

  const features10 = [
    '✨ AI-Powered Technology',
    '💇 Men & Women Styles',
    '📸 Instant Results',
    '🎨 Easy to Use'
  ];

  ctx10.font = '52px Arial, sans-serif';
  ctx10.fillStyle = colors.white;
  features10.forEach((feature, i) => {
    ctx10.fillText(feature, 800, 1850 + i * 100);
  });

  fs.writeFileSync(path.join(outputDir, 'tablet-10inch-screenshot.png'), canvas10.toBuffer('image/png'));
  console.log('Created: tablet-10inch-screenshot.png');
}

// Run all
async function main() {
  console.log('Generating store graphics...\n');

  await createAppIcon();
  await createFeatureGraphic();
  await createPhoneScreenshots();
  await createTabletScreenshots();

  console.log('\n✅ All graphics created in:', outputDir);
  console.log('\nFiles created:');
  console.log('- app-icon-512.png (512x512)');
  console.log('- feature-graphic-1024x500.png (1024x500)');
  console.log('- screenshot-1-hero.png (1080x1920)');
  console.log('- screenshot-2-howto.png (1080x1920)');
  console.log('- screenshot-3-styles.png (1080x1920)');
  console.log('- screenshot-4-cta.png (1080x1920)');
  console.log('- tablet-7inch-screenshot.png (1200x1920)');
  console.log('- tablet-10inch-screenshot.png (1600x2560)');
}

main().catch(console.error);

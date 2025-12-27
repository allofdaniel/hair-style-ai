const fs = require('fs');
const path = require('path');

// SVG 아이콘 생성
const createSvgIcon = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0F0F1A"/>
      <stop offset="100%" style="stop-color:#1a1a2e"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ec4899"/>
      <stop offset="100%" style="stop-color:#f97316"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="${size * 0.5}" fill="url(#accent)">✨</text>
</svg>
`.trim();

// OG 이미지 SVG
const createOgImage = () => `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0F0F1A"/>
      <stop offset="100%" style="stop-color:#1a1a2e"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ec4899"/>
      <stop offset="100%" style="stop-color:#f97316"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="600" y="250" dominant-baseline="middle" text-anchor="middle" font-size="120" fill="url(#accent)">✨</text>
  <text x="600" y="380" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="url(#accent)">LookSim</text>
  <text x="600" y="480" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="#9ca3af">AI 외모 시뮬레이션</text>
</svg>
`.trim();

const publicDir = path.join(__dirname, '..', 'public');

// 아이콘 생성
const sizes = [192, 512];
sizes.forEach(size => {
  const svg = createSvgIcon(size);
  fs.writeFileSync(path.join(publicDir, `icon-${size}.svg`), svg);
  console.log(`Created icon-${size}.svg`);
});

// Apple Touch Icon (180x180)
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.svg'), createSvgIcon(180));
console.log('Created apple-touch-icon.svg');

// OG Image
fs.writeFileSync(path.join(publicDir, 'og-image.svg'), createOgImage());
console.log('Created og-image.svg');

console.log('All icons generated!');

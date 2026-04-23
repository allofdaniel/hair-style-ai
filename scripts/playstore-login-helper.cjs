const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const AAB_PATH = path.join(__dirname, '../android/app/build/outputs/bundle/release/app-release.aab');
const SCREENSHOTS_DIR = path.join(__dirname, '../.playwright-mcp');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function uploadToPlayStore() {
  console.log('🚀 Play Store Upload Helper');
  console.log('========================================');
  console.log(`📦 AAB: ${AAB_PATH}`);
  console.log('');

  if (!fs.existsSync(AAB_PATH)) {
    console.error('❌ AAB file not found!');
    process.exit(1);
  }

  console.log('✅ AAB file found');
  console.log('');
  console.log('Opening browser for Google Play Console login...');
  console.log('');

  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    slowMo: 50
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  // Go directly to Play Console developer page
  await page.goto('https://play.google.com/console/developers');

  console.log('');
  console.log('========================================');
  console.log('📋 INSTRUCTIONS:');
  console.log('========================================');
  console.log('1. Log in to your Google account in the browser');
  console.log('2. Once logged in, navigate to your app (BeforeCut)');
  console.log('3. Go to: Testing > Closed testing > Manage track');
  console.log('4. Click "Create new release"');
  console.log('');
  console.log('When you see the upload screen, press ENTER here and I will upload the AAB file.');
  console.log('');

  await askQuestion('Press ENTER when ready to upload AAB file...');

  console.log('');
  console.log('📤 Looking for file upload input...');

  // Try to find file input
  const fileInputs = await page.locator('input[type="file"]').all();

  if (fileInputs.length > 0) {
    console.log(`Found ${fileInputs.length} file input(s), uploading to first one...`);
    await fileInputs[0].setInputFiles(AAB_PATH);
    console.log('✅ AAB file selected for upload!');
    console.log('');
    console.log('Please wait for the upload to complete in the browser...');
  } else {
    console.log('⚠️ No file input found.');
    console.log('');
    console.log('Try these alternatives:');
    console.log('1. Drag and drop the AAB file from this location:');
    console.log(`   ${AAB_PATH}`);
    console.log('');
    console.log('2. Click "Upload" button and select the file manually');
  }

  console.log('');
  console.log('========================================');
  console.log('Browser will stay open.');
  console.log('Complete the release notes and rollout manually.');
  console.log('Press Ctrl+C when done.');
  console.log('========================================');

  // Keep running
  await new Promise(() => {});
}

uploadToPlayStore().catch(console.error);

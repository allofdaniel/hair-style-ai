const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const AAB_PATH = path.join(__dirname, '../android/app/build/outputs/bundle/release/app-release.aab');
const SCREENSHOTS_DIR = path.join(__dirname, '../.playwright-mcp');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function screenshot(page, name) {
  const filepath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 ${name}`);
}

async function main() {
  console.log('🚀 Play Store Auto Upload');
  console.log('AAB:', AAB_PATH);
  console.log('');

  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    slowMo: 100
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  // Go to Play Console
  console.log('📍 Opening Play Console...');
  await page.goto('https://play.google.com/console/developers');
  await sleep(3000);
  await screenshot(page, 'auto-01');

  const url = page.url();
  console.log('URL:', url);

  // If login required
  if (url.includes('accounts.google.com')) {
    console.log('');
    console.log('⚠️  LOGIN REQUIRED');
    console.log('Please log in to Google in the browser window.');
    console.log('Waiting for login (3 minutes max)...');
    console.log('');

    try {
      await page.waitForURL('**/play.google.com/**', { timeout: 180000 });
      console.log('✅ Login successful!');
    } catch (e) {
      console.log('Login timeout');
    }
    await sleep(3000);
    await screenshot(page, 'auto-02-after-login');
  }

  // Now should be at Play Console
  console.log('');
  console.log('🔍 Looking for BeforeCut app...');

  // Click on BeforeCut
  try {
    const appLink = page.locator('text=BeforeCut').first();
    await appLink.waitFor({ timeout: 10000 });
    await appLink.click();
    console.log('✅ Clicked BeforeCut');
    await sleep(3000);
    await screenshot(page, 'auto-03-app');
  } catch (e) {
    console.log('BeforeCut not found directly, looking in list...');
    await screenshot(page, 'auto-03-searching');
  }

  // Navigate to Testing > Closed testing
  console.log('📍 Going to Closed Testing...');

  // Try clicking on Testing menu (Korean or English)
  try {
    const testingBtn = page.locator('text=/테스트|Testing/i').first();
    await testingBtn.click();
    await sleep(1500);
  } catch (e) {
    console.log('Testing menu not found');
  }

  // Click Closed testing
  try {
    const closedBtn = page.locator('text=/비공개|Closed/i').first();
    await closedBtn.click();
    await sleep(2000);
    await screenshot(page, 'auto-04-closed');
  } catch (e) {
    console.log('Closed testing not found');
  }

  // Look for "Manage track" or create release button
  console.log('📍 Looking for release options...');

  try {
    // Try manage track first
    const manageBtn = page.locator('text=/트랙 관리|Manage track|새 버전|Create new release|버전 만들기/i').first();
    await manageBtn.click();
    await sleep(2000);
    await screenshot(page, 'auto-05-release');
  } catch (e) {
    console.log('Release button not found');
  }

  // Upload the AAB file
  console.log('📤 Uploading AAB file...');

  try {
    // Find file input
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(AAB_PATH);
    console.log('✅ AAB file uploaded!');
    await sleep(10000); // Wait for upload
    await screenshot(page, 'auto-06-uploaded');
  } catch (e) {
    console.log('File input not found, trying drag area...');
    await screenshot(page, 'auto-06-no-input');
  }

  console.log('');
  console.log('========================================');
  console.log('🎉 Browser is open - complete manually:');
  console.log('========================================');
  console.log('1. Verify AAB uploaded');
  console.log('2. Add release notes');
  console.log('3. Review and roll out');
  console.log('');
  console.log('Press Ctrl+C when done.');

  // Keep open
  await new Promise(() => {});
}

main().catch(console.error);

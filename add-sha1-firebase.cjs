const { chromium } = require('playwright');

const SHA1 = '16:79:40:FF:5C:25:D3:B3:64:E8:68:5C:05:05:F9:A8:B4:08:E6:42';
const PROJECT_ID = 'beforecut-app';

async function addSHA1ToFirebase() {
  console.log('Launching browser...');

  // Launch a fresh browser instance (not using existing Chrome profile to avoid conflicts)
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome'
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to Firebase Console...');
  await page.goto(`https://console.firebase.google.com/project/${PROJECT_ID}/settings/general`);

  // Wait for page to load
  console.log('Waiting for page to load (you may need to log in)...');
  await page.waitForTimeout(10000);

  console.log('Taking screenshot...');
  await page.screenshot({ path: '.playwright-mcp/firebase-settings.png', fullPage: true });

  console.log('Screenshot saved to .playwright-mcp/firebase-settings.png');
  console.log('');
  console.log('=== Instructions ===');
  console.log('1. If you see a login page, please log in with your Google account');
  console.log('2. After login, scroll down to find the Android app section');
  console.log('3. Click "Add fingerprint" button');
  console.log('4. Paste this SHA-1: ' + SHA1);
  console.log('5. Click Save');
  console.log('');
  console.log('Browser will stay open. Press Ctrl+C to close when done.');

  // Keep browser open for manual interaction
  await new Promise(() => {});
}

addSHA1ToFirebase().catch(console.error);

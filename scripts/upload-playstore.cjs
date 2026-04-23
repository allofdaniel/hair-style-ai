const { chromium } = require('playwright');
const path = require('path');

const AAB_PATH = path.join(__dirname, '../android/app/build/outputs/bundle/release/app-release.aab');

async function uploadToPlayStore() {
  console.log('Launching browser...');

  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome'
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to Google Play Console...');
  await page.goto('https://play.google.com/console');

  console.log('Waiting for page to load (you may need to log in)...');
  await page.waitForTimeout(10000);

  await page.screenshot({ path: '.playwright-mcp/playstore-console.png', fullPage: true });

  console.log('');
  console.log('=== AAB File Location ===');
  console.log(AAB_PATH);
  console.log('');
  console.log('=== Instructions ===');
  console.log('1. Log in with your Google account if needed');
  console.log('2. Select your app (BeforeCut)');
  console.log('3. Go to Testing > Closed testing');
  console.log('4. Click "Create new release"');
  console.log('5. Upload the AAB file from the path above');
  console.log('6. Add release notes');
  console.log('7. Review and roll out');
  console.log('');
  console.log('Browser will stay open. Press Ctrl+C when done.');

  // Keep browser open
  await new Promise(() => {});
}

uploadToPlayStore().catch(console.error);

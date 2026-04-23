const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const AAB_PATH = path.join(__dirname, '../android/app/build/outputs/bundle/release/app-release.aab');
const SCREENSHOTS_DIR = path.join(__dirname, '../.playwright-mcp');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function takeScreenshot(page, name) {
  const filepath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot saved: ${filepath}`);
  return filepath;
}

async function uploadToPlayStore() {
  console.log('🚀 Starting Play Store upload automation...');
  console.log(`📦 AAB file: ${AAB_PATH}`);

  // Check if AAB exists
  if (!fs.existsSync(AAB_PATH)) {
    console.error('❌ AAB file not found!');
    process.exit(1);
  }

  console.log('✅ AAB file found');

  // Launch browser with user's Chrome profile to reuse login session
  const userDataDir = path.join(process.env.LOCALAPPDATA, 'Google/Chrome/User Data');

  console.log('🌐 Launching Chrome with your profile...');

  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'chrome',
    args: ['--profile-directory=Default']
  });

  const page = await browser.newPage();

  try {
    // Navigate to Play Console
    console.log('📍 Navigating to Google Play Console...');
    await page.goto('https://play.google.com/console');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, 'playstore-1-home');

    // Check if we need to log in
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (currentUrl.includes('accounts.google.com')) {
      console.log('⚠️ Login required. Please log in manually in the browser window...');
      console.log('Waiting for login to complete (60 seconds max)...');

      // Wait for redirect away from login page
      await page.waitForURL('**/play.google.com/console/**', { timeout: 60000 });
      console.log('✅ Login successful!');
    }

    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'playstore-2-console');

    // Find and click on BeforeCut app
    console.log('🔍 Looking for BeforeCut app...');

    // Try clicking on the app
    const appLink = await page.locator('text=BeforeCut').first();
    if (await appLink.isVisible()) {
      await appLink.click();
      console.log('✅ Clicked on BeforeCut app');
      await page.waitForTimeout(3000);
      await takeScreenshot(page, 'playstore-3-app-dashboard');
    } else {
      console.log('⚠️ BeforeCut not found on main page, trying search...');
      await takeScreenshot(page, 'playstore-3-app-not-found');
    }

    // Navigate to Testing > Closed testing
    console.log('📍 Navigating to Closed testing...');

    // Look for Testing menu
    const testingMenu = await page.locator('text=테스트').or(page.locator('text=Testing')).first();
    if (await testingMenu.isVisible()) {
      await testingMenu.click();
      await page.waitForTimeout(1000);
    }

    // Look for Closed testing
    const closedTesting = await page.locator('text=비공개 테스트').or(page.locator('text=Closed testing')).first();
    if (await closedTesting.isVisible()) {
      await closedTesting.click();
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'playstore-4-closed-testing');
    }

    // Try direct URL navigation if menus didn't work
    // The URL pattern is: play.google.com/console/u/0/developers/{devId}/app/{appId}/tracks/closed-testing
    console.log('📍 Trying direct URL navigation to closed testing...');

    // Click "Create new release" or "새 버전 만들기"
    console.log('🔍 Looking for "Create new release" button...');
    const createRelease = await page.locator('button:has-text("새 버전 만들기")').or(
      page.locator('button:has-text("Create new release")')
    ).or(
      page.locator('text=새 버전 만들기')
    ).or(
      page.locator('text=Create new release')
    ).first();

    if (await createRelease.isVisible()) {
      await createRelease.click();
      console.log('✅ Clicked "Create new release"');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'playstore-5-new-release');
    } else {
      console.log('⚠️ Create release button not found');
      await takeScreenshot(page, 'playstore-5-no-button');
    }

    // Upload AAB file
    console.log('📤 Looking for file upload area...');

    // Find file input or upload area
    const fileInput = await page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles(AAB_PATH);
      console.log('✅ AAB file uploaded!');
      await page.waitForTimeout(5000); // Wait for upload to process
      await takeScreenshot(page, 'playstore-6-uploaded');
    } else {
      console.log('⚠️ File input not found. Looking for drop zone...');
      await takeScreenshot(page, 'playstore-6-no-input');
    }

    console.log('\n========================================');
    console.log('🎉 Automation paused - browser will stay open');
    console.log('========================================');
    console.log('Please complete the remaining steps manually:');
    console.log('1. Verify the upload completed');
    console.log('2. Add release notes');
    console.log('3. Click "Review release"');
    console.log('4. Click "Start rollout"');
    console.log('\nPress Ctrl+C when done.');

    // Keep browser open
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Error:', error.message);
    await takeScreenshot(page, 'playstore-error');

    console.log('\n⚠️ Automation encountered an issue.');
    console.log('Browser will stay open for manual intervention.');
    console.log('Press Ctrl+C when done.');

    // Keep browser open
    await new Promise(() => {});
  }
}

uploadToPlayStore().catch(console.error);

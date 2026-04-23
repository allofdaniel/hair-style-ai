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
  console.log(`📸 Screenshot: ${name}`);
  return filepath;
}

async function uploadToPlayStore() {
  console.log('🚀 Starting Play Store upload...');
  console.log(`📦 AAB: ${AAB_PATH}`);

  if (!fs.existsSync(AAB_PATH)) {
    console.error('❌ AAB file not found!');
    process.exit(1);
  }

  // Launch fresh browser - don't use persistent context to avoid conflicts
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    slowMo: 100 // Slow down actions for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  try {
    console.log('📍 Opening Google Play Console...');
    await page.goto('https://play.google.com/console');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, 'ps-01-initial');

    // Check current state
    const url = page.url();
    console.log(`Current URL: ${url}`);

    if (url.includes('accounts.google.com')) {
      console.log('\n⚠️ Login required!');
      console.log('Please log in to your Google account in the browser...');
      console.log('Waiting up to 2 minutes for login...\n');

      // Wait for navigation away from login
      try {
        await page.waitForURL('**/play.google.com/**', { timeout: 120000 });
        console.log('✅ Login detected!');
      } catch (e) {
        console.log('⚠️ Login timeout - please continue manually if logged in');
      }
    }

    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'ps-02-after-login');

    // Look for BeforeCut app or search for it
    console.log('🔍 Looking for BeforeCut app...');

    const beforecutLink = page.locator('text=BeforeCut').first();
    if (await beforecutLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Found BeforeCut, clicking...');
      await beforecutLink.click();
      await page.waitForTimeout(3000);
      await takeScreenshot(page, 'ps-03-app-page');
    } else {
      console.log('BeforeCut not immediately visible, checking page...');
      await takeScreenshot(page, 'ps-03-searching');
    }

    // Try to navigate to release section
    console.log('📍 Looking for Testing/Release menu...');

    // Try Korean first, then English
    const menuItems = ['테스트', 'Testing', '출시', 'Release'];
    for (const item of menuItems) {
      const menu = page.locator(`text=${item}`).first();
      if (await menu.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`Found "${item}" menu, clicking...`);
        await menu.click();
        await page.waitForTimeout(1500);
        break;
      }
    }

    await takeScreenshot(page, 'ps-04-menu-clicked');

    // Look for Closed testing
    const closedItems = ['비공개 테스트', 'Closed testing', '비공개 테스팅'];
    for (const item of closedItems) {
      const closed = page.locator(`text=${item}`).first();
      if (await closed.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`Found "${item}", clicking...`);
        await closed.click();
        await page.waitForTimeout(2000);
        break;
      }
    }

    await takeScreenshot(page, 'ps-05-closed-testing');

    // Look for create new release button
    const releaseButtons = [
      '새 버전 만들기',
      'Create new release',
      '새 출시 만들기',
      'Create release'
    ];

    for (const btn of releaseButtons) {
      const button = page.locator(`text=${btn}`).first();
      if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`Found "${btn}" button, clicking...`);
        await button.click();
        await page.waitForTimeout(2000);
        break;
      }
    }

    await takeScreenshot(page, 'ps-06-new-release');

    // Try to find file upload
    console.log('📤 Looking for upload area...');

    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      console.log('Found file input, uploading AAB...');
      await fileInput.setInputFiles(AAB_PATH);
      console.log('✅ File set for upload!');
      await page.waitForTimeout(10000); // Wait for upload
      await takeScreenshot(page, 'ps-07-uploaded');
    } else {
      console.log('File input not found yet - may need manual upload');
      await takeScreenshot(page, 'ps-07-no-input');
    }

    console.log('\n========================================');
    console.log('🎉 Automation complete - browser stays open');
    console.log('========================================');
    console.log('\nPlease complete remaining steps:');
    console.log('1. Verify upload completed');
    console.log('2. Add release notes');
    console.log('3. Review and roll out release');
    console.log('\nPress Ctrl+C when done.');

    // Keep browser open indefinitely
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Error:', error.message);
    await takeScreenshot(page, 'ps-error');
    console.log('\nBrowser stays open for manual completion.');
    console.log('Press Ctrl+C when done.');
    await new Promise(() => {});
  }
}

uploadToPlayStore().catch(console.error);

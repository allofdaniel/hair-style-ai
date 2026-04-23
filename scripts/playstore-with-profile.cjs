const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const AAB_PATH = path.join(__dirname, '../android/app/build/outputs/bundle/release/app-release.aab');
const PLAY_CONSOLE_URL = 'https://play.google.com/console/developers';

console.log('========================================');
console.log('🚀 Play Store Upload Helper');
console.log('========================================');
console.log('');
console.log(`📦 AAB File: ${AAB_PATH}`);
console.log('');

if (!fs.existsSync(AAB_PATH)) {
  console.error('❌ AAB file not found!');
  process.exit(1);
}

console.log('✅ AAB file exists');
console.log('');

// Open Chrome with default profile (keeps login session)
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

console.log('🌐 Opening Chrome with your profile...');
console.log(`   URL: ${PLAY_CONSOLE_URL}`);
console.log('');

const chrome = spawn(chromePath, [
  PLAY_CONSOLE_URL,
  '--new-window'
], {
  detached: true,
  stdio: 'ignore'
});

chrome.unref();

console.log('========================================');
console.log('✅ Chrome opened with Play Console');
console.log('========================================');
console.log('');
console.log('📋 INSTRUCTIONS:');
console.log('');
console.log('1. In Chrome, navigate to your app (BeforeCut)');
console.log('2. Go to: Testing > Closed testing');
console.log('3. Click "Create new release" or "Manage track"');
console.log('4. Upload the AAB file from:');
console.log('');
console.log(`   ${AAB_PATH}`);
console.log('');
console.log('5. Add release notes');
console.log('6. Review and roll out');
console.log('');
console.log('========================================');

// Copy AAB path to clipboard
const clipboardCmd = spawn('powershell', ['-command', `Set-Clipboard -Value '${AAB_PATH}'`]);
clipboardCmd.on('close', () => {
  console.log('📋 AAB path copied to clipboard!');
  console.log('   (Paste with Ctrl+V when selecting file)');
  console.log('');
});

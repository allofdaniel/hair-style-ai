const fs = require('fs');
const path = require('path');

// Path to MainMenu.tsx
const filePath = path.join(__dirname, '../src/pages/MainMenu.tsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Update StyleItem props to include language
content = content.replace(
  /const StyleItem = memo\(\{ style, isSelected, index, onToggle \}: \{/,
  'const StyleItem = memo(({ style, isSelected, index, onToggle, language }: {'
);

// 2. Add language type to props
content = content.replace(
  /onToggle: \(style: HairStyle\) => void;/,
  'onToggle: (style: HairStyle) => void;\n  language: string;'
);

// 3. Add helper to get localized name - insert after the first line of StyleItem
content = content.replace(
  /const hasGif = !!style\.gif;/,
  'const hasGif = !!style.gif;\n  const displayName = language === \'ko\' ? style.nameKo : style.name;'
);

// 4. Replace all style.nameKo with displayName in StyleItem
// For alt attributes
content = content.replace(
  /alt=\{style\.nameKo\}/g,
  'alt={displayName}'
);

// 5. Replace in the title overlay (the text display)
content = content.replace(
  /truncate">\{style\.nameKo\}/,
  'truncate">{displayName}'
);

// 6. Find StyleItem usage and add language prop
// Look for <StyleItem pattern and add language prop
content = content.replace(
  /<StyleItem\s+key=\{style\.id\}\s+style=\{style\}\s+isSelected=\{selectedStyles\.includes\(style\.id\)\}\s+index=\{selectedStyles\.indexOf\(style\.id\)\}\s+onToggle=\{toggleStyle\}/g,
  '<StyleItem\n                      key={style.id}\n                      style={style}\n                      isSelected={selectedStyles.includes(style.id)}\n                      index={selectedStyles.indexOf(style.id)}\n                      onToggle={toggleStyle}\n                      language={language}'
);

// 7. Also fix category names (cat.nameKo) - should use name for non-Korean
// First, let's find the pattern for category display
content = content.replace(
  />\{cat\.nameKo\}<\/button>/g,
  '>{language === \'ko\' ? cat.nameKo : cat.name}</button>'
);

// Write the updated content back
fs.writeFileSync(filePath, content, 'utf-8');
console.log('MainMenu.tsx updated successfully!');

// Verify the changes
const updated = fs.readFileSync(filePath, 'utf-8');
if (updated.includes('language: string;') && updated.includes('displayName')) {
  console.log('✓ Language prop added to StyleItem');
  console.log('✓ displayName helper added');
} else {
  console.log('⚠ Some changes may not have been applied correctly');
}

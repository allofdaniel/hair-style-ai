/**
 * hairStyles.ts의 thumbnail 경로를 id 기반으로 수정
 * id가 'm-두블럭'이면 thumbnail은 '/hairstyles/male/두블럭.jpg' 형식
 */

const fs = require('fs');
const path = require('path');

const hairStylesPath = path.join(__dirname, '..', 'src', 'data', 'hairStyles.ts');
let content = fs.readFileSync(hairStylesPath, 'utf-8');

// 실제 파일 목록 가져오기
const maleDir = path.join(__dirname, '..', 'public', 'hairstyles', 'male');
const femaleDir = path.join(__dirname, '..', 'public', 'hairstyles', 'female');

const maleFiles = fs.readdirSync(maleDir).map(f => f.replace('.jpg', ''));
const femaleFiles = fs.readdirSync(femaleDir).map(f => f.replace('.jpg', ''));

console.log(`남성 이미지: ${maleFiles.length}개`);
console.log(`여성 이미지: ${femaleFiles.length}개`);

// 스타일 객체 정규식
const styleRegex = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*nameKo:\s*'([^']+)',\s*category:\s*'([^']+)',\s*gender:\s*'(male|female)',\s*description:\s*'([^']+)',\s*prompt:\s*'([^']*(?:\\.[^']*)*)',\s*thumbnail:\s*'([^']+)',?\s*\}/gs;

const styles = [];
let match;
while ((match = styleRegex.exec(content)) !== null) {
  styles.push({
    full: match[0],
    id: match[1],
    name: match[2],
    nameKo: match[3],
    category: match[4],
    gender: match[5],
    description: match[6],
    prompt: match[7],
    thumbnail: match[8],
  });
}

console.log(`총 ${styles.length}개 스타일`);

// id에서 파일명 추출 (m-360-wave -> 360-wave)
const getFileNameFromId = (id) => {
  return id.replace(/^[mf]-/, '');
};

let fixedCount = 0;
let notFoundCount = 0;
const notFound = [];

for (const style of styles) {
  const expectedFileName = getFileNameFromId(style.id);
  const folder = style.gender === 'male' ? 'male' : 'female';
  const fileList = style.gender === 'male' ? maleFiles : femaleFiles;

  // 파일이 있는지 확인
  if (fileList.includes(expectedFileName)) {
    const correctPath = `/hairstyles/${folder}/${expectedFileName}.jpg`;

    if (style.thumbnail !== correctPath) {
      const newStyleObj = `{
    id: '${style.id}',
    name: '${style.name}',
    nameKo: '${style.nameKo}',
    category: '${style.category}',
    gender: '${style.gender}',
    description: '${style.description}',
    prompt: '${style.prompt}',
    thumbnail: '${correctPath}',
  }`;

      content = content.replace(style.full, newStyleObj);
      fixedCount++;
      console.log(`✅ ${style.nameKo}: ${style.thumbnail} -> ${correctPath}`);
    }
  } else {
    notFoundCount++;
    notFound.push(`${style.gender} - ${style.id} (expected: ${expectedFileName}.jpg)`);
  }
}

// 저장
fs.writeFileSync(hairStylesPath, content, 'utf-8');

console.log(`\n=== 결과 ===`);
console.log(`수정: ${fixedCount}개`);
console.log(`파일 없음: ${notFoundCount}개`);

if (notFound.length > 0 && notFound.length <= 50) {
  console.log(`\n파일이 없는 스타일:`);
  notFound.forEach(n => console.log(`  - ${n}`));
}

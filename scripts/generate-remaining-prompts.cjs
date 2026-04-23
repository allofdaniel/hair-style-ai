/**
 * styleguide.md에 없는 스타일들에 대해 나노바나나 형식의 프롬프트를 생성
 */

const fs = require('fs');
const path = require('path');

// hairStyles.ts 읽기
const hairStylesPath = path.join(__dirname, '..', 'src', 'data', 'hairStyles.ts');
let hairStylesContent = fs.readFileSync(hairStylesPath, 'utf-8');

// 나노바나나 스타일 프롬프트 템플릿
const malePromptTemplate = (styleName, styleNameKo) =>
  `A vertical portrait photograph of a single white plastic male mannequin bust with subtle sculpted facial contours, a strong jawline and masculine bone structure, facing front-left. It wears a premium navy blue knit sweater against a clean studio white background. The jet black hair is styled in a modern Korean ${styleName} style, with natural texture and volume. The finish is natural and matte. Professional soft lighting highlights the hair texture and sculptural contours. Vertical 3:4 aspect ratio, high detail.`;

const femalePromptTemplate = (styleName, styleNameKo) =>
  `A vertical portrait photograph of a single white plastic female mannequin bust with elegant facial contours and a soft jawline, looking towards the front-left. The mannequin is wearing a premium navy blue knit sweater against a clean studio white background. Hair Style: Beautiful Jet Black ${styleName}, featuring natural volume and texture with a refined finish. The style is modern and stylish with clean lines. Environment: Minimalist white studio background, professional soft lighting to highlight the hair texture and the mannequin's sculpted form. Single person, high-definition, realistic fiber detail on the sweater.`;

// 정규식으로 모든 스타일 객체 찾기
const styleRegex = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*nameKo:\s*'([^']+)',\s*category:\s*'([^']+)',\s*gender:\s*'(male|female)',\s*description:\s*'([^']+)',\s*prompt:\s*'([^']*(?:\\.[^']*)*)',\s*thumbnail:\s*'([^']+)',?\s*\}/gs;

const styles = [];
let match;
while ((match = styleRegex.exec(hairStylesContent)) !== null) {
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

console.log(`총 ${styles.length}개의 스타일 발견`);

let updatedCount = 0;

// 기본 템플릿 프롬프트인지 확인 (업데이트가 필요한 스타일)
const needsUpdate = (prompt) => {
  // 이미 나노바나나 프롬프트가 적용된 경우는 제외
  if (prompt.includes('A high-quality 3:4 portrait') ||
      prompt.includes('A portrait photograph of a white plastic') ||
      prompt.includes('A premium white plastic')) {
    return false;
  }
  // 기본 템플릿 프롬프트인 경우
  if (prompt.includes('The finish is natural and matte. Minimalist white studio background')) {
    return true;
  }
  return false;
};

for (const style of styles) {
  if (needsUpdate(style.prompt)) {
    const template = style.gender === 'male' ? malePromptTemplate : femalePromptTemplate;
    const newPrompt = template(style.name, style.nameKo);

    // 프롬프트 이스케이프 처리
    const escapedPrompt = newPrompt
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\n/g, ' ');

    // 새 스타일 객체 생성
    const newStyleObj = `{
    id: '${style.id}',
    name: '${style.name}',
    nameKo: '${style.nameKo}',
    category: '${style.category}',
    gender: '${style.gender}',
    description: '${style.description}',
    prompt: '${escapedPrompt}',
    thumbnail: '${style.thumbnail}',
  }`;

    hairStylesContent = hairStylesContent.replace(style.full, newStyleObj);
    updatedCount++;
    console.log(`✅ ${style.gender} - ${style.nameKo}: 기본 나노바나나 프롬프트 적용`);
  }
}

// 결과 저장
fs.writeFileSync(hairStylesPath, hairStylesContent, 'utf-8');

console.log(`\n=== 업데이트 완료 ===`);
console.log(`기본 프롬프트 적용: ${updatedCount}개`);

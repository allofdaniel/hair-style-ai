/**
 * styleguide.md에서 스타일별 프롬프트를 추출하는 스크립트
 */

const fs = require('fs');
const path = require('path');

const styleGuideContent = fs.readFileSync(
  path.join(__dirname, '..', 'styleguide.md'),
  'utf-8'
);

// 프롬프트 추출 (> **Prompt:** 또는 **Prompt:** 다음에 나오는 내용)
const promptMatches = [];

// 패턴 1: > **Prompt:** > A ...
// 패턴 2: **Prompt:** A ...
// 패턴 3: > Prompt: > A ...

const lines = styleGuideContent.split('\n');
let currentPrompt = '';
let isCollectingPrompt = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // 프롬프트 시작 감지
  if (line.includes('Prompt') && (line.includes('**') || line.includes('>'))) {
    isCollectingPrompt = true;
    currentPrompt = '';
    continue;
  }

  // 프롬프트 수집 중
  if (isCollectingPrompt) {
    // 프롬프트 내용 추출 (> 로 시작하거나 A로 시작하는 영어 문장)
    let cleanLine = line.replace(/^>\s*/, '').trim();

    // A로 시작하는 영어 프롬프트인지 확인
    if (cleanLine.startsWith('A ') || cleanLine.startsWith('A high') || cleanLine.startsWith('A portrait') || cleanLine.startsWith('A vertical') || cleanLine.startsWith('A premium')) {
      currentPrompt = cleanLine;
    } else if (currentPrompt && cleanLine && !cleanLine.startsWith('---') && !cleanLine.startsWith('#') && !cleanLine.startsWith('*')) {
      // 프롬프트 내용 계속 수집
      if (cleanLine.startsWith('>')) {
        cleanLine = cleanLine.replace(/^>\s*/, '');
      }
      currentPrompt += ' ' + cleanLine;
    }

    // 프롬프트 종료 조건
    if (line.startsWith('---') || line.startsWith('##') || line.startsWith('**[') || (line.trim() === '' && currentPrompt.length > 100)) {
      if (currentPrompt.length > 50 && currentPrompt.includes('mannequin')) {
        promptMatches.push(currentPrompt.trim());
      }
      isCollectingPrompt = false;
      currentPrompt = '';
    }
  }
}

console.log(`총 ${promptMatches.length}개의 프롬프트 추출됨\n`);

// 프롬프트 출력 (처음 10개)
promptMatches.slice(0, 10).forEach((prompt, idx) => {
  console.log(`[${idx + 1}] ${prompt.substring(0, 200)}...`);
  console.log('');
});

// 스타일 이름과 프롬프트 매핑
const styleToPrompt = {};

// 프롬프트에서 스타일 키워드 추출하여 매핑
promptMatches.forEach(prompt => {
  // 스타일 이름 추출 시도
  const stylePatterns = [
    /styled in[^,]*["']?([^"',]+)["']?/i,
    /styled in a[^,]*["']?([^"',]+)["']?/i,
    /["']([^"']+)["']\s*(?:hairstyle|style|cut|perm)/i,
    /\*\*([^*]+)\*\*/,
  ];

  for (const pattern of stylePatterns) {
    const match = prompt.match(pattern);
    if (match) {
      let styleName = match[1].trim().toLowerCase();
      // 정리
      styleName = styleName
        .replace(/^(a|an|the|modern|korean|classic|sharp)\s+/gi, '')
        .replace(/\s+style$/i, '')
        .replace(/^korean\s+/i, '')
        .trim();

      if (styleName.length > 2 && !styleToPrompt[styleName]) {
        styleToPrompt[styleName] = prompt;
      }
    }
  }
});

console.log(`\n스타일-프롬프트 매핑: ${Object.keys(styleToPrompt).length}개`);
Object.keys(styleToPrompt).slice(0, 20).forEach(style => {
  console.log(`  - ${style}`);
});

// JSON 파일로 저장
fs.writeFileSync(
  path.join(__dirname, 'style-prompts.json'),
  JSON.stringify({ prompts: promptMatches, mappings: styleToPrompt }, null, 2)
);

console.log(`\n✅ style-prompts.json 저장 완료`);

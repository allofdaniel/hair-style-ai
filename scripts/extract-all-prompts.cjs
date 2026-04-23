/**
 * styleguide.md에서 모든 프롬프트를 추출하고 스타일 이름과 매핑하는 스크립트
 */

const fs = require('fs');
const path = require('path');

const styleGuideContent = fs.readFileSync(
  path.join(__dirname, '..', 'styleguide.md'),
  'utf-8'
);

// 모든 프롬프트 추출
const allPrompts = [];

// 패턴 1: > **Prompt:** 다음에 나오는 블록인용
const blockQuotePattern = /> \*\*Prompt:\*\*[\s\S]*?(?=\n\n---|\n\n\*\*\[|\n\n###|\n\n##|\n\n헤어|\n\n다른|\n\n---)/gi;
let match;
while ((match = blockQuotePattern.exec(styleGuideContent)) !== null) {
  let prompt = match[0]
    .replace(/> \*\*Prompt:\*\*\s*/i, '')
    .replace(/^>\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\n/g, ' ')
    .trim();
  if (prompt.length > 50) {
    allPrompts.push({ type: 'blockquote', prompt });
  }
}

// 패턴 2: **[실제 사용된 영어 프롬프트 (English Prompt)]** 다음 라인
const englishPromptPattern = /\*\*\[실제 사용된 영어 프롬프트.*?\]\*\*\s*\n+([\s\S]*?)(?=\n\n\*\*\[|\n\n---|\n\n##|\n\n###)/gi;
while ((match = englishPromptPattern.exec(styleGuideContent)) !== null) {
  let prompt = match[1].trim();
  if (prompt.length > 50 && !prompt.startsWith('*')) {
    allPrompts.push({ type: 'english', prompt });
  }
}

// 패턴 3: > **Prompt:** > A ... 형태
const inlinePromptPattern = /> \*\*Prompt:\*\* > ([^\n]+(?:\n> [^\n]+)*)/gi;
while ((match = inlinePromptPattern.exec(styleGuideContent)) !== null) {
  let prompt = match[1]
    .replace(/^>\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\n/g, ' ')
    .trim();
  if (prompt.length > 50) {
    allPrompts.push({ type: 'inline', prompt });
  }
}

console.log(`총 ${allPrompts.length}개의 프롬프트 추출됨\n`);

// 스타일 키워드 추출 함수
function extractStyleKeywords(prompt) {
  const keywords = [];

  // 헤어스타일 이름 추출 패턴들
  const patterns = [
    // "Hair Style:" 다음에 나오는 스타일명
    /Hair Style:\s*(?:Beautiful|Stunning|Intricate|Professional|Defined|Voluminous|neatly styled|Precise|Sophisticated)?\s*(?:Jet Black\s*)?([^,\.]+)/i,
    // styled in/into 다음
    /styled (?:in|into) (?:a\s+)?(?:modern\s+)?(?:Korean[- ]style\s+)?(?:natural\s+)?(?:jet black\s+)?([^,\.]+?)(?:\s+style)?(?:,|\.)/i,
    // "스타일" 형태의 한국어 스타일명
    /['"]([^'"]+)['"]\s*(?:스타일|style)/i,
    // featuring 다음
    /featuring\s+(?:a\s+)?(?:jet black\s+)?(?:natural\s+)?([^,\.]+?)(?:,|\.)/i,
  ];

  for (const pattern of patterns) {
    const m = prompt.match(pattern);
    if (m && m[1]) {
      let styleName = m[1].trim()
        .replace(/^(a|an|the|modern|korean|classic|sharp|long|short|medium|premium)\s+/gi, '')
        .replace(/\s*(hair|hairstyle|style|cut|look)$/gi, '')
        .trim();
      if (styleName.length > 2) {
        keywords.push(styleName.toLowerCase());
      }
    }
  }

  return keywords;
}

// 스타일 이름 정규화 함수
function normalizeStyleName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '')
    .trim();
}

// 스타일-프롬프트 매핑 생성
const styleToPrompt = {};

// 한국어 스타일 이름과 영어 이름 매핑
const koreanToEnglish = {
  '커튼헤어': ['curtain hair', 'curtain', 'gareuma'],
  '투블럭': ['two block', 'two-block', 'twoblock'],
  '리젠트': ['regent', 'pompadour'],
  '댄디컷': ['dandy cut', 'dandy'],
  '포마드': ['pomade', 'slickback', 'slick back'],
  '크롭컷': ['crop cut', 'crop', 'french crop'],
  '텍스처펌': ['texture perm', 'textured'],
  '쉐도우펌': ['shadow perm', 'shadow'],
  '다운펌': ['down perm', 'down'],
  '가일컷': ['bowl cut', 'gail', 'mushroom'],
  '애즈펌': ['s perm', 'scurl'],
  '아이비리그': ['ivy league'],
  '퍼프': ['puff', 'afro puff'],
  '언더컷': ['undercut'],
  '슬릭백': ['slick back', 'slickback'],
  '사이드파트': ['side part', 'sidepart'],
  '볼프컷': ['wolf cut', 'wolfcut'],
  '허쉬컷': ['hush cut', 'hushcut'],
  '레이어드': ['layered', 'layer'],
  '히메컷': ['hime cut', 'himecut'],
  '태슬컷': ['tassel cut', 'tassel'],
  '샤기컷': ['shaggy', 'shag'],
  '픽시': ['pixie'],
  '보브': ['bob', 'short bob', 'lob'],
  '젤리펌': ['jelly perm', 'jelly'],
  '빌드펌': ['build perm', 'build'],
  '히피펌': ['hippie perm', 'hippie'],
  '물결펌': ['wave perm', 'wave'],
  '웨이브': ['wave', 'beach wave', 'waves'],
  '드레드락': ['dreadlocks', 'dreadlock', 'dreads', 'locs'],
  '브레이드': ['braids', 'braid', 'box braids'],
  '콘로우': ['cornrows', 'cornrow'],
  '아프로': ['afro', 'natural afro'],
  '트위스트': ['twist', 'twists', 'twist out'],
  '반투노트': ['bantu knots', 'bantu'],
  '풀라니': ['fulani', 'fulani braids'],
  '패션트위스트': ['passion twist', 'passion twists'],
  '가디스락': ['goddess locs', 'goddess'],
  '세네갈리즈': ['senegalese', 'senegalese twist'],
  '말리트위스트': ['marley twist', 'marley'],
  '낫리스': ['knotless', 'knotless braids'],
  '폼파두르': ['pompadour'],
  '페이드': ['fade', 'skin fade', 'taper fade'],
  '모히칸': ['mohawk', 'mohican', 'faux hawk'],
  '멀릿': ['mullet'],
  '프렌치밥': ['french bob'],
  '블런트밥': ['blunt bob', 'blunt'],
  '레이어드밥': ['layered bob'],
  '롱레이어드': ['long layered', 'long layer'],
};

// 영어 스타일 키워드로 프롬프트 검색
allPrompts.forEach((item, idx) => {
  const prompt = item.prompt;
  const promptLower = prompt.toLowerCase();

  // 모든 한국어-영어 매핑 확인
  for (const [korean, englishList] of Object.entries(koreanToEnglish)) {
    for (const english of englishList) {
      if (promptLower.includes(english)) {
        if (!styleToPrompt[korean]) {
          styleToPrompt[korean] = {
            prompt: prompt,
            matchedKeyword: english,
            index: idx
          };
        }
        break;
      }
    }
  }

  // 추가: 프롬프트에서 스타일 키워드 직접 추출
  const keywords = extractStyleKeywords(prompt);
  keywords.forEach(kw => {
    // 영어 키워드를 한국어로 역매핑
    for (const [korean, englishList] of Object.entries(koreanToEnglish)) {
      if (englishList.some(e => kw.includes(e) || e.includes(kw))) {
        if (!styleToPrompt[korean]) {
          styleToPrompt[korean] = {
            prompt: prompt,
            matchedKeyword: kw,
            index: idx
          };
        }
      }
    }
  });
});

console.log(`\n스타일-프롬프트 매핑: ${Object.keys(styleToPrompt).length}개\n`);
Object.entries(styleToPrompt).forEach(([style, data]) => {
  console.log(`  - ${style}: "${data.matchedKeyword}" (프롬프트 #${data.index})`);
});

// 결과 저장
const result = {
  totalPrompts: allPrompts.length,
  prompts: allPrompts.map(p => p.prompt),
  mappings: {},
};

for (const [korean, data] of Object.entries(styleToPrompt)) {
  result.mappings[korean] = data.prompt;
}

fs.writeFileSync(
  path.join(__dirname, 'style-prompts-mapped.json'),
  JSON.stringify(result, null, 2),
  'utf-8'
);

console.log(`\n✅ style-prompts-mapped.json 저장 완료`);
console.log(`   - 총 프롬프트: ${result.totalPrompts}개`);
console.log(`   - 매핑된 스타일: ${Object.keys(result.mappings).length}개`);

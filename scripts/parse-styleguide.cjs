/**
 * styleguide.md를 라인 단위로 파싱하여 프롬프트를 추출하는 스크립트
 */

const fs = require('fs');
const path = require('path');

const styleGuideContent = fs.readFileSync(
  path.join(__dirname, '..', 'styleguide.md'),
  'utf-8'
);

const lines = styleGuideContent.split('\n');
const allPrompts = [];

let currentPrompt = '';
let isCollecting = false;
let promptStartLine = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmedLine = line.trim();

  // 프롬프트 시작 감지
  // 패턴 1: "> **Prompt:**" 로 시작하는 라인
  if (trimmedLine.startsWith('> **Prompt:**')) {
    // 이전 프롬프트가 있으면 저장
    if (currentPrompt.length > 50) {
      allPrompts.push({ line: promptStartLine, prompt: currentPrompt.trim() });
    }

    // 같은 라인에 프롬프트가 있는지 확인
    const sameLinePrompt = trimmedLine.replace(/^>\s*\*\*Prompt:\*\*\s*>?\s*/, '').trim();
    if (sameLinePrompt.length > 30) {
      // 한 줄짜리 프롬프트
      currentPrompt = sameLinePrompt;
      promptStartLine = i + 1;
      isCollecting = false;
    } else {
      // 다음 라인부터 프롬프트 시작
      currentPrompt = '';
      promptStartLine = i + 1;
      isCollecting = true;
    }
    continue;
  }

  // 프롬프트 수집 중
  if (isCollecting) {
    // 블록 인용 라인 (> 로 시작)
    if (trimmedLine.startsWith('>')) {
      let content = trimmedLine.replace(/^>\s*/, '').trim();
      // ** 마크다운 제거
      content = content.replace(/\*\*/g, '');
      if (content.length > 0) {
        currentPrompt += (currentPrompt ? ' ' : '') + content;
      }
    }
    // 블록 인용이 끝나면 프롬프트 종료
    else if (trimmedLine === '' || trimmedLine.startsWith('---') || trimmedLine.startsWith('#')) {
      if (currentPrompt.length > 50) {
        allPrompts.push({ line: promptStartLine, prompt: currentPrompt.trim() });
      }
      currentPrompt = '';
      isCollecting = false;
    }
  }
}

// 마지막 프롬프트 저장
if (currentPrompt.length > 50) {
  allPrompts.push({ line: promptStartLine, prompt: currentPrompt.trim() });
}

console.log(`총 ${allPrompts.length}개의 프롬프트 추출됨\n`);

// 헤어스타일 키워드 사전
const styleKeywords = {
  // 남성 스타일
  'two strand twist': { ko: '투스트랜드 트위스트', gender: 'male' },
  'two-strand twist': { ko: '투스트랜드 트위스트', gender: 'male' },
  'taper afro': { ko: '테이퍼 아프로', gender: 'male' },
  'curly top fade': { ko: '컬리탑 페이드', gender: 'male' },
  'high-top fade': { ko: '하이탑 페이드', gender: 'male' },
  'high top fade': { ko: '하이탑 페이드', gender: 'male' },
  '360 waves': { ko: '360 웨이브', gender: 'male' },
  'temple fade': { ko: '템플 페이드', gender: 'male' },
  'french crop curly': { ko: '프렌치 크롭 컬리', gender: 'male' },
  'french crop': { ko: '프렌치 크롭', gender: 'male' },
  'pompadour': { ko: '폼파두르', gender: 'male' },
  'slick back': { ko: '슬릭백', gender: 'male' },
  'slickback': { ko: '슬릭백', gender: 'male' },
  'side part': { ko: '사이드 파트', gender: 'male' },
  'textured crop': { ko: '텍스처드 크롭', gender: 'male' },
  'buzz cut': { ko: '버즈컷', gender: 'male' },
  'crew cut': { ko: '크루컷', gender: 'male' },
  'undercut': { ko: '언더컷', gender: 'male' },
  'ivy league': { ko: '아이비리그', gender: 'male' },
  'caesar cut': { ko: '시저컷', gender: 'male' },
  'quiff': { ko: '퀴프', gender: 'male' },
  'mohawk': { ko: '모히칸', gender: 'male' },
  'faux hawk': { ko: '포호크', gender: 'male' },
  'mullet': { ko: '멀릿', gender: 'male' },
  'man bun': { ko: '맨번', gender: 'male' },
  'curtain hair': { ko: '커튼 헤어', gender: 'male' },
  'gareuma': { ko: '가르마 펌', gender: 'male' },
  'two block': { ko: '투블럭', gender: 'male' },
  'regent cut': { ko: '리젠트컷', gender: 'male' },
  'comma hair': { ko: '콤마 헤어', gender: 'male' },
  'dandy cut': { ko: '댄디컷', gender: 'male' },
  'down perm': { ko: '다운펌', gender: 'male' },
  'shadow perm': { ko: '쉐도우펌', gender: 'male' },
  'texture perm': { ko: '텍스처펌', gender: 'male' },
  'bowl cut': { ko: '가일컷', gender: 'male' },
  'mushroom cut': { ko: '머쉬룸컷', gender: 'male' },
  's perm': { ko: '애즈펌', gender: 'male' },
  's-curl': { ko: '애즈펌', gender: 'male' },

  // 여성 스타일
  'dreadlocks': { ko: '드레드락', gender: 'female' },
  'dreadlock': { ko: '드레드락', gender: 'female' },
  'box braids': { ko: '박스 브레이드', gender: 'female' },
  'cornrows': { ko: '콘로우', gender: 'female' },
  'natural afro': { ko: '내추럴 아프로', gender: 'female' },
  'twist out': { ko: '트위스트 아웃', gender: 'female' },
  'bantu knots': { ko: '반투 노트', gender: 'female' },
  'fulani braids': { ko: '풀라니 브레이드', gender: 'female' },
  'passion twist': { ko: '패션 트위스트', gender: 'female' },
  'passion twists': { ko: '패션 트위스트', gender: 'female' },
  'goddess locs': { ko: '가디스 락', gender: 'female' },
  'senegalese twist': { ko: '세네갈리즈 트위스트', gender: 'female' },
  'marley twist': { ko: '말리 트위스트', gender: 'female' },
  'marley twists': { ko: '말리 트위스트', gender: 'female' },
  'knotless braids': { ko: '낫리스 브레이드', gender: 'female' },
  'knotless braid': { ko: '낫리스 브레이드', gender: 'female' },
  'pixie cut': { ko: '픽시컷', gender: 'female' },
  'bob cut': { ko: '보브컷', gender: 'female' },
  'short bob': { ko: '숏보브', gender: 'female' },
  'lob': { ko: '롱보브', gender: 'female' },
  'long bob': { ko: '롱보브', gender: 'female' },
  'french bob': { ko: '프렌치 밥', gender: 'female' },
  'blunt bob': { ko: '블런트 밥', gender: 'female' },
  'layered bob': { ko: '레이어드 밥', gender: 'female' },
  'wolf cut': { ko: '울프컷', gender: 'female' },
  'hush cut': { ko: '허쉬컷', gender: 'female' },
  'shaggy': { ko: '샤기컷', gender: 'female' },
  'shag cut': { ko: '샤기컷', gender: 'female' },
  'hime cut': { ko: '히메컷', gender: 'female' },
  'tassel cut': { ko: '태슬컷', gender: 'female' },
  'layered': { ko: '레이어드', gender: 'female' },
  'layer cut': { ko: '레이어드컷', gender: 'female' },
  'long layered': { ko: '롱 레이어드', gender: 'female' },
  'jelly perm': { ko: '젤리펌', gender: 'female' },
  'build perm': { ko: '빌드펌', gender: 'female' },
  'hippie perm': { ko: '히피펌', gender: 'female' },
  'wave perm': { ko: '물결펌', gender: 'female' },
  'beach wave': { ko: '비치 웨이브', gender: 'female' },
  'beach waves': { ko: '비치 웨이브', gender: 'female' },
  'c-curl': { ko: 'C컬', gender: 'female' },
  's-curl': { ko: 'S컬', gender: 'female' },
  'goddess braids': { ko: '가디스 브레이드', gender: 'female' },
  'fishtail braid': { ko: '피쉬테일 브레이드', gender: 'female' },
  'dutch braid': { ko: '더치 브레이드', gender: 'female' },
  'french braid': { ko: '프렌치 브레이드', gender: 'female' },
  'waterfall braid': { ko: '워터폴 브레이드', gender: 'female' },
  'half up': { ko: '하프업', gender: 'female' },
  'ponytail': { ko: '포니테일', gender: 'female' },
  'bun': { ko: '번', gender: 'female' },
  'updo': { ko: '업두', gender: 'female' },
  'slick bun': { ko: '슬릭 번', gender: 'female' },
  'messy bun': { ko: '메시 번', gender: 'female' },
  'chignon': { ko: '시뇽', gender: 'female' },
  'twist bun': { ko: '트위스트 번', gender: 'female' },
  'straight': { ko: '스트레이트', gender: 'female' },
  'volume straight': { ko: '볼륨 스트레이트', gender: 'female' },
  'side swept bangs': { ko: '사이드 뱅', gender: 'female' },
  'curtain bangs': { ko: '커튼 뱅', gender: 'female' },
  'see-through bangs': { ko: '시스루 뱅', gender: 'female' },
  'full bangs': { ko: '풀뱅', gender: 'female' },
  'wispy bangs': { ko: '위스피 뱅', gender: 'female' },
  'asymmetric bob': { ko: '어심메트릭 밥', gender: 'female' },
};

// 프롬프트에서 스타일 추출
const styleToPrompt = {};

allPrompts.forEach(({ line, prompt }, idx) => {
  const promptLower = prompt.toLowerCase();

  // 성별 감지
  const isFemale = promptLower.includes('female mannequin') || promptLower.includes('feminine');
  const isMale = promptLower.includes('male mannequin') && !promptLower.includes('female');

  // 스타일 키워드 매칭
  for (const [keyword, info] of Object.entries(styleKeywords)) {
    if (promptLower.includes(keyword)) {
      const key = `${info.gender === 'male' ? 'male' : 'female'}_${info.ko}`;
      if (!styleToPrompt[key]) {
        styleToPrompt[key] = {
          prompt: prompt,
          nameKo: info.ko,
          gender: info.gender,
          matchedKeyword: keyword,
          line: line,
          index: idx
        };
      }
    }
  }
});

console.log(`스타일-프롬프트 매핑: ${Object.keys(styleToPrompt).length}개\n`);
Object.entries(styleToPrompt).slice(0, 30).forEach(([key, data]) => {
  console.log(`  [${data.gender}] ${data.nameKo}: "${data.matchedKeyword}" (라인 ${data.line})`);
});

// 결과 저장
const result = {
  totalPrompts: allPrompts.length,
  prompts: allPrompts.map(p => ({ line: p.line, prompt: p.prompt })),
  styles: styleToPrompt,
};

fs.writeFileSync(
  path.join(__dirname, 'parsed-prompts.json'),
  JSON.stringify(result, null, 2),
  'utf-8'
);

console.log(`\n✅ parsed-prompts.json 저장 완료`);
console.log(`   - 총 프롬프트: ${result.totalPrompts}개`);
console.log(`   - 매핑된 스타일: ${Object.keys(result.styles).length}개`);

// 첫 5개 프롬프트 미리보기
console.log('\n=== 첫 5개 프롬프트 미리보기 ===\n');
allPrompts.slice(0, 5).forEach(({ line, prompt }, idx) => {
  console.log(`[${idx + 1}] 라인 ${line}:`);
  console.log(`   ${prompt.substring(0, 150)}...`);
  console.log('');
});

/**
 * hairStyles.ts의 프롬프트를 styleguide.md에서 추출한 나노바나나 프롬프트로 업데이트
 */

const fs = require('fs');
const path = require('path');

// parsed-prompts.json 로드
const parsedData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'parsed-prompts.json'), 'utf-8')
);

// hairStyles.ts 읽기
const hairStylesPath = path.join(__dirname, '..', 'src', 'data', 'hairStyles.ts');
let hairStylesContent = fs.readFileSync(hairStylesPath, 'utf-8');

// 스타일 이름 매핑 (hairStyles.ts의 nameKo -> styleguide.md 프롬프트)
const styleNameMapping = {
  // 남성 스타일
  '360 웨이브': ['360 waves', '360 wave'],
  '투스트랜드 트위스트': ['two strand twist', 'two-strand twist'],
  '테이퍼 아프로': ['taper afro', 'afro taper'],
  '컬리탑 페이드': ['curly top fade', 'curly top'],
  '하이탑 페이드': ['high-top fade', 'high top fade'],
  '템플 페이드': ['temple fade'],
  '프렌치 크롭': ['french crop'],
  '프렌치 크롭 컬리': ['french crop curly'],
  '폼파두르': ['pompadour'],
  '퀴프': ['quiff'],
  '슬릭백': ['slick back', 'slickback'],
  '사이드 파트': ['side swept', 'side part'],
  '텍스처드 크롭': ['textured crop'],
  '커튼 헤어': ['curtain hair', 'gareuma'],
  '가르마펌': ['curtain hair', 'gareuma perm'],
  '멀릿': ['mullet'],
  '언더컷': ['undercut'],
  'S컬펌': ['curly top fade', 's-curl'],
  '쉼표머리': ['comma hair'],
  '콤마헤어': ['comma hair'],
  '다운펌': ['down perm'],
  '투블럭': ['two block'],
  '댄디컷': ['dandy cut', 'dandy'],
  '리젠트컷': ['regent', 'pompadour'],
  '아이비리그': ['ivy league'],
  '쉐도우펌': ['shadow perm'],
  '텍스처펌': ['texture perm'],
  '가일컷': ['bowl cut', 'mushroom'],
  '버즈컷': ['buzz cut'],
  '크루컷': ['crew cut'],
  '시저컷': ['caesar'],
  '모히칸': ['mohawk'],
  '포호크': ['faux hawk'],
  '맨번': ['man bun'],

  // 여성 스타일
  '드레드락': ['dreadlocks', 'dreadlock'],
  '박스 브레이드': ['box braids'],
  '콘로우': ['cornrows'],
  '내추럴 아프로': ['natural afro'],
  '트위스트 아웃': ['twist out'],
  '반투 노트': ['bantu knots'],
  '풀라니 브레이드': ['fulani braids'],
  '패션 트위스트': ['passion twist'],
  '가디스 락': ['goddess locs'],
  '세네갈리즈 트위스트': ['senegalese twist'],
  '말리 트위스트': ['marley twist'],
  '낫리스 브레이드': ['knotless braids', 'knotless braid'],
  '픽시컷': ['pixie'],
  '보브컷': ['bob cut', 'bob'],
  '숏보브': ['short bob'],
  '롱보브': ['lob', 'long bob'],
  '프렌치 밥': ['french bob'],
  '블런트 밥': ['blunt bob'],
  '레이어드 밥': ['layered bob'],
  '울프컷': ['wolf cut'],
  '허쉬컷': ['hush cut'],
  '샤기컷': ['shaggy', 'shag'],
  '히메컷': ['hime cut'],
  '태슬컷': ['tassel cut'],
  '레이어드컷': ['layered'],
  '롱 레이어드': ['long layered'],
  '젤리펌': ['jelly perm'],
  '빌드펌': ['build perm'],
  '히피펌': ['hippie perm'],
  '물결펌': ['wave perm'],
  '비치 웨이브': ['beach wave'],
  'C컬펌': ['c-curl'],
  'S컬': ['s-curl'],
  '가디스 브레이드': ['goddess braids'],
  '피쉬테일': ['fishtail'],
  '더치 브레이드': ['dutch braid'],
  '프렌치 브레이드': ['french braid'],
  '워터폴 브레이드': ['waterfall braid'],
  '하프업': ['half up'],
  '포니테일': ['ponytail'],
  '시뇽': ['chignon'],
  '메시번': ['messy bun'],
  '슬릭번': ['slick bun'],
  '스트레이트': ['straight'],
  '볼륨스트레이트': ['volume straight'],
  '시스루뱅': ['see-through bangs'],
  '커튼뱅': ['curtain bangs'],
  '풀뱅': ['full bangs'],
};

// 프롬프트 찾기 함수
function findPromptForStyle(styleNameKo, gender) {
  const prompts = parsedData.prompts;

  // 매핑 키워드 확인
  const keywords = styleNameMapping[styleNameKo] || [styleNameKo.toLowerCase()];

  for (const prompt of prompts) {
    const promptLower = prompt.prompt.toLowerCase();

    // 성별 확인
    const isMalePrompt = promptLower.includes('male mannequin') && !promptLower.includes('female');
    const isFemalePrompt = promptLower.includes('female mannequin');

    if (gender === 'male' && isFemalePrompt) continue;
    if (gender === 'female' && isMalePrompt) continue;

    // 키워드 매칭
    for (const keyword of keywords) {
      if (promptLower.includes(keyword.toLowerCase())) {
        return prompt.prompt;
      }
    }
  }

  return null;
}

// 프롬프트 업데이트 결과 추적
let updatedCount = 0;
let notFoundCount = 0;
const notFoundStyles = [];

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

// 각 스타일에 대해 프롬프트 업데이트
for (const style of styles) {
  const newPrompt = findPromptForStyle(style.nameKo, style.gender);

  if (newPrompt) {
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
    console.log(`✅ ${style.gender} - ${style.nameKo}: 프롬프트 업데이트됨`);
  } else {
    notFoundCount++;
    notFoundStyles.push(`${style.gender} - ${style.nameKo}`);
  }
}

// 결과 저장
fs.writeFileSync(hairStylesPath, hairStylesContent, 'utf-8');

console.log(`\n=== 업데이트 완료 ===`);
console.log(`업데이트됨: ${updatedCount}개`);
console.log(`찾지 못함: ${notFoundCount}개`);

if (notFoundStyles.length > 0 && notFoundStyles.length <= 30) {
  console.log(`\n찾지 못한 스타일:`);
  notFoundStyles.forEach(s => console.log(`  - ${s}`));
}

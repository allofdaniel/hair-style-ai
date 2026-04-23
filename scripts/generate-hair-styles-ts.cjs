const fs = require('fs');
const path = require('path');

// hairstyle-images 폴더에서 파일 목록 읽기
const imageDir = path.join(__dirname, '..', 'hairstyle-images');
const files = fs.readdirSync(imageDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

// 남성/여성 분리
const maleFiles = files.filter(f => f.startsWith('남자 '));
const femaleFiles = files.filter(f => f.startsWith('여자 '));

// 파일명에서 스타일 정보 추출
function parseFileName(filename) {
  const nameWithoutExt = filename.replace(/\.(jpg|png)$/, '');
  const isMale = nameWithoutExt.startsWith('남자 ');
  const gender = isMale ? 'male' : 'female';
  const styleNameKo = nameWithoutExt.replace(/^(남자|여자) /, '');

  // ID 생성: 한글을 영문으로 매핑 또는 슬러그화
  const prefix = isMale ? 'm' : 'f';
  const id = `${prefix}-${styleNameKo.toLowerCase().replace(/\s+/g, '-')}`;

  return {
    filename,
    gender,
    styleNameKo,
    id
  };
}

// 카테고리 매핑
function getCategory(styleNameKo, gender) {
  const nameLC = styleNameKo.toLowerCase();

  if (gender === 'male') {
    // 다운펌 계열
    if (nameLC.includes('다운') || nameLC.includes('쉼표') || nameLC.includes('포마드')) return 'down-perm';
    // 투블럭 계열
    if (nameLC.includes('투블럭') || nameLC.includes('언더컷') || nameLC.includes('댄디') || nameLC.includes('모히칸')) return 'two-block';
    // 숏 스타일
    if (nameLC.includes('버즈') || nameLC.includes('크루') || nameLC.includes('상고') || nameLC.includes('군인') || nameLC.includes('스포츠') || nameLC.includes('아이비')) return 'short';
    // 펌 스타일
    if (nameLC.includes('펌') || nameLC.includes('컬') || nameLC.includes('웨이브') || nameLC.includes('곱슬')) return 'perm';
    // 롱 스타일
    if (nameLC.includes('롱') || nameLC.includes('맨번') || nameLC.includes('울프') || nameLC.includes('레이어드')) return 'long';
    // 페이드 스타일
    if (nameLC.includes('페이드') || nameLC.includes('테이퍼')) return 'fade';
    // 아프리칸 스타일
    if (nameLC.includes('드레드') || nameLC.includes('아프로') || nameLC.includes('브레이드') || nameLC.includes('콘로우') || nameLC.includes('트위스트')) return 'african';
    // 웨스턴 스타일
    if (nameLC.includes('폼파') || nameLC.includes('슬릭') || nameLC.includes('퀴프') || nameLC.includes('프렌치')) return 'western';
    // 동아시아 스타일
    if (nameLC.includes('jpop') || nameLC.includes('kpop') || nameLC.includes('비주얼') || nameLC.includes('사무라이') || nameLC.includes('호스트') || nameLC.includes('차이니') || nameLC.includes('타이완')) return 'eastasia';
    // 남아시아 스타일
    if (nameLC.includes('볼리우드') || nameLC.includes('인디언') || nameLC.includes('타밀') || nameLC.includes('펀자비') || nameLC.includes('시크교') || nameLC.includes('케랄라')) return 'southasia';
    // 동남아시아 스타일
    if (nameLC.includes('베트남') || nameLC.includes('인도네시') || nameLC.includes('타이') || nameLC.includes('필리핀') || nameLC.includes('말레이') || nameLC.includes('싱가포르') || nameLC.includes('발리')) return 'southeastasia';
    // 중동 스타일
    if (nameLC.includes('아라비') || nameLC.includes('에미레') || nameLC.includes('레바논') || nameLC.includes('터키') || nameLC.includes('페르시') || nameLC.includes('두바이') || nameLC.includes('모로칸')) return 'middleeast';
    // 라틴 스타일
    if (nameLC.includes('라틴') || nameLC.includes('브라질') || nameLC.includes('멕시') || nameLC.includes('콜롬비') || nameLC.includes('아르헨') || nameLC.includes('레게톤') || nameLC.includes('푸에르토') || nameLC.includes('쿠반')) return 'latin';

    return 'salon'; // 기본값
  } else {
    // 숏 스타일
    if (nameLC.includes('픽시') || nameLC.includes('숏') || nameLC.includes('보브') || nameLC.includes('단발') || nameLC.includes('허쉬')) return 'short-cut';
    // 중단발
    if (nameLC.includes('중단발') || nameLC.includes('태슬') || nameLC.includes('블런트')) return 'mid-length';
    // 롱 스타일
    if (nameLC.includes('롱') || nameLC.includes('긴') || nameLC.includes('레이어드')) return 'long-hair';
    // 뱅 스타일
    if (nameLC.includes('뱅') || nameLC.includes('앞머리') || nameLC.includes('시스루') || nameLC.includes('히메')) return 'bangs';
    // 펌 스타일
    if (nameLC.includes('펌') || nameLC.includes('컬') || nameLC.includes('웨이브') || nameLC.includes('물결') || nameLC.includes('글램') || nameLC.includes('히피') || nameLC.includes('샤기')) return 'perm';
    // 업두 스타일
    if (nameLC.includes('번') || nameLC.includes('포니') || nameLC.includes('업') || nameLC.includes('하프') || nameLC.includes('올림')) return 'updo';
    // 아프리칸 스타일
    if (nameLC.includes('드레드') || nameLC.includes('아프로') || nameLC.includes('브레이드') || nameLC.includes('콘로우') || nameLC.includes('트위스트') || nameLC.includes('반투') || nameLC.includes('풀라니') || nameLC.includes('세네갈') || nameLC.includes('낫리스') || nameLC.includes('코일리')) return 'african';
    // 웨스턴 스타일
    if (nameLC.includes('할리우드') || nameLC.includes('비치') || nameLC.includes('프렌치') || nameLC.includes('플래티넘')) return 'western';
    // 동아시아 스타일
    if (nameLC.includes('kpop') || nameLC.includes('얼짱') || nameLC.includes('갸루') || nameLC.includes('애니메') || nameLC.includes('중국') || nameLC.includes('히메컷')) return 'eastasia';
    // 남아시아 스타일
    if (nameLC.includes('볼리우드') || nameLC.includes('인디언') || nameLC.includes('케랄라')) return 'southasia';
    // 동남아시아 스타일
    if (nameLC.includes('베트남') || nameLC.includes('필리핀') || nameLC.includes('태국') || nameLC.includes('싱가포르') || nameLC.includes('발리')) return 'southeastasia';
    // 중동 스타일
    if (nameLC.includes('아라비') || nameLC.includes('두바이') || nameLC.includes('터키') || nameLC.includes('페르시') || nameLC.includes('모로칸')) return 'middleeast';
    // 라틴 스타일
    if (nameLC.includes('라티나') || nameLC.includes('브라질') || nameLC.includes('멕시') || nameLC.includes('콜롬비') || nameLC.includes('푸에르토') || nameLC.includes('쿠반')) return 'latin';

    return 'mid-length'; // 기본값
  }
}

// 프롬프트 생성
function generatePrompt(styleNameKo, gender) {
  const genderKo = gender === 'male' ? '남성' : '여성';
  return `Korean ${gender} ${styleNameKo} hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling`;
}

// 스타일 데이터 생성
const maleStyles = maleFiles.map(f => {
  const parsed = parseFileName(f);
  const encodedFilename = encodeURIComponent(f);
  return {
    id: parsed.id,
    nameKo: parsed.styleNameKo,
    name: parsed.styleNameKo, // 영문 이름 (나중에 번역 가능)
    category: getCategory(parsed.styleNameKo, 'male'),
    gender: 'male',
    description: `${parsed.styleNameKo} 스타일`,
    prompt: generatePrompt(parsed.styleNameKo, 'male'),
    thumbnail: `https://hairstyle-ai-references.s3.ap-northeast-2.amazonaws.com/references/new/${encodedFilename}`
  };
});

const femaleStyles = femaleFiles.map(f => {
  const parsed = parseFileName(f);
  const encodedFilename = encodeURIComponent(f);
  return {
    id: parsed.id,
    nameKo: parsed.styleNameKo,
    name: parsed.styleNameKo,
    category: getCategory(parsed.styleNameKo, 'female'),
    gender: 'female',
    description: `${parsed.styleNameKo} 스타일`,
    prompt: generatePrompt(parsed.styleNameKo, 'female'),
    thumbnail: `https://hairstyle-ai-references.s3.ap-northeast-2.amazonaws.com/references/new/${encodedFilename}`
  };
});

// TypeScript 파일 생성
const tsContent = `import type { HairStyle, Gender } from '../stores/useAppStore';

// 카테고리: 전체 + 즐겨찾기만
export const maleCategories = [
  { id: 'all', name: 'All', nameKo: '전체' },
  { id: 'favorites', name: 'Favorites', nameKo: '즐겨찾기' },
];

// 상세 카테고리 (확장 시 사용)
export const maleSubCategories = {
  natural: ['down-perm', 'two-block', 'short'],
  trendy: ['perm', 'long', 'fade'],
  classic: ['salon'],
  global: ['eastasia', 'southeastasia', 'southasia', 'middleeast', 'african', 'western', 'latin'],
};

// 인기 스타일 ID (데이터 기반 추천)
export const malePopularStyleIds = [
  'm-쉼표머리', 'm-댄디컷', 'm-투블럭', 'm-가일펌', 'm-내추럴-다운'
];

// 카테고리: 전체 + 즐겨찾기만
export const femaleCategories = [
  { id: 'all', name: 'All', nameKo: '전체' },
  { id: 'favorites', name: 'Favorites', nameKo: '즐겨찾기' },
];

// 상세 카테고리 매핑
export const femaleSubCategories = {
  short: ['short-cut', 'mid-length'],
  long: ['long-hair', 'bangs'],
  perm: ['perm', 'updo'],
  global: ['eastasia', 'southeastasia', 'southasia', 'middleeast', 'african', 'western', 'latin'],
};

// 여성 인기 스타일 ID
export const femalePopularStyleIds = [
  'f-레이어드컷', 'f-시스루뱅', 'f-c컬펌', 'f-허쉬컷', 'f-태슬컷'
];

export const hairStyles: HairStyle[] = [
  // ===== MALE STYLES (${maleStyles.length}개) =====
${maleStyles.map(s => `  {
    id: '${s.id}',
    name: '${s.name}',
    nameKo: '${s.nameKo}',
    category: '${s.category}',
    gender: '${s.gender}' as Gender,
    description: '${s.description}',
    prompt: '${s.prompt}',
    thumbnail: '${s.thumbnail}',
  }`).join(',\n')},
  // ===== FEMALE STYLES (${femaleStyles.length}개) =====
${femaleStyles.map(s => `  {
    id: '${s.id}',
    name: '${s.name}',
    nameKo: '${s.nameKo}',
    category: '${s.category}',
    gender: '${s.gender}' as Gender,
    description: '${s.description}',
    prompt: '${s.prompt}',
    thumbnail: '${s.thumbnail}',
  }`).join(',\n')}
];

// 성별로 필터링된 스타일 가져오기
export const getStylesByGender = (gender: Gender): HairStyle[] => {
  return hairStyles.filter(style => style.gender === gender);
};

// 카테고리로 필터링
export const getStylesByCategory = (gender: Gender, category: string): HairStyle[] => {
  if (category === 'all') return getStylesByGender(gender);
  if (category === 'favorites') return []; // 앱 스토어에서 관리
  return hairStyles.filter(style => style.gender === gender && style.category === category);
};

// ID로 스타일 찾기
export const getStyleById = (id: string): HairStyle | undefined => {
  return hairStyles.find(style => style.id === id);
};

// 카테고리 반환
export const getCategories = (gender: Gender) => {
  return gender === 'male' ? maleCategories : femaleCategories;
};

// 즐겨찾기 스타일 가져오기 (실제로는 앱 스토어에서 관리)
export const getFavoriteStyles = (gender: Gender, favoriteIds: string[]): HairStyle[] => {
  return hairStyles.filter(style => style.gender === gender && favoriteIds.includes(style.id));
};

// 머리 색상 옵션
export const hairColors = [
  { id: 'natural', nameKo: '자연색', prompt: 'keep the natural existing hair color unchanged' },
  { id: 'black', nameKo: '블랙', prompt: 'pure jet black colored hair - the hair must be completely BLACK' },
  { id: 'dark-brown', nameKo: '다크브라운', prompt: 'dark chocolate brown colored hair - the hair must be DARK BROWN' },
  { id: 'ash-brown', nameKo: '애쉬브라운', prompt: 'ash brown colored hair with cool gray undertones - the hair must be ASH BROWN (grayish brown)' },
  { id: 'chestnut', nameKo: '밤색', prompt: 'warm reddish chestnut brown colored hair - the hair must be CHESTNUT (reddish brown)' },
  { id: 'honey-blonde', nameKo: '허니블론드', prompt: 'golden honey blonde colored hair - the hair must be BLONDE with golden honey tones' },
  { id: 'platinum', nameKo: '플래티넘', prompt: 'bright platinum blonde almost white colored hair - the hair must be PLATINUM BLONDE (very light, almost white)' },
  { id: 'burgundy', nameKo: '버건디', prompt: 'deep burgundy wine red colored hair - the hair must be BURGUNDY RED (dark red wine color)' },
  { id: 'blue-black', nameKo: '청흑색', prompt: 'blue-black colored hair with visible blue sheen - the hair must show BLUE undertones' },
];

// 머리 질감 옵션
export const hairTextures = [
  { id: 'straight', nameKo: '직모', description: '곧은 머리', prompt: 'naturally straight hair texture' },
  { id: 'wavy', nameKo: '웨이브', description: '자연 웨이브', prompt: 'naturally wavy hair texture' },
  { id: 'curly', nameKo: '곱슬', description: '곱슬머리', prompt: 'naturally curly hair texture' },
];
`;

// 파일 저장
const outputPath = path.join(__dirname, '..', 'src', 'data', 'hairStyles.ts');
fs.writeFileSync(outputPath, tsContent, 'utf8');

console.log('hairStyles.ts 파일이 생성되었습니다!');
console.log(`남성 스타일: ${maleStyles.length}개`);
console.log(`여성 스타일: ${femaleStyles.length}개`);
console.log(`총: ${maleStyles.length + femaleStyles.length}개`);

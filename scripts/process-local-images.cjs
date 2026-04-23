/**
 * 로컬 헤어스타일 이미지들을 public 폴더로 복사하고 hairStyles.ts 생성
 */

const fs = require('fs');
const path = require('path');

// 경로 설정
const IMAGES_DIR = path.join(__dirname, '..', 'hairstyle-images');
const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'hairstyles');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'hairStyles.ts');

// 스타일 매핑 (한글 -> 영문)
const styleMap = {
  // 남자 스타일
  '쉼표머리': 'comma-hair',
  'kpop 쉼표머리': 'kpop-comma-hair',
  '가르마펌': 'parted-perm',
  '가일펌': 'gail-perm',
  '곱슬펌': 'curly-perm',
  '군인머리': 'military-cut',
  '기본 다운펌': 'basic-down-perm',
  '내추럴 다운': 'natural-down',
  '댄디컷': 'dandy-cut',
  '드레드락': 'dreadlocks',
  '드롭 페이드': 'drop-fade',
  '라틴 페이드': 'latin-fade',
  '레게톤 트위스트': 'reggaeton-twist',
  '레바논 시크': 'lebanese-chic',
  '레이어드 컷': 'layered-cut',
  '레이어드컷': 'layered-cut',
  '로우페이드': 'low-fade',
  '롱 레이어드': 'long-layered',
  '리젠트펌': 'regent-perm',
  '리프컷': 'leaf-cut',
  '말레이시안 모던': 'malaysian-modern',
  '매직 스트레이트': 'magic-straight',
  '맨번': 'man-bun',
  '메시 미디엄': 'messy-medium',
  '멕시칸 포마드': 'mexican-pomade',
  '모던 멀릿': 'modern-mullet',
  '모히칸 투블럭': 'mohawk-two-block',
  '미드페이드': 'mid-fade',
  '바가지머리': 'bowl-cut',
  '박스 브레이드': 'box-braids',
  '버스트 페이드': 'burst-fade',
  '버즈컷': 'buzz-cut',
  '베트남 클래식': 'vietnam-classic',
  '볼륨 펌': 'volume-perm',
  '볼륨펌': 'volume-perm',
  '볼리우드 클래식': 'bollywood-classic',
  '브라질 서퍼': 'brazilian-surfer',
  '사무라이 번': 'samurai-bun',
  '사이드 스웹트': 'side-swept',
  '사이드 파트 컷': 'side-part-cut',
  '상고머리': 'sanggo-cut',
  '세팅 펌': 'setting-perm',
  '세팅펌': 'setting-perm',
  '쉐도우펌': 'shadow-perm',
  '스킨페이드': 'skin-fade',
  '스포츠컷': 'sports-cut',
  '슬릭백': 'slick-back',
  '시크교 스타일': 'sikh-style',
  '아라비안 클래식': 'arabian-classic',
  '아르헨틴 웨이브': 'argentine-wave',
  '아이리쉬펌': 'irish-perm',
  '아이비리그컷': 'ivy-league-cut',
  '아프로': 'afro',
  '애니메 스파이크': 'anime-spike',
  '애즈펌': 'ash-perm',
  '언더컷': 'undercut',
  '에미레이트 모던': 'emirate-modern',
  '울프컷': 'wolf-cut',
  '유러피안 페이드': 'european-fade',
  '인도네시안 텍스처': 'indonesian-texture',
  '인디언 페이드': 'indian-fade',
  '차이니즈 클래식': 'chinese-classic',
  '커튼 헤어': 'curtain-hair',
  '컬리탑 페이드': 'curly-top-fade',
  '콘로우': 'cornrows',
  '콜롬비아 모던': 'colombian-modern',
  '퀴프': 'quiff',
  '크루컷': 'crew-cut',
  '타밀 웨이브': 'tamil-wave',
  '타이 언더컷': 'thai-undercut',
  '타이완 웨이브': 'taiwan-wave',
  '터키쉬 페이드': 'turkish-fade',
  '테이퍼 아프로': 'taper-afro',
  '테이퍼 페이드': 'taper-fade',
  '텍스처 펌': 'texture-perm',
  '텍스처펌': 'texture-perm',
  '텍스처드 크롭': 'textured-crop',
  '템퍼 페이드': 'temple-fade',
  '투 스탠드 트위스트': 'two-strand-twist',
  '투블럭': 'two-block',
  '펀자비 스타일': 'punjabi-style',
  '페르시안 웨이브': 'persian-wave',
  '포마드 다운펌': 'pomade-down-perm',
  '폼파두르': 'pompadour',
  '프렌치 크롭 컬리': 'french-crop-curly',
  '프렌치 크롭': 'french-crop',
  '픽시컷': 'pixie-cut',
  '필리핀 포마드': 'philippine-pomade',
  '하이탑 페이드': 'high-top-fade',
  '하이페이드': 'high-fade',
  '호스트 클럽 스타일': 'host-club-style',
  '히피펌': 'hippie-perm',
  'S컬펌': 's-curl-perm',
  'jpop visual': 'jpop-visual',
  '360 웨이브': '360-wave',

  // 여자 스타일
  'C컬펌': 'c-curl-perm',
  'kpop 아이돌': 'kpop-idol',
  '가디스 락': 'goddess-locs',
  '갸루 스타일': 'gyaru-style',
  '귀넘김 단발': 'ear-tuck-bob',
  '글램펌': 'glam-perm',
  '긴생머리': 'long-straight',
  '남 인디언 번': 'south-indian-bun',
  '낫리스 브레이즈': 'knotless-braids',
  '네추럴 아프로': 'natural-afro',
  '두바이 글램': 'dubai-glam',
  '디지털 펌': 'digital-perm',
  '디지털펌': 'digital-perm',
  '라티나 컬': 'latina-curl',
  '레이어드 중단발': 'layered-mid-bob',
  '로맨틱 업스타일': 'romantic-upstyle',
  '로우번': 'low-bun',
  '롱 S컬펌': 'long-s-curl-perm',
  '롱 레이어드': 'long-layered',
  '말리 트위스트': 'marley-twist',
  '메시번': 'messy-bun',
  '멕시칸 브레이드': 'mexican-braid',
  '모던 인디언': 'modern-indian',
  '모로칸 스타일': 'moroccan-style',
  '물결펌': 'wave-perm',
  '바디펌': 'body-perm',
  '반투 노트': 'bantu-knots',
  '발리 웨이브': 'bali-wave',
  '베트남 긴 생머리': 'vietnam-long-straight',
  '보브컷': 'bob-cut',
  '볼륨 매직': 'volume-magic',
  '볼리우드 글램': 'bollywood-glam',
  '브라질리언 블로우아웃': 'brazilian-blowout',
  '블런트 컷': 'blunt-cut',
  '비치 웨이브': 'beach-wave',
  '사이드뱅': 'side-bang',
  '샤기컷': 'shaggy-cut',
  '세네갈 트위스트': 'senegalese-twist',
  '숏 생머리': 'short-straight',
  '숏 울프컷': 'short-wolf-cut',
  '슬릭 스트레이트': 'sleek-straight',
  '시스루뱅': 'see-through-bang',
  '싱가포르 시크': 'singapore-chic',
  '아라비안 긴머리': 'arabian-long',
  '앞머리 있는 롱보브': 'long-bob-with-bangs',
  '앞머리 있는 보브컷': 'bob-with-bangs',
  '애니메이션 트윈테일': 'anime-twintail',
  '얼짱 스타일': 'ulzzang-style',
  '여신웨이브': 'goddess-wave',
  '인디언 브레이드': 'indian-braid',
  '중국 고대식 올림머리': 'chinese-ancient-updo',
  '쵸피 보브': 'choppy-bob',
  '커튼뱅': 'curtain-bang',
  '케랄라 스타일': 'kerala-style',
  '콜롬비안 웨이브': 'colombian-wave',
  '쿠반 업도': 'cuban-updo',
  '태국 시크': 'thai-chic',
  '태슬컷': 'tassel-cut',
  '터키 드라마': 'turkish-drama',
  '트위스트 아웃': 'twist-out',
  '패션 트위스트': 'passion-twist',
  '페르시안 컬': 'persian-curl',
  '푸에르토리칸 코일리': 'puerto-rican-coily',
  '풀라니 브레이드': 'fulani-braid',
  '풀뱅': 'full-bang',
  '프렌치 보브': 'french-bob',
  '플래티넘 보브': 'platinum-bob',
  '필리핀 웨이브': 'philippine-wave',
  '하이 포니테일': 'high-ponytail',
  '하프업': 'half-up',
  '할리우드 컬': 'hollywood-curl',
  '허쉬컷': 'hush-cut',
  '히메 컷': 'hime-cut',
  '히메컷': 'hime-cut',
};

// 파일명 파싱
function parseFileName(fileName) {
  const baseName = path.basename(fileName, path.extname(fileName));
  const parts = baseName.split(' ');
  const genderKo = parts[0];
  const gender = genderKo === '남자' ? 'male' : 'female';
  const styleName = parts.slice(1).join(' ');
  const englishName = styleMap[styleName] || styleName.toLowerCase().replace(/\s+/g, '-');
  const prefix = gender === 'male' ? 'm' : 'f';
  const styleId = `${prefix}-${englishName}`;

  return { gender, styleName, styleId, englishName };
}

// 카테고리 결정
function determineCategory(gender, styleName) {
  const s = styleName.toLowerCase();

  if (gender === 'male') {
    if (s.includes('페이드') || s.includes('fade')) return 'fade';
    if (s.includes('펌') || s.includes('perm')) return 'perm';
    if (s.includes('투블럭') || s.includes('언더컷')) return 'two-block';
    if (s.includes('다운') || s.includes('쉼표')) return 'down-perm';
    if (s.match(/(브라질|멕시칸|아라비안|터키|인도|필리핀|베트남|차이니즈|타이|볼리우드|페르시안|아르헨틴|콜롬비아|말레이|인도네시안|타밀|펀자비|시크교|에미레이트|레바논|드레드|콘로우|브레이드|트위스트|아프로)/)) return 'global';
    if (s.match(/(댄디|슬릭백|포마드|아이비리그|크루|사이드)/)) return 'salon';
    return 'short';
  } else {
    if (s.includes('펌') || s.includes('perm') || s.includes('웨이브') || s.includes('컬')) return 'perm';
    if (s.match(/(숏|픽시|보브|단발)/)) return 'short-cut';
    if (s.match(/(긴|롱|생머리|레이어드)/)) return 'long-hair';
    if (s.includes('뱅') || s.includes('앞머리')) return 'bangs';
    if (s.match(/(번|업|포니테일|업도)/)) return 'updo';
    if (s.match(/(브라질|멕시칸|아라비안|터키|인도|필리핀|베트남|두바이|발리|싱가포르|태국|볼리우드|페르시안|콜롬비|쿠반|케랄라|모로칸|아프로|브레이드|콘로우|드레드|트위스트|풀라니|반투|세네갈|가디스)/)) return 'global';
    return 'mid-length';
  }
}

// 나노바나나 스타일 프롬프트 생성
function generatePrompt(gender, styleName) {
  return `A vertical portrait photograph of a single white plastic ${gender === 'male' ? 'male' : 'female'} mannequin bust with subtle sculpted facial contours, facing front-left. It wears a premium navy blue knit sweater. The jet black hair is styled in a ${styleName} style. The finish is natural and matte. Minimalist white studio background, professional soft lighting.`;
}

async function main() {
  console.log('🚀 로컬 이미지 처리 시작...\n');

  // 디렉토리 생성
  fs.mkdirSync(path.join(PUBLIC_DIR, 'male'), { recursive: true });
  fs.mkdirSync(path.join(PUBLIC_DIR, 'female'), { recursive: true });

  // 이미지 파일 목록
  const files = fs.readdirSync(IMAGES_DIR).filter(f =>
    f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg')
  );

  console.log(`📁 총 ${files.length}개 이미지 발견\n`);

  const maleStyles = [];
  const femaleStyles = [];
  const popularMale = ['m-comma-hair', 'm-dandy-cut', 'm-two-block', 'm-gail-perm', 'm-natural-down'];
  const popularFemale = ['f-layered-cut', 'f-see-through-bang', 'f-c-curl-perm', 'f-hush-cut', 'f-tassel-cut'];

  for (const file of files) {
    const { gender, styleName, styleId, englishName } = parseFileName(file);
    const ext = path.extname(file);
    const targetName = `${englishName}${ext}`;
    const targetDir = path.join(PUBLIC_DIR, gender);
    const targetPath = path.join(targetDir, targetName);

    // 이미지 복사
    fs.copyFileSync(path.join(IMAGES_DIR, file), targetPath);

    const category = determineCategory(gender, styleName);
    const prompt = generatePrompt(gender, styleName);
    const thumbnail = `/hairstyles/${gender}/${targetName}`;

    const style = {
      id: styleId,
      name: englishName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      nameKo: styleName,
      category,
      gender,
      description: `${styleName} 스타일`,
      prompt,
      thumbnail,
    };

    if (gender === 'male') {
      maleStyles.push(style);
    } else {
      femaleStyles.push(style);
    }

    console.log(`✅ ${styleName} -> ${targetName}`);
  }

  // hairStyles.ts 생성
  const tsContent = `import type { HairStyle, Gender } from '../stores/useAppStore';

// 힉의 법칙: 선택지를 6-7개로 제한 (메인 카테고리)
export const maleCategories = [
  { id: 'all', name: 'All', nameKo: '전체', icon: '✨' },
  { id: 'popular', name: 'Popular', nameKo: '인기', icon: '🔥' },
  { id: 'natural', name: 'Natural', nameKo: '내추럴', icon: '🍃' },
  { id: 'trendy', name: 'Trendy', nameKo: '트렌디', icon: '💫' },
  { id: 'classic', name: 'Classic', nameKo: '클래식', icon: '👔' },
  { id: 'global', name: 'Global', nameKo: '글로벌', icon: '🌍' },
];

export const maleSubCategories = {
  natural: ['down-perm', 'two-block', 'short'],
  trendy: ['perm', 'long', 'fade'],
  classic: ['salon'],
  global: ['global'],
};

export const malePopularStyleIds = ${JSON.stringify(popularMale)};

export const femaleCategories = [
  { id: 'all', name: 'All', nameKo: '전체', icon: '✨' },
  { id: 'popular', name: 'Popular', nameKo: '인기', icon: '🔥' },
  { id: 'short', name: 'Short', nameKo: '짧은', icon: '💇‍♀️' },
  { id: 'long', name: 'Long', nameKo: '긴머리', icon: '👩‍🦰' },
  { id: 'perm', name: 'Perm', nameKo: '펌', icon: '🌀' },
  { id: 'global', name: 'Global', nameKo: '글로벌', icon: '🌍' },
];

export const femaleSubCategories = {
  short: ['short-cut', 'mid-length'],
  long: ['long-hair', 'bangs'],
  perm: ['perm', 'updo'],
  global: ['global'],
};

export const femalePopularStyleIds = ${JSON.stringify(popularFemale)};

export const hairStyles: HairStyle[] = [
  // ===== MALE STYLES (${maleStyles.length}개) =====
${maleStyles.map(s => `  {
    id: '${s.id}',
    name: '${s.name}',
    nameKo: '${s.nameKo}',
    category: '${s.category}',
    gender: 'male',
    description: '${s.description}',
    prompt: '${s.prompt.replace(/'/g, "\\'")}',
    thumbnail: '${s.thumbnail}',
  }`).join(',\n')},

  // ===== FEMALE STYLES (${femaleStyles.length}개) =====
${femaleStyles.map(s => `  {
    id: '${s.id}',
    name: '${s.name}',
    nameKo: '${s.nameKo}',
    category: '${s.category}',
    gender: 'female',
    description: '${s.description}',
    prompt: '${s.prompt.replace(/'/g, "\\'")}',
    thumbnail: '${s.thumbnail}',
  }`).join(',\n')},
];

// 성별로 필터링
export const getStylesByGender = (gender: Gender): HairStyle[] => {
  return hairStyles.filter(style => style.gender === gender);
};

// 카테고리로 필터링
export const getStylesByCategory = (gender: Gender, category: string): HairStyle[] => {
  if (category === 'all') return getStylesByGender(gender);
  if (category === 'popular') {
    const popularIds = gender === 'male' ? malePopularStyleIds : femalePopularStyleIds;
    return hairStyles.filter(s => popularIds.includes(s.id));
  }

  const subCategories = gender === 'male' ? maleSubCategories : femaleSubCategories;
  const subs = subCategories[category as keyof typeof subCategories] || [];

  return hairStyles.filter(s => s.gender === gender && subs.includes(s.category));
};

// ID로 스타일 찾기
export const getStyleById = (id: string): HairStyle | undefined => {
  return hairStyles.find(style => style.id === id);
};
`;

  fs.writeFileSync(OUTPUT_FILE, tsContent, 'utf-8');

  console.log(`\n========================================`);
  console.log(`✅ 완료!`);
  console.log(`   남성 스타일: ${maleStyles.length}개`);
  console.log(`   여성 스타일: ${femaleStyles.length}개`);
  console.log(`   총: ${maleStyles.length + femaleStyles.length}개`);
  console.log(`📄 hairStyles.ts 생성됨`);
}

main().catch(console.error);

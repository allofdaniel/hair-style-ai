/**
 * styleguide.md에서 프롬프트를 추출하여 hairStyles.ts를 업데이트하는 스크립트
 */

const fs = require('fs');
const path = require('path');

const styleGuideContent = fs.readFileSync(
  path.join(__dirname, '..', 'styleguide.md'),
  'utf-8'
);

// 헤어스타일 이미지 폴더에서 실제 스타일 목록 가져오기
const hairstyleImagesDir = path.join(__dirname, '..', 'hairstyle-images');
const imageFiles = fs.readdirSync(hairstyleImagesDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

// 스타일 이름과 프롬프트 매핑
const stylePrompts = {};

// Prompt: 패턴을 찾아서 추출
const promptRegex = /\*\*Prompt[:\s]*\*\*[:\s]*(?:\n>)?(.+?)(?=\n---|\n\*\*\[|$)/gs;
const altPromptRegex = />\s*\*\*Prompt:\*\*\s*(?:\n>)?(.+?)(?=\n---|\n\*\*|$)/gs;
const simplePromptRegex = />\s*A (?:vertical )?(?:high-quality )?(?:portrait|premium)[^>]+?(?=\n\n|\n---)/gs;

// styleguide.md에서 모든 프롬프트 추출
let matches = [...styleGuideContent.matchAll(/(?:Prompt[:\s]*\*\*)?[:\s]*\n?>?\s*(A (?:vertical |high-quality |premium |portrait )?(?:portrait |photograph )?[^]+?)(?=\n\n---|\n\n\*\*\[|\n\n###|\n\n##|\n\n\*\*다른|$)/g)];

console.log(`Found ${matches.length} potential prompts in styleguide.md`);

// 스타일 이름을 한글에서 영어 ID로 변환
function koreanToId(koreanName) {
  const mappings = {
    '360 웨이브': '360-wave',
    'jpop visual': 'jpop-visual',
    'kpop 쉼표머리': 'kpop-comma-hair',
    'S컬펌': 's-curl-perm',
    '가르마펌': 'parted-perm',
    '가일펌': 'gail-perm',
    '쉼표머리': 'comma-hair',
    '댄디컷': 'dandy-cut',
    '투블럭': 'two-block',
    '다운펌': 'down-perm',
    '애쉬펌': 'ash-perm',
    '슬릭백': 'slick-back',
    '포마드': 'pomade',
    '퀴프': 'quiff',
    '언더컷': 'undercut',
    '크롭컷': 'crop-cut',
    '텍스처드 크롭': 'textured-crop',
    '프렌치 크롭': 'french-crop',
    '커튼 헤어': 'curtain-hair',
    '사이드 스웹트': 'side-swept',
    '드레드락': 'dreadlocks',
    '박스 브레이드': 'box-braids',
    '콘로우': 'cornrows',
    '아프로': 'afro',
    '트위스트 아웃': 'twist-out',
    '반투 노트': 'bantu-knots',
    '풀라니 브레이드': 'fulani-braids',
    '패션 트위스트': 'passion-twist',
    '가디스 락': 'goddess-locs',
    '세네갈리즈 트위스트': 'senegalese-twist',
    '말리 트위스트': 'marley-twist',
    '낫리스 브레이즈': 'knotless-braids',
    '레이어드컷': 'layered-cut',
    '허쉬컷': 'hush-cut',
    '태슬컷': 'tassel-cut',
    '보브컷': 'bob-cut',
    '숏컷': 'short-cut',
    '픽시컷': 'pixie-cut',
    '히메컷': 'hime-cut',
    '시스루뱅': 'see-through-bang',
    'C컬펌': 'c-curl-perm',
    '젤리펌': 'jelly-perm',
    '바디펌': 'body-perm',
    '물결펌': 'wave-perm',
    '히피펌': 'hippie-perm',
  };

  for (const [korean, english] of Object.entries(mappings)) {
    if (koreanName.includes(korean)) {
      return english;
    }
  }

  // 기본 변환 - 한글을 제거하고 영어 부분만 추출
  const englishPart = koreanName.replace(/[가-힣\s]+/g, '').toLowerCase();
  return englishPart || koreanName.toLowerCase().replace(/\s+/g, '-');
}

// 나노바나나 표준 프롬프트 템플릿
const basePromptMale = "A vertical portrait photograph of a single white plastic male mannequin bust with subtle sculpted facial contours, facing front-left. It wears a premium navy blue knit sweater.";
const basePromptFemale = "A high-quality 3:4 portrait of a white plastic female mannequin bust with elegant facial contours and a soft jawline, looking towards the front-left. The mannequin is wearing a premium navy blue knit sweater.";
const endPrompt = "Minimalist white studio background, professional soft lighting.";

// 이미지 파일에서 스타일 정보 추출
const styles = imageFiles.map(filename => {
  const nameWithoutExt = filename.replace(/\.(jpg|png)$/i, '');
  const isMale = nameWithoutExt.startsWith('남자 ');
  const isFemale = nameWithoutExt.startsWith('여자 ');
  const gender = isMale ? 'male' : 'female';
  const styleName = nameWithoutExt.replace(/^(남자|여자)\s+/, '');

  return {
    filename,
    gender,
    styleNameKo: styleName,
    id: `${gender === 'male' ? 'm' : 'f'}-${koreanToId(styleName)}`,
  };
});

// styleguide.md에서 스타일별 프롬프트 매칭
function findPromptForStyle(styleNameKo, gender) {
  // 스타일 이름 검색
  const searchTerms = [
    styleNameKo,
    styleNameKo.replace(/컷$/, ''),
    styleNameKo.replace(/펌$/, ''),
  ];

  for (const term of searchTerms) {
    // 해당 스타일 섹션 찾기
    const sectionRegex = new RegExp(
      `(?:${term}|${term.replace(' ', '')})[^]*?(?:Prompt[:\\s]*\\*\\*|> A |A vertical|A high-quality|A portrait|A premium)([^]+?)(?=\\n\\n---|\\n\\n###|\\n\\n##|\\n\\*\\*\\[나노|$)`,
      'i'
    );

    const match = styleGuideContent.match(sectionRegex);
    if (match) {
      // 프롬프트 추출
      let prompt = match[1] || match[0];

      // 프롬프트 정리
      prompt = prompt
        .replace(/^[\s>:*]+/g, '')
        .replace(/\n>/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // 완전한 프롬프트인지 확인
      if (prompt.includes('mannequin') && prompt.length > 100) {
        return prompt;
      }
    }
  }

  // 못 찾으면 기본 템플릿 사용
  const basePrompt = gender === 'male' ? basePromptMale : basePromptFemale;
  return `${basePrompt} The jet black hair is styled in a ${styleNameKo} style. The finish is natural and matte. ${endPrompt}`;
}

// 각 스타일에 프롬프트 매칭
styles.forEach(style => {
  style.prompt = findPromptForStyle(style.styleNameKo, style.gender);
});

// hairStyles.ts 템플릿 생성
const maleStyles = styles.filter(s => s.gender === 'male');
const femaleStyles = styles.filter(s => s.gender === 'female');

console.log(`\nProcessed ${maleStyles.length} male styles and ${femaleStyles.length} female styles`);

// 카테고리 결정 함수
function determineCategory(styleNameKo, gender) {
  const nameLower = styleNameKo.toLowerCase();

  if (gender === 'male') {
    if (nameLower.includes('펌') || nameLower.includes('컬') || nameLower.includes('웨이브')) return 'perm';
    if (nameLower.includes('다운') || nameLower.includes('쉼표') || nameLower.includes('가르마')) return 'down-perm';
    if (nameLower.includes('투블럭') || nameLower.includes('언더컷')) return 'two-block';
    if (nameLower.includes('숏') || nameLower.includes('크롭') || nameLower.includes('군인') || nameLower.includes('페이드')) return 'short';
    if (nameLower.includes('롱') || nameLower.includes('long')) return 'long';
    if (nameLower.includes('페이드')) return 'fade';
    if (nameLower.includes('드레드') || nameLower.includes('트위스트') || nameLower.includes('브레이드') || nameLower.includes('아프로') || nameLower.includes('콘로우')) return 'global';
    return 'salon';
  } else {
    if (nameLower.includes('숏') || nameLower.includes('보브') || nameLower.includes('픽시') || nameLower.includes('단발')) return 'short-cut';
    if (nameLower.includes('펌') || nameLower.includes('컬') || nameLower.includes('웨이브')) return 'perm';
    if (nameLower.includes('롱') || nameLower.includes('레이어드') || nameLower.includes('긴')) return 'long-hair';
    if (nameLower.includes('뱅') || nameLower.includes('앞머리')) return 'bangs';
    if (nameLower.includes('드레드') || nameLower.includes('트위스트') || nameLower.includes('브레이드') || nameLower.includes('아프로') || nameLower.includes('콘로우') || nameLower.includes('노트')) return 'global';
    if (nameLower.includes('업도') || nameLower.includes('번')) return 'updo';
    return 'mid-length';
  }
}

// ID를 영어 이름으로 변환
function idToEnglishName(id) {
  return id
    .replace(/^[mf]-/, '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// 영어 파일명으로 변환
function koreanToEnglishFilename(koreanName) {
  const mappings = {
    '360 웨이브': '360-wave',
    'jpop visual': 'jpop-visual',
    'kpop 쉼표머리': 'kpop-comma-hair',
    'S컬펌': 's-curl-perm',
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
    '리젠트 펌': 'regent-perm',
    '맨번': 'man-bun',
    '모히칸': 'mohawk',
    '바버샵 페이드': 'barbershop-fade',
    '복고 슬릭백': 'retro-slickback',
    '볼륨 다운펌': 'volume-down-perm',
    '볼륨펌': 'volume-perm',
    '사이드 파트': 'side-part',
    '샤기컷': 'shaggy-cut',
    '슬릭백': 'slick-back',
    '애쉬펌': 'ash-perm',
    '아르헨티나 웨이브': 'argentine-wave',
    '아라비안 클래식': 'arabian-classic',
    '아프로': 'afro',
    '애니메 스파이크': 'anime-spike',
    '에드가컷': 'edgar-cut',
    '울프컷': 'wolf-cut',
    '쉼표머리': 'comma-hair',
    '스왓컷': 'swat-cut',
    '스팍스컷': 'sparks-cut',
    '젤리펌': 'jelly-perm',
    '치노컷': 'chino-cut',
    '크롭컷': 'crop-cut',
    '크루컷': 'crew-cut',
    '클래식 테이퍼': 'classic-taper',
    '테이퍼 페이드': 'taper-fade',
    '텍스처드 크롭': 'textured-crop',
    '투블럭': 'two-block',
    '투블럭 펌': 'two-block-perm',
    '포마드 스타일': 'pomade-style',
    '하이탑 페이드': 'high-top-fade',
    '핫셀컷': 'hassle-cut',
    '히피펌': 'hippie-perm',
    // 여성 스타일
    '레이어드컷': 'layered-cut',
    '시스루뱅': 'see-through-bang',
    'C컬펌': 'c-curl-perm',
    '허쉬컷': 'hush-cut',
    '태슬컷': 'tassel-cut',
    '보브컷': 'bob-cut',
    '보브 앤 뱅': 'bob-with-bangs',
    '바디펌': 'body-perm',
    '물결펌': 'wave-perm',
    '비치 웨이브': 'beach-wave',
    '블런트컷': 'blunt-cut',
    '발리 웨이브': 'bali-wave',
    '볼리우드 글램': 'bollywood-glam',
    '세네갈 트위스트': 'senegalese-twist',
    '콘로우': 'cornrows',
    '드레드락': 'dreadlocks',
    '박스 브레이드': 'box-braids',
    '반투 노트': 'bantu-knots',
    '풀라니 브레이드': 'fulani-braids',
    '가디스 락': 'goddess-locs',
    '말리 트위스트': 'marley-twist',
    '트위스트 아웃': 'twist-out',
    '픽시컷': 'pixie-cut',
    '히메컷': 'hime-cut',
    '애니메 트윈테일': 'anime-twintail',
    '아라비안 롱': 'arabian-long',
  };

  // 정확한 매칭 먼저
  if (mappings[koreanName]) {
    return mappings[koreanName];
  }

  // 부분 매칭
  for (const [korean, english] of Object.entries(mappings)) {
    if (koreanName.includes(korean)) {
      return english;
    }
  }

  // 기본: 한글을 제거하고 영어로 변환
  return koreanName
    .replace(/[가-힣]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-') ||
    koreanName.toLowerCase().replace(/\s+/g, '-');
}

// hairStyles.ts 내용 생성
let hairStylesContent = `import type { HairStyle, Gender } from '../stores/useAppStore';

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

export const malePopularStyleIds = ["m-comma-hair","m-dandy-cut","m-two-block","m-gail-perm","m-natural-down"];

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

export const femalePopularStyleIds = ["f-layered-cut","f-see-through-bang","f-c-curl-perm","f-hush-cut","f-tassel-cut"];

export const hairStyles: HairStyle[] = [
  // ===== MALE STYLES (${maleStyles.length}개) =====
`;

// 남성 스타일 추가
maleStyles.forEach(style => {
  const englishFilename = koreanToEnglishFilename(style.styleNameKo);
  const category = determineCategory(style.styleNameKo, 'male');
  const englishName = idToEnglishName(style.id);

  hairStylesContent += `  {
    id: '${style.id}',
    name: '${englishName}',
    nameKo: '${style.styleNameKo}',
    category: '${category}',
    gender: 'male',
    description: '${style.styleNameKo} 스타일',
    prompt: '${style.prompt.replace(/'/g, "\\'")}',
    thumbnail: '/hairstyles/male/${englishFilename}.jpg',
  },
`;
});

hairStylesContent += `  // ===== FEMALE STYLES (${femaleStyles.length}개) =====
`;

// 여성 스타일 추가
femaleStyles.forEach(style => {
  const englishFilename = koreanToEnglishFilename(style.styleNameKo);
  const category = determineCategory(style.styleNameKo, 'female');
  const englishName = idToEnglishName(style.id);

  hairStylesContent += `  {
    id: '${style.id}',
    name: '${englishName}',
    nameKo: '${style.styleNameKo}',
    category: '${category}',
    gender: 'female',
    description: '${style.styleNameKo} 스타일',
    prompt: '${style.prompt.replace(/'/g, "\\'")}',
    thumbnail: '/hairstyles/female/${englishFilename}.jpg',
  },
`;
});

hairStylesContent += `];

// 성별에 맞는 스타일 필터링
export const getStylesByGender = (gender: Gender) => {
  return hairStyles.filter((style) => style.gender === gender);
};

// 카테고리별 스타일 필터링
export const getStylesByCategory = (gender: Gender, category: string) => {
  if (category === 'all') {
    return getStylesByGender(gender);
  }
  if (category === 'popular') {
    const popularIds = gender === 'male' ? malePopularStyleIds : femalePopularStyleIds;
    return hairStyles.filter((style) => popularIds.includes(style.id));
  }

  const genderStyles = getStylesByGender(gender);
  const subCategories = gender === 'male' ? maleSubCategories : femaleSubCategories;

  // 메인 카테고리에서 서브 카테고리 찾기
  const subCats = subCategories[category as keyof typeof subCategories] || [];

  if (subCats.length > 0) {
    return genderStyles.filter((style) => subCats.includes(style.category));
  }

  return genderStyles.filter((style) => style.category === category);
};

// 카테고리 가져오기
export const getCategories = (gender: Gender) => {
  return gender === 'male' ? maleCategories : femaleCategories;
};

// 헤어 컬러 옵션
export const hairColors = [
  { id: 'natural-black', name: '자연 검정', nameKo: '자연 검정', nameEn: 'Natural Black', hex: '#1a1a1a', prompt: 'natural jet black hair color' },
  { id: 'dark-brown', name: '다크 브라운', nameKo: '다크 브라운', nameEn: 'Dark Brown', hex: '#3d2314', prompt: 'dark brown hair color' },
  { id: 'chestnut', name: '밤색', nameKo: '밤색', nameEn: 'Chestnut', hex: '#954535', prompt: 'chestnut brown hair color' },
  { id: 'ash-brown', name: '애쉬 브라운', nameKo: '애쉬 브라운', nameEn: 'Ash Brown', hex: '#8a7355', prompt: 'ash brown hair color' },
  { id: 'caramel', name: '카라멜', nameKo: '카라멜', nameEn: 'Caramel', hex: '#b5651d', prompt: 'caramel blonde hair color' },
  { id: 'burgundy', name: '버건디', nameKo: '버건디', nameEn: 'Burgundy', hex: '#800020', prompt: 'burgundy red hair color' },
  { id: 'ash-gray', name: '애쉬 그레이', nameKo: '애쉬 그레이', nameEn: 'Ash Gray', hex: '#b2beb5', prompt: 'ash gray silver hair color' },
  { id: 'platinum', name: '플래티넘', nameKo: '플래티넘', nameEn: 'Platinum', hex: '#e5e4e2', prompt: 'platinum blonde hair color' },
  { id: 'rose-gold', name: '로즈골드', nameKo: '로즈골드', nameEn: 'Rose Gold', hex: '#b76e79', prompt: 'rose gold pink hair color' },
  { id: 'blue-black', name: '블루블랙', nameKo: '블루블랙', nameEn: 'Blue Black', hex: '#0d0d1a', prompt: 'blue black hair color' },
];

// 헤어 텍스처 옵션
export const hairTextures = [
  { id: 'straight', name: '생머리', nameKo: '생머리', nameEn: 'Straight', prompt: 'straight sleek hair texture' },
  { id: 'wavy', name: '웨이브', nameKo: '웨이브', nameEn: 'Wavy', prompt: 'soft wavy hair texture' },
  { id: 'curly', name: '곱슬', nameKo: '곱슬', nameEn: 'Curly', prompt: 'natural curly hair texture' },
  { id: 'coily', name: '촘촘 곱슬', nameKo: '촘촘 곱슬', nameEn: 'Coily', prompt: 'tight coily hair texture' },
];
`;

// 파일 저장
const outputPath = path.join(__dirname, '..', 'src', 'data', 'hairStyles.ts');
fs.writeFileSync(outputPath, hairStylesContent);

console.log(`\n✅ hairStyles.ts 업데이트 완료!`);
console.log(`   - 남성 스타일: ${maleStyles.length}개`);
console.log(`   - 여성 스타일: ${femaleStyles.length}개`);
console.log(`   - 저장 위치: ${outputPath}`);

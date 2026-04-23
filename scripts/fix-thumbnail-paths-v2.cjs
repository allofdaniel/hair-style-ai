/**
 * hairStyles.ts의 thumbnail 경로를 실제 이미지 파일과 매핑
 * 스타일 name (영문) 기반으로 유사한 파일 찾기
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

// name에서 파일명 생성
const nameToFileName = (name) => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// 유사한 파일 찾기
const findMatchingFile = (name, nameKo, id, files) => {
  // 1. id 기반 (m-xxx -> xxx)
  const idBased = id.replace(/^[mf]-/, '');
  if (files.includes(idBased)) return idBased;

  // 2. name 기반
  const nameBased = nameToFileName(name);
  if (files.includes(nameBased)) return nameBased;

  // 3. 부분 일치 (name이 파일명에 포함)
  const keywords = nameBased.split('-').filter(k => k.length > 2);
  for (const file of files) {
    const matchCount = keywords.filter(k => file.includes(k)).length;
    if (matchCount >= 2 || (keywords.length === 1 && file.includes(keywords[0]))) {
      return file;
    }
  }

  // 4. 특수 매핑
  const specialMappings = {
    // 남성
    '로우페이드': 'low-fade',
    '롱 레이어드': 'long-layered',
    '리젠트펌': 'regent-perm',
    '리프컷': 'leaf-cut',
    '말레이시안 모던': 'malaysian-modern',
    '매직 스트레이트': 'magic-straight',
    '메시 미디엄': 'messy-medium',
    '멕시칸 포마드': 'mexican-pomade',
    '모던 멀릿': 'modern-mullet',
    '미드페이드': 'mid-fade',
    '바가지머리': 'bowl-cut',
    '버스트 페이드': 'burst-fade',
    '버즈컷': 'buzz-cut',
    '베트남 클래식': 'vietnam-classic',
    '볼륨 펌': 'volume-perm',
    '볼리우드 클래식': 'bollywood-classic',
    '브라질 서퍼': 'brazilian-surfer',
    '사무라이 번': 'samurai-bun',
    '사이드 파트 컷': 'side-part-cut',
    '상고머리': 'sanggo-cut',
    '세팅 펌': 'setting-perm',
    '쉐도우펌': 'shadow-perm',
    '쉼표머리': 'comma-hair',
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
    '에미레이트 모던': 'emirate-modern',
    '울프컷': 'wolf-cut',
    '유러피안 페이드': 'european-fade',
    '인도네시안 텍스처': 'indonesian-texture',
    '인디언 페이드': 'indian-fade',
    '차이니즈 클래식': 'chinese-classic',
    '컬리탑 페이드': 'curly-top-fade',
    '콘로우': 'cornrows',
    '콜롬비아 모던': 'colombian-modern',
    '크루컷': 'crew-cut',
    '타밀 웨이브': 'tamil-wave',
    '타이완 웨이브': 'taiwan-wave',
    '터키쉬 페이드': 'turkish-fade',
    '테이퍼 아프로': 'taper-afro',
    '테이퍼 페이드': 'taper-fade',
    '텍스처 펌': 'texture-perm',
    '텍스처드 크롭': 'textured-crop',
    '템퍼 페이드': 'temple-fade',
    '투 스탠드 트위스트': 'two-strand-twist',
    '투블럭': 'two-block',
    '펀자비 스타일': 'punjabi-style',
    '페르시안 웨이브': 'persian-wave',
    '포마드 다운펌': 'pomade-down-perm',
    '폼파두르': 'pompadour',
    '필리핀 포마드': 'philippine-pomade',
    '하이탑 페이드': 'high-top-fade',
    '하이페이드': 'high-fade',
    '호스트 클럽 스타일': 'host-club-style',
    '히피펌': 'hippie-perm',
    '드레드락': 'dreadlocks',
    '드롭 페이드': 'drop-fade',
    '라틴 페이드': 'latin-fade',
    '레게톤 트위스트': 'reggaeton-twist',
    '레바논 시크': 'lebanese-chic',
    '레이어드 컷': 'layered-cut',
    '맨번': 'man-bun',
    '박스 브레이드': 'box-braids',
    '기본 다운펌': 'basic-down-perm',
    '내추럴 다운': 'natural-down',
    '댄디컷': 'dandy-cut',
    '곱슬펌': 'curly-perm',
    '군인머리': 'military-cut',
    '가르마펌': 'parted-perm',
    '가일펌': 'gail-perm',
    '픽시컷': 'pixie-cut',
    // 여성
    'kpop 아이돌': 'kpop-idol',
    '가디스 락': 'goddess-locs',
    '갸루 스타일': 'gyaru-style',
    '귀넘김 단발': 'ear-tuck-bob',
    '글램펌': 'glam-perm',
    '긴생머리': 'long-straight',
    '남 인디언 번': 'south-indian-bun',
    '네추럴 아프로': 'natural-afro',
    '두바이 글램': 'dubai-glam',
    '디지털 펌': 'digital-perm',
    '라티나 컬': 'latina-curl',
    '레이어드 중단발': 'layered-mid-bob',
    '레이어드컷': 'layered-cut',
    '로맨틱 업스타일': 'romantic-upstyle',
    '로우번': 'low-bun',
    '롱 S컬펌': 'long-s-curl-perm',
    '롱 레이어드': 'long-layered',
    '말리 트위스트': 'marley-twist',
    '매직 스트레이트': 'magic-straight',
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
    '세팅펌': 'setting-perm',
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
    'C컬펌': 'c-curl-perm',
  };

  if (specialMappings[nameKo]) {
    const mapped = specialMappings[nameKo];
    if (files.includes(mapped)) return mapped;
  }

  return null;
};

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

let fixedCount = 0;
let notFoundCount = 0;
const notFound = [];

for (const style of styles) {
  const folder = style.gender === 'male' ? 'male' : 'female';
  const fileList = style.gender === 'male' ? maleFiles : femaleFiles;

  const matchedFile = findMatchingFile(style.name, style.nameKo, style.id, fileList);

  if (matchedFile) {
    const correctPath = `/hairstyles/${folder}/${matchedFile}.jpg`;

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
    notFound.push(`${style.gender} - ${style.nameKo} (${style.name})`);
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

/**
 * hairStyles.ts 파일에서 thumbnail URL을 로컬 경로로 변경하고
 * GIF가 있는 스타일에 gif 속성 추가
 */

const fs = require('fs');
const path = require('path');

const hairStylesPath = path.join(__dirname, '../src/data/hairStyles.ts');
const publicMaleDir = path.join(__dirname, '../public/hairstyles/male');
const publicFemaleDir = path.join(__dirname, '../public/hairstyles/female');
const publicGifDir = path.join(__dirname, '../public/hairstyles/gif');

// 사용 가능한 로컬 이미지들 확인
const maleImages = fs.readdirSync(publicMaleDir).filter(f => f.endsWith('.jpg'));
const femaleImages = fs.readdirSync(publicFemaleDir).filter(f => f.endsWith('.jpg'));
const gifImages = fs.readdirSync(publicGifDir).filter(f => f.endsWith('.gif'));

console.log('=== hairStyles.ts 업데이트 ===');
console.log(`남자 이미지: ${maleImages.length}개`);
console.log(`여자 이미지: ${femaleImages.length}개`);
console.log(`GIF: ${gifImages.length}개`);

// hairStyles.ts 읽기
let content = fs.readFileSync(hairStylesPath, 'utf-8');

// 한글 이름 -> 파일명 매핑 생성
const nameToFile = {};

// 남자 스타일 매핑
const maleMapping = {
  '360 웨이브': '360-wave.jpg',
  'jpop visual': 'jpop-visual.jpg',
  'kpop 쉼표머리': 'kpop-comma-hair.jpg',
  'S컬펌': 's-curl-perm.jpg',
  '가르마펌': 'parted-perm.jpg',
  '가일펌': 'gyle-perm.jpg',
  '곱슬펌': 'curly-perm.jpg',
  '군인머리': 'military-cut.jpg',
  '기본 다운펌': 'basic-down-perm.jpg',
  '내추럴 다운': 'natural-down.jpg',
  '내추럴다운': 'natural-down.jpg',
  '댄디컷': 'dandy-cut.jpg',
  '드레드락': 'dreadlocks.jpg',
  '드롭 페이드': 'drop-fade.jpg',
  '라틴 페이드': 'latin-fade.jpg',
  '레게톤 트위스트': 'reggaeton-twist.jpg',
  '레바논 시크': 'lebanese-chic.jpg',
  '레이어드 컷': 'layered-cut.jpg',
  '레이어드컷': 'layered-cut.jpg',
  '로우페이드': 'low-fade.jpg',
  '롱 레이어드': 'long-layered.jpg',
  '리젠트펌': 'regent-perm.jpg',
  '리프컷': 'leaf-cut.jpg',
  '말레이시안 모던': 'malaysian-modern.jpg',
  '매직 스트레이트': 'magic-straight.jpg',
  '매직스트레이트': 'magic-straight.jpg',
  '맨번': 'man-bun.jpg',
  '메시 미디엄': 'messy-medium.jpg',
  '멕시칸 포마드': 'mexican-pomade.jpg',
  '모던 멀릿': 'modern-mullet.jpg',
  '모히칸 투블럭': 'mohican-two-block.jpg',
  '미드페이드': 'mid-fade.jpg',
  '바가지머리': 'bowl-cut.jpg',
  '박스 브레이드': 'box-braids.jpg',
  '버스트 페이드': 'burst-fade.jpg',
  '버즈컷': 'buzz-cut.jpg',
  '베트남 클래식': 'vietnamese-classic.jpg',
  '볼륨 펌': 'volume-perm.jpg',
  '볼륨펌': 'volume-perm.jpg',
  '볼리우드 클래식': 'bollywood-classic.jpg',
  '브라질 서퍼': 'brazilian-surfer.jpg',
  '사무라이 번': 'samurai-bun.jpg',
  '사이드 스웹트': 'side-swept.jpg',
  '사이드 파트 컷': 'side-part-cut.jpg',
  '사이드파트컷': 'side-part-cut.jpg',
  '상고머리': 'sanggo.jpg',
  '세팅 펌': 'setting-perm.jpg',
  '세팅펌': 'setting-perm.jpg',
  '쉐도우펌': 'shadow-perm.jpg',
  '쉼표머리': 'comma-hair.jpg',
  '스킨페이드': 'skin-fade.jpg',
  '스포츠컷': 'sports-cut.jpg',
  '슬릭백': 'slick-back.jpg',
  '시크교 스타일': 'sikh-style.jpg',
  '아라비안 클래식': 'arabian-classic.jpg',
  '아르헨틴 웨이브': 'argentine-wave.jpg',
  '아프로': 'afro.jpg',
  '애니메 스파이크': 'anime-spike.jpg',
  '애쉬펌': 'ash-perm.jpg',
  '언더컷': 'undercut.jpg',
  '울프컷': 'wolf-cut.jpg',
  '테이퍼 페이드': 'taper-fade.jpg',
  '테이퍼페이드': 'taper-fade.jpg',
  '텍스처 펌': 'texture-perm.jpg',
  '텍스처펌': 'texture-perm.jpg',
  '텍스처드 크롭': 'textured-crop.jpg',
  '투블럭': 'two-block.jpg',
  '폼파두르': 'pompadour.jpg',
  '프렌치 크롭': 'french-crop.jpg',
  '히피펌': 'hippie-perm.jpg',
};

// 여자 스타일 매핑
const femaleMapping = {
  'c컬펌': 'c-curl-perm.jpg',
  'C컬펌': 'c-curl-perm.jpg',
  's컬펌': 's-curl-perm.jpg',
  'S컬펌': 's-curl-perm.jpg',
  '레이어드컷': 'layered-cut.jpg',
  '롱 레이어드': 'long-layered.jpg',
  '롱레이어드': 'long-layered.jpg',
  '바디펌': 'body-perm.jpg',
  '볼륨 매직': 'volume-magic.jpg',
  '볼륨매직': 'volume-magic.jpg',
  '비치 웨이브': 'beach-wave.jpg',
  '비치웨이브': 'beach-wave.jpg',
  '샤기컷': 'shaggy-cut.jpg',
  '시스루뱅': 'see-through-bangs.jpg',
  '태슬컷': 'tassel-cut.jpg',
  '픽시컷': 'pixie-cut.jpg',
  '하이 포니테일': 'high-ponytail.jpg',
  '하이포니테일': 'high-ponytail.jpg',
  '허쉬컷': 'hush-cut.jpg',
  '히메컷': 'hime-cut.jpg',
  '히피펌': 'hippie-perm.jpg',
};

// GIF 매핑
const gifMapping = {
  'm-360-웨이브': '360-wave.gif',
  'm-jpop-visual': 'jpop-visual.gif',
  'm-kpop-쉼표머리': 'kpop-comma-hair.gif',
  'm-s컬펌': 's-curl-perm.gif',
  'm-가르마펌': 'parted-perm.gif',
  'm-가일펌': 'gyle-perm.gif',
  'm-곱슬펌': 'curly-perm.gif',
  'm-군인머리': 'military-cut.gif',
  'm-기본-다운펌': 'basic-down-perm.gif',
  'm-내추럴-다운': 'natural-down.gif',
  'm-댄디컷': 'dandy-cut.gif',
  'm-드레드락': 'dreadlocks.gif',
  'f-태슬컷': 'tassel-cut.gif',
};

// 스타일별로 thumbnail과 gif 업데이트
let updatedCount = 0;
let gifAddedCount = 0;

// 정규식으로 각 스타일 블록을 찾아서 처리
const styleBlockRegex = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*nameKo:\s*'([^']+)',[\s\S]*?thumbnail:\s*'[^']*',?\s*(?:gif:\s*'[^']*',?)?\s*\}/g;

content = content.replace(styleBlockRegex, (match, id, name, nameKo) => {
  const isMale = id.startsWith('m-');
  const mapping = isMale ? maleMapping : femaleMapping;
  const folder = isMale ? 'male' : 'female';

  // 이름으로 파일 찾기
  let filename = mapping[nameKo] || mapping[name];

  if (!filename) {
    // 다른 형식 시도
    const variations = [nameKo, name, nameKo.replace(/ /g, ''), name.replace(/ /g, '')];
    for (const v of variations) {
      if (mapping[v]) {
        filename = mapping[v];
        break;
      }
    }
  }

  if (filename) {
    const localPath = `/hairstyles/${folder}/${filename}`;

    // thumbnail 업데이트
    let updated = match.replace(/thumbnail:\s*'[^']*'/, `thumbnail: '${localPath}'`);

    // GIF 확인 및 추가
    const gifFile = gifMapping[id];
    if (gifFile && gifImages.includes(gifFile)) {
      const gifPath = `/hairstyles/gif/${gifFile}`;
      // 이미 gif 속성이 있으면 업데이트, 없으면 thumbnail 다음에 추가
      if (updated.includes('gif:')) {
        updated = updated.replace(/gif:\s*'[^']*'/, `gif: '${gifPath}'`);
      } else {
        updated = updated.replace(/(thumbnail:\s*'[^']*')/, `$1,\n    gif: '${gifPath}'`);
      }
      gifAddedCount++;
    }

    updatedCount++;
    return updated;
  }

  return match;
});

// 파일 저장
fs.writeFileSync(hairStylesPath, content, 'utf-8');

console.log(`\n업데이트 완료: ${updatedCount}개 스타일`);
console.log(`GIF 추가: ${gifAddedCount}개 스타일`);

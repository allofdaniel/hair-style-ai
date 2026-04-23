/**
 * 헤어스타일 이미지 교체 스크립트
 * - output 폴더의 가공된 이미지들 (_붙은 파일)로 기존 이미지 교체
 * - GIF 폴더의 파일들도 복사
 */

const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '../hairstyle-images/output');
const gifDir = path.join(__dirname, '../hairstyle-images/gif');
const publicMaleDir = path.join(__dirname, '../public/hairstyles/male');
const publicFemaleDir = path.join(__dirname, '../public/hairstyles/female');
const publicGifDir = path.join(__dirname, '../public/hairstyles/gif');

// 한글 이름 -> 영문 파일명 매핑
const nameMapping = {
  // 남자 스타일
  '남자 360 웨이브': { gender: 'male', filename: '360-wave.jpg' },
  '남자 jpop visual': { gender: 'male', filename: 'jpop-visual.jpg' },
  '남자 kpop 쉼표머리': { gender: 'male', filename: 'kpop-comma-hair.jpg' },
  '남자 S컬펌': { gender: 'male', filename: 's-curl-perm.jpg' },
  '남자 가르마펌': { gender: 'male', filename: 'parted-perm.jpg' },
  '남자 가일펌': { gender: 'male', filename: 'gyle-perm.jpg' },
  '남자 곱슬펌': { gender: 'male', filename: 'curly-perm.jpg' },
  '남자 군인머리': { gender: 'male', filename: 'military-cut.jpg' },
  '남자 기본 다운펌': { gender: 'male', filename: 'basic-down-perm.jpg' },
  '남자 내추럴 다운': { gender: 'male', filename: 'natural-down.jpg' },
  '남자 댄디컷': { gender: 'male', filename: 'dandy-cut.jpg' },
  '남자 드레드락': { gender: 'male', filename: 'dreadlocks.jpg' },
  '남자 드롭 페이드': { gender: 'male', filename: 'drop-fade.jpg' },
  '남자 라틴 페이드': { gender: 'male', filename: 'latin-fade.jpg' },
  '남자 레게톤 트위스트': { gender: 'male', filename: 'reggaeton-twist.jpg' },
  '남자 레바논 시크': { gender: 'male', filename: 'lebanese-chic.jpg' },
  '남자 레이어드 컷': { gender: 'male', filename: 'layered-cut.jpg' },
  '남자 로우페이드': { gender: 'male', filename: 'low-fade.jpg' },
  '남자 롱 레이어드': { gender: 'male', filename: 'long-layered.jpg' },
  '남자 리젠트펌': { gender: 'male', filename: 'regent-perm.jpg' },
  '남자 리프컷': { gender: 'male', filename: 'leaf-cut.jpg' },
  '남자 말레이시안 모던': { gender: 'male', filename: 'malaysian-modern.jpg' },
  '남자 매직 스트레이트': { gender: 'male', filename: 'magic-straight.jpg' },
  '남자 맨번': { gender: 'male', filename: 'man-bun.jpg' },
  '남자 메시 미디엄': { gender: 'male', filename: 'messy-medium.jpg' },
  '남자 멕시칸 포마드': { gender: 'male', filename: 'mexican-pomade.jpg' },
  '남자 모던 멀릿': { gender: 'male', filename: 'modern-mullet.jpg' },
  '남자 모히칸 투블럭': { gender: 'male', filename: 'mohican-two-block.jpg' },
  '남자 미드페이드': { gender: 'male', filename: 'mid-fade.jpg' },
  '남자 바가지머리': { gender: 'male', filename: 'bowl-cut.jpg' },
  '남자 박스 브레이드': { gender: 'male', filename: 'box-braids.jpg' },
  '남자 버스트 페이드': { gender: 'male', filename: 'burst-fade.jpg' },
  '남자 버즈컷': { gender: 'male', filename: 'buzz-cut.jpg' },
  '남자 베트남 클래식': { gender: 'male', filename: 'vietnamese-classic.jpg' },
  '남자 볼륨 펌': { gender: 'male', filename: 'volume-perm.jpg' },
  '남자 볼리우드 클래식': { gender: 'male', filename: 'bollywood-classic.jpg' },
  '남자 브라질 서퍼': { gender: 'male', filename: 'brazilian-surfer.jpg' },
  '남자 사무라이 번': { gender: 'male', filename: 'samurai-bun.jpg' },
  '남자 사이드 스웹트': { gender: 'male', filename: 'side-swept.jpg' },
  '남자 사이드 파트 컷': { gender: 'male', filename: 'side-part-cut.jpg' },
  '남자 상고머리': { gender: 'male', filename: 'sanggo.jpg' },
  '남자 세팅 펌': { gender: 'male', filename: 'setting-perm.jpg' },
  '남자 쉐도우펌': { gender: 'male', filename: 'shadow-perm.jpg' },
  '남자 쉼표머리': { gender: 'male', filename: 'comma-hair.jpg' },
  '남자 스킨페이드': { gender: 'male', filename: 'skin-fade.jpg' },
  '남자 스포츠컷': { gender: 'male', filename: 'sports-cut.jpg' },
  '남자 슬릭백': { gender: 'male', filename: 'slick-back.jpg' },
  '남자 시크교 스타일': { gender: 'male', filename: 'sikh-style.jpg' },
  '남자 아라비안 클래식': { gender: 'male', filename: 'arabian-classic.jpg' },
  '남자 아르헨틴 웨이브': { gender: 'male', filename: 'argentine-wave.jpg' },
  '남자 아이비리그': { gender: 'male', filename: 'ivy-league.jpg' },
  '남자 아프리칸 클래식': { gender: 'male', filename: 'african-classic.jpg' },
  '남자 아프로': { gender: 'male', filename: 'afro.jpg' },
  '남자 애쉬펌': { gender: 'male', filename: 'ash-perm.jpg' },
  '남자 언더컷': { gender: 'male', filename: 'undercut.jpg' },
  '남자 에디터 컷': { gender: 'male', filename: 'editor-cut.jpg' },
  '남자 오키나와 리젠트': { gender: 'male', filename: 'okinawa-regent.jpg' },
  '남자 울프컷': { gender: 'male', filename: 'wolf-cut.jpg' },
  '남자 이집트 클래식': { gender: 'male', filename: 'egyptian-classic.jpg' },
  '남자 인도네시아 클래식': { gender: 'male', filename: 'indonesian-classic.jpg' },
  '남자 일본 락 스파이크': { gender: 'male', filename: 'japanese-rock-spike.jpg' },
  '남자 중국 클래식': { gender: 'male', filename: 'chinese-classic.jpg' },
  '남자 쪽머리': { gender: 'male', filename: 'topknot.jpg' },
  '남자 초이스 컷': { gender: 'male', filename: 'choice-cut.jpg' },
  '남자 캄보디안 모던': { gender: 'male', filename: 'cambodian-modern.jpg' },
  '남자 커리 탑 페이드': { gender: 'male', filename: 'curly-top-fade.jpg' },
  '남자 컬럼비안 모던': { gender: 'male', filename: 'colombian-modern.jpg' },
  '남자 코로우': { gender: 'male', filename: 'cornrows.jpg' },
  '남자 클래식 사이드 파트': { gender: 'male', filename: 'classic-side-part.jpg' },
  '남자 클래식 크루컷': { gender: 'male', filename: 'crew-cut.jpg' },
  '남자 클래식 포마드': { gender: 'male', filename: 'classic-pomade.jpg' },
  '남자 타이 모던': { gender: 'male', filename: 'thai-modern.jpg' },
  '남자 터키 모던': { gender: 'male', filename: 'turkish-modern.jpg' },
  '남자 테이퍼 페이드': { gender: 'male', filename: 'taper-fade.jpg' },
  '남자 텍스처 펌': { gender: 'male', filename: 'texture-perm.jpg' },
  '남자 텍스처드 크롭': { gender: 'male', filename: 'textured-crop.jpg' },
  '남자 투블럭': { gender: 'male', filename: 'two-block.jpg' },
  '남자 트위스트 컬': { gender: 'male', filename: 'twist-curl.jpg' },
  '남자 파인애플 드레드': { gender: 'male', filename: 'pineapple-dread.jpg' },
  '남자 펑크 모히칸': { gender: 'male', filename: 'punk-mohawk.jpg' },
  '남자 포마드 슬릭백': { gender: 'male', filename: 'pomade-slickback.jpg' },
  '남자 폼파두르': { gender: 'male', filename: 'pompadour.jpg' },
  '남자 푸에르토리칸 모던': { gender: 'male', filename: 'puerto-rican-modern.jpg' },
  '남자 프렌치 크롭': { gender: 'male', filename: 'french-crop.jpg' },
  '남자 필리핀 모던': { gender: 'male', filename: 'filipino-modern.jpg' },
  '남자 하이 탑 페이드': { gender: 'male', filename: 'high-top-fade.jpg' },
  '남자 허쉬펌': { gender: 'male', filename: 'hush-perm.jpg' },
  '남자 히피펌': { gender: 'male', filename: 'hippie-perm.jpg' },
  '남자 애니메 스파이크': { gender: 'male', filename: 'anime-spike.jpg' },

  // 여자 스타일
  '여자 c컬펌': { gender: 'female', filename: 'c-curl-perm.jpg' },
  '여자 s컬펌': { gender: 'female', filename: 's-curl-perm.jpg' },
  '여자 가르마 레이어드': { gender: 'female', filename: 'parted-layered.jpg' },
  '여자 걸리쉬 픽시': { gender: 'female', filename: 'girlish-pixie.jpg' },
  '여자 글램 웨이브': { gender: 'female', filename: 'glam-wave.jpg' },
  '여자 글래머러스 롱': { gender: 'female', filename: 'glamorous-long.jpg' },
  '여자 네추럴 롱': { gender: 'female', filename: 'natural-long.jpg' },
  '여자 네추럴 웨이브': { gender: 'female', filename: 'natural-wave.jpg' },
  '여자 단발 보브': { gender: 'female', filename: 'short-bob.jpg' },
  '여자 단발 웨이브': { gender: 'female', filename: 'short-wave.jpg' },
  '여자 댄스 펌': { gender: 'female', filename: 'dance-perm.jpg' },
  '여자 더치 브레이드': { gender: 'female', filename: 'dutch-braid.jpg' },
  '여자 레이어드컷': { gender: 'female', filename: 'layered-cut.jpg' },
  '여자 롱 레이어드': { gender: 'female', filename: 'long-layered.jpg' },
  '여자 롱 스트레이트': { gender: 'female', filename: 'long-straight.jpg' },
  '여자 롱 웨이브': { gender: 'female', filename: 'long-wave.jpg' },
  '여자 롱 히피': { gender: 'female', filename: 'long-hippie.jpg' },
  '여자 로우 포니테일': { gender: 'female', filename: 'low-ponytail.jpg' },
  '여자 뮬레': { gender: 'female', filename: 'mullet.jpg' },
  '여자 미디엄 레이어드': { gender: 'female', filename: 'medium-layered.jpg' },
  '여자 미디엄 보브': { gender: 'female', filename: 'medium-bob.jpg' },
  '여자 미디엄 웨이브': { gender: 'female', filename: 'medium-wave.jpg' },
  '여자 바디펌': { gender: 'female', filename: 'body-perm.jpg' },
  '여자 발레리나 번': { gender: 'female', filename: 'ballerina-bun.jpg' },
  '여자 베이비 뱅': { gender: 'female', filename: 'baby-bangs.jpg' },
  '여자 볼륨 레이어드': { gender: 'female', filename: 'volume-layered.jpg' },
  '여자 볼륨 매직': { gender: 'female', filename: 'volume-magic.jpg' },
  '여자 브레이드 업도': { gender: 'female', filename: 'braid-updo.jpg' },
  '여자 블런트 뱅': { gender: 'female', filename: 'blunt-bangs.jpg' },
  '여자 비치 웨이브': { gender: 'female', filename: 'beach-wave.jpg' },
  '여자 빌드업 펌': { gender: 'female', filename: 'buildup-perm.jpg' },
  '여자 샤기컷': { gender: 'female', filename: 'shaggy-cut.jpg' },
  '여자 숏컷': { gender: 'female', filename: 'short-cut.jpg' },
  '여자 스트레이트 뱅': { gender: 'female', filename: 'straight-bangs.jpg' },
  '여자 시스루뱅': { gender: 'female', filename: 'see-through-bangs.jpg' },
  '여자 시스루 레이어드': { gender: 'female', filename: 'see-through-layered.jpg' },
  '여자 아프리칸 클래식': { gender: 'female', filename: 'african-classic.jpg' },
  '여자 아프로': { gender: 'female', filename: 'afro.jpg' },
  '여자 에어 뱅': { gender: 'female', filename: 'air-bangs.jpg' },
  '여자 엘레강스 웨이브': { gender: 'female', filename: 'elegance-wave.jpg' },
  '여자 영펌': { gender: 'female', filename: 'young-perm.jpg' },
  '여자 올백': { gender: 'female', filename: 'slick-back.jpg' },
  '여자 울프컷': { gender: 'female', filename: 'wolf-cut.jpg' },
  '여자 젤리펌': { gender: 'female', filename: 'jelly-perm.jpg' },
  '여자 초커 레이어드': { gender: 'female', filename: 'choker-layered.jpg' },
  '여자 카디건 뱅': { gender: 'female', filename: 'cardigan-bangs.jpg' },
  '여자 클래식 업도': { gender: 'female', filename: 'classic-updo.jpg' },
  '여자 태슬컷': { gender: 'female', filename: 'tassel-cut.jpg' },
  '여자 트렌치 펌': { gender: 'female', filename: 'trench-perm.jpg' },
  '여자 트윈 브레이드': { gender: 'female', filename: 'twin-braids.jpg' },
  '여자 파워 숄더 롱': { gender: 'female', filename: 'power-shoulder-long.jpg' },
  '여자 페이스 프레임': { gender: 'female', filename: 'face-frame.jpg' },
  '여자 픽시컷': { gender: 'female', filename: 'pixie-cut.jpg' },
  '여자 하이 포니테일': { gender: 'female', filename: 'high-ponytail.jpg' },
  '여자 하프 업': { gender: 'female', filename: 'half-up.jpg' },
  '여자 허쉬컷': { gender: 'female', filename: 'hush-cut.jpg' },
  '여자 히메컷': { gender: 'female', filename: 'hime-cut.jpg' },
  '여자 히피펌': { gender: 'female', filename: 'hippie-perm.jpg' },
};

// GIF 이름 매핑
const gifMapping = {
  '남자 360 웨이브': { gender: 'male', filename: '360-wave.gif' },
  '남자 jpop visual': { gender: 'male', filename: 'jpop-visual.gif' },
  '남자 kpop 쉼표머리': { gender: 'male', filename: 'kpop-comma-hair.gif' },
  '남자 S컬펌': { gender: 'male', filename: 's-curl-perm.gif' },
  '남자 가르마펌': { gender: 'male', filename: 'parted-perm.gif' },
  '남자 가일펌': { gender: 'male', filename: 'gyle-perm.gif' },
  '남자 곱슬펌': { gender: 'male', filename: 'curly-perm.gif' },
  '남자 군인머리': { gender: 'male', filename: 'military-cut.gif' },
  '남자 기본 다운펌': { gender: 'male', filename: 'basic-down-perm.gif' },
  '남자 내추럴 다운': { gender: 'male', filename: 'natural-down.gif' },
  '남자 댄디컷': { gender: 'male', filename: 'dandy-cut.gif' },
  '남자 드레드락': { gender: 'male', filename: 'dreadlocks.gif' },
  '여자 태슬컷': { gender: 'female', filename: 'tassel-cut.gif' },
};

// 디렉토리 생성
if (!fs.existsSync(publicGifDir)) {
  fs.mkdirSync(publicGifDir, { recursive: true });
}

console.log('=== 이미지 업데이트 시작 ===\n');

// 1. output 폴더의 이미지들 복사
console.log('1. 가공된 이미지 복사 중...');
let copiedImages = 0;
let skippedImages = 0;

const outputFiles = fs.readdirSync(outputDir);
for (const file of outputFiles) {
  // _붙은 파일명에서 원래 이름 추출 (예: "남자 360 웨이브_.jpg" -> "남자 360 웨이브")
  const baseName = file.replace(/_.jpg$/, '').replace(/_.png$/, '');
  const mapping = nameMapping[baseName];

  if (mapping) {
    const srcPath = path.join(outputDir, file);
    const destDir = mapping.gender === 'male' ? publicMaleDir : publicFemaleDir;
    const destPath = path.join(destDir, mapping.filename);

    try {
      fs.copyFileSync(srcPath, destPath);
      console.log(`  ✓ ${file} -> ${mapping.gender}/${mapping.filename}`);
      copiedImages++;
    } catch (err) {
      console.error(`  ✗ 복사 실패: ${file} - ${err.message}`);
    }
  } else {
    console.log(`  ? 매핑 없음: ${file}`);
    skippedImages++;
  }
}

console.log(`\n   이미지 복사 완료: ${copiedImages}개 (스킵: ${skippedImages}개)\n`);

// 2. GIF 폴더의 파일들 복사
console.log('2. GIF 파일 복사 중...');
let copiedGifs = 0;

const gifFiles = fs.readdirSync(gifDir);
for (const file of gifFiles) {
  // GIF 파일명에서 이름 추출 (예: "남자 360 웨이브.gif" -> "남자 360 웨이브")
  const baseName = file.replace(/\.gif$/, '');
  const mapping = gifMapping[baseName];

  if (mapping) {
    const srcPath = path.join(gifDir, file);
    const destPath = path.join(publicGifDir, mapping.filename);

    try {
      fs.copyFileSync(srcPath, destPath);
      console.log(`  ✓ ${file} -> gif/${mapping.filename}`);
      copiedGifs++;
    } catch (err) {
      console.error(`  ✗ 복사 실패: ${file} - ${err.message}`);
    }
  } else {
    // 매핑이 없으면 파일명 그대로 복사
    const srcPath = path.join(gifDir, file);
    const destPath = path.join(publicGifDir, file);
    try {
      fs.copyFileSync(srcPath, destPath);
      console.log(`  ✓ ${file} (원본 이름 유지)`);
      copiedGifs++;
    } catch (err) {
      console.error(`  ✗ 복사 실패: ${file} - ${err.message}`);
    }
  }
}

console.log(`\n   GIF 복사 완료: ${copiedGifs}개\n`);

console.log('=== 완료 ===');

const fs = require('fs');
const path = require('path');

// Korean to English mapping for hairstyle names
const koreanToEnglish = {
  // Male styles
  '남자 360 웨이브': 'm-360-wave',
  '남자 jpop visual': 'm-jpop-visual',
  '남자 kpop 쉼표머리': 'm-kpop-comma-hair',
  '남자 S컬펌': 'm-s-curl-perm',
  '남자 가르마펌': 'm-parted-perm',
  '남자 가일펌': 'm-gyle-perm',
  '남자 곱슬펌': 'm-curly-perm',
  '남자 군인머리': 'm-military-cut',
  '남자 기본 다운펌': 'm-basic-down-perm',
  '남자 내추럴 다운': 'm-natural-down',
  '남자 댄디컷': 'm-dandy-cut',
  '남자 드레드락': 'm-dreadlocks',
  '남자 드롭 페이드': 'm-drop-fade',
  '남자 라틴 페이드': 'm-latin-fade',
  '남자 레게톤 트위스트': 'm-reggaeton-twist',
  '남자 레바논 시크': 'm-lebanon-chic',
  '남자 레이어드 컷': 'm-layered-cut',
  '남자 로우페이드': 'm-low-fade',
  '남자 롱 레이어드': 'm-long-layered',
  '남자 리젠트펌': 'm-regent-perm',
  '남자 리프컷': 'm-leaf-cut',
  '남자 말레이시안 모던': 'm-malaysian-modern',
  '남자 매직 스트레이트': 'm-magic-straight',
  '남자 맨번': 'm-man-bun',
  '남자 메시 미디엄': 'm-messy-medium',
  '남자 멕시칸 포마드': 'm-mexican-pomade',
  '남자 모던 멀릿': 'm-modern-mullet',
  '남자 모히칸 투블럭': 'm-mohican-two-block',
  '남자 미드페이드': 'm-mid-fade',
  '남자 바가지머리': 'm-bowl-cut',
  '남자 버스트페이드': 'm-burst-fade',
  '남자 버즈컷': 'm-buzz-cut',
  '남자 베트남 클래식': 'm-vietnam-classic',
  '남자 볼리우드 클래식': 'm-bollywood-classic',
  '남자 브라질 서퍼': 'm-brazil-surfer',
  '남자 사무라이 번': 'm-samurai-bun',
  '남자 사이드 스웹트': 'm-side-swept',
  '남자 상고머리': 'm-sanggo',
  '남자 세팅 펌': 'm-setting-perm',
  '남자 쉐도우펌': 'm-shadow-perm',
  '남자 쉼표머리': 'm-comma-hair',
  '남자 스킨페이드': 'm-skin-fade',
  '남자 스포츠컷': 'm-sports-cut',
  '남자 슬릭백': 'm-slick-back',
  '남자 시크교 스타일': 'm-sikh-style',
  '남자 아라비안 클래식': 'm-arabian-classic',
  '남자 아르헨틴 웨이브': 'm-argentine-wave',
  '남자 아이리쉬펌': 'm-irish-perm',
  '남자 아이비리그 컷': 'm-ivy-league-cut',
  '남자 아프로': 'm-afro',
  '남자 애니메 스파이크': 'm-anime-spike',
  '남자 애즈펌': 'm-ash-perm',
  '남자 언더컷': 'm-undercut',
  '남자 에미레이트 모던': 'm-emirate-modern',
  '남자 울프컷': 'm-wolf-cut',
  '남자 유러피안 페이드': 'm-european-fade',
  '남자 인도네시안 텍스처': 'm-indonesian-texture',
  '남자 차이니즈 클래식': 'm-chinese-classic',
  '남자 커튼 헤어': 'm-curtain-hair',
  '남자 컬리탑 페이드': 'm-curly-top-fade',
  '남자 콘로우': 'm-cornrows',
  '남자 콜롬비아 모던': 'm-colombia-modern',
  '남자 크루컷': 'm-crew-cut',
  '남자 타밀 웨이브': 'm-tamil-wave',
  '남자 타이 언더컷': 'm-thai-undercut',
  '남자 타이완 웨이브': 'm-taiwan-wave',
  '남자 터키쉬 페이드': 'm-turkish-fade',
  '남자 테이퍼 아프로': 'm-taper-afro',
  '남자 테이퍼 페이드': 'm-taper-fade',
  '남자 텍스처 펌': 'm-texture-perm',
  '남자 텍스처드 크롭': 'm-textured-crop',
  '남자 템퍼 페이드': 'm-temp-fade',
  '남자 투 스탠드 트위스트': 'm-two-strand-twist',
  '남자 투블럭': 'm-two-block',
  '남자 펀자비 스타일': 'm-punjabi-style',
  '남자 포마드 다운펌': 'm-pomade-down-perm',
  '남자 폼파두르': 'm-pompadour',
  '남자 프렌치 크롭': 'm-french-crop',
  '남자 픽시컷': 'm-pixie-cut',
  '남자 필리핀 포마드': 'm-philippine-pomade',
  '남자 하이탑 페이드': 'm-high-top-fade',
  '남자 하이페이드': 'm-high-fade',
  '남자 호스트 클럽 스타일': 'm-host-club-style',
  '남자 히피펌': 'm-hippie-perm',

  // Female styles
  '여자 C컬펌': 'f-c-curl-perm',
  '여자 갸루 스타일': 'f-gyaru-style',
  '여자 귀넘김 단발': 'f-ear-tuck-bob',
  '여자 긴생머리': 'f-long-straight',
  '여자 남 인디언 번': 'f-south-indian-bun',
  '여자 낫리스 브레이즈': 'f-knotless-braids',
  '여자 네추럴 아프로': 'f-natural-afro',
  '여자 두바이 글램': 'f-dubai-glam',
  '여자 디지털 펌': 'f-digital-perm',
  '여자 라티나 컬': 'f-latina-curl',
  '여자 레이어드 중단발': 'f-layered-medium',
  '여자 레이어드컷': 'f-layered-cut',
  '여자 로맨틱 업스타일': 'f-romantic-upstyle',
  '여자 로우번': 'f-low-bun',
  '여자 롱 S컬펌': 'f-long-s-curl-perm',
  '여자 롱 레이어드': 'f-long-layered',
  '여자 매직 스트레이트': 'f-magic-straight',
  '여자 메시번': 'f-messy-bun',
  '여자 멕시칸 브레이드': 'f-mexican-braid',
  '여자 모던 인디언': 'f-modern-indian',
  '여자 모로칸 스타일': 'f-moroccan-style',
  '여자 바디펌': 'f-body-perm',
  '여자 반투 노트': 'f-bantu-knots',
  '여자 베트남 긴 생머리': 'f-vietnam-long-straight',
  '여자 보브컷': 'f-bob-cut',
  '여자 볼륨 매직': 'f-volume-magic',
  '여자 볼리우드 글램': 'f-bollywood-glam',
  '여자 브라질리언 블로우아웃': 'f-brazilian-blowout',
  '여자 블런트 컷': 'f-blunt-cut',
  '여자 사이드뱅': 'f-side-bangs',
  '여자 샤기컷': 'f-shaggy-cut',
  '여자 세네갈 트위스트': 'f-senegal-twist',
  '여자 세팅펌': 'f-setting-perm',
  '여자 숏 생머리': 'f-short-straight',
  '여자 숏 울프컷': 'f-short-wolf-cut',
  '여자 슬릭 스트레이트': 'f-sleek-straight',
  '여자 시스루뱅': 'f-see-through-bangs',
  '여자 싱가포르 시크': 'f-singapore-chic',
  '여자 아라비안 긴머리': 'f-arabian-long',
  '여자 앞머리 있는 롱보브': 'f-long-bob-with-bangs',
  '여자 앞머리 있는 보브컷': 'f-bob-with-bangs',
  '여자 애니메이션 트윈테일': 'f-anime-twintail',
  '여자 얼짱 스타일': 'f-ulzzang-style',
  '여자 여신웨이브': 'f-goddess-wave',
  '여자 중국 고대식 올림머리': 'f-chinese-ancient-updo',
  '여자 쵸피 보브': 'f-choppy-bob',
  '여자 커튼뱅': 'f-curtain-bangs',
  '여자 콘로우': 'f-cornrows',
  '여자 콜롬비안 웨이브': 'f-colombian-wave',
  '여자 쿠반 업도': 'f-cuban-updo',
  '여자 태국 시크': 'f-thai-chic',
  '여자 태슬컷': 'f-tassel-cut',
  '여자 터키 드라마': 'f-turkish-drama',
  '여자 트위스트 아웃': 'f-twist-out',
  '여자 페르시안 컬': 'f-persian-curl',
  '여자 푸에르토리칸 코일리': 'f-puerto-rican-coily',
  '여자 풀라니 브레이드': 'f-fulani-braid',
  '여자 풀뱅': 'f-full-bangs',
  '여자 프렌치 보브': 'f-french-bob',
  '여자 플래티넘 보브': 'f-platinum-bob',
  '여자 픽시컷': 'f-pixie-cut',
  '여자 필리핀 웨이브': 'f-philippine-wave',
  '여자 하이 포니테일': 'f-high-ponytail',
  '여자 하프업': 'f-half-up',
  '여자 할리우드 컬': 'f-hollywood-curl',
  '여자 허쉬컷': 'f-hush-cut',
  '여자 히메컷': 'f-hime-cut',
  '여자 히피펌': 'f-hippie-perm',
};

const sourceDir = path.join(__dirname, '../hairstyle-images/gif');
const targetDir = path.join(__dirname, '../public/hairstyles/gif');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Read all files from source directory
const files = fs.readdirSync(sourceDir);
let copied = 0;
let skipped = 0;
let notMapped = [];

files.forEach(file => {
  if (!file.endsWith('.gif')) return;

  const baseName = file.replace('.gif', '');
  const englishName = koreanToEnglish[baseName];

  if (englishName) {
    const sourceFile = path.join(sourceDir, file);
    const targetFile = path.join(targetDir, `${englishName}.gif`);

    try {
      fs.copyFileSync(sourceFile, targetFile);
      console.log(`Copied: ${file} -> ${englishName}.gif`);
      copied++;
    } catch (error) {
      console.error(`Error copying ${file}:`, error.message);
    }
  } else {
    notMapped.push(baseName);
    skipped++;
  }
});

console.log('\n=== Summary ===');
console.log(`Copied: ${copied} files`);
console.log(`Skipped: ${skipped} files (no mapping)`);

if (notMapped.length > 0) {
  console.log('\nNot mapped:');
  notMapped.forEach(name => console.log(`  - ${name}`));
}

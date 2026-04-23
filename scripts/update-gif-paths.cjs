const fs = require('fs');
const path = require('path');

// Read the hairStyles.ts file
const hairStylesPath = path.join(__dirname, '../src/data/hairStyles.ts');
let content = fs.readFileSync(hairStylesPath, 'utf-8');

// GIF files mapping (id -> gif filename)
const gifMapping = {
  // Male styles
  'm-360-웨이브': 'm-360-wave',
  'm-jpop-visual': 'm-jpop-visual',
  'm-kpop-쉼표머리': 'm-kpop-comma-hair',
  'm-s컬펌': 'm-s-curl-perm',
  'm-가르마펌': 'm-parted-perm',
  'm-가일펌': 'm-gyle-perm',
  'm-곱슬펌': 'm-curly-perm',
  'm-군인머리': 'm-military-cut',
  'm-기본-다운펌': 'm-basic-down-perm',
  'm-내추럴-다운': 'm-natural-down',
  'm-댄디컷': 'm-dandy-cut',
  'm-드레드락': 'm-dreadlocks',
  'm-드롭-페이드': 'm-drop-fade',
  'm-라틴-페이드': 'm-latin-fade',
  'm-레게톤-트위스트': 'm-reggaeton-twist',
  'm-레바논-시크': 'm-lebanon-chic',
  'm-레이어드-컷': 'm-layered-cut',
  'm-로우페이드': 'm-low-fade',
  'm-롱-레이어드': 'm-long-layered',
  'm-리젠트펌': 'm-regent-perm',
  'm-리프컷': 'm-leaf-cut',
  'm-말레이시안-모던': 'm-malaysian-modern',
  'm-매직-스트레이트': 'm-magic-straight',
  'm-맨번': 'm-man-bun',
  'm-메시-미디엄': 'm-messy-medium',
  'm-멕시칸-포마드': 'm-mexican-pomade',
  'm-모던-멀릿': 'm-modern-mullet',
  'm-모히칸-투블럭': 'm-mohican-two-block',
  'm-미드페이드': 'm-mid-fade',
  'm-바가지머리': 'm-bowl-cut',
  'm-버스트페이드': 'm-burst-fade',
  'm-버즈컷': 'm-buzz-cut',
  'm-베트남-클래식': 'm-vietnam-classic',
  'm-볼리우드-클래식': 'm-bollywood-classic',
  'm-브라질-서퍼': 'm-brazil-surfer',
  'm-사무라이-번': 'm-samurai-bun',
  'm-사이드-스웹트': 'm-side-swept',
  'm-상고머리': 'm-sanggo',
  'm-세팅-펌': 'm-setting-perm',
  'm-쉐도우펌': 'm-shadow-perm',
  'm-쉼표머리': 'm-comma-hair',
  'm-스킨페이드': 'm-skin-fade',
  'm-스포츠컷': 'm-sports-cut',
  'm-슬릭백': 'm-slick-back',
  'm-시크교-스타일': 'm-sikh-style',
  'm-아라비안-클래식': 'm-arabian-classic',
  'm-아르헨틴-웨이브': 'm-argentine-wave',
  'm-아이리쉬펌': 'm-irish-perm',
  'm-아이비리그-컷': 'm-ivy-league-cut',
  'm-아프로': 'm-afro',
  'm-애니메-스파이크': 'm-anime-spike',
  'm-애즈펌': 'm-ash-perm',
  'm-언더컷': 'm-undercut',
  'm-에미레이트-모던': 'm-emirate-modern',
  'm-울프컷': 'm-wolf-cut',
  'm-유러피안-페이드': 'm-european-fade',
  'm-인도네시안-텍스처': 'm-indonesian-texture',
  'm-차이니즈-클래식': 'm-chinese-classic',
  'm-커튼-헤어': 'm-curtain-hair',
  'm-컬리탑-페이드': 'm-curly-top-fade',
  'm-콘로우': 'm-cornrows',
  'm-콜롬비아-모던': 'm-colombia-modern',
  'm-크루컷': 'm-crew-cut',
  'm-타밀-웨이브': 'm-tamil-wave',
  'm-타이-언더컷': 'm-thai-undercut',
  'm-타이완-웨이브': 'm-taiwan-wave',
  'm-터키쉬-페이드': 'm-turkish-fade',
  'm-테이퍼-아프로': 'm-taper-afro',
  'm-테이퍼-페이드': 'm-taper-fade',
  'm-텍스처-펌': 'm-texture-perm',
  'm-텍스처드-크롭': 'm-textured-crop',
  'm-템퍼-페이드': 'm-temp-fade',
  'm-투-스탠드-트위스트': 'm-two-strand-twist',
  'm-투블럭': 'm-two-block',
  'm-펀자비-스타일': 'm-punjabi-style',
  'm-포마드-다운펌': 'm-pomade-down-perm',
  'm-폼파두르': 'm-pompadour',
  'm-프렌치-크롭': 'm-french-crop',
  'm-픽시컷': 'm-pixie-cut',
  'm-필리핀-포마드': 'm-philippine-pomade',
  'm-하이탑-페이드': 'm-high-top-fade',
  'm-하이페이드': 'm-high-fade',
  'm-호스트-클럽-스타일': 'm-host-club-style',
  'm-히피펌': 'm-hippie-perm',

  // Female styles
  'f-c컬펌': 'f-c-curl-perm',
  'f-갸루-스타일': 'f-gyaru-style',
  'f-귀넘김-단발': 'f-ear-tuck-bob',
  'f-긴생머리': 'f-long-straight',
  'f-남-인디언-번': 'f-south-indian-bun',
  'f-낫리스-브레이즈': 'f-knotless-braids',
  'f-네추럴-아프로': 'f-natural-afro',
  'f-두바이-글램': 'f-dubai-glam',
  'f-디지털-펌': 'f-digital-perm',
  'f-라티나-컬': 'f-latina-curl',
  'f-레이어드-중단발': 'f-layered-medium',
  'f-레이어드컷': 'f-layered-cut',
  'f-로맨틱-업스타일': 'f-romantic-upstyle',
  'f-로우번': 'f-low-bun',
  'f-롱-s컬펌': 'f-long-s-curl-perm',
  'f-롱-레이어드': 'f-long-layered',
  'f-매직-스트레이트': 'f-magic-straight',
  'f-메시번': 'f-messy-bun',
  'f-멕시칸-브레이드': 'f-mexican-braid',
  'f-모던-인디언': 'f-modern-indian',
  'f-모로칸-스타일': 'f-moroccan-style',
  'f-바디펌': 'f-body-perm',
  'f-반투-노트': 'f-bantu-knots',
  'f-베트남-긴-생머리': 'f-vietnam-long-straight',
  'f-보브컷': 'f-bob-cut',
  'f-볼륨-매직': 'f-volume-magic',
  'f-볼리우드-글램': 'f-bollywood-glam',
  'f-브라질리언-블로우아웃': 'f-brazilian-blowout',
  'f-블런트-컷': 'f-blunt-cut',
  'f-사이드뱅': 'f-side-bangs',
  'f-샤기컷': 'f-shaggy-cut',
  'f-세네갈-트위스트': 'f-senegal-twist',
  'f-세팅펌': 'f-setting-perm',
  'f-숏-생머리': 'f-short-straight',
  'f-숏-울프컷': 'f-short-wolf-cut',
  'f-슬릭-스트레이트': 'f-sleek-straight',
  'f-시스루뱅': 'f-see-through-bangs',
  'f-싱가포르-시크': 'f-singapore-chic',
  'f-아라비안-긴머리': 'f-arabian-long',
  'f-앞머리-있는-롱보브': 'f-long-bob-with-bangs',
  'f-앞머리-있는-보브컷': 'f-bob-with-bangs',
  'f-애니메이션-트윈테일': 'f-anime-twintail',
  'f-얼짱-스타일': 'f-ulzzang-style',
  'f-여신웨이브': 'f-goddess-wave',
  'f-중국-고대식-올림머리': 'f-chinese-ancient-updo',
  'f-쵸피-보브': 'f-choppy-bob',
  'f-커튼뱅': 'f-curtain-bangs',
  'f-콘로우': 'f-cornrows',
  'f-콜롬비안-웨이브': 'f-colombian-wave',
  'f-쿠반-업도': 'f-cuban-updo',
  'f-태국-시크': 'f-thai-chic',
  'f-태슬컷': 'f-tassel-cut',
  'f-터키-드라마': 'f-turkish-drama',
  'f-트위스트-아웃': 'f-twist-out',
  'f-페르시안-컬': 'f-persian-curl',
  'f-푸에르토리칸-코일리': 'f-puerto-rican-coily',
  'f-풀라니-브레이드': 'f-fulani-braid',
  'f-풀뱅': 'f-full-bangs',
  'f-프렌치-보브': 'f-french-bob',
  'f-플래티넘-보브': 'f-platinum-bob',
  'f-픽시컷': 'f-pixie-cut',
  'f-필리핀-웨이브': 'f-philippine-wave',
  'f-하이-포니테일': 'f-high-ponytail',
  'f-하프업': 'f-half-up',
  'f-할리우드-컬': 'f-hollywood-curl',
  'f-허쉬컷': 'f-hush-cut',
  'f-히메컷': 'f-hime-cut',
  'f-히피펌': 'f-hippie-perm',
};

// Count updates
let updated = 0;
let notFound = [];

// For each mapping, find the style and add/update gif path
Object.entries(gifMapping).forEach(([id, gifName]) => {
  // Pattern to find style blocks with this id
  const idPattern = new RegExp(`(id:\\s*['"]${id}['"][^}]*?)(thumbnail:\\s*['"][^'"]*['"])`, 'g');

  const newGifPath = `/hairstyles/gif/${gifName}.gif`;

  if (content.includes(`id: '${id}'`)) {
    // Check if gif already exists for this style
    const styleBlockPattern = new RegExp(`\\{[^}]*id:\\s*['"]${id}['"][^}]*\\}`, 's');
    const match = content.match(styleBlockPattern);

    if (match) {
      const block = match[0];
      if (block.includes('gif:')) {
        // Update existing gif
        content = content.replace(
          new RegExp(`(id:\\s*['"]${id}['"][^}]*gif:\\s*['"])[^'"]*(['"])`, 's'),
          `$1${newGifPath}$2`
        );
      } else {
        // Add gif after thumbnail
        content = content.replace(
          new RegExp(`(id:\\s*['"]${id}['"][^}]*thumbnail:\\s*['"][^'"]*['"])`, 's'),
          `$1,\n    gif: '${newGifPath}'`
        );
      }
      updated++;
    }
  } else {
    notFound.push(id);
  }
});

// Write the updated file
fs.writeFileSync(hairStylesPath, content, 'utf-8');

console.log(`Updated ${updated} styles with gif paths`);
if (notFound.length > 0) {
  console.log(`\nStyles not found in file (${notFound.length}):`);
  notFound.slice(0, 10).forEach(id => console.log(`  - ${id}`));
  if (notFound.length > 10) {
    console.log(`  ... and ${notFound.length - 10} more`);
  }
}

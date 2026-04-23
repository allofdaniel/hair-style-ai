const fs = require('fs');
const path = require('path');

// Path to hairStyles.ts
const filePath = path.join(__dirname, '../src/data/hairStyles.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Fix gyle-perm -> gail-perm (image path typo)
content = content.replace(/gyle-perm/g, 'gail-perm');
console.log('Fixed: gyle-perm -> gail-perm');

// 2. Korean to English name mappings
const nameTranslations = {
  // Male styles
  '360 웨이브': '360 Wave',
  'kpop 쉼표머리': 'K-Pop Comma Hair',
  'S컬펌': 'S-Curl Perm',
  '가르마펌': 'Side Part Perm',
  '가일펌': 'Gail Perm',
  '곱슬펌': 'Curly Perm',
  '군인머리': 'Military Cut',
  '기본 다운펌': 'Basic Down Perm',
  '내추럴 다운': 'Natural Down',
  '댄디컷': 'Dandy Cut',
  '드레드락': 'Dreadlocks',
  '드롭 페이드': 'Drop Fade',
  '라틴 페이드': 'Latin Fade',
  '레게톤 트위스트': 'Reggaeton Twist',
  '롱 레이어드': 'Long Layered',
  '리젠트컷': 'Regent Cut',
  '머쉬룸컷': 'Mushroom Cut',
  '모히칸': 'Mohawk',
  '모히칸 투블럭': 'Mohawk Two-Block',
  '미디움 웨이브': 'Medium Wave',
  '미드 페이드': 'Mid Fade',
  '버즈컷': 'Buzz Cut',
  '볼륨펌': 'Volume Perm',
  '사이드파트': 'Side Part',
  '샤기컷': 'Shaggy Cut',
  '새도우컷': 'Shadow Cut',
  '소프트 언더컷': 'Soft Undercut',
  '스왈로우펌': 'Swallow Perm',
  '스킨 페이드': 'Skin Fade',
  '슬릭백': 'Slick Back',
  '애쉬펌': 'Ash Perm',
  '아이리쉬펌': 'Irish Perm',
  '아이비리그': 'Ivy League',
  '언더컷': 'Undercut',
  '옴브레컷': 'Ombre Cut',
  '웨이브펌': 'Wave Perm',
  '쉼표머리': 'Comma Hair',
  '제이팝 비주얼': 'J-Pop Visual',
  '짧은 머리': 'Short Hair',
  '크루컷': 'Crew Cut',
  '탑 노트': 'Top Knot',
  '테이퍼 페이드': 'Taper Fade',
  '텍스처펌': 'Texture Perm',
  '투블럭': 'Two-Block',
  '포마드 다운': 'Pomade Down',
  '프렌치 크롭': 'French Crop',
  '하이 페이드': 'High Fade',
  '하이탑 페이드': 'High Top Fade',
  '히피펌': 'Hippie Perm',
  '로우 페이드': 'Low Fade',
  '상고머리': 'Sanggo Cut',

  // Female styles
  '단발머리': 'Bob Cut',
  '레이어드컷': 'Layered Cut',
  '롱 스트레이트': 'Long Straight',
  '롱 웨이브': 'Long Wave',
  '롱밥': 'Long Bob (Lob)',
  '빌드펌': 'Build Perm',
  '보디펌': 'Body Perm',
  '시스루뱅': 'See-Through Bangs',
  '풀뱅': 'Full Bangs',
  '허쉬컷': 'Hush Cut',
  '태슬컷': 'Tassel Cut',
  'c컬펌': 'C-Curl Perm',
  's컬펌': 'S-Curl Perm',
  '글램펌': 'Glam Perm',
  '웨이브펌': 'Wave Perm',
  '픽시컷': 'Pixie Cut',
  '울프컷': 'Wolf Cut',
  '샤기컷': 'Shaggy Cut',
  '밥컷': 'Bob Cut',
  '단발 웨이브': 'Short Wave',
  '롱 레이어드': 'Long Layered',
  '커튼뱅': 'Curtain Bangs',
  '사이드뱅': 'Side Bangs',
  '로우번': 'Low Bun',
  '하프업': 'Half Up',
  '메시번': 'Messy Bun',
  '여신웨이브': 'Goddess Wave',
  '숏컷': 'Short Cut',
  '미디엄밥': 'Medium Bob',
  '숏울프': 'Short Wolf',
  '쵸피밥': 'Choppy Bob',
  '이어턱밥': 'Ear Tuck Bob',
  '뱅밥': 'Bob with Bangs',
  '롱밥 뱅': 'Long Bob with Bangs',
  '레이어드밥': 'Layered Bob',
  '롱S컬펌': 'Long S-Curl Perm',
  '할리우드컬': 'Hollywood Curl',
  '슬릭스트레이트': 'Sleek Straight',
  '프렌치밥': 'French Bob',
  '플래티넘밥': 'Platinum Bob',
  '로맨틱업스타일': 'Romantic Upstyle',
  '블런트컷': 'Blunt Cut',

  // Global styles
  '코른로우': 'Cornrows',
  '투스트랜드 트위스트': 'Two-Strand Twist',
  '테이퍼 아프로': 'Taper Afro',
  '컬리탑 페이드': 'Curly Top Fade',
  '템플 페이드': 'Temple Fade',
  '박스브레이드': 'Box Braids',
  '내추럴 아프로': 'Natural Afro',
  '트위스트아웃': 'Twist Out',
  '반투 노트': 'Bantu Knots',
  '풀라니 브레이드': 'Fulani Braids',
  '패션 트위스트': 'Passion Twist',
  '가디스 락스': 'Goddess Locs',
  '세네갈 트위스트': 'Senegalese Twist',
  '말리 트위스트': 'Marley Twist',
  '노트리스 브레이드': 'Knotless Braids',
  '프렌치 크롭 컬리': 'French Crop Curly',
  '퀴프': 'Quiff',
  '커튼 헤어': 'Curtain Hair',
  '유럽피안 페이드': 'European Fade',

  // East Asian
  '차이니즈 클래식': 'Chinese Classic',
  '호스트클럽 스타일': 'Host Club Style',
  '대만 웨이브': 'Taiwan Wave',
  'K팝 아이돌': 'K-Pop Idol',
  '중국 고전 업두': 'Chinese Ancient Updo',
  '갸루 스타일': 'Gyaru Style',
  '얼짱 스타일': 'Ulzzang Style',
  '애니메 트윈테일': 'Anime Twintail',

  // South Asian
  '인디안 페이드': 'Indian Fade',
  '펀자비 스타일': 'Punjabi Style',
  '타밀 웨이브': 'Tamil Wave',
  '볼리우드 글램': 'Bollywood Glam',
  '인디안 브레이드': 'Indian Braid',
  '사우스 인디안 번': 'South Indian Bun',
  '모던 인디안': 'Modern Indian',
  '케랄라 스타일': 'Kerala Style',

  // Southeast Asian
  '태국 언더컷': 'Thai Undercut',
  '필리핀 포마드': 'Philippine Pomade',
  '인도네시안 텍스처': 'Indonesian Texture',
  '베트남 클래식': 'Vietnam Classic',
  '태국 시크': 'Thai Chic',
  '필리핀 웨이브': 'Philippine Wave',
  '베트남 롱스트레이트': 'Vietnam Long Straight',
  '발리 웨이브': 'Bali Wave',
  '싱가포르 시크': 'Singapore Chic',

  // Middle Eastern
  '페르시안 웨이브': 'Persian Wave',
  '터키쉬 페이드': 'Turkish Fade',
  '에미레이트 모던': 'Emirate Modern',
  '아라비안 롱': 'Arabian Long',
  '페르시안 컬': 'Persian Curl',
  '터키 드라마': 'Turkish Drama',
  '모로칸 스타일': 'Moroccan Style',
  '두바이 글램': 'Dubai Glam',

  // Latin
  '콜롬비아 모던': 'Colombian Modern',
  '라티나 컬': 'Latina Curl',
  '브라질리안 블로아웃': 'Brazilian Blowout',
  '콜롬비안 웨이브': 'Colombian Wave',
  '쿠반 업두': 'Cuban Updo',
  '멕시칸 브레이드': 'Mexican Braid',
  '푸에르토리칸 코일리': 'Puerto Rican Coily',
  '매직스트레이트': 'Magic Straight',
};

// Update the name field to English while keeping nameKo as Korean
let updated = 0;
for (const [korean, english] of Object.entries(nameTranslations)) {
  // Match pattern: name: 'Korean Name', and replace with English
  const regex = new RegExp(`(name: ')(${korean})(')`, 'g');
  const matches = content.match(regex);
  if (matches) {
    content = content.replace(regex, `$1${english}$3`);
    updated += matches.length;
    console.log(`Updated: ${korean} -> ${english}`);
  }
}

console.log(`\nTotal name translations: ${updated}`);

// Write the updated content back
fs.writeFileSync(filePath, content, 'utf-8');
console.log('\nFile updated successfully!');

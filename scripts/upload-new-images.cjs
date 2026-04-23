/**
 * 새 헤어스타일 이미지를 S3에 업로드하고 hairStyles.ts를 업데이트하는 스크립트
 * 나노바나나 스타일 이미지들을 처리
 */

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const S3_BUCKET = 'hairstyle-ai-references';
const S3_REGION = 'ap-northeast-2';
const S3_BASE_URL = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/references`;

const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// 이미지 폴더 경로
const IMAGES_DIR = path.join(__dirname, '..', 'hairstyle-images');

// 파일명에서 성별과 스타일명 파싱
function parseFileName(fileName) {
  // "남자 쉼표머리.jpg" -> { gender: 'male', styleName: '쉼표머리', styleNameEn: 'comma-hair' }
  const baseName = path.basename(fileName, path.extname(fileName));
  const parts = baseName.split(' ');

  const genderKo = parts[0];
  const gender = genderKo === '남자' ? 'male' : 'female';
  const styleName = parts.slice(1).join(' ');

  // 영문 ID 생성 (한글을 음역하거나 매핑)
  const styleId = generateStyleId(gender, styleName);

  return {
    gender,
    genderKo,
    styleName,
    styleId,
  };
}

// 스타일 ID 생성 (한글 -> 영문 매핑)
function generateStyleId(gender, styleName) {
  const prefix = gender === 'male' ? 'm' : 'f';

  // 한글 -> 영문 매핑
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

  const englishName = styleMap[styleName] || styleName.toLowerCase().replace(/\s+/g, '-');
  return `${prefix}-${englishName}`;
}

// S3에 이미지 업로드
async function uploadToS3(filePath, s3Key) {
  const fileBuffer = fs.readFileSync(filePath);
  const contentType = filePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: contentType,
    CacheControl: 'max-age=31536000',
  });

  await s3Client.send(command);
  return `${S3_BASE_URL}/${s3Key.replace('references/', '')}`;
}

// 카테고리 결정
function determineCategory(gender, styleName) {
  const styleNameLower = styleName.toLowerCase();

  if (gender === 'male') {
    // 페이드 관련
    if (styleNameLower.includes('페이드') || styleNameLower.includes('fade')) {
      return 'fade';
    }
    // 펌 관련
    if (styleNameLower.includes('펌') || styleNameLower.includes('perm')) {
      return 'perm';
    }
    // 투블럭
    if (styleNameLower.includes('투블럭') || styleNameLower.includes('언더컷')) {
      return 'two-block';
    }
    // 다운펌
    if (styleNameLower.includes('다운') || styleNameLower.includes('쉼표')) {
      return 'down-perm';
    }
    // 글로벌
    if (styleNameLower.match(/(브라질|멕시칸|아라비안|터키|인도|필리핀|베트남|차이니즈|타이|볼리우드|페르시안|아르헨틴|콜롬비아|말레이|인도네시안|타밀|펀자비|시크교|에미레이트|레바논)/)) {
      return 'global';
    }
    // 클래식
    if (styleNameLower.match(/(댄디|슬릭백|포마드|아이비리그|크루|사이드 파트)/)) {
      return 'salon';
    }
    return 'short';
  } else {
    // 여자
    // 펌 관련
    if (styleNameLower.includes('펌') || styleNameLower.includes('perm') || styleNameLower.includes('웨이브') || styleNameLower.includes('컬')) {
      return 'perm';
    }
    // 숏컷
    if (styleNameLower.match(/(숏|픽시|보브|단발)/)) {
      return 'short-cut';
    }
    // 롱헤어
    if (styleNameLower.match(/(긴|롱|생머리|레이어드)/)) {
      return 'long-hair';
    }
    // 뱅 관련
    if (styleNameLower.includes('뱅') || styleNameLower.includes('앞머리')) {
      return 'bangs';
    }
    // 업스타일
    if (styleNameLower.match(/(번|업|포니테일|업도)/)) {
      return 'updo';
    }
    // 글로벌
    if (styleNameLower.match(/(브라질|멕시칸|아라비안|터키|인도|필리핀|베트남|두바이|발리|싱가포르|태국|볼리우드|페르시안|콜롬비|쿠반|케랄라|모로칸|아프로|브레이드|콘로우|드레드|트위스트|풀라니|반투|세네갈)/)) {
      return 'global';
    }
    return 'mid-length';
  }
}

// 프롬프트 생성 (나노바나나 스타일)
function generatePrompt(gender, styleName) {
  const genderText = gender === 'male' ? 'Korean male' : 'Korean female';

  return `A vertical portrait photograph of a single white plastic ${gender === 'male' ? 'male' : 'female'} mannequin bust with subtle sculpted facial contours, facing front-left. It wears a premium navy blue knit sweater. The jet black hair is styled in a ${styleName} style. The finish is natural and matte. Minimalist white studio background, professional soft lighting.`;
}

// 메인 실행
async function main() {
  console.log('🚀 새 헤어스타일 이미지 처리 시작...\n');

  // 이미지 파일 목록 가져오기
  const files = fs.readdirSync(IMAGES_DIR).filter(f =>
    f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg')
  );

  console.log(`📁 총 ${files.length}개 이미지 발견\n`);

  const uploadedStyles = [];
  const errors = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(IMAGES_DIR, file);

    try {
      const { gender, styleName, styleId } = parseFileName(file);
      const extension = path.extname(file);
      const s3Key = `references/${gender}/${styleId}${extension}`;

      console.log(`[${i + 1}/${files.length}] 업로드 중: ${styleName} (${gender})`);

      // S3 업로드
      const thumbnailUrl = await uploadToS3(filePath, s3Key);

      // 카테고리 결정
      const category = determineCategory(gender, styleName);

      // 프롬프트 생성
      const prompt = generatePrompt(gender, styleName);

      uploadedStyles.push({
        id: styleId,
        name: styleName,
        nameKo: styleName,
        category,
        gender,
        description: `${styleName} 스타일`,
        prompt,
        thumbnail: thumbnailUrl,
      });

      console.log(`   ✅ 완료: ${thumbnailUrl}\n`);

    } catch (error) {
      console.error(`   ❌ 실패: ${file}`, error.message);
      errors.push({ file, error: error.message });
    }
  }

  // 결과 저장
  const outputPath = path.join(__dirname, 'uploaded-styles.json');
  fs.writeFileSync(outputPath, JSON.stringify(uploadedStyles, null, 2), 'utf-8');

  console.log('\n========================================');
  console.log(`✅ 업로드 완료: ${uploadedStyles.length}개`);
  console.log(`❌ 실패: ${errors.length}개`);
  console.log(`📄 결과 저장: ${outputPath}`);

  if (errors.length > 0) {
    console.log('\n실패 목록:');
    errors.forEach(e => console.log(`  - ${e.file}: ${e.error}`));
  }

  // hairStyles.ts 업데이트를 위한 코드 생성
  console.log('\n📝 hairStyles.ts 업데이트 코드 생성 중...');

  const maleStyles = uploadedStyles.filter(s => s.gender === 'male');
  const femaleStyles = uploadedStyles.filter(s => s.gender === 'female');

  const codeOutput = `
// ===== MALE STYLES (${maleStyles.length}개) =====
${maleStyles.map(s => `
  {
    id: '${s.id}',
    name: '${s.name}',
    nameKo: '${s.nameKo}',
    category: '${s.category}',
    gender: 'male',
    description: '${s.description}',
    prompt: '${s.prompt}',
    thumbnail: '${s.thumbnail}',
  },`).join('')}

// ===== FEMALE STYLES (${femaleStyles.length}개) =====
${femaleStyles.map(s => `
  {
    id: '${s.id}',
    name: '${s.name}',
    nameKo: '${s.nameKo}',
    category: '${s.category}',
    gender: 'female',
    description: '${s.description}',
    prompt: '${s.prompt}',
    thumbnail: '${s.thumbnail}',
  },`).join('')}
`;

  const codeOutputPath = path.join(__dirname, 'hairStyles-code.txt');
  fs.writeFileSync(codeOutputPath, codeOutput, 'utf-8');
  console.log(`📄 코드 저장: ${codeOutputPath}`);
}

main().catch(console.error);

/**
 * 미등록 스타일을 hairStyles.ts에 자동 추가하는 스크립트
 * hairstyle-analysis.json의 분석 결과를 사용
 */

const fs = require('fs');
const path = require('path');

// 파일명을 스타일 이름으로 변환
function fileNameToStyleName(fileName) {
  return fileName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// 파일명을 한글 이름으로 변환 (기본값)
const styleNameMap = {
  // Male
  '360-wave': '360 웨이브',
  'afro': '아프로',
  'arabian-classic': '아라비안 클래식',
  'basic-down-perm': '베이직 다운펌',
  'box-braids': '박스 브레이드',
  'brazilian-surfer': '브라질리안 서퍼',
  'cornrows': '콘로우',
  'curtain-hair': '커튼 헤어',
  'dreadlocks': '드레드락',
  'host-club-style': '호스트 클럽 스타일',
  'indonesian-texture': '인도네시안 텍스처',
  'ivy-league-cut': '아이비리그 컷',
  'kpop-comma-hair': 'K-Pop 쉼표머리',
  'latin-fade': '라틴 페이드',
  'leaf-cut': '리프 컷',
  'lebanese-chic': '레바논 시크',
  'long-layered': '롱 레이어드',
  'magic-straight': '매직 스트레이트',
  'malaysian-modern': '말레이시안 모던',
  'modern-mullet': '모던 멀렛',
  'parted-perm': '가르마 펌',
  'philippine-pomade': '필리핀 포마드',
  'pixie-cut': '픽시 컷',
  'pomade-down-perm': '포마드 다운펌',
  'reggaeton-twist': '레게톤 트위스트',
  's-curl-perm': 'S컬 펌',
  'sanggo-cut': '상고 컷',
  'setting-perm': '셋팅 펌',
  'side-part-cut': '사이드 파트 컷',
  'temple-fade': '템플 페이드',
  'two-block': '투블럭',
  'volume-perm': '볼륨 펌',
  'wolf-cut': '울프 컷',

  // Female
  'anime-twintail': '애니메 트윈테일',
  'arabian-long': '아라비안 롱',
  'bali-wave': '발리 웨이브',
  'beach-wave': '비치 웨이브',
  'bob-with-bangs': '뱅 밥',
  'c-curl-perm': 'C컬 펌',
  'chinese-ancient-updo': '중국 전통 업스타일',
  'colombian-wave': '콜롬비안 웨이브',
  'curtain-bang': '커튼 뱅',
  'fulani-braid': '풀라니 브레이드',
  'full-bang': '풀뱅',
  'goddess-wave': '갓데스 웨이브',
  'hippie-perm': '히피 펌',
  'hollywood-curl': '할리우드 컬',
  'latina-curl': '라티나 컬',
  'layered-cut': '레이어드 컷',
  'layered-mid-bob': '레이어드 미디 밥',
  'long-bob-with-bangs': '롱 밥 뱅',
  'long-s-curl-perm': '롱 S컬 펌',
  'mexican-braid': '멕시칸 브레이드',
  'natural-afro': '내추럴 아프로',
  'philippine-wave': '필리핀 웨이브',
  'romantic-upstyle': '로맨틱 업스타일',
  'see-through-bang': '시스루 뱅',
  'setting-perm': '셋팅 펌',
  'short-wolf-cut': '숏 울프컷',
  'thai-chic': '타이 시크',
  'ulzzang-style': '얼짱 스타일',
};

// 카테고리 추론
function inferCategory(fileName, gender) {
  const name = fileName.toLowerCase();

  if (gender === 'male') {
    if (name.includes('perm') || name.includes('curl')) return 'perm';
    if (name.includes('fade') || name.includes('undercut')) return 'fade';
    if (name.includes('cut') || name.includes('crop')) return 'short';
    if (name.includes('braid') || name.includes('dread') || name.includes('afro') || name.includes('cornrow') || name.includes('twist')) return 'african';
    if (name.includes('wave') || name.includes('surfer')) return 'natural';
    if (name.includes('pomade') || name.includes('slick')) return 'classic';
    if (name.includes('kpop') || name.includes('comma') || name.includes('two-block')) return 'down-perm';
    return 'trendy';
  } else {
    if (name.includes('perm') || name.includes('curl') || name.includes('wave')) return 'perm';
    if (name.includes('bob') || name.includes('short') || name.includes('pixie')) return 'short-cut';
    if (name.includes('long') || name.includes('layered')) return 'long-hair';
    if (name.includes('bang')) return 'bangs';
    if (name.includes('braid') || name.includes('afro') || name.includes('twist') || name.includes('locs')) return 'african';
    if (name.includes('updo') || name.includes('bun')) return 'updo';
    return 'mid-length';
  }
}

async function main() {
  const analysisFile = path.join(__dirname, 'hairstyle-analysis.json');
  const hairStylesFile = path.join(__dirname, '..', 'src', 'data', 'hairStyles.ts');
  const publicDir = path.join(__dirname, '..', 'public', 'hairstyles');

  // 분석 결과 로드
  if (!fs.existsSync(analysisFile)) {
    console.error('hairstyle-analysis.json not found');
    process.exit(1);
  }

  const analysisData = JSON.parse(fs.readFileSync(analysisFile, 'utf-8'));
  let hairStylesContent = fs.readFileSync(hairStylesFile, 'utf-8');

  // 현재 등록된 스타일 ID 추출
  const registeredIds = new Set();
  const idMatches = hairStylesContent.matchAll(/id:\s*['"]([^'"]+)['"]/g);
  for (const match of idMatches) {
    registeredIds.add(match[1]);
  }
  console.log(`현재 등록된 스타일: ${registeredIds.size}개`);

  // 이미지 파일 스캔
  const allImages = [];
  for (const gender of ['male', 'female']) {
    const genderDir = path.join(publicDir, gender);
    if (!fs.existsSync(genderDir)) continue;

    const files = fs.readdirSync(genderDir);
    for (const file of files) {
      if (file.endsWith('.jpg') || file.endsWith('.png')) {
        const fileName = file.replace(/\.(jpg|png)$/, '');
        const id = `${gender === 'male' ? 'm' : 'f'}-${fileName}`;
        allImages.push({ id, fileName, gender, file });
      }
    }
  }

  // 미등록 스타일 필터링
  const missingStyles = allImages.filter(img => !registeredIds.has(img.id));
  console.log(`미등록 스타일: ${missingStyles.length}개`);

  if (missingStyles.length === 0) {
    console.log('모든 스타일이 이미 등록되어 있습니다.');
    return;
  }

  // 새 스타일 엔트리 생성
  const newEntries = [];
  for (const style of missingStyles) {
    const analysisKey = style.id;
    const analysis = analysisData[analysisKey];

    const nameEn = fileNameToStyleName(style.fileName);
    const nameKo = styleNameMap[style.fileName] || nameEn;
    const category = inferCategory(style.fileName, style.gender);
    const prompt = analysis?.prompt || `${style.gender === 'male' ? 'Male' : 'Female'} ${nameEn} hairstyle`;

    const entry = `  {
    id: '${style.id}',
    name: '${nameEn}',
    nameKo: '${nameKo}',
    category: '${category}',
    gender: '${style.gender}',
    description: '${nameKo} 스타일',
    prompt: '${prompt.replace(/'/g, "\\'")}',
    thumbnail: \`\${S3_BASE_URL}/${style.gender}/${style.fileName}.${style.file.endsWith('.png') ? 'png' : 'jpg'}\`,
  },`;

    newEntries.push({ entry, gender: style.gender, id: style.id });
  }

  // hairStyles.ts에 추가
  // 남성 스타일과 여성 스타일을 각각 적절한 위치에 추가
  const maleEntries = newEntries.filter(e => e.gender === 'male').map(e => e.entry);
  const femaleEntries = newEntries.filter(e => e.gender === 'female').map(e => e.entry);

  // 마지막 남성 스타일 뒤에 남성 스타일 추가
  if (maleEntries.length > 0) {
    // "// ===== FEMALE STYLES =====" 앞에 추가
    const femaleMarker = "// ===== FEMALE STYLES =====";
    const femaleIndex = hairStylesContent.indexOf(femaleMarker);
    if (femaleIndex !== -1) {
      const beforeFemale = hairStylesContent.substring(0, femaleIndex);
      const afterFemale = hairStylesContent.substring(femaleIndex);
      hairStylesContent = beforeFemale + '\n  // Auto-added male styles\n' + maleEntries.join('\n') + '\n\n  ' + afterFemale;
    }
  }

  // 마지막에 여성 스타일 추가
  if (femaleEntries.length > 0) {
    // 마지막 "];" 앞에 추가
    const lastBracket = hairStylesContent.lastIndexOf('];');
    if (lastBracket !== -1) {
      const beforeEnd = hairStylesContent.substring(0, lastBracket);
      const afterEnd = hairStylesContent.substring(lastBracket);
      hairStylesContent = beforeEnd + '\n  // Auto-added female styles\n' + femaleEntries.join('\n') + '\n' + afterEnd;
    }
  }

  // 저장
  fs.writeFileSync(hairStylesFile, hairStylesContent);

  console.log('\n=== 추가 완료 ===');
  console.log(`남성 스타일 추가: ${maleEntries.length}개`);
  console.log(`여성 스타일 추가: ${femaleEntries.length}개`);
  console.log(`총 추가: ${newEntries.length}개`);

  // 추가된 스타일 목록 출력
  console.log('\n추가된 스타일:');
  newEntries.forEach(e => console.log(`  - ${e.id}`));
}

main().catch(console.error);

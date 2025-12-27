/**
 * hairStyles.ts의 thumbnail URL을 새 S3 이미지로 업데이트
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'data', 'hairStyles.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 새로 생성된 이미지들의 매핑
const mappings = {
  // 남성 다운펌
  'm-gail-perm': 'male/gail-perm.png',
  'm-pomade-down': 'male/pomade-down.png',
  'm-natural-down': 'male/natural-down.png',

  // 남성 투블럭
  'm-dandy-cut': 'male/dandy-cut.png',
  'm-undercut': 'male/undercut.png',
  'm-mohawk-two-block': 'male/mohawk-two-block.png',

  // 남성 펌
  'm-ash-perm': 'male/ash-perm.png',
  'm-garma-perm': 'male/garma-perm.png',
  'm-scurl-perm': 'male/scurl-perm.png',

  // 남성 장발
  'm-wolf-cut': 'male/wolf-cut-m.png',

  // 남성 숏
  'm-crew-cut': 'male/crew-cut.png',

  // 남성 페이드
  'm-low-fade': 'male/low-fade.png',
  'm-mid-fade': 'male/mid-fade.png',

  // 여성 숏컷
  'f-pixie-cut': 'female/pixie-cut.png',
  'f-hush-cut': 'female/hush-cut.png',
  'f-short-wolf': 'female/short-wolf.png',

  // 여성 중단발
  'f-lob-cut': 'female/lob-cut.png',
  'f-wave-perm': 'female/wave-perm.png',
  'f-layered-mid': 'female/layered-mid.png',

  // 여성 긴머리
  'f-long-straight': 'female/long-straight.png',
  'f-long-layered': 'female/long-layered-f.png',
  'f-s-curl-long': 'female/s-curl-long.png',

  // 여성 앞머리
  'f-see-through-bangs': 'female/see-through-bangs.png',
  'f-curtain-bangs': 'female/curtain-bangs.png',

  // 여성 펌
  'f-body-perm': 'female/body-perm.png',
  'f-glam-perm': 'female/glam-perm.png',

  // 여성 업스타일
  'f-low-bun': 'female/low-bun.png',
  'f-high-ponytail': 'female/high-ponytail.png',
  'f-half-up': 'female/half-up.png',

  // 여성 살롱
  'f-hime-cut': 'female/hime-cut.png',
};

const S3_BASE = '${S3_BASE_URL}';

// 각 스타일 ID에 대해 thumbnail URL 업데이트
Object.entries(mappings).forEach(([styleId, newPath]) => {
  // 해당 ID를 가진 스타일 블록 찾기
  const idPattern = new RegExp(`id: '${styleId}'[\\s\\S]*?thumbnail: [^,]+,`, 'g');

  content = content.replace(idPattern, (match) => {
    // thumbnail 라인만 교체
    return match.replace(/thumbnail: [^,]+,/, `thumbnail: \`\${S3_BASE_URL}/${newPath}\`,`);
  });
});

// 파일 저장
fs.writeFileSync(filePath, content, 'utf8');
console.log('hairStyles.ts 업데이트 완료!');
console.log(`총 ${Object.keys(mappings).length}개 스타일의 thumbnail URL이 업데이트되었습니다.`);

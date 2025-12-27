/**
 * Unsplash에서 헤어스타일 이미지를 다운로드하여 S3에 업로드하는 스크립트
 *
 * 사용법: node scripts/download-hairstyle-images.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Unsplash에서 무료로 사용 가능한 헤어스타일 이미지 URL들
// (Unsplash License: Free to use for any purpose)
const hairstyleImages = {
  male: [
    // 남성 헤어스타일 - Unsplash 무료 이미지
    { id: 'two-block', name: '투블럭', url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=500&fit=crop' },
    { id: 'pomade', name: '포마드', url: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&h=500&fit=crop' },
    { id: 'comma-hair', name: '쉼표머리', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop' },
    { id: 'dandy-cut', name: '댄디컷', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop' },
    { id: 'crop-cut', name: '크롭컷', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop' },
    { id: 'fade-cut', name: '페이드컷', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=500&fit=crop' },
    { id: 'slick-back', name: '슬릭백', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop' },
    { id: 'natural-wave', name: '내추럴웨이브', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=500&fit=crop' },
  ],
  female: [
    // 여성 헤어스타일 - Unsplash 무료 이미지
    { id: 'short-bob', name: '숏보브', url: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=400&h=500&fit=crop' },
    { id: 'long-wave', name: '롱웨이브', url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop' },
    { id: 'hime-cut', name: '히메컷', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop' },
    { id: 'layered', name: '레이어드', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop' },
    { id: 'pixie-cut', name: '픽시컷', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop' },
    { id: 'c-curl', name: 'C컬', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop' },
    { id: 'straight-long', name: '스트레이트롱', url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop' },
    { id: 'natural-perm', name: '내추럴펌', url: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=500&fit=crop' },
  ],
  global: [
    // 글로벌 스타일 - Unsplash 무료 이미지
    { id: 'dreadlocks', name: '드레드락스', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop' },
    { id: 'braids', name: '브레이드', url: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=400&h=500&fit=crop' },
    { id: 'afro', name: '아프로', url: 'https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?w=400&h=500&fit=crop' },
    { id: 'mohawk', name: '모호크', url: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=400&h=500&fit=crop' },
  ]
};

const downloadDir = path.join(__dirname, '..', 'temp-images');
const S3_BUCKET = 'hairstyle-ai-references';
const S3_REGION = 'ap-northeast-2';

// 디렉토리 생성
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      // 리다이렉트 처리
      if (response.statusCode === 301 || response.statusCode === 302) {
        https.get(response.headers.location, (res) => {
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }
    }).on('error', reject);
  });
}

async function main() {
  console.log('헤어스타일 레퍼런스 이미지 다운로드 및 S3 업로드 시작...\n');

  const allImages = [];

  // 모든 카테고리 이미지 수집
  for (const [category, images] of Object.entries(hairstyleImages)) {
    for (const img of images) {
      allImages.push({ ...img, category });
    }
  }

  console.log(`총 ${allImages.length}개 이미지 처리 예정\n`);

  for (const img of allImages) {
    const filename = `${img.category}-${img.id}.jpg`;
    const filepath = path.join(downloadDir, filename);
    const s3Key = `references/${img.category}/${img.id}.jpg`;

    try {
      console.log(`다운로드 중: ${img.name} (${img.category})`);
      await downloadImage(img.url, filepath);

      console.log(`S3 업로드 중: ${s3Key}`);
      execSync(`aws s3 cp "${filepath}" s3://${S3_BUCKET}/${s3Key} --region ${S3_REGION}`, { stdio: 'pipe' });

      console.log(`✓ 완료: ${img.name}\n`);
    } catch (error) {
      console.error(`✗ 실패: ${img.name} - ${error.message}\n`);
    }
  }

  // 임시 파일 정리
  console.log('임시 파일 정리 중...');
  fs.rmSync(downloadDir, { recursive: true, force: true });

  console.log('\n완료!');
  console.log(`S3 버킷 URL: https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/references/`);
}

main().catch(console.error);

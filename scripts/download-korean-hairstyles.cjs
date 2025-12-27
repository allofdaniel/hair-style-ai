/**
 * 한국 스타일 헤어스타일 레퍼런스 이미지 다운로드 및 S3 업로드
 *
 * 전문 헤어샵 사이트들의 고품질 레퍼런스 이미지 사용
 * 사용법: node scripts/download-korean-hairstyles.cjs
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 한국 남성 헤어스타일 - 전문 사이트 고품질 이미지
const maleStyles = [
  // 다운펌
  {
    id: 'comma-hair',
    category: 'male',
    name: '쉼표머리',
    url: 'https://gatsby.sg/img/men-lifestyle/11-trendy-korean-hairstyles-for-men-in-2024/s-shaped_fringe.jpg'
  },
  {
    id: 'gail-perm',
    category: 'male',
    name: '가일펌',
    url: 'https://gatsby.sg/img/men-lifestyle/8-top-korean-perm-men-hairstyles-in-2024/Gail-Perm.jpg'
  },
  {
    id: 'pomade-down',
    category: 'male',
    name: '포마드 다운펌',
    url: 'https://gatsby.sg/img/men-lifestyle/11-trendy-korean-hairstyles-for-men-in-2024/neat_comb_back.jpg'
  },
  {
    id: 'natural-down',
    category: 'male',
    name: '내추럴 다운',
    url: 'https://gatsby.sg/img/men-lifestyle/11-trendy-korean-hairstyles-for-men-in-2024/natural_flow.jpg'
  },

  // 투블럭
  {
    id: 'dandy-cut',
    category: 'male',
    name: '댄디컷',
    url: 'https://gatsby.sg/img/men-lifestyle/11-trendy-korean-hairstyles-for-men-in-2024/two_block_haircut_with_air_bangs.jpg'
  },
  {
    id: 'undercut',
    category: 'male',
    name: '언더컷',
    url: 'https://forteseries.com/cdn/shop/articles/Korean_Undercut.jpg?v=1698742612&width=800'
  },
  {
    id: 'two-block-basic',
    category: 'male',
    name: '투블럭 기본',
    url: 'https://forteseries.com/cdn/shop/articles/Two_Block.jpg?v=1698742612&width=800'
  },
  {
    id: 'mohawk-two-block',
    category: 'male',
    name: '모히칸 투블럭',
    url: 'https://forteseries.com/cdn/shop/articles/Korean_Mohawk.jpg?v=1698742612&width=800'
  },

  // 펌
  {
    id: 'ash-perm',
    category: 'male',
    name: '애즈펌',
    url: 'https://gatsby.sg/img/men-lifestyle/8-top-korean-perm-men-hairstyles-in-2024/Soft-Wavy-Perm.jpg'
  },
  {
    id: 'garma-perm',
    category: 'male',
    name: '가르마펌',
    url: 'https://gatsby.sg/img/men-lifestyle/8-top-korean-perm-men-hairstyles-in-2024/Middle-Part-Perm.jpg'
  },
  {
    id: 'regent-perm',
    category: 'male',
    name: '리젠트펌',
    url: 'https://gatsby.sg/img/men-lifestyle/11-trendy-korean-hairstyles-for-men-in-2024/permed_crop_with_high_fade_60-40_part_with_down_perm.jpg'
  },
  {
    id: 'scurl-perm',
    category: 'male',
    name: 'S컬펌',
    url: 'https://gatsby.sg/img/men-lifestyle/8-top-korean-perm-men-hairstyles-in-2024/S-Curve-Perm.jpg'
  },
  {
    id: 'hippie-perm',
    category: 'male',
    name: '히피펌',
    url: 'https://gatsby.sg/img/men-lifestyle/11-trendy-korean-hairstyles-for-men-in-2024/long_curtain_hair.jpg'
  },

  // 장발
  {
    id: 'wolf-cut',
    category: 'male',
    name: '울프컷',
    url: 'https://forteseries.com/cdn/shop/articles/Korean_Wolf_Cut.jpg?v=1698742612&width=800'
  },
  {
    id: 'long-layered',
    category: 'male',
    name: '롱 레이어드',
    url: 'https://forteseries.com/cdn/shop/articles/Korean_Curtain_Bangs.jpg?v=1698742612&width=800'
  },
  {
    id: 'man-bun',
    category: 'male',
    name: '맨번',
    url: 'https://gatsby.sg/img/men-lifestyle/8-top-korean-perm-men-hairstyles-in-2024/Permed-Mullet.jpg'
  },

  // 숏
  {
    id: 'crew-cut',
    category: 'male',
    name: '크루컷',
    url: 'https://gatsby.sg/img/men-lifestyle/8-top-korean-perm-men-hairstyles-in-2024/Short-Hair-Perm.jpg'
  },
  {
    id: 'ivy-league',
    category: 'male',
    name: '아이비리그',
    url: 'https://gatsby.sg/img/men-lifestyle/11-trendy-korean-hairstyles-for-men-in-2024/korean_mash.jpg'
  },
  {
    id: 'buzz-cut',
    category: 'male',
    name: '버즈컷',
    url: 'https://forteseries.com/cdn/shop/articles/Korean_Buzz_Cut.jpg?v=1698742612&width=800'
  },

  // 페이드
  {
    id: 'low-fade',
    category: 'male',
    name: '로우 페이드',
    url: 'https://forteseries.com/cdn/shop/articles/Korean_Low_Fade.jpg?v=1698742612&width=800'
  },
  {
    id: 'mid-fade',
    category: 'male',
    name: '미드 페이드',
    url: 'https://gatsby.sg/img/men-lifestyle/11-trendy-korean-hairstyles-for-men-in-2024/shadow_perm.jpg'
  },
  {
    id: 'high-fade',
    category: 'male',
    name: '하이 페이드',
    url: 'https://gatsby.sg/img/men-lifestyle/11-trendy-korean-hairstyles-for-men-in-2024/permed_crop_with_high_fade.jpg'
  },
  {
    id: 'skin-fade',
    category: 'male',
    name: '스킨 페이드',
    url: 'https://forteseries.com/cdn/shop/articles/Korean_Skin_Fade.jpg?v=1698742612&width=800'
  },
];

// 한국 여성 헤어스타일 - 전문 사이트 고품질 이미지
const femaleStyles = [
  // 숏컷
  {
    id: 'pixie-cut',
    category: 'female',
    name: '픽시컷',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-Pixie-Cut.png'
  },
  {
    id: 'bob-cut',
    category: 'female',
    name: '보브컷',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-Blunt-Bob.png'
  },
  {
    id: 'hush-cut',
    category: 'female',
    name: '허쉬컷',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-Hush-Cut.png'
  },
  {
    id: 'short-wolf',
    category: 'female',
    name: '숏 울프컷',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-Wolf-Cut.png'
  },

  // 중단발
  {
    id: 'c-curl',
    category: 'female',
    name: 'C컬펌',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-C-Curl.png'
  },
  {
    id: 'lob-cut',
    category: 'female',
    name: '롱보브',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-Lob.png'
  },
  {
    id: 'wave-perm',
    category: 'female',
    name: '물결펌',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-Waves.png'
  },
  {
    id: 'layered-mid',
    category: 'female',
    name: '레이어드 중단발',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-Layers-1.png'
  },

  // 긴머리
  {
    id: 'long-straight',
    category: 'female',
    name: '긴 생머리',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-Straight-and-Sleek-Liquid-hair-1.png'
  },
  {
    id: 'long-layered',
    category: 'female',
    name: '롱 레이어드',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-Layers-1.png'
  },
  {
    id: 's-curl-long',
    category: 'female',
    name: '롱 S컬펌',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-S-Curl.png'
  },
  {
    id: 'goddess-waves',
    category: 'female',
    name: '여신 웨이브',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-Body-Wave.png'
  },

  // 앞머리
  {
    id: 'see-through-bangs',
    category: 'female',
    name: '시스루뱅',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-See-Through-Bangs.png'
  },
  {
    id: 'full-bangs',
    category: 'female',
    name: '풀뱅',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-Blunt-Bangs.png'
  },
  {
    id: 'curtain-bangs',
    category: 'female',
    name: '커튼뱅',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-Curtain-Hair-for-Men.png'
  },
  {
    id: 'side-bangs',
    category: 'female',
    name: '사이드뱅',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-Side-Bangs.png'
  },

  // 펌
  {
    id: 'body-perm',
    category: 'female',
    name: '바디펌',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-Body-Wave.png'
  },
  {
    id: 'build-perm',
    category: 'female',
    name: '빌드펌',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-Volume-Perm.png'
  },
  {
    id: 'glam-perm',
    category: 'female',
    name: '글램펌',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-Glam-Curl.png'
  },
  {
    id: 'hippie-perm',
    category: 'female',
    name: '히피펌',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-Hippie-Perm.png'
  },

  // 업스타일
  {
    id: 'low-bun',
    category: 'female',
    name: '로우번',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-Low-Bun.png'
  },
  {
    id: 'high-ponytail',
    category: 'female',
    name: '하이 포니테일',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-High-Ponytail.png'
  },
  {
    id: 'half-up',
    category: 'female',
    name: '하프업',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-Half-Up.png'
  },
  {
    id: 'messy-bun',
    category: 'female',
    name: '헝클어진 번',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-Messy-Bun.png'
  },

  // 살롱
  {
    id: 'hime-cut',
    category: 'female',
    name: '히메컷',
    url: 'https://uploads.dailyvanity.sg/wp-content/uploads/2023/12/Korean-Hair-Trends-2024-Hime-Cut.png'
  },
];

const downloadDir = path.join(__dirname, '..', 'temp-hair-images');
const S3_BUCKET = 'hairstyle-ai-references';
const S3_REGION = 'ap-northeast-2';

// 디렉토리 생성
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*',
        'Referer': 'https://google.com'
      }
    }, (response) => {
      // 리다이렉트 처리
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 303) {
        const redirectUrl = response.headers.location;
        console.log(`  리다이렉트: ${redirectUrl}`);
        file.close();
        fs.unlinkSync(filepath);
        downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });

    request.on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });

    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function main() {
  console.log('한국 스타일 헤어스타일 레퍼런스 이미지 다운로드 시작...\n');

  const allStyles = [...maleStyles, ...femaleStyles];
  console.log(`총 ${allStyles.length}개 이미지 처리 예정\n`);

  const results = { success: [], failed: [] };

  for (const style of allStyles) {
    const ext = style.url.includes('.png') ? 'png' : 'jpg';
    const filename = `${style.category}-${style.id}.${ext}`;
    const filepath = path.join(downloadDir, filename);
    const s3Key = `references/${style.category}/${style.id}.${ext}`;

    try {
      console.log(`다운로드 중: ${style.name} (${style.id})`);
      await downloadImage(style.url, filepath);

      // 파일 크기 확인
      const stats = fs.statSync(filepath);
      if (stats.size < 1000) {
        throw new Error('파일이 너무 작음 (손상 의심)');
      }

      console.log(`S3 업로드 중: ${s3Key} (${Math.round(stats.size/1024)}KB)`);
      execSync(`aws s3 cp "${filepath}" s3://${S3_BUCKET}/${s3Key} --region ${S3_REGION}`, { stdio: 'pipe' });

      console.log(`✓ 완료: ${style.name}\n`);
      results.success.push(style.id);
    } catch (error) {
      console.error(`✗ 실패: ${style.name} - ${error.message}\n`);
      results.failed.push({ id: style.id, error: error.message });
    }
  }

  // 임시 파일 정리
  console.log('임시 파일 정리 중...');
  if (fs.existsSync(downloadDir)) {
    fs.rmSync(downloadDir, { recursive: true, force: true });
  }

  console.log('\n========== 결과 ==========');
  console.log(`성공: ${results.success.length}개`);
  console.log(`실패: ${results.failed.length}개`);

  if (results.failed.length > 0) {
    console.log('\n실패한 스타일:');
    results.failed.forEach(f => console.log(`  - ${f.id}: ${f.error}`));
  }

  console.log(`\nS3 버킷 URL: https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/references/`);
}

main().catch(console.error);

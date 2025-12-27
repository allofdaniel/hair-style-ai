/**
 * DALL-E 3으로 샘플 헤어스타일 이미지 생성 (테스트용 - 5개만)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const S3_BUCKET = 'hairstyle-ai-references';
const S3_REGION = 'ap-northeast-2';

if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY가 설정되지 않았습니다.');
  process.exit(1);
}

// 샘플 5개만 테스트
const sampleStyles = [
  {
    id: 'comma-hair',
    category: 'male',
    name: '쉼표머리',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean comma hair hairstyle for men, soft curved bangs falling naturally in comma shape on forehead, medium length black textured hair on top sweeping to one side, clean tapered sides, simple neutral gray studio background, soft professional lighting highlighting hair texture details, photorealistic 3D render, no face features just smooth mannequin, focus entirely on the hairstyle'
  },
  {
    id: 'two-block-basic',
    category: 'male',
    name: '투블럭 기본',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean two-block haircut for men, clean buzzed short sides transitioning to longer textured black hair on top, classic K-drama actor style, simple neutral gray studio background, soft professional lighting highlighting hair texture, photorealistic 3D render, smooth mannequin without facial features, 3/4 angle view showing both sides and top'
  },
  {
    id: 'bob-cut',
    category: 'female',
    name: '보브컷',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean bob cut for women, sleek black straight hair at jaw length with clean blunt ends, elegant sophisticated minimalist style, simple neutral gray studio background, soft professional lighting, photorealistic 3D render, smooth mannequin without facial features, front view showing the bob shape framing the face area'
  },
  {
    id: 'c-curl',
    category: 'female',
    name: 'C컬펌',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean C-curl perm for women, dark brown hair at shoulder length with ends curling inward in C-shape, sweet natural feminine look, simple neutral gray studio background, soft professional lighting, photorealistic 3D render, smooth mannequin without facial features, 3/4 view showing the C-curl at ends'
  },
  {
    id: 'high-fade',
    category: 'male',
    name: '하이 페이드',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean high fade haircut for men, dramatic gradient taper starting high near crown blending to skin, textured black hair on top, modern urban barbershop style, simple neutral gray studio background, soft professional lighting, photorealistic 3D render, smooth mannequin without facial features, side profile view showing fade gradient clearly'
  },
];

const downloadDir = path.join(__dirname, '..', 'temp-sample-images');

if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}

async function generateImage(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url'
    });

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          if (result.error) {
            reject(new Error(result.error.message));
          } else if (result.data && result.data[0]) {
            resolve(result.data[0].url);
          } else {
            reject(new Error('No image URL in response'));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${responseData.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(120000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(data);
    req.end();
  });
}

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(filepath);
        downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      reject(err);
    });
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('DALL-E 3으로 샘플 헤어스타일 이미지 생성 시작 (5개)...\n');

  const results = { success: [], failed: [] };

  for (let i = 0; i < sampleStyles.length; i++) {
    const style = sampleStyles[i];
    const filename = `${style.category}-${style.id}.png`;
    const filepath = path.join(downloadDir, filename);
    const s3Key = `references/${style.category}/${style.id}.png`;

    try {
      console.log(`[${i + 1}/${sampleStyles.length}] 생성 중: ${style.name}`);

      const imageUrl = await generateImage(style.prompt);
      console.log(`  → 이미지 생성 완료`);

      await downloadImage(imageUrl, filepath);
      console.log(`  → 다운로드 완료`);

      const stats = fs.statSync(filepath);
      console.log(`  → S3 업로드: ${s3Key} (${Math.round(stats.size/1024)}KB)`);
      execSync(`aws s3 cp "${filepath}" s3://${S3_BUCKET}/${s3Key} --region ${S3_REGION}`, { stdio: 'pipe' });

      console.log(`  ✓ 성공!\n`);
      results.success.push(style.id);

      if (i < sampleStyles.length - 1) {
        console.log('  ⏳ 12초 대기...\n');
        await sleep(12000);
      }

    } catch (error) {
      console.error(`  ✗ 실패: ${error.message}\n`);
      results.failed.push({ id: style.id, error: error.message });
      await sleep(5000);
    }
  }

  console.log('\n========== 샘플 생성 결과 ==========');
  console.log(`성공: ${results.success.length}개`);
  console.log(`실패: ${results.failed.length}개`);

  if (results.success.length > 0) {
    console.log('\n생성된 이미지 URL:');
    results.success.forEach(id => {
      const style = sampleStyles.find(s => s.id === id);
      console.log(`  ${style.name}: https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/references/${style.category}/${id}.png`);
    });
  }

  // 로컬 파일은 유지 (확인용)
  console.log(`\n로컬 파일 경로: ${downloadDir}`);
}

main().catch(console.error);

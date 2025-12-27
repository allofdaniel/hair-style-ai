/**
 * 문제있는 레퍼런스 이미지 재생성
 * - 쉼표머리: 여자머리처럼 보임 -> 남자 쉼표머리로
 * - 가일펌: 뒷머리만 보임 -> 앞모습
 * - 미드페이드, 하이페이드: 이상함
 * - 투 스트랜드 트위스트: 이상함
 * - 레이어드 컷 (남): 이상함
 * - 텍스쳐펌: 이상함
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const S3_BUCKET = 'hairstyle-ai-references';
const S3_REGION = 'ap-northeast-2';

// 재생성 필요한 스타일들 - 매우 구체적인 프롬프트
const stylesToFix = [
  {
    id: 'comma-hair',
    category: 'male',
    name: '쉼표머리',
    prompt: 'Professional 3D mannequin head bust showing Korean MALE comma hair (쉼표머리) style, short to medium length dark hair with the front bangs curved like a comma shape sweeping to one side on the forehead, clean cut masculine Asian male hairstyle, NOT female hair, sides are short and neat, smooth mannequin without facial features, front view showing the distinctive comma-shaped bangs, neutral gray studio background, professional lighting'
  },
  {
    id: 'gail-perm',
    category: 'male',
    name: '가일펌',
    prompt: 'Professional 3D mannequin head bust showing Korean male gail perm (가일펌) style, FRONT VIEW showing the face area, soft natural S-wave curls falling down gracefully, medium length wavy dark hair with gentle waves, smooth mannequin without facial features, showing the front of the hairstyle not the back, neutral gray studio background, professional lighting'
  },
  {
    id: 'mid-fade',
    category: 'male',
    name: '미드 페이드',
    prompt: 'Professional 3D mannequin head bust showing mid fade haircut for men, clean gradual fade starting at the middle of the head, short clipped sides blending smoothly to longer hair on top, dark hair, crisp professional barbershop cut, SIDE VIEW showing the fade gradient clearly, smooth mannequin without facial features, neutral gray studio background, professional lighting'
  },
  {
    id: 'high-fade',
    category: 'male',
    name: '하이 페이드',
    prompt: 'Professional 3D mannequin head bust showing high fade haircut for men, dramatic fade starting high on the head near the temples, very short sides fading to skin, more length on top styled upward, dark hair, clean modern barbershop style, SIDE VIEW showing the high fade line, smooth mannequin without facial features, neutral gray studio background, professional lighting'
  },
  {
    id: 'two-strand-twist',
    category: 'male',
    name: '투 스트랜드 트위스트',
    prompt: 'Professional 3D mannequin head bust showing two strand twist hairstyle for men, African-American male protective style, two sections of hair twisted around each other creating rope-like twists, medium length twisted dark hair sections all over the head, neat uniform twists, smooth mannequin without facial features, neutral gray studio background, professional lighting'
  },
  {
    id: 'layer-cut-m',
    category: 'male',
    name: '레이어드 컷',
    prompt: 'Professional 3D mannequin head bust showing Korean male layered cut, textured layers throughout giving movement and dimension, medium length dark hair with visible layering, modern Korean hairstyle for men, FRONT VIEW, smooth mannequin without facial features, neutral gray studio background, professional lighting'
  },
  {
    id: 'texture-perm',
    category: 'male',
    name: '텍스쳐펌',
    prompt: 'Professional 3D mannequin head bust showing Korean texture perm for men, naturally wavy and tousled dark hair with added texture and movement, medium length messy styled waves, modern casual Korean male style, FRONT VIEW showing the textured waves, smooth mannequin without facial features, neutral gray studio background, professional lighting'
  }
];

const downloadDir = path.join(__dirname, '..', 'temp-fix-images');

if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}

async function generateWithGemini(prompt) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"]
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.error) {
            reject(new Error(result.error.message));
            return;
          }

          const parts = result.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
              resolve(part.inlineData.data);
              return;
            }
          }
          reject(new Error('No image generated'));
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(120000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.write(requestBody);
    req.end();
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(`문제있는 ${stylesToFix.length}개 이미지 재생성 시작...\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < stylesToFix.length; i++) {
    const style = stylesToFix[i];
    const filename = `${style.id}.png`;
    const filepath = path.join(downloadDir, filename);
    const s3Key = `references/${style.category}/${style.id}.png`;

    try {
      console.log(`[${i + 1}/${stylesToFix.length}] ${style.name} (${style.category})`);

      const imageBase64 = await generateWithGemini(style.prompt);
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      fs.writeFileSync(filepath, imageBuffer);

      const stats = fs.statSync(filepath);

      // S3 업로드
      execSync(`aws s3 cp "${filepath}" s3://${S3_BUCKET}/${s3Key} --region ${S3_REGION}`, { stdio: 'pipe' });

      console.log(`  ✓ 성공 (${Math.round(stats.size/1024)}KB)\n`);
      successCount++;

      if (i < stylesToFix.length - 1) {
        await sleep(6000);
      }
    } catch (error) {
      console.error(`  ✗ 실패: ${error.message}\n`);
      failCount++;
      await sleep(3000);
    }
  }

  console.log('\n========================================');
  console.log(`완료! 성공: ${successCount}, 실패: ${failCount}`);
  console.log('========================================');
}

main().catch(console.error);

/**
 * 나머지 헤어스타일 이미지 생성 (샘플 5개 제외한 나머지)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const S3_BUCKET = 'hairstyle-ai-references';
const S3_REGION = 'ap-northeast-2';

// 이미 생성된 것 제외한 나머지 스타일들
const remainingStyles = [
  // 남성 다운펌 (comma-hair 제외)
  {
    id: 'gail-perm',
    category: 'male',
    name: '가일펌',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean gail perm hairstyle for men, natural soft S-waves falling down gracefully, medium-long black hair on top with gentle waves, sophisticated look, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },
  {
    id: 'pomade-down',
    category: 'male',
    name: '포마드 다운펌',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean pomade slick back hairstyle for men, black hair swept back smoothly with wet glossy finish, forehead exposed, neutral gray studio background, photorealistic render, smooth mannequin without face, side profile'
  },
  {
    id: 'natural-down',
    category: 'male',
    name: '내추럴 다운',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean natural down perm for men, effortless natural fall, soft dark brown textured hair falling loosely, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 남성 투블럭 (two-block-basic 제외)
  {
    id: 'dandy-cut',
    category: 'male',
    name: '댄디컷',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean dandy cut two-block for men, short trimmed sides 3-6mm, volume textured black hair on top, neutral gray studio background, photorealistic render, smooth mannequin without face, side view'
  },
  {
    id: 'undercut',
    category: 'male',
    name: '언더컷',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean undercut for men, dramatically shaved sides disconnected from longer textured black top hair, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },
  {
    id: 'mohawk-two-block',
    category: 'male',
    name: '모히칸 투블럭',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean mohawk two-block for men, volume concentrated in center strip, sides very short, bold black hair, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 남성 펌
  {
    id: 'ash-perm',
    category: 'male',
    name: '애즈펌',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean ash perm for men, natural S-wave curls throughout medium length black hair, added volume, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },
  {
    id: 'garma-perm',
    category: 'male',
    name: '가르마펌',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean garma perm for men, center part with soft waves flowing to both sides, black hair, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },
  {
    id: 'scurl-perm',
    category: 'male',
    name: 'S컬펌',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean S-curl perm for men, flowing S-shaped waves throughout medium length dark hair, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 남성 숏/장발/페이드
  {
    id: 'crew-cut',
    category: 'male',
    name: '크루컷',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean crew cut for men, very short buzzed sides and slightly longer textured black top, athletic style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },
  {
    id: 'wolf-cut-m',
    category: 'male',
    name: '울프컷',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean wolf cut for men, heavy choppy layers shaggy texture, mullet-inspired longer black back, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },
  {
    id: 'mid-fade',
    category: 'male',
    name: '미드 페이드',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean mid fade haircut for men, taper at temple level with textured black top, neutral gray studio background, photorealistic render, smooth mannequin without face, side view'
  },
  {
    id: 'low-fade',
    category: 'male',
    name: '로우 페이드',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean low fade haircut for men, gradual taper starting below ear with textured black top, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 여성 숏컷 (bob-cut 제외)
  {
    id: 'pixie-cut',
    category: 'female',
    name: '픽시컷',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean pixie cut for women, cropped short sides textured wispy dark brown pieces on top, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },
  {
    id: 'hush-cut',
    category: 'female',
    name: '허쉬컷',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean hush cut for women, heavy face-framing layers around cheeks, textured wispy dark brown ends, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },
  {
    id: 'short-wolf',
    category: 'female',
    name: '숏 울프컷',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean short wolf cut for women, choppy shaggy layers wispy black face-framing pieces, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 여성 중단발 (c-curl 제외)
  {
    id: 'lob-cut',
    category: 'female',
    name: '롱보브',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean lob long bob for women, shoulder length black hair with blunt ends, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },
  {
    id: 'wave-perm',
    category: 'female',
    name: '물결펌',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean wave perm for women, natural flowing S-waves throughout mid-length brown hair, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },
  {
    id: 'layered-mid',
    category: 'female',
    name: '레이어드 중단발',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean layered mid-length cut for women, soft face-framing dark brown layers, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 여성 긴머리
  {
    id: 'long-straight',
    category: 'female',
    name: '긴 생머리',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean long straight silky black hair for women, reaching mid-back, sleek glossy healthy look, neutral gray studio background, photorealistic render, smooth mannequin without face, back view'
  },
  {
    id: 'long-layered-f',
    category: 'female',
    name: '롱 레이어드',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean long layered dark brown hair for women, flowing face-framing layers, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },
  {
    id: 's-curl-long',
    category: 'female',
    name: '롱 S컬펌',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean long S-curl perm for women, elegant S-shaped waves from mid-length down, brown hair, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 여성 앞머리
  {
    id: 'see-through-bangs',
    category: 'female',
    name: '시스루뱅',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean see-through bangs for women with long black hair, light wispy thin strands showing forehead, neutral gray studio background, photorealistic render, smooth mannequin without face, front view'
  },
  {
    id: 'curtain-bangs',
    category: 'female',
    name: '커튼뱅',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean curtain bangs for women, parted in center flowing to sides framing face, brown hair, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 여성 펌
  {
    id: 'body-perm',
    category: 'female',
    name: '바디펌',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean body perm for women, large loose waves adding volume throughout long brown hair, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },
  {
    id: 'glam-perm',
    category: 'female',
    name: '글램펌',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean glam perm for women, large glamorous bouncy curls, Hollywood-style brown waves, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 여성 업스타일
  {
    id: 'low-bun',
    category: 'female',
    name: '로우번',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean low bun for women, elegantly gathered black hair at nape of neck, chignon style, neutral gray studio background, photorealistic render, smooth mannequin without face, side view'
  },
  {
    id: 'high-ponytail',
    category: 'female',
    name: '하이 포니테일',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean high ponytail for women, black hair tied at crown with sleek pulled back sides, neutral gray studio background, photorealistic render, smooth mannequin without face, back view'
  },
  {
    id: 'half-up',
    category: 'female',
    name: '하프업',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean half-up half-down style for women, top section tied back rest flows down, brown hair, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 여성 살롱
  {
    id: 'hime-cut',
    category: 'female',
    name: '히메컷',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean hime cut for women, straight blunt bangs and cheek-length sidelocks with long black back hair, Japanese princess style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },
];

const downloadDir = path.join(__dirname, '..', 'temp-remaining-images');

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
            reject(new Error('No image URL'));
          }
        } catch (e) {
          reject(new Error(`Parse error`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(120000, () => {
      req.destroy();
      reject(new Error('Timeout'));
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
    }).on('error', reject);
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(`나머지 ${remainingStyles.length}개 이미지 생성 시작...\n`);
  console.log('예상 시간: 약 ' + Math.ceil(remainingStyles.length * 15 / 60) + '분\n');

  const results = { success: [], failed: [] };

  for (let i = 0; i < remainingStyles.length; i++) {
    const style = remainingStyles[i];
    const filename = `${style.category}-${style.id}.png`;
    const filepath = path.join(downloadDir, filename);
    const s3Key = `references/${style.category}/${style.id}.png`;

    try {
      console.log(`[${i + 1}/${remainingStyles.length}] ${style.name}`);

      const imageUrl = await generateImage(style.prompt);
      await downloadImage(imageUrl, filepath);

      const stats = fs.statSync(filepath);
      execSync(`aws s3 cp "${filepath}" s3://${S3_BUCKET}/${s3Key} --region ${S3_REGION}`, { stdio: 'pipe' });

      console.log(`  ✓ 성공 (${Math.round(stats.size/1024)}KB)`);
      results.success.push(style.id);

      if (i < remainingStyles.length - 1) {
        await sleep(12000);
      }
    } catch (error) {
      console.error(`  ✗ 실패: ${error.message}`);
      results.failed.push({ id: style.id, error: error.message });

      if (error.message.includes('rate')) {
        console.log('  Rate limit - 60초 대기');
        await sleep(60000);
      } else {
        await sleep(5000);
      }
    }
  }

  console.log(`\n성공: ${results.success.length}, 실패: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log('실패 목록:', results.failed.map(f => f.id).join(', '));
  }
}

main().catch(console.error);

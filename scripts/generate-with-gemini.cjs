/**
 * Gemini API로 나머지 31개 헤어스타일 이미지 생성
 * Gemini 2.5 Flash 모델 사용 (무료)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const S3_BUCKET = 'hairstyle-ai-references';
const S3_REGION = 'ap-northeast-2';

// 생성 필요한 31개 스타일
const stylesToGenerate = [
  // 남성 - 아프로/텍스처
  {
    id: 'two-strand-twist',
    category: 'male',
    name: '투 스트랜드 트위스트',
    prompt: 'Professional 3D rendered mannequin head bust showing two strand twist hairstyle for Black men, tightly twisted rope-like sections of dark hair, medium length twists, smooth mannequin without face, neutral gray background, professional studio lighting, high quality reference photo'
  },
  {
    id: 'taper-afro',
    category: 'male',
    name: '테이퍼 아프로',
    prompt: 'Professional 3D rendered mannequin head bust showing taper afro hairstyle for Black men, rounded afro on top with tapered sides, natural black curly hair texture, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  {
    id: 'curly-top-fade',
    category: 'male',
    name: '컬리탑 페이드',
    prompt: 'Professional 3D rendered mannequin head bust showing curly top fade hairstyle for men, tight curls on top with clean fade on sides, dark curly hair, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  {
    id: 'french-crop-curly',
    category: 'male',
    name: '프렌치 크롭 컬리',
    prompt: 'Professional 3D rendered mannequin head bust showing French crop with curly texture for men, short curly fringe at front with textured top, dark hair, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  // 남성 - 매직/펌
  {
    id: 'magic-straight-m',
    category: 'male',
    name: '매직 스트레이트',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean magic straight perm for men, perfectly straight sleek dark hair falling naturally, medium length, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  {
    id: 'volume-perm-m',
    category: 'male',
    name: '볼륨펌',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean volume perm for men, fluffy voluminous wavy dark hair with natural bounce, medium length, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  {
    id: 'texture-perm',
    category: 'male',
    name: '텍스쳐펌',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean texture perm for men, naturally textured wavy dark hair with movement, medium length messy style, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  {
    id: 'setting-perm-m',
    category: 'male',
    name: '셋팅펌',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean setting perm for men, soft C-curl waves in dark hair, natural-looking curves, medium length, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  {
    id: 'side-part',
    category: 'male',
    name: '사이드 파트',
    prompt: 'Professional 3D rendered mannequin head bust showing classic side part hairstyle for men, neatly combed dark hair with clean side parting, slicked gentleman style, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  {
    id: 'layer-cut-m',
    category: 'male',
    name: '레이어드 컷',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean layered cut for men, textured layers in dark hair with natural movement, medium length modern style, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  // 여성 - 앞머리
  {
    id: 'full-bangs',
    category: 'female',
    name: '풀뱅',
    prompt: 'Professional 3D rendered mannequin head bust showing full bangs hairstyle for women, thick straight bangs covering forehead completely, dark straight hair, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  {
    id: 'side-bangs',
    category: 'female',
    name: '사이드뱅',
    prompt: 'Professional 3D rendered mannequin head bust showing side swept bangs for women, angled bangs sweeping to one side, dark hair framing face, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  // 여성 - 펌
  {
    id: 'build-perm',
    category: 'female',
    name: '빌드펌',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean build perm for women, voluminous bouncy waves with root lift, dark wavy hair, medium to long length, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  {
    id: 'hippie-perm-f',
    category: 'female',
    name: '히피펌',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean hippie perm for women, tight small curls throughout long dark hair, bohemian style waves, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  // 여성 - 업스타일
  {
    id: 'messy-bun',
    category: 'female',
    name: '헝클어진 번',
    prompt: 'Professional 3D rendered mannequin head bust showing messy bun hairstyle for women, loosely gathered dark hair in casual updo with wispy pieces, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  {
    id: 'goddess-waves',
    category: 'female',
    name: '여신 웨이브',
    prompt: 'Professional 3D rendered mannequin head bust showing goddess waves for women, large flowing S-curve waves in long dark hair, glamorous Hollywood style, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  // 여성 - 아프로/브레이드
  {
    id: 'dreadlocks-f',
    category: 'female',
    name: '드레드락',
    prompt: 'Professional 3D rendered mannequin head bust showing dreadlocks for women, long ropelike locs in dark hair, natural bohemian style, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  {
    id: 'box-braids-f',
    category: 'female',
    name: '박스 브레이드',
    prompt: 'Professional 3D rendered mannequin head bust showing box braids for women, neat sectioned braids in dark hair, long protective style, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  {
    id: 'cornrows-f',
    category: 'female',
    name: '콘로우',
    prompt: 'Professional 3D rendered mannequin head bust showing cornrows for women, tight braids close to scalp in geometric patterns, dark hair, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  {
    id: 'afro-f',
    category: 'female',
    name: '내추럴 아프로',
    prompt: 'Professional 3D rendered mannequin head bust showing natural afro for women, round fluffy natural black curly hair, embracing natural texture, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  {
    id: 'twist-out',
    category: 'female',
    name: '트위스트 아웃',
    prompt: 'Professional 3D rendered mannequin head bust showing twist out hairstyle for women, defined spiral curls from untwisted sections, natural black hair texture, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  {
    id: 'bantu-knots',
    category: 'female',
    name: '반투 노트',
    prompt: 'Professional 3D rendered mannequin head bust showing bantu knots for women, small coiled knots across scalp in dark hair, African traditional style, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  {
    id: 'fulani-braids',
    category: 'female',
    name: '풀라니 브레이드',
    prompt: 'Professional 3D rendered mannequin head bust showing Fulani braids for women, center cornrow with side braids and beads, dark hair traditional African style, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  {
    id: 'passion-twist',
    category: 'female',
    name: '패션 트위스트',
    prompt: 'Professional 3D rendered mannequin head bust showing passion twists for women, bohemian style twisted locs with curly ends, dark hair protective style, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  // 여성 - 스트레이트/펌
  {
    id: 'magic-straight-f',
    category: 'female',
    name: '매직 스트레이트',
    prompt: 'Professional 3D rendered mannequin head bust showing magic straight perm for women, perfectly sleek straight long dark hair, glossy smooth finish, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  {
    id: 'volume-magic',
    category: 'female',
    name: '볼륨 매직',
    prompt: 'Professional 3D rendered mannequin head bust showing volume magic perm for women, straight hair with root volume lift, dark shiny hair, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  {
    id: 'digital-perm',
    category: 'female',
    name: '디지털펌',
    prompt: 'Professional 3D rendered mannequin head bust showing digital perm for women, large loose waves in long dark hair, natural flowing curls, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  {
    id: 'setting-perm-f',
    category: 'female',
    name: '셋팅펌',
    prompt: 'Professional 3D rendered mannequin head bust showing setting perm for women, soft natural waves with inward curl ends, dark hair Korean style, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  // 여성 - 레이어드/샤기
  {
    id: 'layer-cut-f',
    category: 'female',
    name: '레이어드 컷',
    prompt: 'Professional 3D rendered mannequin head bust showing layered cut for women, face-framing layers in long dark hair, movement and dimension, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  {
    id: 'shaggy-cut',
    category: 'female',
    name: '샤기컷',
    prompt: 'Professional 3D rendered mannequin head bust showing shaggy cut for women, choppy textured layers with messy finish, medium length dark hair, smooth mannequin without face, neutral gray background, professional studio lighting'
  },
  {
    id: 'tassel-cut',
    category: 'female',
    name: '테슬컷',
    prompt: 'Professional 3D rendered mannequin head bust showing tassel cut for women, blunt ends with slight layers creating tassel effect, medium dark hair, smooth mannequin without face, neutral gray background, professional studio lighting'
  }
];

const downloadDir = path.join(__dirname, '..', 'temp-gemini-images');

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

          // 이미지 데이터 추출
          const parts = result.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
              resolve(part.inlineData.data); // base64 이미지
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
  console.log(`Gemini API로 ${stylesToGenerate.length}개 이미지 생성 시작...\n`);
  console.log(`예상 시간: 약 ${Math.ceil(stylesToGenerate.length * 8 / 60)}분\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < stylesToGenerate.length; i++) {
    const style = stylesToGenerate[i];
    const filename = `${style.id}.png`;
    const filepath = path.join(downloadDir, filename);
    const s3Key = `references/${style.category}/${style.id}.png`;

    try {
      console.log(`[${i + 1}/${stylesToGenerate.length}] ${style.name} (${style.category})`);

      const imageBase64 = await generateWithGemini(style.prompt);

      // Base64를 파일로 저장
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      fs.writeFileSync(filepath, imageBuffer);

      const stats = fs.statSync(filepath);

      // S3 업로드
      execSync(`aws s3 cp "${filepath}" s3://${S3_BUCKET}/${s3Key} --region ${S3_REGION}`, { stdio: 'pipe' });

      console.log(`  ✓ 성공 (${Math.round(stats.size/1024)}KB)\n`);
      successCount++;

      // Rate limiting - 6초 대기
      if (i < stylesToGenerate.length - 1) {
        await sleep(6000);
      }
    } catch (error) {
      console.error(`  ✗ 실패: ${error.message}\n`);
      failCount++;

      // 에러 시에도 잠시 대기
      await sleep(3000);
    }
  }

  console.log('\n========================================');
  console.log(`완료! 성공: ${successCount}, 실패: ${failCount}`);
  console.log('========================================');
}

main().catch(console.error);

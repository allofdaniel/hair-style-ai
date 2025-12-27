/**
 * 새로 추가된 헤어스타일 레퍼런스 이미지 생성
 * - 페이드 추가: 테이퍼 페이드, 드롭 페이드, 버스트 페이드
 * - 짧은 머리 추가: 상고머리, 스포츠컷, 군인머리, 프렌치 크롭, 바가지머리
 * - 펌 추가: 쉐도우펌, 리프컷펌, 아이리쉬펌, 기본 다운펌, 곱슬펌
 * - 여성 추가: 쵸피 보브, 숏 생머리, 귀넘김 단발
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const S3_BUCKET = 'hairstyle-ai-references';
const S3_REGION = 'ap-northeast-2';

// 새로 추가된 스타일들
const newStyles = [
  // Fade 추가
  {
    id: 'taper-fade',
    category: 'male',
    name: '테이퍼 페이드',
    prompt: 'Professional 3D mannequin head bust showing TAPER FADE haircut, very subtle gradual fade only around ears and neckline, minimal contrast, most natural conservative fade style, professional office-appropriate look, smooth mannequin without facial features, neutral gray studio background'
  },
  {
    id: 'drop-fade',
    category: 'male',
    name: '드롭 페이드',
    prompt: 'Professional 3D mannequin head bust showing DROP FADE haircut from SIDE VIEW, fade line CURVES DOWN and drops behind the ear following natural head shape, arc-shaped fade line clearly visible, modern stylish urban look, smooth mannequin without facial features, neutral gray studio background'
  },
  {
    id: 'burst-fade',
    category: 'male',
    name: '버스트 페이드',
    prompt: 'Professional 3D mannequin head bust showing BURST FADE haircut, semicircular fade radiating around the ear like a sunburst, curved fade behind ears, unique edgy style, smooth mannequin without facial features, neutral gray studio background'
  },

  // Short 추가
  {
    id: 'sanggo',
    category: 'male',
    name: '상고머리',
    prompt: 'Professional 3D mannequin head bust showing Korean traditional SANGGO haircut (상고머리), very short buzzed sides and back almost shaved, slightly longer top hair standing up naturally about 1-2cm, classic Korean military student style, very common traditional Korean mens haircut, smooth mannequin without facial features, neutral gray studio background'
  },
  {
    id: 'sports-cut',
    category: 'male',
    name: '스포츠컷',
    prompt: 'Professional 3D mannequin head bust showing athletic SPORTS CUT, short all around easy to manage, sporty clean active look perfect for athletes, very practical low-maintenance style, smooth mannequin without facial features, neutral gray studio background'
  },
  {
    id: 'military-cut',
    category: 'male',
    name: '군인머리',
    prompt: 'Professional 3D mannequin head bust showing strict MILITARY REGULATION haircut, extremely short almost shaved all around, uniform disciplined military style, Korean army regulation cut, smooth mannequin without facial features, neutral gray studio background'
  },
  {
    id: 'french-crop',
    category: 'male',
    name: '프렌치 크롭',
    prompt: 'Professional 3D mannequin head bust showing FRENCH CROP haircut, short textured fringe falling forward on forehead, short tapered sides, modern European trendy style, smooth mannequin without facial features, neutral gray studio background'
  },
  {
    id: 'bowl-cut',
    category: 'male',
    name: '바가지머리',
    prompt: 'Professional 3D mannequin head bust showing classic BOWL CUT (바가지머리), rounded mushroom shape, hair cut in uniform length around head like a bowl was placed on top, classic retro Korean style, smooth mannequin without facial features, neutral gray studio background'
  },

  // Perm 추가
  {
    id: 'shadow-perm',
    category: 'male',
    name: '쉐도우펌',
    prompt: 'Professional 3D mannequin head bust showing Korean male SHADOW PERM, root volume lift creating natural shadow effect, subtle wave adding dimension, soft natural textured look, dark hair, smooth mannequin without facial features, neutral gray studio background'
  },
  {
    id: 'leaf-cut-perm',
    category: 'male',
    name: '리프컷펌',
    prompt: 'Professional 3D mannequin head bust showing Korean male LEAF CUT PERM, layered hair flowing like leaves with natural movement and texture, soft romantic K-pop idol style, dark hair, smooth mannequin without facial features, neutral gray studio background'
  },
  {
    id: 'irish-perm',
    category: 'male',
    name: '아이리쉬펌',
    prompt: 'Professional 3D mannequin head bust showing Korean male IRISH PERM, thick bouncy defined curls, voluminous body throughout hair, masculine yet stylish curly look, dark hair, smooth mannequin without facial features, neutral gray studio background'
  },
  {
    id: 'down-perm-basic',
    category: 'male',
    name: '기본 다운펌',
    prompt: 'Professional 3D mannequin head bust showing Korean male BASIC DOWN PERM, natural straight fall hair laying flat and controlled, taming flyaway hair, most common Korean salon treatment for men, dark hair, smooth mannequin without facial features, neutral gray studio background'
  },
  {
    id: 'curly-perm',
    category: 'male',
    name: '곱슬펌',
    prompt: 'Professional 3D mannequin head bust showing Korean male CURLY PERM, defined tight curls throughout medium length hair, trendy modern textured curly style, dark hair, smooth mannequin without facial features, neutral gray studio background'
  },

  // Female 추가
  {
    id: 'choppy-bob',
    category: 'female',
    name: '쵸피 보브',
    prompt: 'Professional 3D mannequin head bust showing Korean female CHOPPY BOB, irregular layered textured ends, messy trendy edgy short bob at jaw length, youthful energetic style, dark hair, smooth mannequin without facial features, neutral gray studio background'
  },
  {
    id: 'short-straight',
    category: 'female',
    name: '숏 생머리',
    prompt: 'Professional 3D mannequin head bust showing Korean female SHORT STRAIGHT hair above shoulders, sleek clean minimal style, sophisticated mature elegant look, glossy dark hair, smooth mannequin without facial features, neutral gray studio background'
  },
  {
    id: 'ear-tuck-bob',
    category: 'female',
    name: '귀넘김 단발',
    prompt: 'Professional 3D mannequin head bust showing Korean female EAR TUCK BOB, bob length hair with one side tucked neatly behind the ear, chic sophisticated clean K-beauty look, very popular trendy style, dark hair, smooth mannequin without facial features, neutral gray studio background'
  },

  // 기존 페이드 재생성 (설명 개선된 버전)
  {
    id: 'low-fade',
    category: 'male',
    name: '로우 페이드',
    prompt: 'Professional 3D mannequin head bust showing LOW FADE haircut from SIDE VIEW, fade starts BELOW the ear near the neckline/hairline, very gradual subtle taper, most conservative natural look, longer hair remains higher up on head, clearly showing the LOW starting point near neckline, smooth mannequin without facial features, neutral gray studio background'
  },
  {
    id: 'mid-fade',
    category: 'male',
    name: '미드 페이드',
    prompt: 'Professional 3D mannequin head bust showing MID FADE haircut from SIDE VIEW, fade starts at TEMPLE level at the MIDDLE of the ear, balanced versatile look, clearly showing fade beginning at mid-ear level, modern popular barbershop style, smooth mannequin without facial features, neutral gray studio background'
  },
  {
    id: 'high-fade',
    category: 'male',
    name: '하이 페이드',
    prompt: 'Professional 3D mannequin head bust showing HIGH FADE haircut from SIDE VIEW, fade starts HIGH above the ear near temples/crown, dramatic contrast with very short sides, bold urban hip-hop style, clearly showing HIGH starting point well above ear, smooth mannequin without facial features, neutral gray studio background'
  },
  {
    id: 'skin-fade',
    category: 'male',
    name: '스킨 페이드',
    prompt: 'Professional 3D mannequin head bust showing SKIN FADE (bald fade) from SIDE VIEW, sides shaved down to BARE SKIN showing scalp, seamless smooth gradient from skin to hair, ultra clean sharp precise look, most dramatic fade style, smooth mannequin without facial features, neutral gray studio background'
  },

  // 댄디컷 재생성
  {
    id: 'dandy-cut',
    category: 'male',
    name: '댄디컷',
    prompt: 'Professional 3D mannequin head bust showing Korean DANDY CUT, classic gentleman style with buzzed short sides, longer top hair neatly parted 7:3 and swept to side, clean professional businessman look like news anchor, refined elegant mature style, very neat and polished NOT messy, dark hair, smooth mannequin without facial features, neutral gray studio background'
  }
];

const downloadDir = path.join(__dirname, '..', 'temp-new-styles');

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
  console.log(`새로 추가된 ${newStyles.length}개 스타일 이미지 생성 시작...\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < newStyles.length; i++) {
    const style = newStyles[i];
    const filename = `${style.id}.png`;
    const filepath = path.join(downloadDir, filename);
    const s3Key = `references/${style.category}/${style.id}.png`;

    try {
      console.log(`[${i + 1}/${newStyles.length}] ${style.name} (${style.category})`);

      const imageBase64 = await generateWithGemini(style.prompt);
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      fs.writeFileSync(filepath, imageBuffer);

      const stats = fs.statSync(filepath);

      // S3 업로드
      execSync(`aws s3 cp "${filepath}" s3://${S3_BUCKET}/${s3Key} --region ${S3_REGION}`, { stdio: 'pipe' });

      console.log(`  ✓ 성공 (${Math.round(stats.size/1024)}KB)\n`);
      successCount++;

      if (i < newStyles.length - 1) {
        await sleep(6000); // 6초 대기 (rate limit 방지)
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

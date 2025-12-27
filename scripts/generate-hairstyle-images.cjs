/**
 * DALL-E 3를 사용하여 한국식 헤어스타일 레퍼런스 이미지 생성
 * 3D 마네킹/모형 스타일로 머리에만 집중
 *
 * 사용법: node scripts/generate-hairstyle-images.cjs
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// .env 파일에서 API 키 읽기
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const S3_BUCKET = 'hairstyle-ai-references';
const S3_REGION = 'ap-northeast-2';

if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY가 설정되지 않았습니다.');
  process.exit(1);
}

// 헤어스타일 정의 - 3D 마네킹 스타일 프롬프트
const hairstyles = [
  // ===== 남성 다운펌 =====
  {
    id: 'comma-hair',
    category: 'male',
    name: '쉼표머리',
    prompt: 'Professional 3D rendered mannequin head showing Korean comma hair hairstyle, soft curved bangs falling naturally like a comma shape on forehead, medium length textured hair on top sweeping to one side, clean tapered sides, neutral gray background, studio lighting, hair texture clearly visible, black hair, side view angle'
  },
  {
    id: 'gail-perm',
    category: 'male',
    name: '가일펌',
    prompt: 'Professional 3D rendered mannequin head showing Korean gail perm hairstyle, natural soft S-waves falling down gracefully, medium-long length on top with gentle waves, sophisticated gentleman look, neutral gray background, studio lighting, black hair, 3/4 view angle'
  },
  {
    id: 'pomade-down',
    category: 'male',
    name: '포마드 다운펌',
    prompt: 'Professional 3D rendered mannequin head showing Korean pomade slick back hairstyle, hair swept back smoothly and neatly, wet glossy finish, forehead exposed, professional refined look, neutral gray background, studio lighting, black hair, side profile view'
  },
  {
    id: 'natural-down',
    category: 'male',
    name: '내추럴 다운',
    prompt: 'Professional 3D rendered mannequin head showing Korean natural down perm, effortless natural fall, soft textured hair falling loosely, casual elegant relaxed style, neutral gray background, studio lighting, dark brown hair, front view'
  },

  // ===== 남성 투블럭 =====
  {
    id: 'dandy-cut',
    category: 'male',
    name: '댄디컷',
    prompt: 'Professional 3D rendered mannequin head showing Korean dandy cut two-block hairstyle, short trimmed sides and back 3-6mm, volume and texture on top styled upward, classic gentleman professional look, neutral gray background, studio lighting, black hair, side view showing the contrast'
  },
  {
    id: 'undercut',
    category: 'male',
    name: '언더컷',
    prompt: 'Professional 3D rendered mannequin head showing Korean undercut hairstyle, dramatically shaved sides disconnected from longer textured top hair, edgy modern trendy K-pop look, neutral gray background, studio lighting, black hair, 3/4 view showing disconnect'
  },
  {
    id: 'two-block-basic',
    category: 'male',
    name: '투블럭 기본',
    prompt: 'Professional 3D rendered mannequin head showing Korean classic two-block cut, clean buzzed sides and textured medium-length top, versatile modern Korean style, neutral gray background, studio lighting, black hair, front angle view'
  },
  {
    id: 'mohawk-two-block',
    category: 'male',
    name: '모히칸 투블럭',
    prompt: 'Professional 3D rendered mannequin head showing Korean mohawk two-block hairstyle, volume and height concentrated in center strip, sides very short, bold edgy statement look, neutral gray background, studio lighting, black hair, front view'
  },

  // ===== 남성 펌 =====
  {
    id: 'ash-perm',
    category: 'male',
    name: '애즈펌',
    prompt: 'Professional 3D rendered mannequin head showing Korean ash perm, natural S-wave curls throughout medium length hair, added volume and soft texture, romantic sophisticated look, neutral gray background, studio lighting, black hair, 3/4 view'
  },
  {
    id: 'garma-perm',
    category: 'male',
    name: '가르마펌',
    prompt: 'Professional 3D rendered mannequin head showing Korean garma perm, center or side part with soft waves flowing elegantly to both sides, sophisticated wavy gentleman style, neutral gray background, studio lighting, black hair, front view'
  },
  {
    id: 'scurl-perm',
    category: 'male',
    name: 'S컬펌',
    prompt: 'Professional 3D rendered mannequin head showing Korean S-curl perm, soft flowing S-shaped waves throughout medium length hair, romantic gentle artistic look, neutral gray background, studio lighting, dark brown hair, side view'
  },
  {
    id: 'hippie-perm-m',
    category: 'male',
    name: '히피펌',
    prompt: 'Professional 3D rendered mannequin head showing Korean hippie perm for men, loose large waves, free-spirited bohemian style, medium to long flowing length, neutral gray background, studio lighting, brown hair, 3/4 view'
  },

  // ===== 남성 장발 =====
  {
    id: 'wolf-cut-m',
    category: 'male',
    name: '울프컷',
    prompt: 'Professional 3D rendered mannequin head showing Korean wolf cut for men, heavy choppy layers and shaggy texture, mullet-inspired longer back, trendy K-pop idol style, neutral gray background, studio lighting, black hair, side profile'
  },
  {
    id: 'long-layered-m',
    category: 'male',
    name: '롱 레이어드',
    prompt: 'Professional 3D rendered mannequin head showing Korean long layered hair for men, reaching shoulders, soft flowing layers for movement, artistic sophisticated look, neutral gray background, studio lighting, black hair, 3/4 view'
  },
  {
    id: 'man-bun',
    category: 'male',
    name: '맨번',
    prompt: 'Professional 3D rendered mannequin head showing Korean man bun hairstyle, long hair tied back in a neat bun at crown, clean sophisticated trendy look, neutral gray background, studio lighting, black hair, side profile view'
  },

  // ===== 남성 숏 =====
  {
    id: 'crew-cut',
    category: 'male',
    name: '크루컷',
    prompt: 'Professional 3D rendered mannequin head showing Korean crew cut, very short buzzed sides and slightly longer textured top, clean military-inspired athletic style, neutral gray background, studio lighting, black hair, 3/4 view'
  },
  {
    id: 'ivy-league',
    category: 'male',
    name: '아이비리그',
    prompt: 'Professional 3D rendered mannequin head showing Korean ivy league cut, short tapered sides and neat combable parted top, classic preppy professional clean style, neutral gray background, studio lighting, black hair, side view'
  },
  {
    id: 'buzz-cut',
    category: 'male',
    name: '버즈컷',
    prompt: 'Professional 3D rendered mannequin head showing Korean buzz cut, uniformly very short hair all around the head, bold minimalist clean athletic look, neutral gray background, studio lighting, black hair, front view'
  },

  // ===== 남성 페이드 =====
  {
    id: 'low-fade',
    category: 'male',
    name: '로우 페이드',
    prompt: 'Professional 3D rendered mannequin head showing Korean low fade haircut, gradual taper starting below ear level, textured styled top, modern clean barbershop style, neutral gray background, studio lighting, black hair, side view showing fade'
  },
  {
    id: 'mid-fade',
    category: 'male',
    name: '미드 페이드',
    prompt: 'Professional 3D rendered mannequin head showing Korean mid fade haircut, taper at temple level, versatile modern textured top, sharp barbershop style, neutral gray background, studio lighting, black hair, 3/4 view'
  },
  {
    id: 'high-fade',
    category: 'male',
    name: '하이 페이드',
    prompt: 'Professional 3D rendered mannequin head showing Korean high fade haircut, dramatic taper starting high on head near crown, bold urban street style, neutral gray background, studio lighting, black hair, side profile'
  },
  {
    id: 'skin-fade',
    category: 'male',
    name: '스킨 페이드',
    prompt: 'Professional 3D rendered mannequin head showing Korean skin fade, seamless blend down to bare skin, ultra clean sharp precise barbershop look, neutral gray background, studio lighting, black hair, side view'
  },

  // ===== 여성 숏컷 =====
  {
    id: 'pixie-cut',
    category: 'female',
    name: '픽시컷',
    prompt: 'Professional 3D rendered mannequin head showing Korean pixie cut for women, cropped short sides and back, playful textured wispy pieces on top, cute elfin chic trendy style, neutral gray background, studio lighting, dark brown hair, 3/4 view'
  },
  {
    id: 'bob-cut',
    category: 'female',
    name: '보브컷',
    prompt: 'Professional 3D rendered mannequin head showing Korean bob cut for women, jaw length with clean blunt straight ends, sleek elegant sophisticated minimalist style, neutral gray background, studio lighting, black hair, front view'
  },
  {
    id: 'hush-cut',
    category: 'female',
    name: '허쉬컷',
    prompt: 'Professional 3D rendered mannequin head showing Korean hush cut for women, heavy face-framing layers around cheeks and chin, textured wispy ends, trendy effortless chic style, neutral gray background, studio lighting, dark brown hair, 3/4 view'
  },
  {
    id: 'short-wolf',
    category: 'female',
    name: '숏 울프컷',
    prompt: 'Professional 3D rendered mannequin head showing Korean short wolf cut for women, choppy shaggy layers and wispy face-framing pieces, edgy modern trendy K-style, neutral gray background, studio lighting, black hair, side view'
  },

  // ===== 여성 중단발 =====
  {
    id: 'c-curl',
    category: 'female',
    name: 'C컬펌',
    prompt: 'Professional 3D rendered mannequin head showing Korean C-curl perm for women, ends curling inward in C-shape framing the face, sweet natural feminine look, shoulder length, neutral gray background, studio lighting, dark brown hair, front view'
  },
  {
    id: 'lob-cut',
    category: 'female',
    name: '롱보브',
    prompt: 'Professional 3D rendered mannequin head showing Korean lob long bob cut for women, shoulder length with blunt or slightly textured ends, sleek versatile sophisticated style, neutral gray background, studio lighting, black hair, 3/4 view'
  },
  {
    id: 'wave-perm',
    category: 'female',
    name: '물결펌',
    prompt: 'Professional 3D rendered mannequin head showing Korean wave perm for women, natural flowing soft ocean-like S-waves throughout mid-length hair, romantic feminine style, neutral gray background, studio lighting, brown hair, side view'
  },
  {
    id: 'layered-mid',
    category: 'female',
    name: '레이어드 중단발',
    prompt: 'Professional 3D rendered mannequin head showing Korean layered mid-length cut for women, soft face-framing layers for movement and volume, elegant feminine style, neutral gray background, studio lighting, dark brown hair, 3/4 view'
  },

  // ===== 여성 긴머리 =====
  {
    id: 'long-straight',
    category: 'female',
    name: '긴 생머리',
    prompt: 'Professional 3D rendered mannequin head showing Korean long straight silky hair for women, reaching mid-back, sleek glossy healthy-looking goddess hair, elegant classic beauty, neutral gray background, studio lighting, black hair, back view with partial profile'
  },
  {
    id: 'long-layered-f',
    category: 'female',
    name: '롱 레이어드',
    prompt: 'Professional 3D rendered mannequin head showing Korean long layered hair for women, flowing face-framing layers throughout for movement and volume, romantic feminine style, neutral gray background, studio lighting, dark brown hair, side view'
  },
  {
    id: 's-curl-long',
    category: 'female',
    name: '롱 S컬펌',
    prompt: 'Professional 3D rendered mannequin head showing Korean long S-curl perm for women, flowing elegant S-shaped waves from mid-length down, glamorous feminine K-beauty style, neutral gray background, studio lighting, brown hair, 3/4 view'
  },
  {
    id: 'goddess-waves',
    category: 'female',
    name: '여신 웨이브',
    prompt: 'Professional 3D rendered mannequin head showing Korean goddess waves for women, large luxurious bouncy waves throughout long hair, glamorous red carpet style, neutral gray background, studio lighting, dark brown hair, side view'
  },

  // ===== 여성 앞머리 =====
  {
    id: 'see-through-bangs',
    category: 'female',
    name: '시스루뱅',
    prompt: 'Professional 3D rendered mannequin head showing Korean see-through bangs for women with long hair, light wispy thin strands showing forehead underneath, airy cute youthful K-idol style, neutral gray background, studio lighting, black hair, front view close-up on bangs'
  },
  {
    id: 'full-bangs',
    category: 'female',
    name: '풀뱅',
    prompt: 'Professional 3D rendered mannequin head showing Korean full bangs for women, thick blunt straight cut bangs covering forehead completely, doll-like cute youthful style with long hair, neutral gray background, studio lighting, black hair, front view'
  },
  {
    id: 'curtain-bangs',
    category: 'female',
    name: '커튼뱅',
    prompt: 'Professional 3D rendered mannequin head showing Korean curtain bangs for women, parted in center with pieces flowing to each side framing face, 70s retro elegant feminine style with long hair, neutral gray background, studio lighting, brown hair, front view'
  },
  {
    id: 'side-bangs',
    category: 'female',
    name: '사이드뱅',
    prompt: 'Professional 3D rendered mannequin head showing Korean side swept bangs for women, brushed elegantly to one side across forehead, sophisticated feminine mature style with mid-length hair, neutral gray background, studio lighting, dark brown hair, 3/4 view'
  },

  // ===== 여성 펌 =====
  {
    id: 'body-perm',
    category: 'female',
    name: '바디펌',
    prompt: 'Professional 3D rendered mannequin head showing Korean body perm for women, large loose waves adding volume and body throughout long hair, glamorous full bouncy style, neutral gray background, studio lighting, brown hair, 3/4 view'
  },
  {
    id: 'build-perm',
    category: 'female',
    name: '빌드펌',
    prompt: 'Professional 3D rendered mannequin head showing Korean build perm for women, volume and texture starting from roots, bouncy full-bodied movement throughout medium-long hair, neutral gray background, studio lighting, dark brown hair, side view'
  },
  {
    id: 'glam-perm',
    category: 'female',
    name: '글램펌',
    prompt: 'Professional 3D rendered mannequin head showing Korean glam perm for women, large glamorous bouncy curls, sexy Hollywood-style waves, luxurious red carpet look, neutral gray background, studio lighting, brown hair, 3/4 view'
  },
  {
    id: 'hippie-perm-f',
    category: 'female',
    name: '히피펌',
    prompt: 'Professional 3D rendered mannequin head showing Korean hippie perm for women, loose bohemian natural waves, free-spirited effortless romantic style, long hair, neutral gray background, studio lighting, light brown hair, side view'
  },

  // ===== 여성 업스타일 =====
  {
    id: 'low-bun',
    category: 'female',
    name: '로우번',
    prompt: 'Professional 3D rendered mannequin head showing Korean low bun for women, elegantly gathered at nape of neck, sophisticated sleek clean chignon style, neutral gray background, studio lighting, black hair, side profile view'
  },
  {
    id: 'high-ponytail',
    category: 'female',
    name: '하이 포니테일',
    prompt: 'Professional 3D rendered mannequin head showing Korean high ponytail for women, tied at crown with sleek pulled back sides, youthful energetic athletic style, neutral gray background, studio lighting, black hair, 3/4 back view'
  },
  {
    id: 'half-up',
    category: 'female',
    name: '하프업',
    prompt: 'Professional 3D rendered mannequin head showing Korean half-up half-down style for women, top section tied back while rest flows down, romantic feminine sweet style, neutral gray background, studio lighting, brown hair, 3/4 back view'
  },
  {
    id: 'messy-bun',
    category: 'female',
    name: '헝클어진 번',
    prompt: 'Professional 3D rendered mannequin head showing Korean messy bun for women, loose face-framing strands and relaxed texture, effortless chic casual elegant style, neutral gray background, studio lighting, dark brown hair, side view'
  },

  // ===== 여성 살롱 =====
  {
    id: 'hime-cut',
    category: 'female',
    name: '히메컷',
    prompt: 'Professional 3D rendered mannequin head showing Korean hime cut for women, straight blunt bangs and cheek-length sidelocks framing face with long back hair, Japanese princess style, neutral gray background, studio lighting, black hair, front view'
  },
];

const downloadDir = path.join(__dirname, '..', 'temp-generated-images');

// 디렉토리 생성
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
  console.log('DALL-E 3으로 한국 헤어스타일 레퍼런스 이미지 생성 시작...\n');
  console.log(`총 ${hairstyles.length}개 이미지 생성 예정\n`);
  console.log('⚠️ 참고: DALL-E 3 API는 분당 요청 제한이 있어 각 요청 사이에 대기 시간이 있습니다.\n');

  const results = { success: [], failed: [] };

  for (let i = 0; i < hairstyles.length; i++) {
    const style = hairstyles[i];
    const filename = `${style.category}-${style.id}.png`;
    const filepath = path.join(downloadDir, filename);
    const s3Key = `references/${style.category}/${style.id}.png`;

    try {
      console.log(`[${i + 1}/${hairstyles.length}] 생성 중: ${style.name} (${style.id})`);

      // 이미지 생성
      const imageUrl = await generateImage(style.prompt);
      console.log(`  → 이미지 URL 생성 완료`);

      // 이미지 다운로드
      await downloadImage(imageUrl, filepath);
      console.log(`  → 다운로드 완료`);

      // S3 업로드
      const stats = fs.statSync(filepath);
      console.log(`  → S3 업로드 중: ${s3Key} (${Math.round(stats.size/1024)}KB)`);
      execSync(`aws s3 cp "${filepath}" s3://${S3_BUCKET}/${s3Key} --region ${S3_REGION}`, { stdio: 'pipe' });

      console.log(`  ✓ 완료: ${style.name}\n`);
      results.success.push(style.id);

      // Rate limit 대기 (DALL-E 3는 분당 5-7개 제한)
      if (i < hairstyles.length - 1) {
        console.log('  ⏳ 다음 요청까지 15초 대기...\n');
        await sleep(15000);
      }

    } catch (error) {
      console.error(`  ✗ 실패: ${style.name} - ${error.message}\n`);
      results.failed.push({ id: style.id, name: style.name, error: error.message });

      // 에러 발생 시 더 긴 대기
      if (error.message.includes('rate') || error.message.includes('Rate')) {
        console.log('  ⏳ Rate limit 감지, 60초 대기...\n');
        await sleep(60000);
      } else {
        await sleep(5000);
      }
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
    results.failed.forEach(f => console.log(`  - ${f.name} (${f.id}): ${f.error}`));
  }

  console.log(`\nS3 버킷 URL: https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/references/`);
}

main().catch(console.error);

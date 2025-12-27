/**
 * 모든 문제있는 헤어스타일 이미지 재생성
 * - 외부 URL 사용중인 것들 -> S3 PNG로 교체
 * - 얼굴이 나오는 것들 -> 마네킹 스타일로 재생성
 * - 이름과 매칭 안되는 것들 -> 정확한 스타일로 재생성
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

// 모든 문제있는 스타일들 - 마네킹 스타일로 재생성
const stylesToFix = [
  // === 남성 스타일 (문제 있는 것들) ===

  // 리젠트펌 - 사람 얼굴 나옴
  {
    id: 'regent-perm',
    category: 'male',
    name: '리젠트펌',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean regent perm for men, hair swept back elegantly with volume and soft waves, classic sophisticated gentleman style, neutral gray studio background, photorealistic render, smooth mannequin without face, side angle view'
  },

  // 히피펌 - 사람 얼굴 + 잘못된 스타일
  {
    id: 'hippie-perm-m',
    category: 'male',
    name: '히피펌',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean hippie perm for men, loose large bohemian waves, medium-long flowing wavy hair with free-spirited texture, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 롱 레이어드 - 사람 얼굴 나옴
  {
    id: 'long-layered-m',
    category: 'male',
    name: '롱 레이어드',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean long layered hair for men, shoulder-length flowing layers, soft artistic rock star style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 맨번 - 사람 얼굴 나옴
  {
    id: 'man-bun',
    category: 'male',
    name: '맨번',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean man bun style, long hair tied back in neat bun at crown, clean sophisticated trendy look, neutral gray studio background, photorealistic render, smooth mannequin without face, 3/4 angle showing bun'
  },

  // 아이비리그 - 사람 얼굴 + 잘못된 스타일
  {
    id: 'ivy-league',
    category: 'male',
    name: '아이비리그',
    prompt: 'Professional 3D rendered mannequin head bust showing classic Ivy League haircut for men, short tapered sides with neat combable parted top, clean preppy professional style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 버즈컷 - 사람 얼굴 나옴
  {
    id: 'buzz-cut',
    category: 'male',
    name: '버즈컷',
    prompt: 'Professional 3D rendered mannequin head bust showing buzz cut for men, uniformly very short clipped hair all around, clean military athletic minimalist style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 하이 페이드 - 사람 얼굴 나옴
  {
    id: 'high-fade',
    category: 'male',
    name: '하이 페이드',
    prompt: 'Professional 3D rendered mannequin head bust showing high fade haircut for men, dramatic gradient taper starting high near crown blending to skin, textured top, neutral gray studio background, photorealistic render, smooth mannequin without face, side view showing fade'
  },

  // 스킨 페이드 - 사람 얼굴 나옴
  {
    id: 'skin-fade',
    category: 'male',
    name: '스킨 페이드',
    prompt: 'Professional 3D rendered mannequin head bust showing skin fade haircut for men, seamless blend down to bare skin at sides, textured styled top, ultra clean precise barbershop style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 드레드락 - 사람 얼굴 나옴
  {
    id: 'dreadlocks-m',
    category: 'male',
    name: '드레드락',
    prompt: 'Professional 3D rendered mannequin head bust showing male dreadlocks hairstyle, thick rope-like matted locks hanging down, authentic reggae rastafarian style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 박스 브레이드 - 사람 얼굴 나옴
  {
    id: 'box-braids-m',
    category: 'male',
    name: '박스 브레이드',
    prompt: 'Professional 3D rendered mannequin head bust showing male box braids hairstyle, neatly sectioned square braids hanging down, hip-hop urban style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 콘로우 - 이미지 없음
  {
    id: 'cornrows-m',
    category: 'male',
    name: '콘로우',
    prompt: 'Professional 3D rendered mannequin head bust showing male cornrows hairstyle, tight braids close to scalp in neat straight rows going back, classic urban street style, neutral gray studio background, photorealistic render, smooth mannequin without face, top angle view'
  },

  // 아프로 - 사람 얼굴 나옴
  {
    id: 'afro-m',
    category: 'male',
    name: '아프로',
    prompt: 'Professional 3D rendered mannequin head bust showing male afro hairstyle, big round natural textured curly hair, full voluminous afro, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 투 스트랜드 트위스트 - 이미지 없음
  {
    id: 'two-strand-twist',
    category: 'male',
    name: '투 스트랜드 트위스트',
    prompt: 'Professional 3D rendered mannequin head bust showing male two strand twist hairstyle, hair twisted into rope-like coils all over head, textured natural style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 테이퍼 아프로 - 이미지 없음
  {
    id: 'taper-afro',
    category: 'male',
    name: '테이퍼 아프로',
    prompt: 'Professional 3D rendered mannequin head bust showing male taper afro hairstyle, faded sides with natural curly textured afro on top, modern clean urban style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 컬리탑 페이드 - 이미지 없음
  {
    id: 'curly-top-fade',
    category: 'male',
    name: '컬리탑 페이드',
    prompt: 'Professional 3D rendered mannequin head bust showing male curly top fade hairstyle, tight curls on top with clean faded sides, modern urban R&B style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 프렌치 크롭 컬리 - 이미지 없음
  {
    id: 'french-crop-curly',
    category: 'male',
    name: '프렌치 크롭 컬리',
    prompt: 'Professional 3D rendered mannequin head bust showing male french crop with curly texture, textured messy curls on top with short sides and textured fringe, European fashion style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 매직 스트레이트 남성 - 이미지 없음
  {
    id: 'magic-straight-m',
    category: 'male',
    name: '매직 스트레이트',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean male magic straight perm, naturally straightened smooth silky hair falling down, sleek refined professional look, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 볼륨펌 남성 - 이미지 없음
  {
    id: 'volume-perm-m',
    category: 'male',
    name: '볼륨펌',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean male volume perm, root lift with body and bounce throughout medium length hair, fuller thicker looking style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 텍스쳐펌 - 이미지 없음
  {
    id: 'texture-perm',
    category: 'male',
    name: '텍스쳐펌',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean male texture perm, natural looking movement and texture with subtle waves for dimension, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 셋팅펌 남성 - 이미지 없음
  {
    id: 'setting-perm-m',
    category: 'male',
    name: '셋팅펌',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean male setting perm, hair set in styled position with natural waves, versatile maintainable style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 사이드 파트 - 이미지 없음
  {
    id: 'side-part',
    category: 'male',
    name: '사이드 파트',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean male side part cut, clean defined side parting with combed neat hair, classic gentleman professional style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 레이어드 컷 남성 - 이미지 없음
  {
    id: 'layer-cut-m',
    category: 'male',
    name: '레이어드 컷',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean male layered cut, textured layers for movement and lightness, versatile everyday style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // === 여성 스타일 (문제 있는 것들) ===

  // 풀뱅 - 이미지 없음
  {
    id: 'full-bangs',
    category: 'female',
    name: '풀뱅',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean female full bangs hairstyle, thick blunt straight cut bangs covering forehead completely with long straight hair, doll-like cute youthful style, neutral gray studio background, photorealistic render, smooth mannequin without face, front view'
  },

  // 사이드뱅 - 이미지 없음
  {
    id: 'side-bangs',
    category: 'female',
    name: '사이드뱅',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean female side swept bangs, bangs brushed elegantly to one side across forehead with long hair, sophisticated feminine style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 빌드펌 - 이미지 없음
  {
    id: 'build-perm',
    category: 'female',
    name: '빌드펌',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean female build perm, volume and texture starting from roots with bouncy full-bodied movement throughout long hair, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 히피펌 여성 - 잘못된 이미지
  {
    id: 'hippie-perm-f',
    category: 'female',
    name: '히피펌',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean female hippie perm, loose bohemian natural waves throughout long flowing hair, free-spirited effortless romantic style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 메시번 - 이미지 없음
  {
    id: 'messy-bun',
    category: 'female',
    name: '헝클어진 번',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean female messy bun hairstyle, loosely gathered bun with relaxed face-framing strands, effortless chic casual elegant style, neutral gray studio background, photorealistic render, smooth mannequin without face, 3/4 angle view'
  },

  // 여신 웨이브 - 잘못된 이미지
  {
    id: 'goddess-waves',
    category: 'female',
    name: '여신 웨이브',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean female goddess waves hairstyle, large luxurious bouncy waves throughout very long hair, glamorous red carpet movie star style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 드레드락 여성 - 이미지 없음
  {
    id: 'dreadlocks-f',
    category: 'female',
    name: '드레드락',
    prompt: 'Professional 3D rendered mannequin head bust showing female dreadlocks hairstyle, long flowing rope-like matted locks, bohemian free-spirited style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 박스 브레이드 여성 - 이미지 없음
  {
    id: 'box-braids-f',
    category: 'female',
    name: '박스 브레이드',
    prompt: 'Professional 3D rendered mannequin head bust showing female long box braids hairstyle, neatly sectioned square braids hanging down long, protective style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 콘로우 여성 - 이미지 없음
  {
    id: 'cornrows-f',
    category: 'female',
    name: '콘로우',
    prompt: 'Professional 3D rendered mannequin head bust showing female cornrows hairstyle, tight braids close to scalp in artistic curved patterns, sleek edgy modern style, neutral gray studio background, photorealistic render, smooth mannequin without face, top angle view'
  },

  // 아프로 여성 - 이미지 없음
  {
    id: 'afro-f',
    category: 'female',
    name: '내추럴 아프로',
    prompt: 'Professional 3D rendered mannequin head bust showing female natural afro hairstyle, big beautiful round textured curly natural hair, proud authentic voluminous afro, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 트위스트 아웃 - 이미지 없음
  {
    id: 'twist-out',
    category: 'female',
    name: '트위스트 아웃',
    prompt: 'Professional 3D rendered mannequin head bust showing female twist out hairstyle, defined bouncy curls from unraveled twists, natural textured curly style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 반투 노트 - 이미지 없음
  {
    id: 'bantu-knots',
    category: 'female',
    name: '반투 노트',
    prompt: 'Professional 3D rendered mannequin head bust showing female bantu knots hairstyle, hair coiled into small twisted buns all over head, African traditional style, neutral gray studio background, photorealistic render, smooth mannequin without face, top angle view'
  },

  // 풀라니 브레이드 - 이미지 없음
  {
    id: 'fulani-braids',
    category: 'female',
    name: '풀라니 브레이드',
    prompt: 'Professional 3D rendered mannequin head bust showing female fulani braids hairstyle, center cornrow with side braids decorated with beads, tribal style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 패션 트위스트 - 이미지 없음
  {
    id: 'passion-twist',
    category: 'female',
    name: '패션 트위스트',
    prompt: 'Professional 3D rendered mannequin head bust showing female passion twist hairstyle, wavy bohemian twists flowing down, romantic protective style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 매직 스트레이트 여성 - 이미지 없음
  {
    id: 'magic-straight-f',
    category: 'female',
    name: '매직 스트레이트',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean female magic straight perm, perfectly smooth sleek silky straight long hair, glossy healthy shine, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 볼륨 매직 - 이미지 없음
  {
    id: 'volume-magic',
    category: 'female',
    name: '볼륨 매직',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean female volume magic perm, root volume lift with straight smooth ends, natural bouncy volume long hair, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 디지털펌 - 이미지 없음
  {
    id: 'digital-perm',
    category: 'female',
    name: '디지털펌',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean female digital perm, large soft bouncy curls from mid-length down long hair, glamorous long-lasting waves, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 셋팅펌 여성 - 이미지 없음
  {
    id: 'setting-perm-f',
    category: 'female',
    name: '셋팅펌',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean female setting perm, styled curl pattern that holds shape throughout long hair, easy daily styling, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 레이어드 컷 여성 - 이미지 없음
  {
    id: 'layer-cut-f',
    category: 'female',
    name: '레이어드 컷',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean female layered cut, soft face-framing layers throughout long hair for movement and dimension, versatile elegant style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 샤기컷 - 이미지 없음
  {
    id: 'shaggy-cut',
    category: 'female',
    name: '샤기컷',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean female shaggy cut, heavy choppy layers and textured wispy ends, effortless rock chic style mid-length hair, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },

  // 태슬컷 - 이미지 없음
  {
    id: 'tassel-cut',
    category: 'female',
    name: '태슬컷',
    prompt: 'Professional 3D rendered mannequin head bust showing Korean female tassel cut, feathery tapered ends like tassels on mid-length hair, light airy movement trendy style, neutral gray studio background, photorealistic render, smooth mannequin without face'
  },
];

const downloadDir = path.join(__dirname, '..', 'temp-fix-images');

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
          reject(new Error(`Parse error: ${responseData.substring(0, 100)}`));
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
  console.log(`${stylesToFix.length}개 이미지 생성 시작...\n`);
  console.log('예상 시간: 약 ' + Math.ceil(stylesToFix.length * 15 / 60) + '분\n');

  const results = { success: [], failed: [] };

  for (let i = 0; i < stylesToFix.length; i++) {
    const style = stylesToFix[i];
    const filename = `${style.id}.png`;
    const filepath = path.join(downloadDir, filename);
    const s3Key = `references/${style.category}/${style.id}.png`;

    try {
      console.log(`[${i + 1}/${stylesToFix.length}] ${style.name} (${style.category})`);

      const imageUrl = await generateImage(style.prompt);
      await downloadImage(imageUrl, filepath);

      const stats = fs.statSync(filepath);
      execSync(`aws s3 cp "${filepath}" s3://${S3_BUCKET}/${s3Key} --region ${S3_REGION}`, { stdio: 'pipe' });

      console.log(`  ✓ 성공 (${Math.round(stats.size/1024)}KB)\n`);
      results.success.push(style.id);

      if (i < stylesToFix.length - 1) {
        await sleep(12000);
      }
    } catch (error) {
      console.error(`  ✗ 실패: ${error.message}\n`);
      results.failed.push({ id: style.id, error: error.message });

      if (error.message.includes('rate') || error.message.includes('Rate')) {
        console.log('  Rate limit - 60초 대기');
        await sleep(60000);
      } else {
        await sleep(5000);
      }
    }
  }

  console.log(`\n========== 결과 ==========`);
  console.log(`성공: ${results.success.length}개`);
  console.log(`실패: ${results.failed.length}개`);

  if (results.failed.length > 0) {
    console.log('\n실패 목록:');
    results.failed.forEach(f => console.log(`  - ${f.id}: ${f.error}`));
  }
}

main().catch(console.error);

/**
 * AI 레퍼런스 이미지 생성 스크립트
 * 각 헤어스타일별로 한국인 모델의 전문적인 헤어스타일 이미지를 생성합니다.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env 파일 로드
dotenv.config();

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent';

// 남성 헤어스타일 정의 (전문 헤어샵 기준)
const maleHairStyles = [
  // 다운펌 카테고리
  {
    id: 'm-comma-hair',
    name: '쉼표머리',
    prompt: `Professional hair salon reference photo of a young Korean male model with comma hair (쉼표머리).

    HAIRSTYLE DETAILS:
    - Soft curved bangs falling naturally on forehead in comma shape
    - Medium length on top (7-10cm), short sides (2-3cm)
    - Natural black hair color
    - Slight texture and volume on top
    - Clean, sophisticated K-pop idol style

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Front-facing portrait, shoulders visible
    - High quality, sharp focus on hair details
    - Korean male model in his 20s with clear skin
    - Neutral facial expression`,
  },
  {
    id: 'm-gail-perm',
    name: '가일펌',
    prompt: `Professional hair salon reference photo of a young Korean male model with Gail perm (가일펌).

    HAIRSTYLE DETAILS:
    - Natural soft S-waves falling down
    - Medium length throughout (8-12cm on top)
    - Waves flow downward with volume
    - Natural dark brown or black hair
    - Sophisticated, romantic gentleman look

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Front-facing portrait, shoulders visible
    - High quality, sharp focus on hair texture
    - Korean male model in his 20s-30s
    - Neutral facial expression`,
  },
  {
    id: 'm-pomade-down',
    name: '포마드 다운펌',
    prompt: `Professional hair salon reference photo of a young Korean male model with pomade down perm (포마드 다운펌).

    HAIRSTYLE DETAILS:
    - Sleek hair swept back smoothly
    - Medium length on top (8-10cm)
    - Glossy, polished finish
    - Natural black hair with shine
    - Professional, sophisticated businessman style

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Slight side angle to show swept-back style
    - Korean male model in his 20s-30s
    - Neutral, confident expression`,
  },
  {
    id: 'm-natural-down',
    name: '내추럴 다운',
    prompt: `Professional hair salon reference photo of a young Korean male model with natural down perm (내추럴 다운펌).

    HAIRSTYLE DETAILS:
    - Effortless, naturally falling hair
    - Medium length (6-9cm on top)
    - Soft texture, not too styled
    - Natural black or dark brown hair
    - Casual, approachable look

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Front-facing portrait
    - Korean male model in his 20s
    - Relaxed, natural expression`,
  },
  // 투블럭 카테고리
  {
    id: 'm-dandy-cut',
    name: '댄디컷',
    prompt: `Professional hair salon reference photo of a young Korean male model with dandy cut two-block (댄디컷 투블럭).

    HAIRSTYLE DETAILS:
    - Clean short sides (fade or clipper cut, 3-6mm)
    - Volume and length on top (6-10cm)
    - Classic gentleman style parting
    - Natural black hair
    - Professional, polished appearance

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Slight angle to show side contrast
    - Korean male model in his 20s-30s
    - Confident expression`,
  },
  {
    id: 'm-undercut',
    name: '언더컷',
    prompt: `Professional hair salon reference photo of a young Korean male model with undercut (언더컷).

    HAIRSTYLE DETAILS:
    - Dramatically shaved sides (1-3mm)
    - Disconnected longer top (8-15cm)
    - Clear contrast between top and sides
    - Modern, edgy trendy look
    - Can be styled up or to the side

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Angle showing the undercut contrast
    - Korean male model in his 20s
    - Stylish, confident expression`,
  },
  {
    id: 'm-two-block-basic',
    name: '투블럭 기본',
    prompt: `Professional hair salon reference photo of a young Korean male model with classic two-block cut (투블럭 기본).

    HAIRSTYLE DETAILS:
    - Short trimmed sides (6-10mm)
    - Textured top (5-8cm)
    - Clean, versatile Korean style
    - Natural black hair
    - Works with various styling options

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Front-facing portrait
    - Korean male model in his 20s
    - Neutral expression`,
  },
  // 펌 카테고리
  {
    id: 'm-ash-perm',
    name: '애즈펌',
    prompt: `Professional hair salon reference photo of a young Korean male model with ash perm (애즈펌).

    HAIRSTYLE DETAILS:
    - Natural S-wave curls throughout
    - Added volume and texture
    - Medium length (8-12cm)
    - Soft, romantic waves
    - Natural black or ash brown color

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Front-facing to show wave pattern
    - Korean male model in his 20s
    - Soft, approachable expression`,
  },
  {
    id: 'm-garma-perm',
    name: '가르마펌',
    prompt: `Professional hair salon reference photo of a young Korean male model with garma perm (가르마펌).

    HAIRSTYLE DETAILS:
    - Center or side part with waves
    - Waves flowing to both sides
    - Medium length (8-12cm)
    - Elegant, sophisticated style
    - Natural black hair

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Front-facing showing the part
    - Korean male model in his 20s-30s
    - Refined expression`,
  },
  // 페이드 카테고리
  {
    id: 'm-low-fade',
    name: '로우 페이드',
    prompt: `Professional hair salon reference photo of a young Korean male model with low fade haircut (로우 페이드).

    HAIRSTYLE DETAILS:
    - Gradual fade starting below the ear
    - Textured top (5-8cm)
    - Clean, modern barbershop style
    - Natural black hair
    - Sharp, precise fade lines

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Slight side angle to show fade
    - Korean male model in his 20s
    - Clean-cut appearance`,
  },
  {
    id: 'm-mid-fade',
    name: '미드 페이드',
    prompt: `Professional hair salon reference photo of a young Korean male model with mid fade haircut (미드 페이드).

    HAIRSTYLE DETAILS:
    - Fade at temple level
    - Textured or styled top (5-10cm)
    - Versatile, modern style
    - Natural black hair
    - Clean barbershop finish

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Angle showing the mid-level fade
    - Korean male model in his 20s
    - Modern, stylish appearance`,
  },
  {
    id: 'm-high-fade',
    name: '하이 페이드',
    prompt: `Professional hair salon reference photo of a young Korean male model with high fade haircut (하이 페이드).

    HAIRSTYLE DETAILS:
    - Dramatic fade starting high on the head
    - Bold contrast with longer top
    - Urban, trendy street style
    - Natural black hair
    - Sharp, defined fade line

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Side angle to show high fade
    - Korean male model in his 20s
    - Confident, stylish expression`,
  },
];

// 여성 헤어스타일 정의
const femaleHairStyles = [
  // 숏컷 카테고리
  {
    id: 'f-pixie-cut',
    name: '픽시컷',
    prompt: `Professional hair salon reference photo of a young Korean female model with pixie cut (픽시컷).

    HAIRSTYLE DETAILS:
    - Cropped short sides and back
    - Playful texture on top (3-5cm)
    - Cute, elfin style
    - Natural black or dark brown hair
    - Feminine yet bold look

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Front-facing portrait
    - Korean female model in her 20s
    - Confident, bright expression`,
  },
  {
    id: 'f-bob-cut',
    name: '보브컷',
    prompt: `Professional hair salon reference photo of a young Korean female model with bob cut (보브컷).

    HAIRSTYLE DETAILS:
    - Jaw-length blunt cut
    - Clean, straight ends
    - Elegant, minimalist style
    - Natural black or dark brown hair
    - Sleek, sophisticated look

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Front-facing portrait
    - Korean female model in her 20s
    - Elegant expression`,
  },
  {
    id: 'f-hush-cut',
    name: '허쉬컷',
    prompt: `Professional hair salon reference photo of a young Korean female model with hush cut (허쉬컷).

    HAIRSTYLE DETAILS:
    - Heavy face-framing layers
    - Textured, wispy ends
    - Shoulder-length or slightly shorter
    - Trendy, effortless style
    - Natural dark hair with movement

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Front-facing to show layers
    - Korean female model in her 20s
    - Natural, trendy expression`,
  },
  // 중단발 카테고리
  {
    id: 'f-c-curl',
    name: 'C컬펌',
    prompt: `Professional hair salon reference photo of a young Korean female model with C-curl perm (C컬펌).

    HAIRSTYLE DETAILS:
    - Ends curling inward in C-shape
    - Shoulder to collarbone length
    - Sweet, feminine natural look
    - Natural black or brown hair
    - Soft, bouncy finish

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Front-facing showing curl pattern
    - Korean female model in her 20s
    - Sweet, feminine expression`,
  },
  {
    id: 'f-lob-cut',
    name: '롱보브',
    prompt: `Professional hair salon reference photo of a young Korean female model with lob cut (롱보브).

    HAIRSTYLE DETAILS:
    - Shoulder-length long bob
    - Sleek, blunt or slightly layered ends
    - Versatile, sophisticated style
    - Natural black or dark brown hair
    - Can be straight or with slight wave

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Front-facing portrait
    - Korean female model in her 20s-30s
    - Elegant, professional expression`,
  },
  {
    id: 'f-wave-perm',
    name: '물결펌',
    prompt: `Professional hair salon reference photo of a young Korean female model with wave perm (물결펌).

    HAIRSTYLE DETAILS:
    - Natural flowing ocean-like waves
    - Medium length (shoulder to mid-back)
    - Romantic, soft feminine style
    - Natural black or brown hair
    - Loose, effortless waves

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Front-facing showing wave pattern
    - Korean female model in her 20s
    - Soft, romantic expression`,
  },
  // 긴머리 카테고리
  {
    id: 'f-long-straight',
    name: '긴 생머리',
    prompt: `Professional hair salon reference photo of a young Korean female model with long straight hair (긴 생머리).

    HAIRSTYLE DETAILS:
    - Long, sleek straight hair
    - Mid-back length or longer
    - Glossy, healthy shine
    - Natural black hair (goddess hair)
    - Classic, elegant beauty look

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Front-facing portrait
    - Korean female model in her 20s
    - Elegant, refined expression`,
  },
  {
    id: 'f-long-layered',
    name: '롱 레이어드',
    prompt: `Professional hair salon reference photo of a young Korean female model with long layered hair (롱 레이어드).

    HAIRSTYLE DETAILS:
    - Long hair with flowing layers throughout
    - Voluminous, movement-rich style
    - Mid-back length or longer
    - Natural black or brown hair
    - Romantic, elegant look

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Front-facing showing layers
    - Korean female model in her 20s
    - Graceful expression`,
  },
  // 앞머리 카테고리
  {
    id: 'f-see-through-bangs',
    name: '시스루뱅',
    prompt: `Professional hair salon reference photo of a young Korean female model with see-through bangs (시스루뱅).

    HAIRSTYLE DETAILS:
    - Light, wispy bangs showing forehead
    - Airy, cute youthful style
    - Any length back hair (show with medium length)
    - Natural black or brown hair
    - K-pop idol inspired look

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Front-facing close-up on bangs
    - Korean female model in her 20s
    - Cute, youthful expression`,
  },
  {
    id: 'f-full-bangs',
    name: '풀뱅',
    prompt: `Professional hair salon reference photo of a young Korean female model with full bangs (풀뱅).

    HAIRSTYLE DETAILS:
    - Thick bangs covering forehead completely
    - Blunt cut bangs
    - Doll-like, cute style
    - Natural black hair
    - Classic feminine look

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Front-facing portrait
    - Korean female model in her 20s
    - Doll-like cute expression`,
  },
  {
    id: 'f-curtain-bangs',
    name: '커튼뱅',
    prompt: `Professional hair salon reference photo of a young Korean female model with curtain bangs (커튼뱅).

    HAIRSTYLE DETAILS:
    - Center-parted bangs framing face
    - 70s retro inspired style
    - Elegant, feminine look
    - Natural black or brown hair
    - Face-framing, flattering cut

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Front-facing showing the part
    - Korean female model in her 20s
    - Elegant, feminine expression`,
  },
  // 펌 카테고리
  {
    id: 'f-body-perm',
    name: '바디펌',
    prompt: `Professional hair salon reference photo of a young Korean female model with body perm (바디펌).

    HAIRSTYLE DETAILS:
    - Large loose waves adding volume
    - Full-bodied, glamorous style
    - Medium to long length
    - Natural black or brown hair
    - Luxurious, voluminous look

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Front-facing showing volume
    - Korean female model in her 20s-30s
    - Glamorous expression`,
  },
  {
    id: 'f-build-perm',
    name: '빌드펌',
    prompt: `Professional hair salon reference photo of a young Korean female model with build perm (빌드펌).

    HAIRSTYLE DETAILS:
    - Volume starting from roots
    - Bouncy, full-bodied texture
    - Medium length preferred
    - Natural black or brown hair
    - Root lift with overall body

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Front-facing showing root volume
    - Korean female model in her 20s
    - Lively, energetic expression`,
  },
  {
    id: 'f-glam-perm',
    name: '글램펌',
    prompt: `Professional hair salon reference photo of a young Korean female model with glam perm (글램펌).

    HAIRSTYLE DETAILS:
    - Large glamorous curls
    - Sexy, Hollywood-style waves
    - Long hair preferred
    - Natural black or brown hair
    - Luxurious, red-carpet look

    PHOTO REQUIREMENTS:
    - Professional studio lighting
    - Clean white or light gray background
    - Front-facing or slight angle
    - Korean female model in her 20s-30s
    - Glamorous, confident expression`,
  },
];

// 이미지 생성 함수
async function generateImage(style: { id: string; name: string; prompt: string }): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not set');
    return null;
  }

  const fullPrompt = `Generate a professional hair salon reference photograph.

${style.prompt}

CRITICAL REQUIREMENTS:
- Photorealistic, high-quality image
- Korean model only
- Professional hair salon quality
- Clean, simple background
- Focus on the hairstyle
- No text or watermarks`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: { responseModalities: ['image', 'text'] },
      }),
    });

    if (!response.ok) {
      console.error(`API error for ${style.id}:`, await response.text());
      return null;
    }

    const data = await response.json();
    const imagePart = data.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData
    );

    if (imagePart?.inlineData) {
      return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    }

    console.error(`No image generated for ${style.id}`);
    return null;
  } catch (error) {
    console.error(`Error generating ${style.id}:`, error);
    return null;
  }
}

// 이미지를 파일로 저장
async function saveImage(base64Data: string, styleId: string, outputDir: string): Promise<string> {
  const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  const filename = `${styleId}.png`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, buffer);
  console.log(`Saved: ${filepath}`);

  return filename;
}

// 메인 실행 함수
async function main() {
  const outputDir = path.join(__dirname, '../public/hair-references');

  // 출력 디렉토리 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const allStyles = [...maleHairStyles, ...femaleHairStyles];
  const results: Record<string, string> = {};

  console.log(`Generating ${allStyles.length} hair style reference images...`);
  console.log('This may take a while...\n');

  for (let i = 0; i < allStyles.length; i++) {
    const style = allStyles[i];
    console.log(`[${i + 1}/${allStyles.length}] Generating: ${style.name} (${style.id})`);

    const imageData = await generateImage(style);

    if (imageData) {
      const filename = await saveImage(imageData, style.id, outputDir);
      results[style.id] = `/hair-references/${filename}`;
      console.log(`  ✓ Success\n`);
    } else {
      console.log(`  ✗ Failed\n`);
    }

    // API 속도 제한을 위한 딜레이
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 결과를 JSON 파일로 저장
  const resultsPath = path.join(outputDir, 'references.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${resultsPath}`);
  console.log(`Generated ${Object.keys(results).length}/${allStyles.length} images`);
}

main().catch(console.error);

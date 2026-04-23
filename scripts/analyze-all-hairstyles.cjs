/**
 * 모든 헤어스타일 레퍼런스 이미지를 GPT-4o Vision으로 분석하여
 * 상세한 헤어스타일 지침을 생성하고 저장하는 스크립트
 */

const fs = require('fs');
const path = require('path');
// .env 또는 .env.local 파일 로드 시도
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.VITE_OPENAI_API_KEY) {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('VITE_OPENAI_API_KEY not found in .env or .env.local');
  process.exit(1);
}

// 이미지를 base64로 변환
function imageToBase64(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}

// GPT-4o Vision으로 이미지 분석
async function analyzeHairstyleImage(imagePath, styleName) {
  const base64Image = imageToBase64(imagePath);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a professional hair stylist. Analyze this hairstyle reference image "${styleName}" and provide EXACT specifications that another AI can use to recreate this IDENTICAL hairstyle on a different person's photo.

Provide specifications in this exact format (be VERY specific with measurements):

HAIRSTYLE: [Name]
LENGTH: Bangs [X]cm, Top [X]cm, Sides [X]cm, Back [X]cm
TEXTURE: [straight/wavy/curly/S-curl/loose waves/tight curls/etc]
VOLUME: [flat/low/natural/medium/high/very high]
PARTING: [none/center/left/right/deep left/deep right]
TECHNIQUE: [List any: layers, undercut, fade, two-block, perm type, etc]
SHAPE: [Description of overall silhouette and how hair frames the face]
KEY FEATURES: [2-3 most distinctive features that make this style unique]

Be extremely precise. This will be used to generate the exact same hairstyle.`
            },
            {
              type: 'image_url',
              image_url: {
                url: base64Image,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}

// 분석 결과를 프롬프트로 변환
function convertToPrompt(analysis) {
  if (!analysis) return null;

  // 분석 결과를 한 줄의 프롬프트로 압축
  const lines = analysis.split('\n').filter(line => line.trim());
  const specs = {};

  for (const line of lines) {
    if (line.includes('LENGTH:')) specs.length = line.split('LENGTH:')[1]?.trim();
    if (line.includes('TEXTURE:')) specs.texture = line.split('TEXTURE:')[1]?.trim();
    if (line.includes('VOLUME:')) specs.volume = line.split('VOLUME:')[1]?.trim();
    if (line.includes('PARTING:')) specs.parting = line.split('PARTING:')[1]?.trim();
    if (line.includes('TECHNIQUE:')) specs.technique = line.split('TECHNIQUE:')[1]?.trim();
    if (line.includes('SHAPE:')) specs.shape = line.split('SHAPE:')[1]?.trim();
    if (line.includes('KEY FEATURES:')) specs.features = line.split('KEY FEATURES:')[1]?.trim();
  }

  // 컴팩트한 프롬프트 생성
  const parts = [];
  if (specs.length) parts.push(`Length: ${specs.length}`);
  if (specs.texture) parts.push(`Texture: ${specs.texture}`);
  if (specs.volume) parts.push(`Volume: ${specs.volume}`);
  if (specs.parting) parts.push(`Parting: ${specs.parting}`);
  if (specs.technique && specs.technique.toLowerCase() !== 'none') parts.push(`Technique: ${specs.technique}`);
  if (specs.shape) parts.push(`Shape: ${specs.shape}`);
  if (specs.features) parts.push(`Key features: ${specs.features}`);

  return parts.join('. ') || analysis.replace(/\n/g, ' ').substring(0, 500);
}

// 메인 함수
async function main() {
  const publicDir = path.join(__dirname, '..', 'public', 'hairstyles');
  const outputFile = path.join(__dirname, 'hairstyle-analysis.json');

  // 기존 분석 결과 로드 (재시작 시 이어서 진행)
  let results = {};
  if (fs.existsSync(outputFile)) {
    try {
      results = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
      console.log(`Loaded ${Object.keys(results).length} existing analyses`);
    } catch (e) {
      results = {};
    }
  }

  // 모든 이미지 파일 수집
  const genders = ['male', 'female'];
  const allImages = [];

  for (const gender of genders) {
    const genderDir = path.join(publicDir, gender);
    if (!fs.existsSync(genderDir)) continue;

    const files = fs.readdirSync(genderDir);
    for (const file of files) {
      if (file.endsWith('.jpg') || file.endsWith('.png')) {
        const styleName = file.replace(/\.(jpg|png)$/, '');
        const id = `${gender === 'male' ? 'm' : 'f'}-${styleName}`;
        allImages.push({
          id,
          gender,
          styleName,
          path: path.join(genderDir, file),
          thumbnailPath: `/hairstyles/${gender}/${file}`
        });
      }
    }
  }

  console.log(`Found ${allImages.length} hairstyle images to analyze`);

  // 아직 분석되지 않은 이미지만 필터링
  const toAnalyze = allImages.filter(img => !results[img.id]);
  console.log(`${toAnalyze.length} images need analysis`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < toAnalyze.length; i++) {
    const img = toAnalyze[i];
    console.log(`\n[${i + 1}/${toAnalyze.length}] Analyzing: ${img.id}`);

    try {
      const analysis = await analyzeHairstyleImage(img.path, img.styleName);
      const prompt = convertToPrompt(analysis);

      results[img.id] = {
        id: img.id,
        gender: img.gender,
        styleName: img.styleName,
        thumbnail: img.thumbnailPath,
        analysis: analysis,
        prompt: prompt,
        analyzedAt: new Date().toISOString()
      };

      successCount++;
      console.log(`✅ ${img.id}: ${prompt?.substring(0, 100)}...`);

      // 5개마다 저장 (중간에 중단되어도 진행상황 유지)
      if (successCount % 5 === 0) {
        fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
        console.log(`💾 Saved progress (${Object.keys(results).length} total)`);
      }

      // Rate limiting - 0.5초 대기
      await new Promise(r => setTimeout(r, 500));

    } catch (error) {
      errorCount++;
      console.error(`❌ ${img.id}: ${error.message}`);

      // Rate limit 에러시 더 오래 대기
      if (error.message.includes('429')) {
        console.log('Rate limited, waiting 30 seconds...');
        await new Promise(r => setTimeout(r, 30000));
      }
    }
  }

  // 최종 저장
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));

  console.log('\n=== Analysis Complete ===');
  console.log(`Total: ${allImages.length}`);
  console.log(`Analyzed: ${Object.keys(results).length}`);
  console.log(`New: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`\nResults saved to: ${outputFile}`);
}

main().catch(console.error);

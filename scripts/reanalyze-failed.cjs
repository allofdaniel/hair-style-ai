/**
 * 분석 실패한 스타일 재분석 스크립트
 * 다른 프롬프트를 사용하여 재시도
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.VITE_OPENAI_API_KEY) {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('VITE_OPENAI_API_KEY not found in .env or .env.local');
  process.exit(1);
}

// 재분석할 스타일 목록
const failedStyles = [
  { id: 'm-lebanese-chic', path: 'public/hairstyles/male/lebanese-chic.jpg' },
  { id: 'm-punjabi-style', path: 'public/hairstyles/male/punjabi-style.jpg' },
  { id: 'm-sikh-style', path: 'public/hairstyles/male/sikh-style.jpg' },
  { id: 'f-kerala-style', path: 'public/hairstyles/female/kerala-style.jpg' },
];

// 이미지를 base64로 변환
function imageToBase64(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}

// GPT-4o Vision으로 이미지 분석 (간단한 프롬프트)
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
              text: `Describe this person's hairstyle in detail for recreating it. Include:
- Hair length (bangs, top, sides, back in cm)
- Texture (straight, wavy, curly)
- Volume (low, medium, high)
- Parting style
- Any styling techniques used
- Overall shape and how it frames the face

Just describe the hair, nothing else.`
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

async function main() {
  const analysisFile = path.join(__dirname, 'hairstyle-analysis.json');
  let results = {};

  if (fs.existsSync(analysisFile)) {
    results = JSON.parse(fs.readFileSync(analysisFile, 'utf-8'));
  }

  for (const style of failedStyles) {
    const fullPath = path.join(__dirname, '..', style.path);

    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️ File not found: ${style.path}`);
      continue;
    }

    console.log(`\nAnalyzing: ${style.id}`);

    try {
      const analysis = await analyzeHairstyleImage(fullPath, style.id);

      if (analysis && !analysis.includes("I'm sorry") && !analysis.includes("I can't") && !analysis.includes("I'm unable")) {
        results[style.id] = {
          id: style.id,
          gender: style.id.startsWith('m-') ? 'male' : 'female',
          styleName: style.id.replace(/^[mf]-/, ''),
          thumbnail: style.path.replace('public', ''),
          analysis: analysis,
          prompt: analysis.replace(/\n/g, ' ').trim(),
          analyzedAt: new Date().toISOString(),
          reanalyzed: true
        };
        console.log(`✅ ${style.id}: ${analysis.substring(0, 100)}...`);
      } else {
        console.log(`❌ ${style.id}: Still failed - ${analysis?.substring(0, 50)}...`);
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 1000));

    } catch (error) {
      console.error(`❌ ${style.id}: ${error.message}`);
    }
  }

  // 저장
  fs.writeFileSync(analysisFile, JSON.stringify(results, null, 2));
  console.log('\n✅ Results saved to hairstyle-analysis.json');
}

main().catch(console.error);

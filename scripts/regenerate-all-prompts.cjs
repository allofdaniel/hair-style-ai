/**
 * Gemini API를 사용해서 모든 헤어스타일의 프롬프트를 재생성
 * mannequin 관련 내용 없이 순수 헤어스타일 설명만 생성
 */

const fs = require('fs');
const path = require('path');

// Gemini API 설정
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCS13liPmLbbI4sULo0oBNFzPJIqJ_UDQM';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// hairStyles.ts 읽기
const hairStylesPath = path.join(__dirname, '..', 'src', 'data', 'hairStyles.ts');
let hairStylesContent = fs.readFileSync(hairStylesPath, 'utf-8');

// 정규식으로 모든 스타일 객체 찾기
const styleRegex = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*nameKo:\s*'([^']+)',\s*category:\s*'([^']+)',\s*gender:\s*'(male|female)',\s*description:\s*'([^']+)',\s*prompt:\s*'([^']*(?:\\.[^']*)*)',\s*thumbnail:\s*'([^']+)',?\s*\}/gs;

const styles = [];
let match;
while ((match = styleRegex.exec(hairStylesContent)) !== null) {
  styles.push({
    full: match[0],
    id: match[1],
    name: match[2],
    nameKo: match[3],
    category: match[4],
    gender: match[5],
    description: match[6],
    prompt: match[7],
    thumbnail: match[8],
  });
}

console.log(`총 ${styles.length}개의 스타일 발견\n`);

// Gemini API로 프롬프트 생성
async function generatePromptWithGemini(styleName, styleNameKo, gender) {
  const genderKo = gender === 'male' ? '남성' : '여성';

  const systemPrompt = `You are a hairstyle description expert. Generate a detailed English description of a hairstyle that can be used for AI image editing.

IMPORTANT RULES:
1. Do NOT mention mannequins, dolls, or any non-human subjects
2. Focus ONLY on describing the hair: shape, length, texture, layers, styling, and techniques
3. Keep it under 150 words
4. Use professional salon terminology
5. Describe how the hairstyle looks on a real person

Hairstyle: ${styleName} (${styleNameKo})
Gender: ${genderKo}

Generate a clear, detailed description of this ${genderKo} hairstyle focusing on:
- Hair length and layers
- Texture and volume
- Styling technique
- Key visual characteristics

Output ONLY the hairstyle description, nothing else.`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) {
      return text.trim().replace(/'/g, "\\'");
    }

    return null;
  } catch (error) {
    console.error(`Error generating prompt for ${styleName}:`, error.message);
    return null;
  }
}

// 간단한 프롬프트 생성 (API 실패 시 폴백)
function generateSimplePrompt(styleName, styleNameKo, gender) {
  const genderAdj = gender === 'male' ? 'masculine' : 'feminine';

  const baseDescriptions = {
    'perm': 'with soft waves and natural volume created through perming',
    'fade': 'with gradual fade on the sides transitioning smoothly from short to longer on top',
    'bob': 'cut at chin to shoulder length with clean lines and smooth texture',
    'layered': 'with strategically cut layers adding movement and dimension',
    'braids': 'featuring intricate braided patterns with neat, precise sections',
    'curly': 'showcasing natural or styled curls with defined texture',
    'straight': 'with sleek, smooth finish and refined straightness',
    'wave': 'featuring soft, flowing waves with natural movement',
    'short': 'cropped short with clean edges and precise styling',
    'long': 'flowing long hair with healthy shine and volume',
    'undercut': 'with shaved or closely cropped sides contrasting with longer top',
    'twist': 'featuring twisted rope-like strands creating unique texture',
  };

  // Find matching description based on keywords
  const nameLower = styleName.toLowerCase();
  let description = `${genderAdj} ${styleName} hairstyle`;

  for (const [keyword, desc] of Object.entries(baseDescriptions)) {
    if (nameLower.includes(keyword)) {
      description += ` ${desc}`;
      break;
    }
  }

  description += `. Modern Korean ${styleNameKo} styling with natural finish and refined silhouette.`;

  return description;
}

// 메인 실행
async function main() {
  let updatedCount = 0;
  let failedCount = 0;

  // 배치 처리 (API 제한 피하기)
  const batchSize = 5;
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  for (let i = 0; i < styles.length; i += batchSize) {
    const batch = styles.slice(i, Math.min(i + batchSize, styles.length));

    console.log(`\n처리 중: ${i + 1} - ${Math.min(i + batchSize, styles.length)} / ${styles.length}`);

    for (const style of batch) {
      process.stdout.write(`  ${style.nameKo}... `);

      // 이미 좋은 프롬프트가 있는지 확인 (mannequin 없고 충분한 설명)
      if (!style.prompt.toLowerCase().includes('mannequin') &&
          !style.prompt.toLowerCase().includes('bust') &&
          style.prompt.length > 50 &&
          style.prompt.length < 500) {
        console.log('이미 좋은 프롬프트 있음 (스킵)');
        continue;
      }

      // Gemini API로 새 프롬프트 생성
      let newPrompt = await generatePromptWithGemini(style.name, style.nameKo, style.gender);

      // API 실패 시 간단한 프롬프트 생성
      if (!newPrompt) {
        newPrompt = generateSimplePrompt(style.name, style.nameKo, style.gender);
        console.log('(폴백 사용)');
      } else {
        console.log('✅');
      }

      // hairStyles.ts에서 해당 스타일 업데이트
      const newStyleObj = `{
    id: '${style.id}',
    name: '${style.name}',
    nameKo: '${style.nameKo}',
    category: '${style.category}',
    gender: '${style.gender}',
    description: '${style.description}',
    prompt: '${newPrompt}',
    thumbnail: '${style.thumbnail}',
  }`;

      hairStylesContent = hairStylesContent.replace(style.full, newStyleObj);
      updatedCount++;
    }

    // API 레이트 리밋 방지
    if (i + batchSize < styles.length) {
      console.log('  잠시 대기...');
      await delay(2000);
    }
  }

  // 결과 저장
  fs.writeFileSync(hairStylesPath, hairStylesContent, 'utf-8');

  console.log(`\n=== 완료 ===`);
  console.log(`업데이트: ${updatedCount}개`);
  console.log(`실패: ${failedCount}개`);
}

main().catch(console.error);

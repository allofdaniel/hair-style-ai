/**
 * 분석 결과를 hairStyles.ts에 적용하는 스크립트
 * hairstyle-analysis.json에서 분석된 프롬프트를 읽어서
 * hairStyles.ts의 각 스타일의 prompt 필드를 업데이트
 *
 * thumbnail 경로의 파일명으로 매칭하여 적용
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const analysisFile = path.join(__dirname, 'hairstyle-analysis.json');
  const hairStylesFile = path.join(__dirname, '..', 'src', 'data', 'hairStyles.ts');

  // 분석 결과 로드
  if (!fs.existsSync(analysisFile)) {
    console.error('Analysis file not found:', analysisFile);
    console.log('Please run analyze-all-hairstyles.cjs first');
    process.exit(1);
  }

  const analysisData = JSON.parse(fs.readFileSync(analysisFile, 'utf-8'));
  console.log(`Loaded ${Object.keys(analysisData).length} analyzed hairstyles`);

  // 파일명 -> prompt 매핑 생성 (예: "comma-hair" -> prompt)
  const fileNameToPrompt = {};
  const invalidResponses = [];

  for (const [id, analysis] of Object.entries(analysisData)) {
    if (analysis.prompt) {
      // "I'm sorry" 등의 에러 응답 제외
      if (analysis.prompt.includes("I'm sorry") || analysis.prompt.includes("I can't assist") || analysis.prompt.includes("I'm unable")) {
        invalidResponses.push(id);
        continue;
      }
      // ID에서 성별 접두사 제거: "m-comma-hair" -> "comma-hair"
      const fileName = id.replace(/^[mf]-/, '');
      const gender = id.startsWith('m-') ? 'male' : 'female';
      fileNameToPrompt[`${gender}/${fileName}`] = analysis.prompt;
    }
  }

  console.log(`Invalid responses: ${invalidResponses.length}`);
  invalidResponses.forEach(id => console.log(`  ⚠️ ${id}`));
  console.log(`Valid prompts: ${Object.keys(fileNameToPrompt).length}`);

  // hairStyles.ts 파일 읽기
  let hairStylesContent = fs.readFileSync(hairStylesFile, 'utf-8');
  let lines = hairStylesContent.split('\n');

  let updatedCount = 0;
  let addedCount = 0;
  let notFoundCount = 0;
  const notFoundStyles = [];

  // 각 스타일 블록 찾기 (thumbnail로 매칭)
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // thumbnail 라인 찾기
    const thumbnailMatch = line.match(/thumbnail:\s*[`'"].*\/(male|female)\/([^.'"`]+)\.(jpg|png)/);
    if (thumbnailMatch) {
      const gender = thumbnailMatch[1];
      const fileName = thumbnailMatch[2];
      const key = `${gender}/${fileName}`;

      if (fileNameToPrompt[key]) {
        const prompt = fileNameToPrompt[key];
        const escapedPrompt = prompt
          .replace(/\\/g, '\\\\')
          .replace(/'/g, "\\'")
          .replace(/\n/g, ' ')
          .trim();

        // 블록 시작과 끝 찾기
        let blockStart = i;
        let blockEnd = i;

        // 위로 올라가면서 블록 시작 찾기
        for (let j = i; j >= 0; j--) {
          if (lines[j].trim().startsWith('{')) {
            blockStart = j;
            break;
          }
        }

        // 아래로 내려가면서 블록 끝 찾기
        for (let j = i; j < lines.length; j++) {
          if (lines[j].trim() === '},' || lines[j].trim() === '}') {
            blockEnd = j;
            break;
          }
        }

        // 블록 내에서 prompt와 description 라인 찾기
        let promptLineIndex = -1;
        let descriptionLineIndex = -1;

        for (let j = blockStart; j <= blockEnd; j++) {
          if (lines[j].includes('prompt:')) {
            promptLineIndex = j;
          }
          if (lines[j].includes('description:')) {
            descriptionLineIndex = j;
          }
        }

        if (promptLineIndex !== -1) {
          // 기존 prompt 라인 교체
          const indent = lines[promptLineIndex].match(/^(\s*)/)[1];
          lines[promptLineIndex] = `${indent}prompt: '${escapedPrompt}',`;
          updatedCount++;
          console.log(`✅ Updated: ${key}`);
        } else if (descriptionLineIndex !== -1) {
          // prompt 필드가 없으면 description 다음에 추가
          const indent = lines[descriptionLineIndex].match(/^(\s*)/)[1];
          lines.splice(descriptionLineIndex + 1, 0, `${indent}prompt: '${escapedPrompt}',`);
          addedCount++;
          console.log(`✅ Added: ${key}`);
          // 인덱스 조정 (splice로 인해)
          blockEnd++;
          i++; // 추가된 줄만큼 i도 증가
        }

        // 이미 처리한 항목 제거
        delete fileNameToPrompt[key];
      }
    }
    i++;
  }

  // 매칭되지 않은 분석 결과 출력
  const remaining = Object.keys(fileNameToPrompt);
  if (remaining.length > 0) {
    console.log(`\n⚠️ Not matched in hairStyles.ts: ${remaining.length}`);
    remaining.forEach(key => console.log(`  - ${key}`));
  }

  // 파일 저장
  hairStylesContent = lines.join('\n');
  fs.writeFileSync(hairStylesFile, hairStylesContent);

  console.log('\n=== Update Complete ===');
  console.log(`Updated: ${updatedCount} styles`);
  console.log(`Added: ${addedCount} styles`);
  console.log(`Total analyzed: ${Object.keys(analysisData).length}`);
  console.log(`\nFile saved: ${hairStylesFile}`);
}

main().catch(console.error);

/**
 * 주요 헤어스타일에 구체적인 프롬프트 추가
 * AI가 정확하게 생성할 수 있도록 상세 설명 포함
 */

const fs = require('fs');
const path = require('path');

const hairStylesPath = path.join(__dirname, '..', 'src', 'data', 'hairStyles.ts');
let content = fs.readFileSync(hairStylesPath, 'utf-8');

// 주요 스타일별 구체적인 프롬프트 정의
const detailedPrompts = {
  // ===== 남성 인기 스타일 =====
  'm-comma-hair': 'Korean comma hair style with the front bangs curved like a comma (,) shape, falling naturally to one side. Medium length on top (5-7cm), shorter on sides. Hair sweeps across forehead in a soft arc. Clean, natural look popular with K-pop idols.',

  'm-dandy-cut': 'Classic Korean dandy cut with neat side part, short tapered sides (3-4cm), slightly longer on top (5-6cm). Clean and professional look with natural volume. Hair combed back slightly with defined parting. Sophisticated gentleman style.',

  'm-two-block': 'Korean two-block haircut with sharply contrasted lengths - very short buzzed sides and back (2-3mm undercut) with longer hair on top (7-10cm). Top hair can be styled forward, to the side, or textured. Modern and trendy K-style.',

  'm-gail-perm': 'Korean gail perm (가일펌) with soft S-shaped waves throughout the hair. Medium length (6-8cm) with natural volume and movement. Waves are loose and relaxed, not tight curls. Effortlessly stylish look.',

  'm-natural-down': 'Natural down perm with hair falling straight down naturally. Soft texture, medium length (5-7cm on top). Fringe falls across forehead gently. No strong curls or waves, just naturally relaxed straight hair with slight movement.',

  'm-parted-perm': 'Center or side parted hairstyle with soft perm waves. Hair parts in the middle or to one side with gentle waves on each side. Medium length (6-8cm), natural volume. Popular Korean actor hairstyle.',

  'm-s-curl-perm': 'S-curl perm with defined S-shaped wave pattern throughout the hair. Medium to long length (7-10cm) with pronounced curved waves. More defined waves than gail perm. Fashionable and dynamic look.',

  'm-down-perm': 'Down perm that makes hair fall naturally downward instead of sticking up. Medium length (5-7cm), relaxed and natural texture. Hair lies flat and smooth against the head. Low maintenance style.',

  'm-shadow-perm': 'Korean shadow perm with subtle root lift and soft waves. Creates depth and dimension with waves starting mid-shaft. Medium length, natural volume at roots. Sophisticated and textured look.',

  'm-texture-perm': 'Texture perm with choppy, layered waves for movement. Medium length (6-8cm) with varied wave patterns for a messy, effortless look. Modern and youthful style.',

  'm-undercut': 'Classic undercut with very short or shaved sides (0-3mm) with longer top (7-12cm). Top can be slicked back, combed over, or worn loose. Strong contrast between top and sides. Edgy and modern.',

  'm-pompadour': 'Classic pompadour with hair swept upward and back from forehead. Volume at the front, tapered sides. Slick, retro-inspired look with height at the crown. Styled with pomade for shine and hold.',

  'm-quiff': 'Modern quiff hairstyle with volume and height at the front, shorter on sides. Front section styled upward and slightly back. Textured and contemporary look with movement.',

  'm-slick-back': 'Slicked back hairstyle with all hair combed backward from the forehead. Medium length, neat and polished look. Styled with gel or pomade for a sleek, sophisticated appearance.',

  'm-curtain-hair': 'Curtain hair parted in the middle with hair falling on both sides like curtains. Medium to long length (8-12cm), face-framing layers. Popular K-drama actor style.',

  'm-wolf-cut': 'Korean wolf cut with choppy layers, mullet-like shape with shorter layers on top and longer at the back. Shaggy texture with face-framing pieces. Trendy and edgy look.',

  'm-buzz-cut': 'Very short buzz cut with uniform length all around (3-6mm). Clean, minimalist military-inspired style. Low maintenance and classic.',

  'm-crew-cut': 'Classic crew cut with slightly longer top gradually fading to shorter sides. Short and neat, typically 1-2cm on top. Clean-cut professional look.',

  'm-ivy-league-cut': 'Ivy league cut similar to crew cut but slightly longer on top (2-3cm) allowing for side parting. Preppy, collegiate style. Clean and sophisticated.',

  'm-french-crop': 'French crop with short fringe covering the forehead, tapered or faded sides. Textured top with cropped bangs. Modern European style.',

  // ===== 여성 인기 스타일 =====
  'f-layered-cut': 'Korean layered cut with face-framing layers and volume. Medium to long length with graduated layers starting at chin level. Creates movement and dimension. Versatile and feminine.',

  'f-see-through-bang': 'See-through bangs (시스루뱅) - thin, wispy bangs that show the forehead through the strands. Soft, airy fringe with individual strands visible. Very popular in Korean beauty.',

  'f-c-curl-perm': 'C-curl perm with ends curled inward in a C-shape. Creates a polished, bouncy look. Medium to long hair with curled ends framing the face. Elegant and youthful.',

  'f-hush-cut': 'Korean hush cut with soft, feathered layers and curtain bangs. Long length with graduated layers for movement. Face-framing and effortlessly chic.',

  'f-tassel-cut': 'Tassel cut (태슬컷) with blunt ends at shoulder or mid-length. Thick, heavy ends with slight inward curve. Clean lines with healthy appearance. Modern and stylish.',

  'f-bob-cut': 'Classic bob cut at chin to shoulder length. Blunt or slightly layered ends. Clean lines, can be worn straight or with slight waves. Timeless and elegant.',

  'f-pixie-cut': 'Short pixie cut with cropped sides and back, slightly longer on top. Feminine and edgy. Can be styled sleek or textured.',

  'f-wolf-cut': 'Korean wolf cut with heavy layers, shorter on top with longer ends. Shaggy, textured look with lots of movement. Face-framing layers and volume at crown.',

  'f-long-layered': 'Long layered hair with graduated layers throughout. Adds movement and dimension to long hair. Face-framing pieces with blended layers.',

  'f-hippie-perm': 'Hippie perm with loose, bohemian waves throughout. Long length with natural, beachy texture. Effortless and romantic style.',

  'f-wave-perm': 'Wave perm with defined S-shaped waves. Medium to long length with consistent wave pattern. Adds volume and movement. Glamorous and polished.',

  'f-body-perm': 'Body perm adding volume and loose waves to limp hair. Natural-looking body and movement. Subtle curves rather than tight curls.',

  'f-digital-perm': 'Digital perm with defined, bouncy curls or waves. Long-lasting curl pattern with natural movement. Popular Korean salon treatment.',

  'f-half-up': 'Half-up hairstyle with top section pulled back while bottom remains down. Can include ponytail, bun, or twist at crown. Feminine and versatile.',

  'f-high-ponytail': 'High ponytail gathered at crown of head. Sleek or textured, creates lifted, youthful look. Face-framing pieces optional.',

  'f-curtain-bang': 'Curtain bangs parted in middle, framing the face on both sides. Longer than regular bangs, blend into layers. Soft and romantic.',

  'f-full-bang': 'Full bangs covering forehead completely. Thick, blunt fringe at brow level. Classic and dramatic look.',

  'f-french-bob': 'French bob at chin length with slight bend at ends. Chic and sophisticated Parisian style. Clean lines with subtle movement.',

  'f-shaggy-cut': 'Shaggy haircut with lots of choppy layers. Textured and messy-chic look. Face-framing layers with volume throughout.',

  'f-goddess-wave': 'Goddess waves with glamorous, old Hollywood-style waves. Long hair with deep, defined S-curves. Elegant and red-carpet worthy.',
};

// 정규식으로 스타일 객체 찾아서 교체
let updatedCount = 0;

for (const [styleId, newPrompt] of Object.entries(detailedPrompts)) {
  // 해당 스타일 찾기
  const regex = new RegExp(
    `(\\{\\s*id:\\s*'${styleId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}',\\s*name:\\s*'[^']+',\\s*nameKo:\\s*'[^']+',\\s*category:\\s*'[^']+',\\s*gender:\\s*'[^']+',\\s*description:\\s*'[^']+',\\s*prompt:\\s*')([^']*)('.*?thumbnail:\\s*'[^']+',?\\s*\\})`,
    'gs'
  );

  const match = regex.exec(content);
  if (match) {
    const escapedPrompt = newPrompt.replace(/'/g, "\\'");
    const newContent = content.replace(regex, `$1${escapedPrompt}$3`);
    if (newContent !== content) {
      content = newContent;
      updatedCount++;
      console.log(`✅ ${styleId}: 프롬프트 업데이트됨`);
    }
  } else {
    console.log(`⚠️ ${styleId}: 찾을 수 없음`);
  }
}

// 파일 저장
fs.writeFileSync(hairStylesPath, content, 'utf-8');

console.log(`\n=== 완료 ===`);
console.log(`업데이트: ${updatedCount}개`);
console.log(`\n상세 프롬프트가 적용되어 AI가 정확한 헤어스타일을 생성할 수 있습니다.`);

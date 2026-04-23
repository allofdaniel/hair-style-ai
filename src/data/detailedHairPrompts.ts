/**
 * Detailed Hair Style Prompts for Image Editing
 *
 * These prompts are extracted and cleaned from the reference image generation prompts.
 * They contain ONLY the hair description without mannequin/background references.
 * Used for AI image editing to ensure consistent and accurate hairstyle results.
 */

export interface DetailedHairPrompt {
  styleId: string;
  description: string;
  keywords: string[];
}

// Detailed prompts mapped by style ID for male hairstyles
export const maleDetailedPrompts: Record<string, DetailedHairPrompt> = {
  'm-360-웨이브': {
    styleId: 'm-360-웨이브',
    description: '360 waves hairstyle with deep, perfectly defined concentric rippled textures emanating from the crown. The hair is cut very short with a subtle healthy sheen indicating pomade use. The sides feature a smooth taper fade that blends into the skin. The hairline and temples are sharply defined with a crisp, surgical line-up. Sleek, structured, and premium finish.',
    keywords: ['360 waves', 'concentric ripples', 'taper fade', 'pomade sheen', 'surgical line-up'],
  },
  'm-jpop-visual': {
    styleId: 'm-jpop-visual',
    description: 'J-pop Visual Shaggy Wolf Cut hairstyle with heavy sharp layers, voluminous crown, long feathered nape, and highly textured piecey ends. Dramatic, edgy styling with movement and separation between strands.',
    keywords: ['wolf cut', 'shaggy layers', 'voluminous crown', 'feathered nape', 'textured ends'],
  },
  'm-kpop-쉼표머리': {
    styleId: 'm-kpop-쉼표머리',
    description: 'K-pop Comma Hair (쉼표머리) with a structured C-curved fringe on one side, voluminous roots at the crown, and a polished matte wax texture. The signature comma-shaped bang curves elegantly across the forehead.',
    keywords: ['comma hair', 'C-curved fringe', 'voluminous roots', 'matte wax texture'],
  },
  'm-가르마펌': {
    styleId: 'm-가르마펌',
    description: 'Curtain Hair (가르마펌/Gareuma Perm) featuring a center or side part where long, textured bangs curve outwards and downwards like curtains, framing the forehead and cheeks. Soft, natural-looking S-curl waves and volume, sculpted with a matte wax finish. The sides are neatly tucked, showing a subtle undercut beneath the flowing top hair.',
    keywords: ['curtain bangs', 'center part', 'S-curl waves', 'matte wax', 'flowing volume'],
  },
  'm-댄디컷': {
    styleId: 'm-댄디컷',
    description: 'Modern Korean Dandy Cut with clean, textured top hair swept to the side, neatly tapered sides, and a professional polished appearance. Natural volume with controlled styling, matte finish for an elegant gentleman look.',
    keywords: ['dandy cut', 'textured top', 'tapered sides', 'professional', 'matte finish'],
  },
  'm-투블럭': {
    styleId: 'm-투블럭',
    description: 'Korean Two Block Cut with the sides and back shaved or faded short while keeping the top significantly longer. Clean disconnection between the top and sides. The top can be styled with volume, textured, or swept to the side.',
    keywords: ['two block', 'disconnected', 'shaved sides', 'longer top', 'clean lines'],
  },
  'm-가일펌': {
    styleId: 'm-가일펌',
    description: 'Gail Perm (가일펌) featuring soft, natural waves with volume at the crown and sides. Medium-length hair with gentle curves that add movement and texture. Natural-looking perm with soft hold, not stiff or crunchy.',
    keywords: ['gail perm', 'soft waves', 'natural volume', 'gentle curves', 'medium length'],
  },
  'm-리젠트펌': {
    styleId: 'm-리젠트펌',
    description: 'Korean Regent Perm with the front hair swept back and upward in a pompadour style. Significant volume at the front crown, gradually tapering towards the back. Sleek, structured appearance with high-shine or matte wax finish.',
    keywords: ['regent perm', 'pompadour', 'swept back', 'front volume', 'structured'],
  },
  'm-애즈펌': {
    styleId: 'm-애즈펌',
    description: 'Ash Perm (애즈펌) with soft, loose waves and natural-looking texture. Medium volume with effortless, tousled styling. The waves are relaxed and not tightly curled, giving a casual yet stylish appearance.',
    keywords: ['ash perm', 'loose waves', 'tousled', 'natural texture', 'casual style'],
  },
  'm-텍스처-펌': {
    styleId: 'm-텍스처-펌',
    description: 'Texture Perm with choppy, defined layers creating movement and dimension. The hair has visible texture separation with a matte clay or wax finish. Modern, edgy look with controlled messiness.',
    keywords: ['texture perm', 'choppy layers', 'defined separation', 'matte clay', 'edgy'],
  },
  'm-세팅-펌': {
    styleId: 'm-세팅-펌',
    description: 'Setting Perm (세팅펌) with perfectly placed waves that fall naturally into position. Clean, refined curls with lasting hold. Professional, polished appearance suitable for office or formal settings.',
    keywords: ['setting perm', 'placed waves', 'refined curls', 'lasting hold', 'polished'],
  },
  'm-퀴프': {
    styleId: 'm-퀴프',
    description: 'Modern Korean Quiff with significant volume at the front swept upwards and slightly back, with a textured matte wax finish. The sides are neatly tapered down. Clean, structured silhouette with defined hair strands.',
    keywords: ['quiff', 'front volume', 'upward sweep', 'tapered sides', 'textured finish'],
  },
  'm-슬릭백': {
    styleId: 'm-슬릭백',
    description: 'Classic Korean Slick Back Undercut with long hair on top swept back smoothly and neatly with a high-shine pomade finish, showing precise comb lines and a sleek, polished texture against the scalp. The sides and back are faded high and clean, emphasizing the sharp contrast.',
    keywords: ['slick back', 'undercut', 'pomade shine', 'comb lines', 'high fade'],
  },
  'm-사이드-스웹': {
    styleId: 'm-사이드-스웹',
    description: 'Korean Side Swept hairstyle featuring a deep side part. Long, textured bangs swept voluminously across the forehead to one side, partially covering the brow. Natural matte wax finish with defined flow and movement, not stiff. Sides neatly tapered, not shaved high.',
    keywords: ['side swept', 'deep part', 'textured bangs', 'matte wax', 'natural flow'],
  },
  'm-텍스처드-크롭': {
    styleId: 'm-텍스처드-크롭',
    description: 'Modern Korean Textured Crop with short, choppy layers on top that are heavily textured and tousled with a matte clay product, creating a rugged, spiky appearance. Short textured fringe. Sides and back with a sharp, high skin fade.',
    keywords: ['textured crop', 'choppy layers', 'matte clay', 'spiky', 'skin fade'],
  },
  'm-멀렛': {
    styleId: 'm-멀렛',
    description: 'Modern Korean Mullet with the top and front shorter and heavily textured with choppy layers and a matte wax finish, while the back hair is significantly longer, reaching the nape of the neck with natural flow and volume. Sides faded neatly, connecting the shorter top to the longer back.',
    keywords: ['mullet', 'textured top', 'long back', 'contrast length', 'faded sides'],
  },
  'm-유러피안-페이드': {
    styleId: 'm-유러피안-페이드',
    description: 'Sharp European Fade hairstyle with the sides and back faded very high and clean, showing a smooth transition from skin to short hair. Top hair kept longer, textured, and styled upwards and slightly back into a modern quiff with a matte wax finish.',
    keywords: ['european fade', 'high fade', 'clean transition', 'quiff top', 'matte finish'],
  },
  'm-메시-헤어': {
    styleId: 'm-메시-헤어',
    description: 'Messy, medium-length Korean hairstyle featuring tousled, layered strands with a matte finish, falling casually over the forehead and ears. Relaxed and textured look with loose waves and disheveled volume.',
    keywords: ['messy hair', 'tousled', 'layered strands', 'matte finish', 'relaxed'],
  },
  'm-포마드': {
    styleId: 'm-포마드',
    description: 'Korean Pompadour hairstyle with a high, structured volume of hair swept back and upwards from the forehead. Sides cleanly faded low, emphasizing the dramatic height and sleek flow of the top. Matte or glossy wax finish showing defined strands and a sharp silhouette.',
    keywords: ['pompadour', 'high volume', 'swept back', 'low fade', 'sharp silhouette'],
  },
  'm-사무라이번': {
    styleId: 'm-사무라이번',
    description: 'Traditional Samurai Bun (Sangtu/상투) with all hair tightly slicked back and gathered into a structured topknot on the crown, fixed with a matte wax texture. Clean and defined hairline. Masculine and dignified appearance.',
    keywords: ['samurai bun', 'topknot', 'slicked back', 'structured', 'traditional'],
  },
  'm-타이완-웨이브': {
    styleId: 'm-타이완-웨이브',
    description: 'Taiwan Wave (Soft Wavy Perm) with natural S-curved waves, airy volume at the crown, and a soft, textured fringe that slightly reveals the forehead. Smooth and natural texture with effortless styling.',
    keywords: ['taiwan wave', 'S-curved waves', 'airy volume', 'soft fringe', 'natural'],
  },
  'm-프렌치-크롭': {
    styleId: 'm-프렌치-크롭',
    description: 'French Crop Curly hairstyle with short faded sides and a voluminous curly top swept forward towards the forehead. Matte wax texture with defined curls creating movement and dimension.',
    keywords: ['french crop', 'curly top', 'faded sides', 'forward sweep', 'matte texture'],
  },
  'm-라틴-페이드': {
    styleId: 'm-라틴-페이드',
    description: 'Latino Fade adapted for Korean male hair. Sides and nape shaved down to skin using zero-gap clipper technique, blending seamlessly into longer hair towards the crown. Coarse side hair pressed flat with strong down perm effect. Short top (approx. 4cm), heavily textured with point cutting for a matte, choppy, upward-styled crop with defined separation. Sharp, clean front hairline.',
    keywords: ['latino fade', 'zero-gap', 'textured top', 'sharp hairline', 'skin fade'],
  },
  'm-브라질리안-서퍼': {
    styleId: 'm-브라질리안-서퍼',
    description: 'Messy, textured Brazilian surfer look adapted for Korean male hair. Long layers with significant texturizing to remove weight. Strong twist perm with large, irregular rods creating loose, random waves starting near the roots for volume. Matte and rough texture like hair dried with salt spray, with individual strands clumped together and frizz at the ends. Wild and sun-drenched appearance.',
    keywords: ['surfer hair', 'loose waves', 'salt spray texture', 'wild', 'textured layers'],
  },
  'm-멕시칸-포마드': {
    styleId: 'm-멕시칸-포마드',
    description: 'Classic Mexican-inspired pomade look with a high skin fade on the sides, transitioning into a razor-sharp hard part line. Top hair styled with a high-shine wet-look finish, creating a tall and voluminous quiff at the front. Perfectly groomed and slicked back using a fine-tooth comb, showing clear comb marks and a sleek, polished texture.',
    keywords: ['mexican pomade', 'hard part', 'wet look', 'high quiff', 'comb marks'],
  },
  'm-콜롬비안-컬': {
    styleId: 'm-콜롬비안-컬',
    description: 'Modern Colombian-inspired hybrid cut for Korean hair. Sharp, precision low taper fade on sides and nape blending into skin around the ears. Voluminous and textured top with defined, bouncy curls and waves created by shadow perm and pin curl technique, mixing C-curls and S-curls. Hair styled forward with movement, showing separation and a slightly glossy finish from curl cream. Clean, defined hairline.',
    keywords: ['colombian curl', 'low taper fade', 'bouncy curls', 'shadow perm', 'glossy finish'],
  },
  'm-레게톤-트위스트': {
    styleId: 'm-레게톤-트위스트',
    description: 'Modern Korean male reggaeton look with a high skin fade on sides and back with sharp razor lines etched into the temple area. Short, tightly textured top with sponge twist technique for defined, coiled sections, styled upward and forward. Distinct, clean-cut geometric pattern shaved into the fade on the left side. Precise and sharp hairline.',
    keywords: ['reggaeton', 'skin fade', 'razor lines', 'sponge twist', 'geometric pattern'],
  },
  'm-호스트-클럽': {
    styleId: 'm-호스트-클럽',
    description: 'Extravagant Host Club Style with extreme teased volume, sharp feathered layers, and outward-curving wing-like bangs. Stiff and high-shine texture as if fixed with heavy hairspray. Dramatic, glamorous appearance.',
    keywords: ['host club', 'teased volume', 'feathered layers', 'wing bangs', 'high shine'],
  },
  'm-중국-사이드파트': {
    styleId: 'm-중국-사이드파트',
    description: 'Chinese Classic Side-part with a clean defined parting, slicked-back structured volume, and a polished pomade texture. Dignified and traditional masculine aesthetic with refined elegance.',
    keywords: ['chinese side part', 'defined parting', 'slicked back', 'pomade texture', 'dignified'],
  },
  'm-애니메-스파이크': {
    styleId: 'm-애니메-스파이크',
    description: 'Highly stylized, exaggerated Anime Spike hairstyle with large, sharply defined, geometric spikes jutting out from the head. Solid matte wax texture that looks sculptural. Bold, dramatic, fantasy-inspired look.',
    keywords: ['anime spike', 'geometric spikes', 'sculptural', 'matte wax', 'dramatic'],
  },
  'm-볼리우드-클래식': {
    styleId: 'm-볼리우드-클래식',
    description: 'Bollywood Classic with extra-thick volume, a swept-back pompadour with deep, strong waves, and well-defined sideburns. Highly glossy and polished texture resembling a vintage cinema star.',
    keywords: ['bollywood', 'thick volume', 'pompadour', 'strong waves', 'glossy polish'],
  },
  'm-인도-페이드': {
    styleId: 'm-인도-페이드',
    description: 'Modern Indian Fade with a high skin fade on the sides and back, a textured and voluminous top, and a precise, sharp line-up at the forehead and temples. Clean matte texture.',
    keywords: ['indian fade', 'high skin fade', 'voluminous top', 'sharp line-up', 'matte'],
  },
  'm-타밀-웨이브': {
    styleId: 'm-타밀-웨이브',
    description: 'Tamil Wave with thick, naturally wavy hair featuring deep S-curls, a soft side part, and a healthy polished shine. Voluminous and neatly styled to reflect a classic South Indian aesthetic.',
    keywords: ['tamil wave', 'S-curls', 'soft part', 'polished shine', 'voluminous'],
  },
  'm-테이퍼-아프로': {
    styleId: 'm-테이퍼-아프로',
    description: 'Korean-style Taper Afro with a densely coiled, rounded afro shape on the crown and top, created with tight sponge twists and a texturizing perm for defined, springy curl structure. Sides and back feature a clean, gradual taper fade transitioning smoothly from the voluminous top down to a very short, faded length at the hairline. Natural matte finish.',
    keywords: ['taper afro', 'coiled curls', 'sponge twists', 'taper fade', 'matte finish'],
  },
  'm-컬리-탑-페이드': {
    styleId: 'm-컬리-탑-페이드',
    description: 'Korean-style Curly Top Fade with a dense, voluminous mass of tight, springy curls with defined separation on crown and top, achieved through a texturizing perm and styling with curl cream and a diffuser. Sides and back are a sharp skin fade, blending seamlessly from bare skin at the ears and nape up into the curly top. Crisply lined up hairline and temple edges. Natural matte finish.',
    keywords: ['curly top fade', 'tight curls', 'skin fade', 'defined separation', 'crisp line-up'],
  },
  'm-하이탑-페이드': {
    styleId: 'm-하이탑-페이드',
    description: 'Korean-style High-top Fade with significant vertical height and a structured, flat-top silhouette with dense texture on top. Sides and back treated with a high skin fade, starting near the upper temple area for a sharp, dramatic contrast. Hairline and edges perfectly squared and lined up with surgical precision. Clean, dense, and matte finish.',
    keywords: ['high-top fade', 'flat-top', 'vertical height', 'skin fade', 'squared edges'],
  },
  'm-템플-페이드': {
    styleId: 'm-템플-페이드',
    description: 'Korean-style Temple Fade with hair around the temples and sideburns shaved down to skin with a precise fade, transitioning smoothly into slightly longer length on the sides and back. Top styled with medium-length, textured hair and subtle volume, showing a natural, slightly curled flow with soft down perm effect. Clean, natural hairline. Matte finish.',
    keywords: ['temple fade', 'precise fade', 'textured top', 'soft curl', 'natural hairline'],
  },
};

// Detailed prompts mapped by style ID for female hairstyles
export const femaleDetailedPrompts: Record<string, DetailedHairPrompt> = {
  'f-비치-웨이브': {
    styleId: 'f-비치-웨이브',
    description: 'Loose, natural-looking Beach Waves with a tousled, matte texture. Soft S-shaped waves cascade down past the shoulders, looking relaxed and windswept. Effortless, summer-inspired volume.',
    keywords: ['beach waves', 'tousled', 'S-shaped', 'windswept', 'natural'],
  },
  'f-할리우드-웨이브': {
    styleId: 'f-할리우드-웨이브',
    description: 'Classic Hollywood Curls with long hair and a deep side part. Highly structured, uniform waves polished with a high-shine glossy finish, creating a sleek S-pattern that cascades elegantly over the shoulder. Significant volume at the roots, especially around the forehead. Glamorous vintage styling.',
    keywords: ['hollywood curls', 'deep side part', 'glossy finish', 'S-pattern', 'glamorous'],
  },
  'f-슬릭-스트레이트': {
    styleId: 'f-슬릭-스트레이트',
    description: 'Modern Korean Sleek Straight hairstyle with perfectly pin-straight hair falling smoothly and heavily without any frizz or volume. Sharp, clean middle part and a high-shine, liquid-like glossy finish that reflects light. Sharp, clean, polished silhouette.',
    keywords: ['sleek straight', 'pin-straight', 'middle part', 'glossy finish', 'polished'],
  },
  'f-프렌치-보브': {
    styleId: 'f-프렌치-보브',
    description: 'Modern Korean French Bob with a chin-length blunt cut and a textured, slightly messy finish. Full, wispy brow-length bangs framing the face. Natural matte texture with subtle volume and airy movement at the ends, avoiding a stiff look. Chic and effortless.',
    keywords: ['french bob', 'chin-length', 'blunt cut', 'wispy bangs', 'airy movement'],
  },
  'f-플래티넘-보브': {
    styleId: 'f-플래티넘-보브',
    description: 'Sleek, blunt-cut Platinum Bob with smooth silky texture and natural flow, ending at chin length. Clean lines and polished appearance.',
    keywords: ['platinum bob', 'blunt cut', 'silky texture', 'chin length', 'clean lines'],
  },
  'f-로맨틱-업두': {
    styleId: 'f-로맨틱-업두',
    description: 'Romantic Updo with a loose low bun, elegant volume at the crown, and soft face-framing wispy strands. Natural silky texture with professional hair styling. Graceful and feminine.',
    keywords: ['romantic updo', 'low bun', 'crown volume', 'wispy strands', 'elegant'],
  },
  'f-블런트-컷': {
    styleId: 'f-블런트-컷',
    description: 'Sharp, straight Blunt Cut with uniform length without layers, clean horizontal edge at the ends, and sleek polished texture. Precise, geometric silhouette.',
    keywords: ['blunt cut', 'uniform length', 'no layers', 'horizontal edge', 'geometric'],
  },
  'f-kpop-레이어드': {
    styleId: 'f-kpop-레이어드',
    description: 'Glamorous K-pop Idol Long Layered Cut with high-volume roots, airy face-framing side bangs, and large elastic C-curls at the ends. Smooth silky texture with a subtle healthy glow. Voluminous and bouncy.',
    keywords: ['kpop layered', 'face-framing bangs', 'C-curls', 'silky texture', 'voluminous'],
  },
  'f-히메컷': {
    styleId: 'f-히메컷',
    description: 'Sharp, sleek Japanese Hime Cut with distinct, blunt-cut cheek-length blocks of hair framing the face, contrasting with long, straight hair flowing down past the shoulders. Smooth and silky texture. Traditional yet modern.',
    keywords: ['hime cut', 'cheek-length blocks', 'face-framing', 'straight back', 'silky'],
  },
  'f-중국-고전': {
    styleId: 'f-중국-고전',
    description: 'Elaborate Chinese Ancient hairstyle with hair pulled into a large, complex, looped bun at the crown, interwoven with braids and adorned with traditional hairpins, combs, and silk flowers. Remaining hair falls in controlled loops and twists around the base. Smooth, glossy, and intricately styled.',
    keywords: ['chinese ancient', 'looped bun', 'hairpins', 'silk flowers', 'intricate'],
  },
  'f-갸루': {
    styleId: 'f-갸루',
    description: 'Exaggerated Korean Gyaru Style hairstyle with hair extremely voluminous at the crown, teased and sprayed into a high, structured beehive bun adorned with a large black bow and decorative hair clips and chains. Lower half falls in long, glamorous, loose waves around the shoulders. Heavily styled and stiff at the top, transitioning to smooth, styled curls below.',
    keywords: ['gyaru', 'beehive bun', 'teased volume', 'black bow', 'glamorous waves'],
  },
  'f-울짱': {
    styleId: 'f-울짱',
    description: 'Classic Korean Ulzzang Style hairstyle with soft see-through bangs and long, voluminous goddess waves flowing elegantly over the shoulders. Side hair styled to frame the face perfectly. Exceptionally smooth, shiny, and healthy-looking texture.',
    keywords: ['ulzzang', 'see-through bangs', 'goddess waves', 'face-framing', 'shiny'],
  },
  'f-애니메-트윈테일': {
    styleId: 'f-애니메-트윈테일',
    description: 'Highly stylized Anime Twintails with high-positioned pigtails on both sides featuring voluminous, structured hair bundles. Thick straight-cut fringe (bangs) and face-framing side pieces. Smooth and glossy texture with a clean, sharp silhouette.',
    keywords: ['anime twintails', 'high pigtails', 'thick bangs', 'face-framing', 'glossy'],
  },
  'f-볼리우드-글램': {
    styleId: 'f-볼리우드-글램',
    description: 'Bollywood Glam with extreme volume at the roots and thick, bouncy, large-scale curls flowing over the shoulders. Extraordinary healthy shine and luxurious texture. Glamorous and dramatic.',
    keywords: ['bollywood glam', 'extreme volume', 'bouncy curls', 'healthy shine', 'luxurious'],
  },
  'f-인디안-브레이드': {
    styleId: 'f-인디안-브레이드',
    description: 'Traditional Indian Braid with a sleek center part and a long, thick, single braid pulled over the left shoulder. Braid adorned with traditional gold jewelry (Maang Tikka on the forehead, braid ornament down the length) and a cluster of white jasmine flowers at the nape. Neat, smooth, and glossy texture.',
    keywords: ['indian braid', 'center part', 'gold jewelry', 'jasmine flowers', 'glossy'],
  },
  'f-마를리-트위스트': {
    styleId: 'f-마를리-트위스트',
    description: 'Marley Twists with distinctly kinky, coarse, and matte texture. Thick and voluminous twists that are larger than Senegalese twists, showing an organic, natural hair-like fiber. Dense, rope-like twists cascade over the shoulders.',
    keywords: ['marley twists', 'kinky texture', 'coarse matte', 'voluminous', 'rope-like'],
  },
  'f-노트리스-브레이드': {
    styleId: 'f-노트리스-브레이드',
    description: 'Long, medium-sized Knotless Braids starting flat at the scalp without visible knots, seamlessly feeding in hair for a natural transition. Clean and precise parting revealing the scalp. Smooth, uniform braids flowing neatly over the shoulders.',
    keywords: ['knotless braids', 'flat scalp', 'seamless', 'clean parting', 'uniform'],
  },
  // 기존 인기 스타일 추가
  'f-레이어드컷': {
    styleId: 'f-레이어드컷',
    description: 'Korean Layered Cut with soft, flowing layers that add movement and dimension. Face-framing pieces and graduated lengths create a flattering, versatile look. Natural volume and bounce.',
    keywords: ['layered cut', 'flowing layers', 'face-framing', 'volume', 'bounce'],
  },
  'f-시스루뱅': {
    styleId: 'f-시스루뱅',
    description: 'Delicate See-through Bangs (시스루뱅) with thin, wispy strands that softly cover the forehead while still showing skin beneath. Light, airy texture that frames the face beautifully. Natural and effortless look.',
    keywords: ['see-through bangs', 'wispy', 'thin strands', 'airy', 'face-framing'],
  },
  'f-c컬펌': {
    styleId: 'f-c컬펌',
    description: 'C-Curl Perm with elegant inward-curving ends that create a polished, feminine silhouette. Hair ends curl gently toward the face or inward, adding softness and movement. Bouncy, healthy-looking finish.',
    keywords: ['C-curl perm', 'inward curls', 'feminine', 'bouncy ends', 'polished'],
  },
  'f-허쉬컷': {
    styleId: 'f-허쉬컷',
    description: 'Modern Hush Cut with layered framing around the face, soft curtain-style bangs, and textured ends. Wolf cut-inspired but softer and more wearable. Volume at the crown with tapered, flowy ends.',
    keywords: ['hush cut', 'layered framing', 'curtain bangs', 'textured ends', 'soft wolf'],
  },
  'f-태슬컷': {
    styleId: 'f-태슬컷',
    description: 'Tassel Cut with a distinctive tapered, fringed end that resembles a tassel. Graduated layers create movement while maintaining a clean silhouette. Effortlessly chic and modern.',
    keywords: ['tassel cut', 'tapered ends', 'fringed', 'graduated layers', 'chic'],
  },
  'f-히피펌': {
    styleId: 'f-히피펌',
    description: 'Hippie Perm with natural, relaxed waves and curls reminiscent of 70s bohemian style. Loose, flowing texture with volume throughout. Effortless, free-spirited appearance.',
    keywords: ['hippie perm', 'relaxed waves', 'bohemian', 'loose curls', 'free-spirited'],
  },
  'f-물결펌': {
    styleId: 'f-물결펌',
    description: 'Wave Perm (물결펌) with soft, natural S-wave pattern throughout the hair. Gentle, flowing waves that add movement and dimension without tight curls. Feminine and elegant.',
    keywords: ['wave perm', 'S-wave', 'soft waves', 'flowing', 'feminine'],
  },
  'f-보브컷': {
    styleId: 'f-보브컷',
    description: 'Classic Bob Cut with clean lines and a structured silhouette. Hair cut to chin or shoulder length with even, blunt ends. Versatile style that can be worn straight, wavy, or with added texture.',
    keywords: ['bob cut', 'clean lines', 'structured', 'blunt ends', 'versatile'],
  },
  'f-커튼뱅': {
    styleId: 'f-커튼뱅',
    description: 'Elegant Curtain Bangs that part in the middle and sweep to the sides, framing the face like curtains. Soft, face-flattering layers that blend seamlessly into the rest of the hair. Chic and versatile.',
    keywords: ['curtain bangs', 'center part', 'face-framing', 'soft layers', 'chic'],
  },
  'f-여신웨이브': {
    styleId: 'f-여신웨이브',
    description: 'Goddess Wave (여신웨이브) with large, flowing waves that cascade elegantly. Voluminous, bouncy curls with a glamorous, refined appearance. High shine and polished finish.',
    keywords: ['goddess wave', 'large waves', 'voluminous', 'glamorous', 'polished'],
  },
};

// Function to get detailed prompt by style ID
export const getDetailedPrompt = (styleId: string): DetailedHairPrompt | null => {
  return maleDetailedPrompts[styleId] || femaleDetailedPrompts[styleId] || null;
};

// Function to get hair description for AI editing (without mannequin references)
export const getHairDescriptionForEditing = (styleId: string, styleName: string, styleNameKo: string): string => {
  const detailedPrompt = getDetailedPrompt(styleId);

  if (detailedPrompt) {
    return detailedPrompt.description;
  }

  // Fallback for styles not in the detailed prompts
  return `${styleName} (${styleNameKo}) hairstyle with professional salon-quality styling`;
};

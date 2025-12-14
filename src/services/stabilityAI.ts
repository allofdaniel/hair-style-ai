import type { HairStyle, HairSettings, HairTexture } from '../stores/useAppStore';
import { hairColors, hairTextures } from '../data/hairStyles';

const STABILITY_API_KEY = import.meta.env.VITE_STABILITY_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Stability AI Inpainting endpoints
const STABILITY_INPAINT_URL = 'https://api.stability.ai/v2beta/stable-image/edit/inpaint';

interface GenerateHairStyleParams {
  userPhoto: string;
  style: HairStyle;
  settings: HairSettings;
  texture?: HairTexture;
}

interface GenerateHairStyleResponse {
  success: boolean;
  resultImage?: string;
  error?: string;
}

// Build the AI prompt based on selected options
export const buildPrompt = (
  style: HairStyle,
  settings: HairSettings,
  texture?: HairTexture
): string => {
  const parts: string[] = [];

  // Base style prompt
  parts.push(style.prompt);

  // Hair color
  const colorOption = hairColors.find((c) => c.id === settings.color);
  if (colorOption && colorOption.id !== 'natural') {
    parts.push(colorOption.prompt);
  }

  // Volume
  const volumePrompts: Record<string, string> = {
    flat: 'with flat sleek low volume',
    natural: 'with natural medium volume',
    voluminous: 'with high volume and body',
  };
  parts.push(volumePrompts[settings.volume]);

  // Parting
  const partingPrompts: Record<string, string> = {
    left: 'parted on the left side',
    center: 'parted in the center',
    right: 'parted on the right side',
    none: 'with no visible part',
  };
  parts.push(partingPrompts[settings.parting]);

  // Hair texture consideration
  if (texture) {
    const textureOption = hairTextures.find((t) => t.id === texture);
    if (textureOption) {
      parts.push(`considering ${textureOption.prompt}`);
    }
  }

  return parts.join(', ');
};

// Face detection result interface
interface FaceDetectionResult {
  success: boolean;
  faceBox?: {
    x: number;      // 0-1 normalized
    y: number;      // 0-1 normalized
    width: number;  // 0-1 normalized
    height: number; // 0-1 normalized
  };
  error?: string;
}

// Detect face position using Gemini
async function detectFacePosition(userPhoto: string): Promise<FaceDetectionResult> {
  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not configured' };
  }

  const base64Data = userPhoto.includes('base64,')
    ? userPhoto.split('base64,')[1]
    : userPhoto;

  let mimeType = 'image/jpeg';
  if (userPhoto.includes('data:image/png')) mimeType = 'image/png';
  else if (userPhoto.includes('data:image/webp')) mimeType = 'image/webp';

  const prompt = `Analyze this photo and detect the face position.

Return ONLY a JSON object with the face bounding box as normalized coordinates (0 to 1):
{
  "x": <left edge of face, 0-1>,
  "y": <top edge of face (forehead line, NOT hairline), 0-1>,
  "width": <face width, 0-1>,
  "height": <face height from forehead to chin, 0-1>
}

IMPORTANT:
- "y" should be the FOREHEAD LINE (where forehead skin starts), NOT the top of the hair
- The face box should include forehead, eyes, nose, mouth, chin
- Do NOT include hair in the face box
- Values are normalized (0 = left/top edge, 1 = right/bottom edge)

Return ONLY the JSON, no explanation.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: prompt },
          ],
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Face detection error:', response.status, errorText);
      return { success: false, error: `Face detection failed: ${response.status}` };
    }

    const data = await response.json();
    const textPart = data.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text);

    if (textPart?.text) {
      const faceBox = JSON.parse(textPart.text);
      console.log('Detected face box:', faceBox);
      return { success: true, faceBox };
    }

    return { success: false, error: 'No face detected' };
  } catch (error) {
    console.error('Face detection error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Face detection failed' };
  }
}

// Generate hair mask by detecting face and masking above it
async function generateHairMask(userPhoto: string): Promise<{ success: boolean; maskImage?: string; error?: string }> {
  try {
    // Step 1: Detect face position
    const faceResult = await detectFacePosition(userPhoto);
    if (!faceResult.success || !faceResult.faceBox) {
      console.error('Face detection failed, using fallback top-portion mask');
      // Fallback: mask top 40% of image
      return await createSimpleMask(userPhoto, 0.4);
    }

    const { x, y, width, height } = faceResult.faceBox;
    console.log(`Face detected at: x=${x}, y=${y}, w=${width}, h=${height}`);

    // Step 2: Create mask using Canvas
    // Hair area = everything ABOVE the face (y < faceTop)
    // Plus sides of head above ear level

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;

        // Start with all black (preserve everything)
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate face position in pixels
        const faceLeft = x * canvas.width;
        const faceTop = y * canvas.height;
        const faceWidth = width * canvas.width;
        const faceHeight = height * canvas.height;
        const faceRight = faceLeft + faceWidth;
        const faceCenterX = faceLeft + faceWidth / 2;

        // Hair mask area (white = area to replace)
        ctx.fillStyle = 'white';

        // 1. Top of head - everything above the forehead
        // Extend slightly wider than face for hair on sides
        const hairTopWidth = faceWidth * 1.8;
        const hairTopLeft = faceCenterX - hairTopWidth / 2;
        ctx.fillRect(
          Math.max(0, hairTopLeft),
          0,
          Math.min(hairTopWidth, canvas.width),
          faceTop + faceHeight * 0.1  // Include just the very top of forehead for hairline
        );

        // 2. Sides of head (above ear level, which is roughly eye level)
        const earLevel = faceTop + faceHeight * 0.35;
        const sideWidth = faceWidth * 0.4;

        // Left side
        ctx.fillRect(
          Math.max(0, faceLeft - sideWidth),
          0,
          sideWidth + faceWidth * 0.1,
          earLevel
        );

        // Right side
        ctx.fillRect(
          faceRight - faceWidth * 0.1,
          0,
          sideWidth + faceWidth * 0.1,
          earLevel
        );

        // 3. Create smooth edges with gradient
        // Add a slight feather at the bottom of the mask
        const gradient = ctx.createLinearGradient(0, faceTop - 10, 0, faceTop + 20);
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(1, 'black');
        ctx.fillStyle = gradient;
        ctx.fillRect(hairTopLeft, faceTop - 10, hairTopWidth, 30);

        // Convert to base64
        const maskImage = canvas.toDataURL('image/png');
        resolve({ success: true, maskImage });
      };

      img.onerror = () => {
        resolve({ success: false, error: 'Failed to load image for mask creation' });
      };

      img.src = userPhoto;
    });
  } catch (error) {
    console.error('Mask generation error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Mask generation failed' };
  }
}

// Fallback: Create a simple top-portion mask
async function createSimpleMask(userPhoto: string, topPortion: number): Promise<{ success: boolean; maskImage?: string; error?: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      // Black background (preserve)
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // White top portion (replace with hair)
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height * topPortion);

      // Soft gradient transition
      const gradient = ctx.createLinearGradient(0, canvas.height * topPortion - 20, 0, canvas.height * topPortion + 20);
      gradient.addColorStop(0, 'white');
      gradient.addColorStop(1, 'black');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, canvas.height * topPortion - 20, canvas.width, 40);

      const maskImage = canvas.toDataURL('image/png');
      resolve({ success: true, maskImage });
    };

    img.onerror = () => {
      resolve({ success: false, error: 'Failed to load image' });
    };

    img.src = userPhoto;
  });
}

// Convert base64 to Blob
function base64ToBlob(base64: string, mimeType: string): Blob {
  const base64Data = base64.includes('base64,') ? base64.split('base64,')[1] : base64;
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

// Get mime type from base64 data URL
function getMimeType(base64: string): string {
  if (base64.includes('data:image/png')) return 'image/png';
  if (base64.includes('data:image/webp')) return 'image/webp';
  return 'image/jpeg';
}

// Generate hair style using Stability AI inpainting
export const generateHairStyleWithInpainting = async (
  params: GenerateHairStyleParams
): Promise<GenerateHairStyleResponse> => {
  const { userPhoto, style, settings, texture } = params;

  if (!STABILITY_API_KEY) {
    return { success: false, error: 'Stability AI API key not configured. Add VITE_STABILITY_API_KEY to .env file.' };
  }

  const stylePrompt = buildPrompt(style, settings, texture);

  try {
    console.log('Step 1: Generating hair mask with Gemini...');

    // Step 1: Generate hair mask using Gemini
    const maskResult = await generateHairMask(userPhoto);
    if (!maskResult.success || !maskResult.maskImage) {
      console.error('Mask generation failed:', maskResult.error);
      return { success: false, error: `Hair mask generation failed: ${maskResult.error}` };
    }

    console.log('Mask generated successfully');
    console.log('Step 2: Calling Stability AI inpainting...');

    // Step 2: Use Stability AI inpainting with the mask
    const userMimeType = getMimeType(userPhoto);
    const maskMimeType = getMimeType(maskResult.maskImage);

    const imageBlob = base64ToBlob(userPhoto, userMimeType);
    const maskBlob = base64ToBlob(maskResult.maskImage, maskMimeType);

    // Build the inpainting prompt
    const inpaintPrompt = `${style.name} hairstyle, ${stylePrompt}, professional hair salon result, natural looking hair, seamless blend with face`;

    // Create FormData for Stability AI API
    const formData = new FormData();
    formData.append('image', imageBlob, 'image.jpg');
    formData.append('mask', maskBlob, 'mask.png');
    formData.append('prompt', inpaintPrompt);
    formData.append('negative_prompt', 'blurry, distorted face, changed face, different person, bad hair, unnatural, artifacts');
    formData.append('output_format', 'png');

    const response = await fetch(STABILITY_INPAINT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        'Accept': 'image/*',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stability AI error:', response.status, errorText);

      if (response.status === 401) {
        return { success: false, error: 'Invalid Stability AI API key. Please check your API key.' };
      } else if (response.status === 402) {
        return { success: false, error: 'Insufficient credits on Stability AI. Please add credits.' };
      } else if (response.status === 400) {
        try {
          const errorJson = JSON.parse(errorText);
          return { success: false, error: `Stability AI error: ${errorJson.message || errorText}` };
        } catch {
          return { success: false, error: `Stability AI error: ${errorText}` };
        }
      }

      return { success: false, error: `Stability AI error: ${response.status}` };
    }

    // Get the result image
    const resultBlob = await response.blob();
    const resultBase64 = await blobToBase64(resultBlob);

    console.log('Inpainting completed successfully');

    return {
      success: true,
      resultImage: resultBase64,
    };

  } catch (error) {
    console.error('Error in inpainting process:', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { success: false, error: 'Network error. Please check your internet connection.' };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Convert Blob to base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Generate from reference photo using Stability AI inpainting
interface GenerateFromReferenceParams {
  userPhoto: string;
  referencePhoto: string;
  settings: HairSettings;
}

export const generateFromReferenceWithInpainting = async (
  params: GenerateFromReferenceParams
): Promise<GenerateHairStyleResponse> => {
  const { userPhoto, referencePhoto, settings } = params;

  if (!STABILITY_API_KEY) {
    return { success: false, error: 'Stability AI API key not configured. Add VITE_STABILITY_API_KEY to .env file.' };
  }

  try {
    console.log('Step 1: Analyzing reference hairstyle...');

    // First, analyze the reference photo to understand the hairstyle
    const analysisResult = await analyzeReferenceForInpainting(referencePhoto);
    if (!analysisResult.success || !analysisResult.description) {
      return { success: false, error: 'Could not analyze reference hairstyle' };
    }

    console.log('Reference analysis:', analysisResult.description);
    console.log('Step 2: Generating hair mask...');

    // Generate hair mask
    const maskResult = await generateHairMask(userPhoto);
    if (!maskResult.success || !maskResult.maskImage) {
      return { success: false, error: `Hair mask generation failed: ${maskResult.error}` };
    }

    console.log('Mask generated successfully');
    console.log('Step 3: Calling Stability AI inpainting...');

    // Build color modifier
    const colorOption = hairColors.find((c) => c.id === settings.color);
    const colorPrompt = colorOption && colorOption.id !== 'natural' ? colorOption.prompt : '';

    // Build inpainting prompt from reference analysis
    let inpaintPrompt = analysisResult.description;
    if (colorPrompt) {
      inpaintPrompt += `, ${colorPrompt}`;
    }
    inpaintPrompt += ', professional hair salon result, natural looking hair, seamless blend with face';

    // Prepare blobs
    const userMimeType = getMimeType(userPhoto);
    const maskMimeType = getMimeType(maskResult.maskImage);

    const imageBlob = base64ToBlob(userPhoto, userMimeType);
    const maskBlob = base64ToBlob(maskResult.maskImage, maskMimeType);

    // Create FormData
    const formData = new FormData();
    formData.append('image', imageBlob, 'image.jpg');
    formData.append('mask', maskBlob, 'mask.png');
    formData.append('prompt', inpaintPrompt);
    formData.append('negative_prompt', 'blurry, distorted face, changed face, different person, bad hair, unnatural, artifacts');
    formData.append('output_format', 'png');

    const response = await fetch(STABILITY_INPAINT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        'Accept': 'image/*',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stability AI error:', response.status, errorText);

      if (response.status === 401) {
        return { success: false, error: 'Invalid Stability AI API key.' };
      } else if (response.status === 402) {
        return { success: false, error: 'Insufficient Stability AI credits.' };
      }

      return { success: false, error: `Stability AI error: ${response.status}` };
    }

    const resultBlob = await response.blob();
    const resultBase64 = await blobToBase64(resultBlob);

    console.log('Reference-based inpainting completed successfully');

    return {
      success: true,
      resultImage: resultBase64,
    };

  } catch (error) {
    console.error('Error in reference inpainting:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Analyze reference photo for inpainting prompt
async function analyzeReferenceForInpainting(referencePhoto: string): Promise<{ success: boolean; description?: string; error?: string }> {
  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not configured' };
  }

  const base64Data = referencePhoto.includes('base64,')
    ? referencePhoto.split('base64,')[1]
    : referencePhoto;

  let mimeType = 'image/jpeg';
  if (referencePhoto.includes('data:image/png')) mimeType = 'image/png';

  const prompt = `Describe the hairstyle in this photo for an AI image generation model.

Provide a detailed, concise description that includes:
- Hair length (short, medium, long)
- Hair style name if recognizable (e.g., two-block cut, comma hair, layered bob)
- Key characteristics (texture, volume, parting, bangs)
- Hair color if notable

Format your response as a single prompt-friendly sentence, like:
"Short two-block cut with textured top, side parted comma bangs, natural black hair with medium volume"

Return ONLY the description, no additional text.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: prompt },
          ],
        }],
        generationConfig: {
          temperature: 0.3,
        },
      }),
    });

    if (!response.ok) {
      return { success: false, error: `API Error: ${response.status}` };
    }

    const data = await response.json();
    const textPart = data.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text);

    if (textPart?.text) {
      return { success: true, description: textPart.text.trim() };
    }

    return { success: false, error: 'No description generated' };
  } catch (error) {
    console.error('Reference analysis error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Analysis failed' };
  }
}

// Re-export for compatibility
export { generateHairMask };

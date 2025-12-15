/**
 * Hair Segmentation Service using Hugging Face API
 *
 * Uses free Face Parsing models to segment hair from images.
 * No API key required for basic usage (rate limited).
 */

const HF_FACE_PARSING_URL = 'https://api-inference.huggingface.co/models/jonathandinu/face-parsing';
const HF_API_KEY = import.meta.env.VITE_HF_API_KEY || ''; // Optional, increases rate limit

interface SegmentationResult {
  success: boolean;
  hairMask?: string;  // Base64 PNG of hair mask (white = hair, black = rest)
  error?: string;
}

/**
 * Segment hair from an image using Hugging Face Face Parsing model
 */
export async function segmentHair(imageBase64: string): Promise<SegmentationResult> {
  try {
    console.log('Starting hair segmentation with Hugging Face...');

    // Convert base64 to blob
    const base64Data = imageBase64.includes('base64,')
      ? imageBase64.split('base64,')[1]
      : imageBase64;

    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    // Call Hugging Face API
    const headers: HeadersInit = {
      'Content-Type': 'application/octet-stream',
    };
    if (HF_API_KEY) {
      headers['Authorization'] = `Bearer ${HF_API_KEY}`;
    }

    const response = await fetch(HF_FACE_PARSING_URL, {
      method: 'POST',
      headers,
      body: blob,
    });

    if (!response.ok) {
      // Check if model is loading
      if (response.status === 503) {
        const data = await response.json();
        if (data.error?.includes('loading')) {
          console.log('Model is loading, waiting...');
          // Wait and retry
          await new Promise(r => setTimeout(r, 20000));
          return segmentHair(imageBase64);
        }
      }

      const errorText = await response.text();
      console.error('HF API error:', response.status, errorText);

      // Fallback to simple mask
      console.log('Falling back to face-detection based mask');
      return await createFallbackMask(imageBase64);
    }

    // Parse the segmentation result
    const result = await response.json();
    console.log('Face parsing result received');

    // The model returns segments with labels
    // We need to find the "hair" segment and create a mask
    const hairMask = await createHairMaskFromSegments(imageBase64, result);

    return { success: true, hairMask };

  } catch (error) {
    console.error('Hair segmentation error:', error);

    // Fallback to simple mask
    console.log('Error occurred, falling back to simple mask');
    return await createFallbackMask(imageBase64);
  }
}

/**
 * Create hair mask from segmentation results
 */
async function createHairMaskFromSegments(
  originalImage: string,
  segments: Array<{ label: string; mask: string; score: number }>
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      // Start with black (preserve everything)
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Find hair segment
      const hairSegment = segments.find(s =>
        s.label.toLowerCase().includes('hair') &&
        !s.label.toLowerCase().includes('brow')  // Exclude eyebrows
      );

      if (hairSegment && hairSegment.mask) {
        // Draw the hair mask
        const maskImg = new Image();
        maskImg.onload = () => {
          // The mask from HF is usually a grayscale image
          // We need to draw it as white on our black canvas
          ctx.globalCompositeOperation = 'lighter';
          ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        };
        maskImg.onerror = () => {
          // If mask image fails, create fallback
          createFallbackMaskCanvas(ctx, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        };
        maskImg.src = `data:image/png;base64,${hairSegment.mask}`;
      } else {
        // No hair segment found, use fallback
        console.log('No hair segment found, using fallback mask');
        createFallbackMaskCanvas(ctx, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      }
    };

    img.onerror = () => {
      resolve('');
    };

    img.src = originalImage;
  });
}

/**
 * Create a fallback mask (top 35% of image)
 */
async function createFallbackMask(imageBase64: string): Promise<SegmentationResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      createFallbackMaskCanvas(ctx, canvas.width, canvas.height);

      resolve({
        success: true,
        hairMask: canvas.toDataURL('image/png')
      });
    };

    img.onerror = () => {
      resolve({ success: false, error: 'Failed to load image' });
    };

    img.src = imageBase64;
  });
}

/**
 * Draw fallback mask on canvas
 */
function createFallbackMaskCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  // Black background
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);

  // White top portion (roughly where hair would be)
  const hairPortion = 0.35;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height * hairPortion);

  // Soft gradient transition
  const gradient = ctx.createLinearGradient(0, height * hairPortion - 20, 0, height * hairPortion + 40);
  gradient.addColorStop(0, 'white');
  gradient.addColorStop(1, 'black');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, height * hairPortion - 20, width, 60);
}

/**
 * Composite new hair onto original image using mask
 * - originalImage: The user's photo (FACE stays from here)
 * - generatedImage: AI-generated image with new hairstyle (HAIR comes from here)
 * - hairMask: Mask where white = hair area to replace
 *
 * Result: Original photo with ONLY the hair area replaced from generated image
 */
export async function compositeHairOntoOriginal(
  originalImage: string,
  generatedImage: string,
  hairMask: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const original = new Image();
    const generated = new Image();
    const mask = new Image();

    let loadedCount = 0;
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === 3) {
        performComposite();
      }
    };

    const performComposite = () => {
      const width = original.width;
      const height = original.height;

      // Main canvas - final result
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      // Step 1: Draw ORIGINAL image as base (this keeps the face!)
      ctx.drawImage(original, 0, 0, width, height);

      // Step 2: Get pixel data from all images
      // Create temp canvases to read pixel data
      const origCanvas = document.createElement('canvas');
      origCanvas.width = width;
      origCanvas.height = height;
      const origCtx = origCanvas.getContext('2d')!;
      origCtx.drawImage(original, 0, 0, width, height);
      const origData = origCtx.getImageData(0, 0, width, height);

      const genCanvas = document.createElement('canvas');
      genCanvas.width = width;
      genCanvas.height = height;
      const genCtx = genCanvas.getContext('2d')!;
      genCtx.drawImage(generated, 0, 0, width, height);
      const genData = genCtx.getImageData(0, 0, width, height);

      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = width;
      maskCanvas.height = height;
      const maskCtx = maskCanvas.getContext('2d')!;
      maskCtx.drawImage(mask, 0, 0, width, height);
      const maskData = maskCtx.getImageData(0, 0, width, height);

      // Step 3: Pixel-by-pixel compositing
      // Where mask is WHITE (hair) -> use generated pixel
      // Where mask is BLACK (face/body) -> use original pixel
      const resultData = ctx.getImageData(0, 0, width, height);

      for (let i = 0; i < resultData.data.length; i += 4) {
        // Mask value (0-255, where 255 = white = hair area)
        const maskValue = maskData.data[i]; // R channel of mask

        if (maskValue > 128) {
          // Hair area - use generated image pixels
          resultData.data[i] = genData.data[i];         // R
          resultData.data[i + 1] = genData.data[i + 1]; // G
          resultData.data[i + 2] = genData.data[i + 2]; // B
          resultData.data[i + 3] = 255;                  // A
        } else {
          // Face/body area - use original image pixels (UNCHANGED!)
          resultData.data[i] = origData.data[i];         // R
          resultData.data[i + 1] = origData.data[i + 1]; // G
          resultData.data[i + 2] = origData.data[i + 2]; // B
          resultData.data[i + 3] = 255;                  // A
        }
      }

      // Step 4: Put the composited pixels back
      ctx.putImageData(resultData, 0, 0);

      console.log('Compositing complete - face from original, hair from generated');
      resolve(canvas.toDataURL('image/png'));
    };

    original.onload = checkAllLoaded;
    generated.onload = checkAllLoaded;
    mask.onload = checkAllLoaded;

    original.onerror = () => reject(new Error('Failed to load original image'));
    generated.onerror = () => reject(new Error('Failed to load generated image'));
    mask.onerror = () => reject(new Error('Failed to load mask image'));

    original.src = originalImage;
    generated.src = generatedImage;
    mask.src = hairMask;
  });
}

/**
 * Alternative: Use Gemini for face detection + canvas for mask creation
 * This is more reliable than HF for getting accurate hair masks
 */
export async function createHairMaskWithGemini(imageBase64: string): Promise<SegmentationResult> {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return createFallbackMask(imageBase64);
  }

  const base64Data = imageBase64.includes('base64,')
    ? imageBase64.split('base64,')[1]
    : imageBase64;

  let mimeType = 'image/jpeg';
  if (imageBase64.includes('data:image/png')) mimeType = 'image/png';

  // Ask Gemini for face boundaries
  const prompt = `Analyze this photo and return ONLY a JSON object with face bounding box:
{
  "faceTop": <forehead y position 0-1>,
  "faceBottom": <chin y position 0-1>,
  "faceLeft": <left cheek x position 0-1>,
  "faceRight": <right cheek x position 0-1>,
  "eyeLevel": <eye level y position 0-1>
}
Values are normalized 0-1. faceTop is where forehead skin starts (NOT hairline).`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
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
      }
    );

    if (!response.ok) {
      console.error('Gemini face detection failed');
      return createFallbackMask(imageBase64);
    }

    const data = await response.json();
    const textPart = data.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text);

    if (!textPart?.text) {
      return createFallbackMask(imageBase64);
    }

    const face = JSON.parse(textPart.text);
    console.log('Face detected:', face);

    // Create mask based on face position
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

        const faceTop = face.faceTop * canvas.height;
        const faceLeft = face.faceLeft * canvas.width;
        const faceRight = face.faceRight * canvas.width;
        const faceWidth = faceRight - faceLeft;
        const faceCenterX = faceLeft + faceWidth / 2;
        const eyeLevel = face.eyeLevel * canvas.height;

        // Hair area = above forehead, extending to sides
        ctx.fillStyle = 'white';

        // Top of head (wider than face)
        const hairWidth = faceWidth * 2;
        const hairLeft = Math.max(0, faceCenterX - hairWidth / 2);
        ctx.fillRect(hairLeft, 0, hairWidth, faceTop + 10);

        // Sides of head (above eye level)
        const sideExtend = faceWidth * 0.5;

        // Left side
        ctx.fillRect(Math.max(0, faceLeft - sideExtend), 0, sideExtend + 20, eyeLevel);

        // Right side
        ctx.fillRect(faceRight - 20, 0, sideExtend + 20, eyeLevel);

        // Soft transition at forehead line
        const gradient = ctx.createLinearGradient(0, faceTop - 15, 0, faceTop + 25);
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(1, 'black');
        ctx.fillStyle = gradient;
        ctx.fillRect(hairLeft, faceTop - 15, hairWidth, 40);

        resolve({
          success: true,
          hairMask: canvas.toDataURL('image/png'),
        });
      };

      img.onerror = () => {
        resolve({ success: false, error: 'Failed to load image' });
      };

      img.src = imageBase64;
    });

  } catch (error) {
    console.error('Gemini mask creation error:', error);
    return createFallbackMask(imageBase64);
  }
}

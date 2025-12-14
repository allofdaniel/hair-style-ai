import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

interface GenerateRequest {
  image: string; // base64 image
  prompt: string;
  styleId: string;
  settings: {
    length: { top: number; side: number; back: number };
    color: string;
    volume: string;
    parting: string;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { image, prompt } = req.body as GenerateRequest;

    if (!image || !prompt) {
      return res.status(400).json({ error: 'Missing image or prompt' });
    }

    // Extract base64 data (remove data:image/...;base64, prefix if present)
    const base64Data = image.includes('base64,')
      ? image.split('base64,')[1]
      : image;

    // Determine mime type
    let mimeType = 'image/jpeg';
    if (image.includes('data:image/png')) {
      mimeType = 'image/png';
    } else if (image.includes('data:image/webp')) {
      mimeType = 'image/webp';
    }

    // Build the hair transformation prompt
    const fullPrompt = `You are an expert hair stylist AI. Transform ONLY the hair in this photo while keeping the face, skin, and all other features completely unchanged.

Hair transformation request:
${prompt}

CRITICAL INSTRUCTIONS:
1. ONLY modify the hair - do NOT change the face, eyes, nose, mouth, skin tone, or any facial features
2. Keep the person's identity perfectly preserved
3. The new hairstyle should look natural and realistic on this person
4. Maintain the same lighting and photo quality
5. Generate a photorealistic result

Generate the transformed image now.`;

    // Call Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              {
                text: fullPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['image', 'text'],
          responseMimeType: 'image/png',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return res.status(response.status).json({
        error: 'Failed to generate image',
        details: errorText
      });
    }

    const data = await response.json();

    // Extract the generated image from response
    const candidates = data.candidates;
    if (!candidates || candidates.length === 0) {
      return res.status(500).json({ error: 'No response from AI model' });
    }

    const parts = candidates[0].content?.parts;
    if (!parts || parts.length === 0) {
      return res.status(500).json({ error: 'No content in response' });
    }

    // Find the image part in the response
    const imagePart = parts.find((part: any) => part.inlineData);
    if (imagePart && imagePart.inlineData) {
      const resultImage = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      return res.status(200).json({
        success: true,
        resultImage
      });
    }

    // If no image, check for text response
    const textPart = parts.find((part: any) => part.text);
    if (textPart) {
      return res.status(500).json({
        error: 'Model returned text instead of image',
        message: textPart.text
      });
    }

    return res.status(500).json({ error: 'Unexpected response format' });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const { image, prompt } = req.body as GenerateRequest;

    if (!image || !prompt) {
      return res.status(400).json({ error: 'Missing image or prompt' });
    }

    // Extract base64 data from data URL
    let base64Data = image;
    let mimeType = 'image/png';
    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      } else {
        base64Data = image.split(',')[1];
      }
    }

    // Build the hair transformation prompt
    const editPrompt = `Transform ONLY the hairstyle to: ${prompt}.
CRITICAL: Keep the exact same face, skin tone, eyes, expression, facial features, and all other body parts completely unchanged.
The person's identity must remain 100% identical. Only change the hair - nothing else.
Make sure the new hairstyle looks natural and realistic on this person.`;

    console.log('Calling OpenAI Images Edit API with gpt-image-1.5...');
    console.log('Image size:', base64Data.length, 'bytes');

    // Use the images/edits endpoint with proper multipart form data
    // For Node.js, we need to construct the multipart manually or use a library
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Determine file extension from mime type
    const ext = mimeType === 'image/jpeg' ? 'jpg' : 'png';

    // Construct multipart form data manually
    const parts: Buffer[] = [];

    // Add model field - using gpt-image-1 (gpt-image-1.5 requires org verification)
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\ngpt-image-1\r\n`));

    // Add prompt field
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\n${editPrompt}\r\n`));

    // Add size field
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="size"\r\n\r\n1024x1024\r\n`));

    // Add quality field
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="quality"\r\n\r\nhigh\r\n`));

    // Add image file
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="input.${ext}"\r\nContent-Type: ${mimeType}\r\n\r\n`));
    parts.push(imageBuffer);
    parts.push(Buffer.from('\r\n'));

    // Add closing boundary
    parts.push(Buffer.from(`--${boundary}--\r\n`));

    const body = Buffer.concat(parts);

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'Failed to edit image',
        details: errorText,
      });
    }

    const data = await response.json();

    // Get the output image URL or base64
    let resultImage: string;

    if (data.data && data.data[0]) {
      if (data.data[0].b64_json) {
        resultImage = `data:image/png;base64,${data.data[0].b64_json}`;
      } else if (data.data[0].url) {
        // Fetch the image and convert to base64
        const imageResponse = await fetch(data.data[0].url);
        const imageArrayBuffer = await imageResponse.arrayBuffer();
        const base64 = Buffer.from(imageArrayBuffer).toString('base64');
        resultImage = `data:image/png;base64,${base64}`;
      } else {
        return res.status(500).json({ error: 'No image in response' });
      }
    } else {
      return res.status(500).json({ error: 'Invalid response format', data });
    }

    console.log('OpenAI image edit successful');

    return res.status(200).json({
      success: true,
      resultImage,
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

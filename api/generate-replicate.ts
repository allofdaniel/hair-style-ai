import type { VercelRequest, VercelResponse } from '@vercel/node';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

// Vercel Serverless Function has 10s timeout on Hobby, 60s on Pro
// Replicate usually takes 10-20s, so we need to handle this carefully

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

interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[];
  error?: string;
}

async function waitForPrediction(predictionId: string): Promise<ReplicatePrediction> {
  const maxWaitTime = 120000; // 2 minutes max
  const pollInterval = 2000; // Poll every 2 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get prediction status: ${response.status}`);
    }

    const prediction: ReplicatePrediction = await response.json();

    if (prediction.status === 'succeeded') {
      return prediction;
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(prediction.error || `Prediction ${prediction.status}`);
    }

    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Prediction timed out');
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

  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: 'Replicate API token not configured' });
  }

  try {
    const { image, prompt } = req.body as GenerateRequest;

    if (!image || !prompt) {
      return res.status(400).json({ error: 'Missing image or prompt' });
    }

    // Ensure image has proper data URL format
    let imageUrl = image;
    if (!image.startsWith('data:')) {
      imageUrl = `data:image/jpeg;base64,${image}`;
    }

    // Build the hair transformation prompt for flux-kontext-pro
    // This model excels at understanding context and making targeted edits
    const editPrompt = `Change ONLY the hairstyle to: ${prompt}.
Keep the exact same face, skin, eyes, expression, and all other features completely unchanged.
The person's identity must remain 100% the same. Only transform the hair.`;

    // Create prediction with flux-kontext-pro model
    // Use the models endpoint for official models
    const createResponse = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          prompt: editPrompt,
          input_image: imageUrl,
          aspect_ratio: '1:1',
          safety_tolerance: 2,
          output_format: 'png',
        },
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Replicate API error:', errorText);
      return res.status(createResponse.status).json({
        error: 'Failed to start image generation',
        details: errorText,
      });
    }

    const prediction: ReplicatePrediction = await createResponse.json();

    // Wait for the prediction to complete
    const completedPrediction = await waitForPrediction(prediction.id);

    // Get the output image
    const outputUrl = Array.isArray(completedPrediction.output)
      ? completedPrediction.output[0]
      : completedPrediction.output;

    if (!outputUrl) {
      return res.status(500).json({ error: 'No output image generated' });
    }

    // Fetch the generated image and convert to base64
    const imageResponse = await fetch(outputUrl);
    if (!imageResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch generated image' });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const resultImage = `data:image/png;base64,${base64Image}`;

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

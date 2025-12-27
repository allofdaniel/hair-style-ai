/**
 * Local development server for Replicate API proxy
 * Run: node server.js
 */

import http from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '.env') });

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const PORT = 3001;

if (!REPLICATE_API_TOKEN) {
  console.error('ERROR: REPLICATE_API_TOKEN not found in .env file');
  process.exit(1);
}

async function waitForPrediction(predictionId) {
  const maxWaitTime = 180000; // 3 minutes max
  const pollInterval = 2000;
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

    const prediction = await response.json();
    console.log(`Prediction status: ${prediction.status}`);

    if (prediction.status === 'succeeded') {
      return prediction;
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(prediction.error || `Prediction ${prediction.status}`);
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Prediction timed out');
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/generate-replicate') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { image, prompt } = JSON.parse(body);

        if (!image || !prompt) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing image or prompt' }));
          return;
        }

        console.log('Starting Replicate prediction...');
        console.log('Prompt:', prompt);

        // Ensure image has proper data URL format
        let imageUrl = image;
        if (!image.startsWith('data:')) {
          imageUrl = `data:image/jpeg;base64,${image}`;
        }

        // Build the edit prompt
        const editPrompt = `Change ONLY the hairstyle to: ${prompt}.
Keep the exact same face, skin, eyes, expression, and all other features completely unchanged.
The person's identity must remain 100% the same. Only transform the hair.`;

        // Create prediction with flux-kontext-pro model
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
          res.writeHead(createResponse.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to start generation', details: errorText }));
          return;
        }

        const prediction = await createResponse.json();
        console.log('Prediction created:', prediction.id);

        // Wait for completion
        const completedPrediction = await waitForPrediction(prediction.id);

        // Get output URL
        const outputUrl = Array.isArray(completedPrediction.output)
          ? completedPrediction.output[0]
          : completedPrediction.output;

        if (!outputUrl) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No output image generated' }));
          return;
        }

        console.log('Output URL:', outputUrl);

        // Fetch the generated image and convert to base64
        const imageResponse = await fetch(outputUrl);
        if (!imageResponse.ok) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to fetch generated image' }));
          return;
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const resultImage = `data:image/png;base64,${base64Image}`;

        console.log('Generation complete!');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, resultImage }));

      } catch (error) {
        console.error('Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Replicate proxy server running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  POST /api/generate-replicate');
});

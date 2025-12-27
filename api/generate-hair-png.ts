import type { VercelRequest, VercelResponse } from '@vercel/node';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

/**
 * 투명 배경 헤어 PNG 생성 API
 *
 * 1. FLUX로 헤어스타일 이미지 생성 (흰색 배경)
 * 2. 배경 제거 모델로 투명 PNG 변환
 *
 * 이렇게 생성된 헤어 PNG를 사용자 사진 위에 오버레이하면
 * 얼굴이 전혀 변하지 않음!
 */

interface GenerateRequest {
  stylePrompt: string;  // 헤어스타일 설명
  gender: 'male' | 'female';
}

interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[];
  error?: string;
}

async function waitForPrediction(predictionId: string): Promise<ReplicatePrediction> {
  const maxWaitTime = 120000;
  const pollInterval = 2000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to get prediction status: ${response.status}`);
    }

    const prediction: ReplicatePrediction = await response.json();

    if (prediction.status === 'succeeded') return prediction;
    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(prediction.error || `Prediction ${prediction.status}`);
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Prediction timed out');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!REPLICATE_API_TOKEN) return res.status(500).json({ error: 'API token not configured' });

  try {
    const { stylePrompt, gender } = req.body as GenerateRequest;

    if (!stylePrompt) {
      return res.status(400).json({ error: 'Missing stylePrompt' });
    }

    // Step 1: FLUX로 헤어스타일 이미지 생성 (흰색/단색 배경)
    console.log('Step 1: Generating hair image with FLUX...');

    const hairPrompt = `
A ${gender === 'male' ? 'male' : 'female'} hairstyle isolated on pure white background,
${stylePrompt},
hair only without face or body,
professional hair product photography style,
high resolution, studio lighting,
transparent background ready,
hair floating in air,
no mannequin head,
pure white background #FFFFFF
`.trim();

    const fluxResponse = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          prompt: hairPrompt,
          aspect_ratio: '1:1',
          output_format: 'png',
          num_outputs: 1,
        },
      }),
    });

    if (!fluxResponse.ok) {
      const errorText = await fluxResponse.text();
      console.error('FLUX error:', errorText);
      return res.status(500).json({ error: 'Failed to generate hair image', details: errorText });
    }

    const fluxPrediction: ReplicatePrediction = await fluxResponse.json();
    const fluxResult = await waitForPrediction(fluxPrediction.id);

    const hairImageUrl = Array.isArray(fluxResult.output)
      ? fluxResult.output[0]
      : fluxResult.output;

    if (!hairImageUrl) {
      return res.status(500).json({ error: 'No hair image generated' });
    }

    console.log('Hair image generated:', hairImageUrl);

    // Step 2: 배경 제거하여 투명 PNG 생성
    console.log('Step 2: Removing background...');

    const bgRemoveResponse = await fetch('https://api.replicate.com/v1/models/lucataco/remove-bg/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          image: hairImageUrl,
        },
      }),
    });

    if (!bgRemoveResponse.ok) {
      // 배경 제거 실패 시 원본 이미지 반환
      console.warn('Background removal failed, returning original image');
      const imageResponse = await fetch(hairImageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64 = Buffer.from(imageBuffer).toString('base64');

      return res.status(200).json({
        success: true,
        hairPngUrl: `data:image/png;base64,${base64}`,
        hasTransparency: false,
      });
    }

    const bgPrediction: ReplicatePrediction = await bgRemoveResponse.json();
    const bgResult = await waitForPrediction(bgPrediction.id);

    const transparentUrl = Array.isArray(bgResult.output)
      ? bgResult.output[0]
      : bgResult.output;

    if (!transparentUrl) {
      // 배경 제거 결과 없으면 원본 반환
      const imageResponse = await fetch(hairImageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64 = Buffer.from(imageBuffer).toString('base64');

      return res.status(200).json({
        success: true,
        hairPngUrl: `data:image/png;base64,${base64}`,
        hasTransparency: false,
      });
    }

    // 투명 PNG 다운로드 및 base64 변환
    const pngResponse = await fetch(transparentUrl);
    const pngBuffer = await pngResponse.arrayBuffer();
    const pngBase64 = Buffer.from(pngBuffer).toString('base64');

    console.log('Transparent PNG generated successfully');

    return res.status(200).json({
      success: true,
      hairPngUrl: `data:image/png;base64,${pngBase64}`,
      hasTransparency: true,
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = 'hairstyle-ai-references';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, imageData, contentType } = req.body;

    if (!fileName || !imageData) {
      return res.status(400).json({ error: 'Missing fileName or imageData' });
    }

    // Base64를 Buffer로 변환
    const buffer = Buffer.from(imageData, 'base64');

    // S3에 업로드
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `references/${fileName}`,
      Body: buffer,
      ContentType: contentType || 'image/png',
      CacheControl: 'max-age=31536000', // 1년 캐시
    });

    await s3Client.send(command);

    const url = `https://${BUCKET_NAME}.s3.ap-northeast-2.amazonaws.com/references/${fileName}`;

    return res.status(200).json({
      success: true,
      url,
      fileName,
    });
  } catch (error) {
    console.error('S3 upload error:', error);
    return res.status(500).json({
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

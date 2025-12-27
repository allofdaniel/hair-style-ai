/**
 * 실패한 2개 이미지 재생성
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const S3_BUCKET = 'hairstyle-ai-references';
const S3_REGION = 'ap-northeast-2';

const failedStyles = [
  {
    id: 'gail-perm',
    category: 'male',
    name: '가일펌',
    prompt: 'Professional studio photo of a mannequin head showing Korean gail perm hairstyle for men, natural soft wavy black hair falling down gracefully, medium length, neutral gray background, professional lighting'
  },
  {
    id: 'short-wolf',
    category: 'female',
    name: '숏 울프컷',
    prompt: 'Professional studio photo of a mannequin head showing Korean layered shaggy haircut for women, choppy textured dark hair with face-framing layers, neutral gray background, professional lighting'
  },
];

const downloadDir = path.join(__dirname, '..', 'temp-failed-images');

if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}

async function generateImage(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url'
    });

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          if (result.error) {
            reject(new Error(result.error.message));
          } else if (result.data && result.data[0]) {
            resolve(result.data[0].url);
          } else {
            reject(new Error('No image URL'));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${responseData.substring(0, 100)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(120000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.write(data);
    req.end();
  });
}

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(filepath);
        downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(`실패한 ${failedStyles.length}개 이미지 재생성...\n`);

  for (let i = 0; i < failedStyles.length; i++) {
    const style = failedStyles[i];
    const filename = `${style.category}-${style.id}.png`;
    const filepath = path.join(downloadDir, filename);
    const s3Key = `references/${style.category}/${style.id}.png`;

    try {
      console.log(`[${i + 1}/${failedStyles.length}] ${style.name}`);

      const imageUrl = await generateImage(style.prompt);
      await downloadImage(imageUrl, filepath);

      const stats = fs.statSync(filepath);
      execSync(`aws s3 cp "${filepath}" s3://${S3_BUCKET}/${s3Key} --region ${S3_REGION}`, { stdio: 'pipe' });

      console.log(`  ✓ 성공 (${Math.round(stats.size/1024)}KB)\n`);

      if (i < failedStyles.length - 1) {
        await sleep(15000);
      }
    } catch (error) {
      console.error(`  ✗ 실패: ${error.message}\n`);
    }
  }

  console.log('완료!');
}

main().catch(console.error);

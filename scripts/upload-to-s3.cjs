/**
 * S3에 헤어스타일 이미지와 GIF 업로드
 * 실행: node scripts/upload-to-s3.cjs
 */

const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const S3_BUCKET = 'hairstyle-ai-references';
const S3_REGION = 'ap-northeast-2';
const S3_BASE_URL = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;

// S3 클라이언트 설정 (AWS CLI 프로파일 또는 환경 변수 사용)
const s3Client = new S3Client({
  region: S3_REGION,
  // 환경 변수가 있으면 사용, 없으면 AWS CLI 프로파일/IAM 역할 자동 사용
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

// MIME 타입 매핑
const getMimeType = (ext) => {
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  return types[ext.toLowerCase()] || 'application/octet-stream';
};

// 파일이 S3에 이미 존재하는지 확인
async function fileExistsInS3(key) {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    }));
    return true;
  } catch (error) {
    return false;
  }
}

// 단일 파일 업로드
async function uploadFile(localPath, s3Key) {
  try {
    // 이미 존재하면 스킵
    const exists = await fileExistsInS3(s3Key);
    if (exists) {
      console.log(`⏭️  스킵 (이미 존재): ${s3Key}`);
      return { success: true, skipped: true };
    }

    const fileContent = fs.readFileSync(localPath);
    const ext = path.extname(localPath);

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: fileContent,
      ContentType: getMimeType(ext),
      CacheControl: 'public, max-age=31536000', // 1년 캐시
    });

    await s3Client.send(command);
    console.log(`✅ 업로드 완료: ${s3Key}`);
    return { success: true, skipped: false };
  } catch (error) {
    console.error(`❌ 업로드 실패: ${s3Key}`, error.message);
    return { success: false, error: error.message };
  }
}

// 디렉토리 내 모든 파일 업로드
async function uploadDirectory(localDir, s3Prefix) {
  if (!fs.existsSync(localDir)) {
    console.log(`⚠️  디렉토리 없음: ${localDir}`);
    return { total: 0, uploaded: 0, skipped: 0, failed: 0 };
  }

  const files = fs.readdirSync(localDir);
  const results = { total: 0, uploaded: 0, skipped: 0, failed: 0 };

  for (const file of files) {
    const localPath = path.join(localDir, file);
    const stat = fs.statSync(localPath);

    if (stat.isDirectory()) {
      // 하위 디렉토리 재귀 처리
      const subResults = await uploadDirectory(localPath, `${s3Prefix}/${file}`);
      results.total += subResults.total;
      results.uploaded += subResults.uploaded;
      results.skipped += subResults.skipped;
      results.failed += subResults.failed;
    } else {
      results.total++;
      const s3Key = `${s3Prefix}/${file}`;
      const result = await uploadFile(localPath, s3Key);

      if (result.success) {
        if (result.skipped) {
          results.skipped++;
        } else {
          results.uploaded++;
        }
      } else {
        results.failed++;
      }
    }
  }

  return results;
}

async function main() {
  console.log('🚀 S3 업로드 시작\n');
  console.log(`📦 버킷: ${S3_BUCKET}`);
  console.log(`🌏 리전: ${S3_REGION}\n`);

  // AWS CLI 프로파일 또는 환경 변수 확인
  console.log('🔐 자격 증명: ' + (process.env.AWS_ACCESS_KEY_ID ? '환경 변수 사용' : 'AWS CLI 프로파일 사용'));
  console.log('');

  const publicHairstylesDir = path.join(__dirname, '../public/hairstyles');

  // male, female, gif 디렉토리 업로드
  const directories = ['male', 'female', 'gif'];
  let totalResults = { total: 0, uploaded: 0, skipped: 0, failed: 0 };

  for (const dir of directories) {
    console.log(`\n📁 ${dir} 디렉토리 업로드 중...`);
    const localDir = path.join(publicHairstylesDir, dir);
    const s3Prefix = `hairstyles/${dir}`;

    const results = await uploadDirectory(localDir, s3Prefix);
    totalResults.total += results.total;
    totalResults.uploaded += results.uploaded;
    totalResults.skipped += results.skipped;
    totalResults.failed += results.failed;

    console.log(`   ${dir}: ${results.uploaded}개 업로드, ${results.skipped}개 스킵, ${results.failed}개 실패`);
  }

  console.log('\n========================================');
  console.log('📊 업로드 결과 요약');
  console.log('========================================');
  console.log(`총 파일: ${totalResults.total}개`);
  console.log(`✅ 새로 업로드: ${totalResults.uploaded}개`);
  console.log(`⏭️  스킵 (이미 존재): ${totalResults.skipped}개`);
  console.log(`❌ 실패: ${totalResults.failed}개`);
  console.log(`\n🌐 S3 URL: ${S3_BASE_URL}/hairstyles/`);
}

main().catch(console.error);

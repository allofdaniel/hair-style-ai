/**
 * 에셋(이미지/GIF) 소스 설정
 * - 로컬 개발: useS3 = false (public 폴더에서 로드)
 * - 프로덕션: useS3 = true (S3 CDN에서 로드)
 */

// S3 설정
const S3_BUCKET = 'hairstyle-ai-references';
const S3_REGION = 'ap-northeast-2';
const S3_BASE_URL = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;

// CloudFront CDN 설정 (나중에 추가 가능)
// const CDN_URL = 'https://d123456789.cloudfront.net';

// 환경에 따라 자동 설정
const isProduction = import.meta.env.PROD;

// S3 사용 여부 (프로덕션에서는 S3 사용)
export const useS3 = isProduction;

/**
 * 에셋 URL 생성
 * 로컬 경로를 받아서 환경에 따라 적절한 URL 반환
 *
 * @param localPath - 로컬 경로 (예: /hairstyles/male/two-block.jpg)
 * @returns 환경에 맞는 URL
 */
export function getAssetUrl(localPath: string): string {
  if (!localPath) return '';

  // 이미 전체 URL이면 그대로 반환
  if (localPath.startsWith('http://') || localPath.startsWith('https://')) {
    return localPath;
  }

  if (useS3) {
    // S3 URL로 변환 (/hairstyles/male/x.jpg -> S3_BASE_URL/hairstyles/male/x.jpg)
    const cleanPath = localPath.startsWith('/') ? localPath.slice(1) : localPath;
    return `${S3_BASE_URL}/${cleanPath}`;
  }

  // 로컬 경로 그대로 반환
  return localPath;
}

/**
 * 여러 에셋 URL을 한번에 변환
 */
export function getAssetUrls(localPaths: string[]): string[] {
  return localPaths.map(getAssetUrl);
}

// 기본 export
export default {
  useS3,
  s3BaseUrl: S3_BASE_URL,
  getAssetUrl,
  getAssetUrls,
};

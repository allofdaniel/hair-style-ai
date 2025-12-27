/**
 * PNG Hair Overlay Service
 *
 * 핵심 원리: AI가 얼굴을 재생성하지 않음!
 * 투명 배경의 헤어 PNG를 사용자 사진 위에 레이어로 씌움
 * -> 얼굴이 100% 보존됨 (원본 그대로)
 *
 * 작동 방식:
 * 1. 사용자 사진에서 얼굴 위치/크기 감지 (face-api.js)
 * 2. 선택한 헤어스타일의 투명 PNG 로드
 * 3. 얼굴 크기에 맞게 헤어 PNG 크기 조절
 * 4. 헤어를 얼굴 위(이마 위치)에 정확히 배치
 * 5. 원본 사진 + 헤어 PNG를 합성
 */

import { detectFace, type FaceRegion } from './faceDetection';

export interface HairAsset {
  id: string;
  name: string;
  nameKo: string;
  category: string;
  gender: 'male' | 'female';
  // 헤어 PNG URL (투명 배경)
  pngUrl: string;
  // 헤어 PNG의 기준점 (얼굴 중심 대비 오프셋)
  anchorY: number; // 0 = 이마 라인, 음수 = 더 위로
  // 헤어 PNG의 기본 스케일 (얼굴 너비 대비)
  baseScale: number; // 1.5 = 얼굴 너비의 1.5배
}

export interface OverlaySettings {
  offsetX: number; // 수평 미세 조정 (-50 ~ 50)
  offsetY: number; // 수직 미세 조정 (-50 ~ 50)
  scale: number;   // 크기 배율 (0.8 ~ 1.5)
  rotation: number; // 회전 각도 (-15 ~ 15)
  opacity: number;  // 불투명도 (0.8 ~ 1.0)
}

const defaultSettings: OverlaySettings = {
  offsetX: 0,
  offsetY: 0,
  scale: 1.0,
  rotation: 0,
  opacity: 1.0,
};

/**
 * 이미지 로드 헬퍼
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * 헤어 PNG를 사용자 사진 위에 오버레이
 *
 * @param userPhoto - 사용자 사진 (base64 또는 URL)
 * @param hairAsset - 헤어 PNG 에셋 정보
 * @param settings - 위치/크기 조정 설정
 * @returns 합성된 이미지 (base64)
 */
export async function overlayHairOnPhoto(
  userPhoto: string,
  hairPngUrl: string,
  settings: Partial<OverlaySettings> = {}
): Promise<{ success: boolean; resultImage?: string; error?: string; faceRegion?: FaceRegion }> {
  const finalSettings = { ...defaultSettings, ...settings };

  try {
    // 1. 사용자 사진에서 얼굴 감지
    console.log('Step 1: Detecting face in user photo...');
    const faceRegion = await detectFace(userPhoto);

    if (!faceRegion) {
      return { success: false, error: '얼굴을 감지할 수 없습니다. 정면 사진을 사용해주세요.' };
    }
    console.log('Face detected:', faceRegion);

    // 2. 이미지 로드
    console.log('Step 2: Loading images...');
    const [userImg, hairImg] = await Promise.all([
      loadImage(userPhoto),
      loadImage(hairPngUrl),
    ]);

    // 3. 캔버스 생성 및 합성
    console.log('Step 3: Compositing images...');
    const canvas = document.createElement('canvas');
    canvas.width = userImg.width;
    canvas.height = userImg.height;
    const ctx = canvas.getContext('2d')!;

    // 3-1. 원본 사용자 사진 그리기 (배경)
    ctx.drawImage(userImg, 0, 0);

    // 3-2. 헤어 PNG 위치 및 크기 계산
    const hairPosition = calculateHairPosition(faceRegion, hairImg, finalSettings);

    // 3-3. 헤어 PNG 그리기 (오버레이)
    ctx.save();
    ctx.globalAlpha = finalSettings.opacity;

    // 회전이 있으면 회전 적용
    if (finalSettings.rotation !== 0) {
      const centerX = hairPosition.x + hairPosition.width / 2;
      const centerY = hairPosition.y + hairPosition.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((finalSettings.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    ctx.drawImage(
      hairImg,
      hairPosition.x,
      hairPosition.y,
      hairPosition.width,
      hairPosition.height
    );

    ctx.restore();

    // 4. 결과 이미지 반환
    const resultImage = canvas.toDataURL('image/png');

    return {
      success: true,
      resultImage,
      faceRegion,
    };

  } catch (error) {
    console.error('Hair overlay error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 얼굴 영역 기반으로 헤어 PNG 위치/크기 계산
 */
function calculateHairPosition(
  face: FaceRegion,
  hairImg: HTMLImageElement,
  settings: OverlaySettings
): { x: number; y: number; width: number; height: number } {
  // 얼굴 중심점
  const faceCenterX = face.x + face.width / 2;

  // 이마 위치 (얼굴 상단에서 약간 위)
  // 눈썹 위치를 기준으로 이마 라인 추정
  let foreheadY = face.y;
  if (face.landmarks?.leftEyebrow && face.landmarks?.rightEyebrow) {
    const avgEyebrowY = (
      face.landmarks.leftEyebrow.reduce((sum, p) => sum + p.y, 0) / face.landmarks.leftEyebrow.length +
      face.landmarks.rightEyebrow.reduce((sum, p) => sum + p.y, 0) / face.landmarks.rightEyebrow.length
    ) / 2;
    foreheadY = avgEyebrowY - face.height * 0.15; // 눈썹 위 15%
  }

  // 헤어 크기 계산 (얼굴 너비의 약 2배)
  const baseHairWidth = face.width * 2.2 * settings.scale;
  const hairAspectRatio = hairImg.width / hairImg.height;
  const hairWidth = baseHairWidth;
  const hairHeight = hairWidth / hairAspectRatio;

  // 헤어 위치 계산 (이마 위에 중앙 정렬)
  const hairX = faceCenterX - hairWidth / 2 + settings.offsetX;
  const hairY = foreheadY - hairHeight * 0.4 + settings.offsetY; // 40%가 이마 위로

  return {
    x: hairX,
    y: hairY,
    width: hairWidth,
    height: hairHeight,
  };
}

/**
 * 실시간 미리보기용 - Canvas에 직접 렌더링
 */
export async function renderHairPreview(
  canvas: HTMLCanvasElement,
  userPhoto: string,
  hairPngUrl: string,
  settings: Partial<OverlaySettings> = {}
): Promise<void> {
  const result = await overlayHairOnPhoto(userPhoto, hairPngUrl, settings);

  if (result.success && result.resultImage) {
    const ctx = canvas.getContext('2d')!;
    const img = await loadImage(result.resultImage);
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
  }
}

/**
 * 워터마크 추가
 */
export async function addWatermarkToResult(imageData: string): Promise<string> {
  const img = await loadImage(imageData);

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(img, 0, 0);

  // 워터마크 텍스트
  const text = 'HairStyle AI';
  const fontSize = Math.max(16, Math.floor(img.width / 25));
  ctx.font = `bold ${fontSize}px Arial`;

  const padding = 20;
  const metrics = ctx.measureText(text);
  const x = img.width - metrics.width - padding;
  const y = img.height - padding;

  // 배경
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x - 8, y - fontSize, metrics.width + 16, fontSize + 8);

  // 텍스트
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText(text, x, y);

  return canvas.toDataURL('image/png');
}

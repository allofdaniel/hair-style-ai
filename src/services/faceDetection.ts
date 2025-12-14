/**
 * 얼굴 감지 서비스
 * face-api.js를 사용하여 사용자 사진에서 얼굴 영역을 감지하고
 * 마스크를 생성하여 얼굴을 보호합니다.
 */

import * as faceapi from 'face-api.js';

let modelsLoaded = false;

// face-api.js 모델 로드
export const loadFaceDetectionModels = async (): Promise<void> => {
  if (modelsLoaded) return;

  const MODEL_URL = '/models/face-api';

  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    console.log('Face detection models loaded');
  } catch (error) {
    console.error('Error loading face detection models:', error);
    throw error;
  }
};

// 얼굴 영역 인터페이스
export interface FaceRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  landmarks?: {
    jawLine: Array<{ x: number; y: number }>;
    leftEyebrow: Array<{ x: number; y: number }>;
    rightEyebrow: Array<{ x: number; y: number }>;
    nose: Array<{ x: number; y: number }>;
    leftEye: Array<{ x: number; y: number }>;
    rightEye: Array<{ x: number; y: number }>;
    mouth: Array<{ x: number; y: number }>;
  };
}

// 이미지에서 얼굴 영역 감지
export const detectFace = async (imageData: string): Promise<FaceRegion | null> => {
  if (!modelsLoaded) {
    await loadFaceDetectionModels();
  }

  // 이미지 엘리먼트 생성
  const img = await createImageElement(imageData);

  // 얼굴 감지 (랜드마크 포함)
  const detection = await faceapi
    .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks();

  if (!detection) {
    console.warn('No face detected in image');
    return null;
  }

  const box = detection.detection.box;
  const landmarks = detection.landmarks;

  return {
    x: Math.round(box.x),
    y: Math.round(box.y),
    width: Math.round(box.width),
    height: Math.round(box.height),
    landmarks: {
      jawLine: landmarks.getJawOutline().map(p => ({ x: p.x, y: p.y })),
      leftEyebrow: landmarks.getLeftEyeBrow().map(p => ({ x: p.x, y: p.y })),
      rightEyebrow: landmarks.getRightEyeBrow().map(p => ({ x: p.x, y: p.y })),
      nose: landmarks.getNose().map(p => ({ x: p.x, y: p.y })),
      leftEye: landmarks.getLeftEye().map(p => ({ x: p.x, y: p.y })),
      rightEye: landmarks.getRightEye().map(p => ({ x: p.x, y: p.y })),
      mouth: landmarks.getMouth().map(p => ({ x: p.x, y: p.y })),
    },
  };
};

// base64 이미지에서 HTMLImageElement 생성
const createImageElement = (imageData: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageData;
  });
};

// 얼굴 마스크 생성 (Canvas)
export const createFaceMask = async (
  imageData: string,
  faceRegion: FaceRegion
): Promise<string> => {
  const img = await createImageElement(imageData);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;

  // 전체를 흰색(변경 영역)으로 채움
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 얼굴 영역을 검정색(보존 영역)으로 채움
  // 랜드마크를 사용하여 더 정밀한 마스크 생성
  if (faceRegion.landmarks) {
    ctx.fillStyle = 'black';
    ctx.beginPath();

    // 턱 라인을 따라 얼굴 윤곽 그리기
    const jawLine = faceRegion.landmarks.jawLine;
    const leftEyebrow = faceRegion.landmarks.leftEyebrow;
    const rightEyebrow = faceRegion.landmarks.rightEyebrow;

    // 왼쪽 눈썹 시작점부터 시계방향으로
    ctx.moveTo(leftEyebrow[0].x, leftEyebrow[0].y - 10);

    // 왼쪽 눈썹
    leftEyebrow.forEach(p => ctx.lineTo(p.x, p.y - 10));

    // 오른쪽 눈썹
    rightEyebrow.forEach(p => ctx.lineTo(p.x, p.y - 10));

    // 오른쪽 눈썹 끝에서 턱 라인의 오른쪽으로
    ctx.lineTo(jawLine[jawLine.length - 1].x, jawLine[jawLine.length - 1].y);

    // 턱 라인을 따라 (역순)
    for (let i = jawLine.length - 1; i >= 0; i--) {
      ctx.lineTo(jawLine[i].x, jawLine[i].y);
    }

    ctx.closePath();
    ctx.fill();
  } else {
    // 랜드마크가 없으면 바운딩 박스 사용
    ctx.fillStyle = 'black';
    // 얼굴 영역에 약간의 여백 추가
    const padding = Math.min(faceRegion.width, faceRegion.height) * 0.1;
    ctx.beginPath();
    ctx.ellipse(
      faceRegion.x + faceRegion.width / 2,
      faceRegion.y + faceRegion.height / 2,
      faceRegion.width / 2 + padding,
      faceRegion.height / 2 + padding,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  return canvas.toDataURL('image/png');
};

// 얼굴 영역 정보를 프롬프트용 텍스트로 변환
export const getFaceProtectionPrompt = (
  faceRegion: FaceRegion,
  imageWidth: number,
  imageHeight: number
): string => {
  // 비율로 변환 (0-100%)
  const faceX = Math.round((faceRegion.x / imageWidth) * 100);
  const faceY = Math.round((faceRegion.y / imageHeight) * 100);
  const faceW = Math.round((faceRegion.width / imageWidth) * 100);
  const faceH = Math.round((faceRegion.height / imageHeight) * 100);

  return `
CRITICAL: THE FACE REGION MUST REMAIN COMPLETELY UNCHANGED.

FACE LOCATION (percentage of image):
- Position: ${faceX}% from left, ${faceY}% from top
- Size: ${faceW}% width, ${faceH}% height

PROTECTED FACIAL FEATURES (DO NOT MODIFY):
- Face shape and bone structure
- Eyes: position, shape, color, pupils, eyelids, eyelashes
- Eyebrows: shape, thickness, arch
- Nose: bridge, tip, nostrils, overall shape
- Mouth: lips shape, lip color, teeth if visible
- Ears: shape and position
- Skin: tone, texture, all marks, moles, freckles, wrinkles
- Facial expression and emotion
- Jawline and chin shape
- Cheekbones structure

ONLY MODIFY:
- Hair above the forehead
- Hair on the sides (not overlapping ears)
- Hair at the back of head
- Hair color and texture

The resulting image must show the EXACT SAME PERSON - 100% recognizable.
Any change to facial features will make this transformation FAILED.`;
};

/**
 * 원본 얼굴을 AI 생성 이미지에 합성
 * AI가 생성한 머리 + 원본 얼굴 = 최종 이미지
 */
export const composeFaceOntoResult = async (
  originalImage: string,
  aiGeneratedImage: string,
  faceRegion: FaceRegion
): Promise<string> => {
  const originalImg = await createImageElement(originalImage);
  const aiImg = await createImageElement(aiGeneratedImage);

  const canvas = document.createElement('canvas');
  canvas.width = originalImg.width;
  canvas.height = originalImg.height;
  const ctx = canvas.getContext('2d')!;

  // 1. AI 생성 이미지를 배경으로 그리기 (머리 부분)
  // AI 이미지 크기를 원본에 맞게 조정
  ctx.drawImage(aiImg, 0, 0, originalImg.width, originalImg.height);

  // 2. 얼굴 영역 마스크 생성 (부드러운 경계를 위한 그라디언트)
  if (faceRegion.landmarks) {
    // 클리핑 영역 설정 (얼굴 윤곽)
    ctx.save();
    ctx.beginPath();

    const jawLine = faceRegion.landmarks.jawLine;
    const leftEyebrow = faceRegion.landmarks.leftEyebrow;
    const rightEyebrow = faceRegion.landmarks.rightEyebrow;

    // 이마 위쪽으로 확장 (머리카락과 자연스럽게 연결)
    const foreheadExtension = faceRegion.height * 0.15;

    // 왼쪽 눈썹 시작점 위에서 시작
    ctx.moveTo(leftEyebrow[0].x - 10, leftEyebrow[0].y - foreheadExtension);

    // 이마 라인 (눈썹 위로)
    const eyebrowTop = Math.min(
      ...leftEyebrow.map(p => p.y),
      ...rightEyebrow.map(p => p.y)
    ) - foreheadExtension;

    // 왼쪽에서 오른쪽으로 이마 라인
    ctx.lineTo(leftEyebrow[0].x - 10, eyebrowTop);
    ctx.lineTo(rightEyebrow[rightEyebrow.length - 1].x + 10, eyebrowTop);
    ctx.lineTo(rightEyebrow[rightEyebrow.length - 1].x + 10, rightEyebrow[rightEyebrow.length - 1].y - foreheadExtension);

    // 오른쪽 눈썹 끝에서 턱 라인으로
    ctx.lineTo(jawLine[jawLine.length - 1].x + 5, jawLine[jawLine.length - 1].y);

    // 턱 라인을 따라 (역순)
    for (let i = jawLine.length - 1; i >= 0; i--) {
      ctx.lineTo(jawLine[i].x, jawLine[i].y);
    }

    // 왼쪽 턱에서 시작점으로
    ctx.lineTo(jawLine[0].x - 5, jawLine[0].y);

    ctx.closePath();
    ctx.clip();

    // 3. 클리핑된 영역에 원본 이미지 (얼굴) 그리기
    ctx.drawImage(originalImg, 0, 0);

    ctx.restore();

    // 4. 경계 부드럽게 처리 (페더링 효과)
    await applyFeathering(ctx, faceRegion, originalImg);
  } else {
    // 랜드마크가 없으면 타원형으로 얼굴 영역 사용
    ctx.save();
    ctx.beginPath();

    const padding = faceRegion.width * 0.05;
    ctx.ellipse(
      faceRegion.x + faceRegion.width / 2,
      faceRegion.y + faceRegion.height / 2,
      faceRegion.width / 2 + padding,
      faceRegion.height / 2 + padding,
      0,
      0,
      Math.PI * 2
    );
    ctx.clip();
    ctx.drawImage(originalImg, 0, 0);
    ctx.restore();
  }

  return canvas.toDataURL('image/jpeg', 0.95);
};

/**
 * 경계 부드럽게 처리 (페더링)
 * 현재는 단순히 컴포지트 모드만 설정 - 추후 가우시안 블러 등 추가 가능
 */
const applyFeathering = async (
  ctx: CanvasRenderingContext2D,
  faceRegion: FaceRegion,
  _originalImg: HTMLImageElement
): Promise<void> => {
  if (!faceRegion.landmarks) return;

  // 원본 이미지의 측면 부분을 살짝 블렌딩
  // TODO: 추후 가우시안 블러나 페더링 효과 구현
  ctx.globalCompositeOperation = 'source-over';
};

/**
 * 얼굴만 추출하여 별도 이미지로 반환
 */
export const extractFaceRegion = async (
  imageData: string,
  faceRegion: FaceRegion,
  padding: number = 0.2
): Promise<string> => {
  const img = await createImageElement(imageData);
  const canvas = document.createElement('canvas');

  // 패딩을 포함한 얼굴 영역 계산
  const paddingX = faceRegion.width * padding;
  const paddingY = faceRegion.height * padding;

  const x = Math.max(0, faceRegion.x - paddingX);
  const y = Math.max(0, faceRegion.y - paddingY);
  const width = Math.min(img.width - x, faceRegion.width + paddingX * 2);
  const height = Math.min(img.height - y, faceRegion.height + paddingY * 2);

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

  return canvas.toDataURL('image/png');
};

// 얼굴 영역을 시각적으로 표시 (디버그용)
export const drawFaceRegionDebug = async (
  imageData: string,
  faceRegion: FaceRegion
): Promise<string> => {
  const img = await createImageElement(imageData);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;

  // 원본 이미지 그리기
  ctx.drawImage(img, 0, 0);

  // 얼굴 바운딩 박스 그리기
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 3;
  ctx.strokeRect(faceRegion.x, faceRegion.y, faceRegion.width, faceRegion.height);

  // 랜드마크 점 그리기
  if (faceRegion.landmarks) {
    ctx.fillStyle = 'lime';
    const allPoints = [
      ...faceRegion.landmarks.jawLine,
      ...faceRegion.landmarks.leftEyebrow,
      ...faceRegion.landmarks.rightEyebrow,
      ...faceRegion.landmarks.nose,
      ...faceRegion.landmarks.leftEye,
      ...faceRegion.landmarks.rightEye,
      ...faceRegion.landmarks.mouth,
    ];

    allPoints.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  return canvas.toDataURL('image/png');
};

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
 * 원본 얼굴을 유지하고 AI 머리만 합성 (역방향 합성)
 *
 * 핵심 원리:
 * 1. 원본 이미지를 BASE로 사용 (얼굴 100% 보존!)
 * 2. AI 이미지에서 머리 영역만 원본 위에 덮어씌움
 * 3. 얼굴 영역은 원본 그대로 유지
 * => 얼굴은 원본, 머리만 AI!
 */
export const composeFaceOntoResult = async (
  originalImage: string,
  aiGeneratedImage: string,
  faceRegion: FaceRegion
): Promise<string> => {
  const originalImg = await createImageElement(originalImage);
  const aiImg = await createImageElement(aiGeneratedImage);

  const canvas = document.createElement('canvas');
  const width = originalImg.width;
  const height = originalImg.height;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. 원본 이미지를 베이스로 사용 (얼굴 보존!)
  ctx.drawImage(originalImg, 0, 0, width, height);

  // 2. AI 이미지 캔버스 준비 (크기 맞춤)
  const aiCanvas = document.createElement('canvas');
  aiCanvas.width = width;
  aiCanvas.height = height;
  const aiCtx = aiCanvas.getContext('2d')!;
  aiCtx.drawImage(aiImg, 0, 0, width, height);

  // 3. 얼굴 중심과 크기 계산 (보호 영역)
  let faceCenterX = faceRegion.x + faceRegion.width / 2;
  let faceCenterY = faceRegion.y + faceRegion.height / 2;
  let faceRadiusX = faceRegion.width / 2;
  let faceRadiusY = faceRegion.height / 2;

  if (faceRegion.landmarks) {
    const jawLine = faceRegion.landmarks.jawLine;
    const nose = faceRegion.landmarks.nose;
    const leftEye = faceRegion.landmarks.leftEye;
    const rightEye = faceRegion.landmarks.rightEye;

    // 얼굴 중심: 코 중앙, 눈~턱 중간
    faceCenterX = nose[3].x;

    // 눈 위치 ~ 턱 중간점 (눈썹 위는 머리로 처리)
    const eyeY = (leftEye[0].y + rightEye[0].y) / 2;
    const jawBottomY = Math.max(...jawLine.map(p => p.y));
    faceCenterY = (eyeY + jawBottomY) / 2;

    // 얼굴 폭: 턱 라인 기준 (좁게)
    const faceLeft = Math.min(...jawLine.map(p => p.x));
    const faceRight = Math.max(...jawLine.map(p => p.x));
    faceRadiusX = (faceRight - faceLeft) / 2 * 0.85; // 더 좁게

    // 얼굴 높이: 눈 ~ 턱 (눈썹 위는 머리!)
    faceRadiusY = (jawBottomY - eyeY) / 2 * 0.95; // 더 짧게
  }

  // 4. 블렌딩 크기 (얼굴 크기에 비례) - 넓게 설정하여 자연스러운 전환
  const blendSize = Math.min(faceRadiusX, faceRadiusY) * 0.4;

  // 5. 픽셀 데이터 가져오기
  // ctx에는 현재 원본 이미지가 있음
  const originalData = ctx.getImageData(0, 0, width, height);
  const aiData = aiCtx.getImageData(0, 0, width, height);
  const resultData = ctx.createImageData(width, height);

  // 6. 픽셀 단위로 합성 - 원본을 베이스로, 머리만 AI
  // 핵심: 얼굴 내부 = 원본 100%, 얼굴 외부(머리) = AI 100%
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // 타원 방정식: (x-cx)²/rx² + (y-cy)²/ry² <= 1 이면 내부
      const normalizedX = (x - faceCenterX) / faceRadiusX;
      const normalizedY = (y - faceCenterY) / faceRadiusY;
      const ellipseValue = normalizedX * normalizedX + normalizedY * normalizedY;

      // 원본 가중치 (얼굴 영역에서 1, 머리 영역에서 0)
      let originalWeight = 0;

      if (ellipseValue <= 1.0) {
        // 타원 내부: 원본 얼굴 100%
        originalWeight = 1.0;
      } else {
        // 타원 외부: 블렌딩 영역 계산
        const distFromEllipse = Math.sqrt(ellipseValue) - 1.0;
        const normalizedBlend = blendSize / Math.min(faceRadiusX, faceRadiusY);

        if (distFromEllipse < normalizedBlend) {
          // 블렌딩 영역: 부드럽게 전환 (원본 → AI)
          const t = distFromEllipse / normalizedBlend;
          originalWeight = 1.0 - (t * t * (3 - 2 * t)); // smoothstep
        }
        // else: originalWeight = 0 (머리 영역 = AI 이미지 100%)
      }

      const aiWeight = 1 - originalWeight;

      // 픽셀 합성
      resultData.data[idx] = Math.round(
        originalData.data[idx] * originalWeight + aiData.data[idx] * aiWeight
      );
      resultData.data[idx + 1] = Math.round(
        originalData.data[idx + 1] * originalWeight + aiData.data[idx + 1] * aiWeight
      );
      resultData.data[idx + 2] = Math.round(
        originalData.data[idx + 2] * originalWeight + aiData.data[idx + 2] * aiWeight
      );
      resultData.data[idx + 3] = 255;
    }
  }

  // 7. 결과 이미지 적용
  ctx.putImageData(resultData, 0, 0);

  return canvas.toDataURL('image/jpeg', 0.95);
};

/**
 * 얼굴 위치를 맞춰서 합성 (AI 이미지의 얼굴 위치가 다른 경우)
 *
 * 핵심 원리:
 * 1. 원본과 AI 이미지에서 각각 얼굴 위치 감지
 * 2. AI 이미지의 머리 부분을 원본 얼굴 위치에 맞게 변환
 * 3. 원본 얼굴은 그대로 유지, 머리만 AI에서 가져옴
 */
export const composeFaceWithAlignment = async (
  originalImage: string,
  aiGeneratedImage: string,
  originalFace: FaceRegion,
  _aiFace?: FaceRegion // AI 얼굴 위치 (향후 위치 맞춤에 사용)
): Promise<string> => {
  const originalImg = await createImageElement(originalImage);
  const aiImg = await createImageElement(aiGeneratedImage);

  const canvas = document.createElement('canvas');
  const width = originalImg.width;
  const height = originalImg.height;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. 원본 이미지를 베이스로 사용 (얼굴 100% 보존)
  ctx.drawImage(originalImg, 0, 0, width, height);

  // 2. 얼굴 중심 위치 계산
  const originalCenterY = originalFace.y + originalFace.height / 2;

  // 5. 머리 영역에 대해서만 AI 이미지를 합성
  // 얼굴 보호 영역 계산 (원본 기준)
  let faceCenterY = originalCenterY;
  let faceRadiusY = originalFace.height / 2 * 0.8;

  if (originalFace.landmarks) {
    const leftEye = originalFace.landmarks.leftEye;
    const rightEye = originalFace.landmarks.rightEye;
    const jawLine = originalFace.landmarks.jawLine;

    const eyeY = (leftEye[0].y + rightEye[0].y) / 2;
    const jawBottomY = Math.max(...jawLine.map(p => p.y));
    faceCenterY = (eyeY + jawBottomY) / 2;
    faceRadiusY = (jawBottomY - eyeY) / 2 * 1.1;
  }

  // 6. 픽셀 데이터로 합성
  const originalData = ctx.getImageData(0, 0, width, height);
  const resultData = ctx.createImageData(width, height);

  // AI 이미지를 원본 크기로 스케일링
  const aiScaledCanvas = document.createElement('canvas');
  aiScaledCanvas.width = width;
  aiScaledCanvas.height = height;
  const aiScaledCtx = aiScaledCanvas.getContext('2d')!;
  aiScaledCtx.drawImage(aiImg, 0, 0, width, height);
  const aiData = aiScaledCtx.getImageData(0, 0, width, height);

  // 머리 영역 경계 (원본 이미지 기준)
  const hairBoundaryY = faceCenterY - faceRadiusY * 0.5; // 눈 위쪽부터 AI 머리
  const blendHeight = faceRadiusY * 0.4; // 블렌딩 영역

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // 머리 영역인지 판단 (y가 hairBoundaryY보다 위)
      let aiWeight = 0;

      if (y < hairBoundaryY - blendHeight) {
        // 머리 영역: AI 100%
        aiWeight = 1.0;
      } else if (y < hairBoundaryY + blendHeight) {
        // 블렌딩 영역: 부드럽게 전환
        const t = (y - (hairBoundaryY - blendHeight)) / (blendHeight * 2);
        aiWeight = 1.0 - (t * t * (3 - 2 * t)); // smoothstep (AI에서 원본으로)
      }
      // else: 얼굴 영역: 원본 100%

      const originalWeight = 1 - aiWeight;

      // 픽셀 합성
      resultData.data[idx] = Math.round(
        originalData.data[idx] * originalWeight + aiData.data[idx] * aiWeight
      );
      resultData.data[idx + 1] = Math.round(
        originalData.data[idx + 1] * originalWeight + aiData.data[idx + 1] * aiWeight
      );
      resultData.data[idx + 2] = Math.round(
        originalData.data[idx + 2] * originalWeight + aiData.data[idx + 2] * aiWeight
      );
      resultData.data[idx + 3] = 255;
    }
  }

  ctx.putImageData(resultData, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.95);
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

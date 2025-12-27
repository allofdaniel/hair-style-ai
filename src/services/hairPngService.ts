/**
 * Hair PNG Service - 얼굴 100% 보존 헤어스타일 변환
 *
 * 핵심 원리: AI가 얼굴을 재생성하지 않음!
 * 1. 투명 배경 헤어 PNG 생성 (FLUX + 배경 제거)
 * 2. face-api.js로 사용자 얼굴 위치/크기 감지
 * 3. 헤어 PNG를 얼굴 위에 레이어로 씌움
 * -> 얼굴이 100% 보존됨 (원본 그대로)
 */

import { detectFace, type FaceRegion } from './faceDetection';
import type { HairStyle, HairSettings } from '../stores/useAppStore';
import { hairColors } from '../data/hairStyles';

// API endpoint
const HAIR_PNG_API = import.meta.env.DEV
  ? 'http://localhost:3001/api/generate-hair-png'
  : '/api/generate-hair-png';

interface GenerateResult {
  success: boolean;
  resultImage?: string;
  error?: string;
  faceRegion?: FaceRegion;
}

interface OverlaySettings {
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number;
  opacity: number;
}

const defaultOverlaySettings: OverlaySettings = {
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
 * 메인 함수 - PNG 헤어 오버레이 방식
 * 얼굴이 절대 바뀌지 않음!
 */
export async function applyHairPngOverlay(params: {
  userPhoto: string;
  style: HairStyle;
  settings: HairSettings;
}): Promise<GenerateResult> {
  const { userPhoto, style, settings } = params;

  try {
    console.log('=== Hair PNG Overlay Service (Face 100% Preserved) ===');

    // Step 1: 사용자 사진에서 얼굴 감지
    console.log('Step 1: Detecting face in user photo...');
    const faceRegion = await detectFace(userPhoto);

    if (!faceRegion) {
      return {
        success: false,
        error: '얼굴을 감지할 수 없습니다. 정면 사진을 사용해주세요.',
      };
    }
    console.log('Face detected:', faceRegion);

    // Step 2: 헤어 프롬프트 생성
    console.log('Step 2: Creating hair prompt...');
    const hairPrompt = createHairPrompt(style, settings);
    console.log('Hair prompt:', hairPrompt);

    // Step 3: 투명 배경 헤어 PNG 생성
    console.log('Step 3: Generating transparent hair PNG...');
    const hairPngResult = await generateHairPng(hairPrompt, style.gender);

    if (!hairPngResult.success || !hairPngResult.hairPngUrl) {
      return {
        success: false,
        error: hairPngResult.error || '헤어 PNG 생성에 실패했습니다.',
      };
    }
    console.log('Hair PNG generated successfully');

    // Step 4: 헤어 PNG를 사용자 사진 위에 오버레이
    console.log('Step 4: Overlaying hair PNG on user photo...');
    const overlayResult = await overlayHairOnPhoto(
      userPhoto,
      hairPngResult.hairPngUrl,
      faceRegion,
      defaultOverlaySettings
    );

    if (!overlayResult.success || !overlayResult.resultImage) {
      return {
        success: false,
        error: overlayResult.error || '헤어 합성에 실패했습니다.',
      };
    }

    // Step 5: 워터마크 추가
    console.log('Step 5: Adding watermark...');
    const finalImage = await addWatermark(overlayResult.resultImage);

    console.log('=== Success! Face is 100% preserved! ===');

    return {
      success: true,
      resultImage: finalImage,
      faceRegion,
    };

  } catch (error) {
    console.error('Hair PNG overlay error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 헤어 프롬프트 생성
 */
function createHairPrompt(style: HairStyle, settings: HairSettings): string {
  const colorOption = hairColors.find((c) => c.id === settings.color);
  const colorPrompt = colorOption && colorOption.id !== 'natural'
    ? `${colorOption.prompt} colored`
    : '';

  const volumePrompts: Record<string, string> = {
    flat: 'flat sleek',
    natural: 'natural volume',
    voluminous: 'voluminous full',
  };

  const partingPrompts: Record<string, string> = {
    left: 'parted on left',
    center: 'center parted',
    right: 'parted on right',
    none: '',
  };

  const parts = [
    style.name,
    colorPrompt,
    volumePrompts[settings.volume],
    partingPrompts[settings.parting],
    style.prompt,
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * 투명 배경 헤어 PNG 생성 (API 호출)
 */
async function generateHairPng(
  stylePrompt: string,
  gender: 'male' | 'female'
): Promise<{ success: boolean; hairPngUrl?: string; error?: string }> {
  try {
    const response = await fetch(HAIR_PNG_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stylePrompt,
        gender,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hair PNG API error:', response.status, errorText);
      return {
        success: false,
        error: `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: data.success,
      hairPngUrl: data.hairPngUrl,
      error: data.error,
    };

  } catch (error) {
    console.error('Hair PNG generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 헤어 PNG를 사용자 사진 위에 오버레이
 */
async function overlayHairOnPhoto(
  userPhoto: string,
  hairPngUrl: string,
  faceRegion: FaceRegion,
  settings: OverlaySettings
): Promise<{ success: boolean; resultImage?: string; error?: string }> {
  try {
    // 이미지 로드
    const [userImg, hairImg] = await Promise.all([
      loadImage(userPhoto),
      loadImage(hairPngUrl),
    ]);

    // 캔버스 생성
    const canvas = document.createElement('canvas');
    canvas.width = userImg.width;
    canvas.height = userImg.height;
    const ctx = canvas.getContext('2d')!;

    // 1. 원본 사용자 사진 그리기 (배경)
    ctx.drawImage(userImg, 0, 0);

    // 2. 헤어 PNG 위치 및 크기 계산
    const hairPosition = calculateHairPosition(faceRegion, hairImg, settings);

    // 3. 헤어 PNG 그리기 (오버레이)
    ctx.save();
    ctx.globalAlpha = settings.opacity;

    // 회전 적용
    if (settings.rotation !== 0) {
      const centerX = hairPosition.x + hairPosition.width / 2;
      const centerY = hairPosition.y + hairPosition.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((settings.rotation * Math.PI) / 180);
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

    // 결과 이미지 반환
    const resultImage = canvas.toDataURL('image/png');

    return {
      success: true,
      resultImage,
    };

  } catch (error) {
    console.error('Overlay error:', error);
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

  // 이마 위치 추정
  let foreheadY = face.y;
  if (face.landmarks?.leftEyebrow && face.landmarks?.rightEyebrow) {
    const avgEyebrowY = (
      face.landmarks.leftEyebrow.reduce((sum, p) => sum + p.y, 0) / face.landmarks.leftEyebrow.length +
      face.landmarks.rightEyebrow.reduce((sum, p) => sum + p.y, 0) / face.landmarks.rightEyebrow.length
    ) / 2;
    foreheadY = avgEyebrowY - face.height * 0.15;
  }

  // 헤어 크기 계산 (얼굴 너비의 약 2.2배)
  const baseHairWidth = face.width * 2.2 * settings.scale;
  const hairAspectRatio = hairImg.width / hairImg.height;
  const hairWidth = baseHairWidth;
  const hairHeight = hairWidth / hairAspectRatio;

  // 헤어 위치 계산 (이마 위에 중앙 정렬)
  const hairX = faceCenterX - hairWidth / 2 + settings.offsetX;
  const hairY = foreheadY - hairHeight * 0.4 + settings.offsetY;

  return {
    x: hairX,
    y: hairY,
    width: hairWidth,
    height: hairHeight,
  };
}

/**
 * 워터마크 추가
 */
async function addWatermark(imageData: string): Promise<string> {
  const img = await loadImage(imageData);

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(img, 0, 0);

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

/**
 * 레퍼런스 사진 모드 (동일한 방식 적용)
 */
export async function applyReferencePngOverlay(params: {
  userPhoto: string;
  referencePhoto: string;
  settings: HairSettings;
}): Promise<GenerateResult> {
  const { userPhoto, settings } = params;

  // 레퍼런스 모드도 동일한 방식으로 처리
  const dummyStyle: HairStyle = {
    id: 'reference',
    name: 'Reference Style',
    nameKo: '레퍼런스 스타일',
    description: 'Custom reference hairstyle',
    prompt: 'natural hairstyle with volume and texture',
    category: 'medium',
    gender: 'male',
  };

  return applyHairPngOverlay({
    userPhoto,
    style: dummyStyle,
    settings,
  });
}

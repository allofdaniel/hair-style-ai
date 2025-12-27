/**
 * Admin 페이지 - 헤어스타일 레퍼런스 이미지 관리
 * - 각 스타일별 이미지 미리보기
 * - 프롬프트 수정
 * - Gemini로 새 이미지 생성
 * - S3 업로드
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { hairStyles } from '../data/hairStyles';
import type { HairStyle } from '../stores/useAppStore';
import IOSButton, { IOSIconButton } from '../components/IOSButton';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

type GenderFilter = 'all' | 'male' | 'female';
type GenerationMode = 'text' | 'reference' | 'direct-upload';

// 한글/영어 프롬프트 템플릿 - Gemini는 한글도 잘 이해함
const PROMPT_TEMPLATES = {
  korean_portrait: (gender: string, hairDesc: string) => `전문 미용실 레퍼런스 사진.
${gender === 'male' ? '젊은 한국인 남성' : '젊은 한국인 여성'}의 ${hairDesc}.

요구사항:
- 정면 인물 사진, 머리와 어깨만
- 깔끔한 흰색/연회색 스튜디오 배경
- 전문적인 스튜디오 조명, 부드럽고 균일
- 헤어스타일 디테일과 질감에 집중
- 자연스럽고 사실적인 사진 품질
- 머리카락이 메인 포커스
- 중립적인 표정, 카메라를 바라봄`,

  celebrity_style: (gender: string, hairDesc: string, celebrity?: string) => `전문 K-pop 아이돌 스타일 화보 촬영.
${gender === 'male' ? '잘생긴 한국 남자 연예인' : '예쁜 한국 여자 연예인'}${celebrity ? ` ${celebrity} 스타일` : ''}의 ${hairDesc}.

요구사항:
- 매거진 커버 퀄리티 인물 사진
- 부드러운 그라데이션 배경
- 헤어스타일을 강조하는 완벽한 조명
- 화려하지만 자연스러운 느낌
- 머리카락 질감과 스타일이 선명하게 보임`,

  natural_casual: (gender: string, hairDesc: string) => `자연스러운 라이프스타일 인물 사진.
${gender === 'male' ? '한국인 남성' : '한국인 여성'}의 ${hairDesc}.

요구사항:
- 캐주얼하고 자연스러운 포즈
- 야외 또는 부드러운 실내 조명
- 편안한 표정
- 머리카락이 자연스럽고 편안하게 보임
- 깔끔하고 심플한 배경`,

  simple_korean: (gender: string, hairDesc: string) => `${gender === 'male' ? '한국인 남자' : '한국인 여자'}의 ${hairDesc} 헤어스타일.
정면 사진, 흰 배경, 고화질, 사실적인 인물 사진.`,
};

interface StyleWithCustomPrompt extends HairStyle {
  customPrompt?: string;
  generatedImage?: string;
  uploadedReference?: string;
  isGenerating?: boolean;
  error?: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const [styles, setStyles] = useState<StyleWithCustomPrompt[]>([]);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<StyleWithCustomPrompt | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [generationMode, setGenerationMode] = useState<GenerationMode>('text');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof PROMPT_TEMPLATES>('simple_korean');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directUploadRef = useRef<HTMLInputElement>(null);

  // 스타일 초기화
  useEffect(() => {
    setStyles(hairStyles.map(s => ({ ...s })));
  }, []);

  // 필터링된 스타일
  const filteredStyles = styles.filter(style => {
    const matchesGender = genderFilter === 'all' || style.gender === genderFilter;
    const matchesSearch = searchQuery === '' ||
      style.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      style.nameKo.includes(searchQuery);
    return matchesGender && matchesSearch;
  });

  // 스타일 선택
  const handleSelectStyle = (style: StyleWithCustomPrompt) => {
    setSelectedStyle(style);
    setEditPrompt(style.customPrompt || style.prompt);
    setGeneratedPreview(style.generatedImage || null);
    setReferenceImage(style.uploadedReference || null);
    setUploadStatus('');
    setGenerationMode('text');
  };

  // 참조 이미지 업로드
  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setReferenceImage(base64);
      setGenerationMode('reference');
    };
    reader.readAsDataURL(file);
  };

  // 템플릿 적용
  const applyTemplate = (template: keyof typeof PROMPT_TEMPLATES) => {
    if (!selectedStyle) return;
    setSelectedTemplate(template);

    const celebrity = selectedStyle.celebrities?.[0];
    const templateFn = PROMPT_TEMPLATES[template];

    if (template === 'celebrity_style') {
      const fullPrompt = (templateFn as typeof PROMPT_TEMPLATES.celebrity_style)(
        selectedStyle.gender,
        editPrompt,
        celebrity
      );
      setEditPrompt(fullPrompt);
    } else {
      const fullPrompt = (templateFn as typeof PROMPT_TEMPLATES.korean_portrait)(
        selectedStyle.gender,
        editPrompt
      );
      setEditPrompt(fullPrompt);
    }
  };

  // Gemini로 이미지 생성 (텍스트 또는 참조 이미지 기반)
  const handleGenerateImage = async () => {
    if (!selectedStyle || !editPrompt) return;

    setIsGenerating(true);
    setUploadStatus('');

    try {
      let requestBody;

      if (generationMode === 'reference' && referenceImage) {
        // 참조 이미지 기반 생성
        const base64Data = referenceImage.includes('base64,')
          ? referenceImage.split('base64,')[1]
          : referenceImage;

        let mimeType = 'image/jpeg';
        if (referenceImage.includes('data:image/png')) mimeType = 'image/png';
        else if (referenceImage.includes('data:image/webp')) mimeType = 'image/webp';

        const refPrompt = `Generate a professional hair salon reference photo based on the hairstyle in this reference image.

The hairstyle to replicate: ${editPrompt}

Create a ${selectedStyle.gender === 'male' ? 'Korean man' : 'Korean woman'} with this exact hairstyle.

Requirements:
- Copy the hairstyle from the reference image exactly
- Front-facing portrait, head and shoulders
- Clean white/light gray studio background
- Professional studio lighting
- Natural, realistic photo quality
- Neutral expression, looking at camera`;

        requestBody = {
          contents: [{
            role: 'user',
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              { text: refPrompt },
            ],
          }],
          generationConfig: {
            responseModalities: ['image', 'text'],
          },
        };
      } else {
        // 텍스트 기반 생성
        const fullPrompt = PROMPT_TEMPLATES[selectedTemplate](selectedStyle.gender, editPrompt);

        requestBody = {
          contents: [{
            role: 'user',
            parts: [{ text: fullPrompt }],
          }],
          generationConfig: {
            responseModalities: ['image', 'text'],
          },
        };
      }

      console.log('Generating image...');

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const imagePart = data.candidates?.[0]?.content?.parts?.find(
        (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData
      );

      if (imagePart?.inlineData) {
        const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        setGeneratedPreview(imageUrl);

        // 스타일 업데이트
        setStyles(prev => prev.map(s =>
          s.id === selectedStyle.id
            ? { ...s, customPrompt: editPrompt, generatedImage: imageUrl, uploadedReference: referenceImage || undefined }
            : s
        ));
        setSelectedStyle(prev => prev ? { ...prev, customPrompt: editPrompt, generatedImage: imageUrl } : null);
      } else {
        throw new Error('No image in response');
      }
    } catch (error) {
      console.error('Generation error:', error);
      setUploadStatus(`생성 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // S3에 업로드 (서버리스 함수 통해)
  const handleUploadToS3 = async () => {
    if (!selectedStyle || !generatedPreview) return;

    setUploadStatus('업로드 중...');

    try {
      // Base64 데이터 추출
      const base64Data = generatedPreview.split('base64,')[1];
      const fileName = `${selectedStyle.gender}/${selectedStyle.id.replace('m-', '').replace('f-', '')}.png`;

      // Vercel 서버리스 함수로 업로드
      const response = await fetch('/api/upload-to-s3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          imageData: base64Data,
          contentType: 'image/png',
        }),
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      setUploadStatus(`업로드 성공! ${result.url}`);

      // 프롬프트 저장
      savePromptToLocal(selectedStyle.id, editPrompt);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`업로드 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // 로컬 스토리지에 프롬프트 저장
  const savePromptToLocal = (styleId: string, prompt: string) => {
    const savedPrompts = JSON.parse(localStorage.getItem('customPrompts') || '{}');
    savedPrompts[styleId] = prompt;
    localStorage.setItem('customPrompts', JSON.stringify(savedPrompts));
  };

  // 이미지 다운로드
  const handleDownloadImage = () => {
    if (!generatedPreview || !selectedStyle) return;

    const link = document.createElement('a');
    link.href = generatedPreview;
    link.download = `${selectedStyle.id}.png`;
    link.click();
  };

  // 프롬프트 내보내기
  const handleExportPrompts = () => {
    const prompts = styles.reduce((acc, style) => {
      acc[style.id] = {
        name: style.name,
        nameKo: style.nameKo,
        originalPrompt: style.prompt,
        customPrompt: style.customPrompt || style.prompt,
      };
      return acc;
    }, {} as Record<string, { name: string; nameKo: string; originalPrompt: string; customPrompt: string }>);

    const blob = new Blob([JSON.stringify(prompts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hairstyle-prompts.json';
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* 헤더 */}
      <header className="sticky top-0 bg-white border-b border-[#e5e8eb] z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <IOSIconButton variant="ghost" onClick={() => navigate('/')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </IOSIconButton>
            <h1 className="text-xl font-bold text-[#191f28]">헤어스타일 관리자</h1>
          </div>
          <IOSButton variant="secondary" size="sm" onClick={handleExportPrompts}>
            프롬프트 내보내기
          </IOSButton>
        </div>

        {/* 필터 */}
        <div className="max-w-7xl mx-auto px-4 pb-4 flex gap-3">
          <input
            type="text"
            placeholder="스타일 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 rounded-xl border border-[#e5e8eb] text-[14px] focus:outline-none focus:border-[#3182f6]"
          />
          <div className="flex gap-1 bg-[#f2f4f6] p-1 rounded-xl">
            {(['all', 'male', 'female'] as GenderFilter[]).map((g) => (
              <button
                key={g}
                onClick={() => setGenderFilter(g)}
                className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  genderFilter === g
                    ? 'bg-white shadow-sm text-[#191f28]'
                    : 'text-[#6b7684]'
                }`}
              >
                {g === 'all' ? '전체' : g === 'male' ? '남성' : '여성'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* 스타일 목록 */}
        <div className="w-1/2">
          <div className="bg-white rounded-2xl border border-[#e5e8eb] overflow-hidden">
            <div className="p-4 border-b border-[#e5e8eb]">
              <p className="text-[14px] text-[#6b7684]">
                {filteredStyles.length}개 스타일
              </p>
            </div>
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
              {filteredStyles.map((style) => (
                <div
                  key={style.id}
                  onClick={() => handleSelectStyle(style)}
                  className={`flex items-center gap-4 p-4 border-b border-[#f2f4f6] cursor-pointer transition-all hover:bg-[#f7f8fa] ${
                    selectedStyle?.id === style.id ? 'bg-[#3182f6]/5' : ''
                  }`}
                >
                  {/* 썸네일 */}
                  <div className="w-16 h-16 rounded-xl bg-[#f2f4f6] overflow-hidden flex-shrink-0">
                    <img
                      src={style.generatedImage || style.thumbnail}
                      alt={style.nameKo}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=No+Image';
                      }}
                    />
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        style.gender === 'male'
                          ? 'bg-[#3182f6]/10 text-[#3182f6]'
                          : 'bg-[#6b5ce7]/10 text-[#6b5ce7]'
                      }`}>
                        {style.gender === 'male' ? '남성' : '여성'}
                      </span>
                      {style.customPrompt && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#00c471]/10 text-[#00c471]">
                          수정됨
                        </span>
                      )}
                      {style.generatedImage && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#f59e0b]/10 text-[#f59e0b]">
                          새 이미지
                        </span>
                      )}
                    </div>
                    <p className="text-[15px] font-semibold text-[#191f28] mt-1 truncate">
                      {style.nameKo}
                    </p>
                    <p className="text-[12px] text-[#8b95a1] truncate">
                      {style.name}
                    </p>
                  </div>

                  {/* 화살표 */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b0b8c1" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 편집 패널 */}
        <div className="w-1/2">
          {selectedStyle ? (
            <div className="bg-white rounded-2xl border border-[#e5e8eb] p-6 sticky top-[180px]">
              {/* 스타일 정보 */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-24 h-24 rounded-2xl bg-[#f2f4f6] overflow-hidden">
                  <img
                    src={generatedPreview || selectedStyle.thumbnail}
                    alt={selectedStyle.nameKo}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96?text=No+Image';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-[#191f28]">{selectedStyle.nameKo}</h2>
                  <p className="text-[14px] text-[#6b7684]">{selectedStyle.name}</p>
                  <p className="text-[13px] text-[#8b95a1] mt-2">{selectedStyle.description}</p>
                </div>
              </div>

              {/* 생성 모드 선택 */}
              <div className="mb-4">
                <label className="block text-[14px] font-semibold text-[#191f28] mb-2">
                  생성 방식
                </label>
                <div className="flex gap-2 bg-[#f2f4f6] p-1 rounded-xl">
                  <button
                    onClick={() => setGenerationMode('text')}
                    className={`flex-1 py-2 px-3 rounded-lg text-[12px] font-medium transition-all ${
                      generationMode === 'text'
                        ? 'bg-white shadow-sm text-[#191f28]'
                        : 'text-[#6b7684]'
                    }`}
                  >
                    텍스트
                  </button>
                  <button
                    onClick={() => setGenerationMode('reference')}
                    className={`flex-1 py-2 px-3 rounded-lg text-[12px] font-medium transition-all ${
                      generationMode === 'reference'
                        ? 'bg-white shadow-sm text-[#191f28]'
                        : 'text-[#6b7684]'
                    }`}
                  >
                    참조 이미지
                  </button>
                  <button
                    onClick={() => setGenerationMode('direct-upload')}
                    className={`flex-1 py-2 px-3 rounded-lg text-[12px] font-medium transition-all ${
                      generationMode === 'direct-upload'
                        ? 'bg-white shadow-sm text-[#191f28]'
                        : 'text-[#6b7684]'
                    }`}
                  >
                    직접 업로드
                  </button>
                </div>
              </div>

              {/* 참조 이미지 업로드 (reference 모드일 때) */}
              {generationMode === 'reference' && (
                <div className="mb-4">
                  <label className="block text-[14px] font-semibold text-[#191f28] mb-2">
                    참조 이미지
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleReferenceUpload}
                    className="hidden"
                  />
                  {referenceImage ? (
                    <div className="relative">
                      <img
                        src={referenceImage}
                        alt="Reference"
                        className="w-full h-48 object-cover rounded-xl"
                      />
                      <button
                        onClick={() => setReferenceImage(null)}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 border-2 border-dashed border-[#e5e8eb] rounded-xl flex flex-col items-center justify-center text-[#8b95a1] hover:border-[#3182f6] hover:text-[#3182f6] transition-all"
                    >
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="3"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                      </svg>
                      <span className="text-[13px] mt-2">참조 이미지 업로드</span>
                    </button>
                  )}
                </div>
              )}

              {/* 직접 업로드 모드 */}
              {generationMode === 'direct-upload' && (
                <div className="mb-4">
                  <p className="block text-[14px] font-semibold text-[#191f28] mb-2">
                    레퍼런스 이미지 직접 업로드
                  </p>
                  {generatedPreview ? (
                    <div className="relative">
                      <img
                        src={generatedPreview}
                        alt="Uploaded"
                        className="w-full h-48 object-cover rounded-xl"
                      />
                      <button
                        onClick={() => setGeneratedPreview(null)}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-40 border-2 border-dashed border-[#00c471] rounded-xl flex flex-col items-center justify-center text-[#00c471] hover:bg-[#00c471]/5 transition-all cursor-pointer">
                      <input
                        type="file"
                        ref={directUploadRef}
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const base64 = reader.result as string;
                            setGeneratedPreview(base64);
                            // 스타일 업데이트
                            if (selectedStyle) {
                              setStyles(prev => prev.map(s =>
                                s.id === selectedStyle.id
                                  ? { ...s, generatedImage: base64 }
                                  : s
                              ));
                              setSelectedStyle(prev => prev ? { ...prev, generatedImage: base64 } : null);
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="hidden"
                      />
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <span className="text-[14px] font-medium mt-3">클릭하여 이미지 업로드</span>
                      <span className="text-[12px] text-[#8b95a1] mt-1">PNG, JPG, WEBP 지원</span>
                    </label>
                  )}
                  <p className="text-[12px] text-[#8b95a1] mt-2">
                    * Gemini 생성 없이 직접 이미지를 업로드하여 S3에 저장합니다
                  </p>
                </div>
              )}

              {/* 템플릿 선택 (text 모드일 때) */}
              {generationMode === 'text' && (
                <div className="mb-4">
                  <label className="block text-[14px] font-semibold text-[#191f28] mb-2">
                    프롬프트 템플릿
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'simple_korean', label: '간단 한글' },
                      { id: 'korean_portrait', label: '스튜디오 촬영' },
                      { id: 'celebrity_style', label: '셀럽 스타일' },
                      { id: 'natural_casual', label: '내추럴 캐주얼' },
                    ].map((template) => (
                      <button
                        key={template.id}
                        onClick={() => applyTemplate(template.id as keyof typeof PROMPT_TEMPLATES)}
                        className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                          selectedTemplate === template.id
                            ? 'bg-[#3182f6] text-white'
                            : 'bg-[#f2f4f6] text-[#6b7684] hover:bg-[#e5e8eb]'
                        }`}
                      >
                        {template.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 프롬프트 편집 (직접 업로드가 아닐 때만) */}
              {generationMode !== 'direct-upload' && (
                <div className="mb-6">
                  <label className="block text-[14px] font-semibold text-[#191f28] mb-2">
                    {generationMode === 'text' ? '헤어스타일 설명 (한글로 입력 가능)' : '헤어스타일 보조 설명'}
                  </label>
                  <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-[#e5e8eb] text-[14px] focus:outline-none focus:border-[#3182f6] resize-none"
                    placeholder="예: 앞머리가 있는 단발 커트, 웨이브 펌, 투블럭 등..."
                  />
                  <p className="text-[12px] text-[#8b95a1] mt-2">
                    {generationMode === 'text'
                      ? '* 한글로 입력해도 됩니다. 템플릿에 맞춰 자동으로 포맷팅됩니다.'
                      : '* 참조 이미지의 헤어스타일을 기반으로 새 이미지를 생성합니다'}
                  </p>
                </div>
              )}

              {/* 액션 버튼 (직접 업로드가 아닐 때만) */}
              {generationMode !== 'direct-upload' && (
                <div className="flex gap-3 mb-6">
                  <IOSButton
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleGenerateImage}
                    disabled={isGenerating || !editPrompt || (generationMode === 'reference' && !referenceImage)}
                  >
                    {isGenerating ? (
                      <>
                        <svg className="w-5 h-5 animate-spin mr-2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" />
                        </svg>
                        생성 중...
                      </>
                    ) : generationMode === 'reference' ? (
                      '📷 참조 기반 생성'
                    ) : (
                      '🎨 이미지 생성'
                    )}
                  </IOSButton>
                </div>
              )}

              {/* 직접 업로드 모드일 때 S3 업로드 버튼 */}
              {generationMode === 'direct-upload' && generatedPreview && (
                <div className="flex gap-3 mb-6">
                  <IOSButton variant="secondary" size="md" fullWidth onClick={handleDownloadImage}>
                    💾 다운로드
                  </IOSButton>
                  <IOSButton variant="primary" size="md" fullWidth onClick={handleUploadToS3}>
                    ☁️ S3 업로드
                  </IOSButton>
                </div>
              )}

              {/* 생성된 미리보기 (직접 업로드가 아닐 때만) */}
              {generatedPreview && generationMode !== 'direct-upload' && (
                <div className="mb-6">
                  <label className="block text-[14px] font-semibold text-[#191f28] mb-2">
                    생성된 이미지
                  </label>
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#f2f4f6]">
                    <img
                      src={generatedPreview}
                      alt="Generated preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-3 mt-4">
                    <IOSButton variant="secondary" size="md" fullWidth onClick={handleDownloadImage}>
                      💾 다운로드
                    </IOSButton>
                    <IOSButton variant="primary" size="md" fullWidth onClick={handleUploadToS3}>
                      ☁️ S3 업로드
                    </IOSButton>
                  </div>
                </div>
              )}

              {/* 업로드 상태 */}
              {uploadStatus && (
                <div className={`p-4 rounded-xl text-[14px] ${
                  uploadStatus.includes('성공')
                    ? 'bg-[#00c471]/10 text-[#00c471]'
                    : uploadStatus.includes('실패')
                    ? 'bg-[#f04452]/10 text-[#f04452]'
                    : 'bg-[#3182f6]/10 text-[#3182f6]'
                }`}>
                  {uploadStatus}
                </div>
              )}

              {/* 원본 프롬프트 */}
              <div className="mt-6 pt-6 border-t border-[#f2f4f6]">
                <p className="text-[12px] text-[#8b95a1] mb-2">원본 프롬프트:</p>
                <p className="text-[13px] text-[#6b7684] bg-[#f7f8fa] p-3 rounded-lg">
                  {selectedStyle.prompt}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#e5e8eb] p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f2f4f6] flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b0b8c1" strokeWidth="1.5">
                  <path d="M12 2C9.5 2 8 3.5 8 6c0 1.5.5 2.5 1 3.5S8 12 6 13c-3 1.5-3 4-3 6h18c0-2 0-4.5-3-6-2-1-2-2.5-1.5-3.5S16 7.5 16 6c0-2.5-1.5-4-4-4z" />
                </svg>
              </div>
              <p className="text-[16px] font-medium text-[#191f28]">스타일을 선택하세요</p>
              <p className="text-[14px] text-[#8b95a1] mt-1">
                왼쪽 목록에서 스타일을 선택하면<br />프롬프트를 수정하고 이미지를 생성할 수 있습니다
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 헤어 염색 색상 데이터
 */

export interface HairColor {
  id: string;
  name: string;
  nameKo: string;
  hex: string;
  category: 'natural' | 'fashion' | 'highlight' | 'ombre';
}

export const hairColors: HairColor[] = [
  // 자연색 (Natural)
  { id: 'natural-black', name: 'Natural Black', nameKo: '내추럴 블랙', hex: '#1a1a1a', category: 'natural' },
  { id: 'dark-brown', name: 'Dark Brown', nameKo: '다크 브라운', hex: '#3d2314', category: 'natural' },
  { id: 'medium-brown', name: 'Medium Brown', nameKo: '미디엄 브라운', hex: '#5c3a21', category: 'natural' },
  { id: 'light-brown', name: 'Light Brown', nameKo: '라이트 브라운', hex: '#8b6914', category: 'natural' },
  { id: 'chestnut', name: 'Chestnut', nameKo: '밤색', hex: '#6f4e37', category: 'natural' },
  { id: 'auburn', name: 'Auburn', nameKo: '적갈색', hex: '#a52a2a', category: 'natural' },
  { id: 'honey-blonde', name: 'Honey Blonde', nameKo: '허니 블론드', hex: '#c9a86c', category: 'natural' },
  { id: 'platinum-blonde', name: 'Platinum Blonde', nameKo: '플래티넘 블론드', hex: '#e8e4c9', category: 'natural' },

  // 패션컬러 (Fashion)
  { id: 'ash-gray', name: 'Ash Gray', nameKo: '애쉬 그레이', hex: '#8a8a8a', category: 'fashion' },
  { id: 'silver', name: 'Silver', nameKo: '실버', hex: '#c0c0c0', category: 'fashion' },
  { id: 'blue-black', name: 'Blue Black', nameKo: '블루 블랙', hex: '#0d1b2a', category: 'fashion' },
  { id: 'burgundy', name: 'Burgundy', nameKo: '버건디', hex: '#722f37', category: 'fashion' },
  { id: 'wine-red', name: 'Wine Red', nameKo: '와인 레드', hex: '#8b0a1a', category: 'fashion' },
  { id: 'rose-pink', name: 'Rose Pink', nameKo: '로즈 핑크', hex: '#c08081', category: 'fashion' },
  { id: 'lavender', name: 'Lavender', nameKo: '라벤더', hex: '#9d8aa5', category: 'fashion' },
  { id: 'pastel-pink', name: 'Pastel Pink', nameKo: '파스텔 핑크', hex: '#f4c2c2', category: 'fashion' },
  { id: 'pastel-blue', name: 'Pastel Blue', nameKo: '파스텔 블루', hex: '#add8e6', category: 'fashion' },
  { id: 'mint-green', name: 'Mint Green', nameKo: '민트 그린', hex: '#98ff98', category: 'fashion' },
  { id: 'coral', name: 'Coral', nameKo: '코랄', hex: '#ff7f50', category: 'fashion' },
  { id: 'copper', name: 'Copper', nameKo: '카퍼', hex: '#b87333', category: 'fashion' },

  // 하이라이트 (Highlight)
  { id: 'blonde-highlight', name: 'Blonde Highlight', nameKo: '금발 하이라이트', hex: '#daa520', category: 'highlight' },
  { id: 'caramel-highlight', name: 'Caramel Highlight', nameKo: '카라멜 하이라이트', hex: '#d2691e', category: 'highlight' },
  { id: 'red-highlight', name: 'Red Highlight', nameKo: '레드 하이라이트', hex: '#cd5c5c', category: 'highlight' },

  // 옴브레 (Ombre - 그라데이션)
  { id: 'brown-ombre', name: 'Brown Ombre', nameKo: '브라운 옴브레', hex: '#8b4513', category: 'ombre' },
  { id: 'blonde-ombre', name: 'Blonde Ombre', nameKo: '블론드 옴브레', hex: '#f5deb3', category: 'ombre' },
  { id: 'red-ombre', name: 'Red Ombre', nameKo: '레드 옴브레', hex: '#dc143c', category: 'ombre' },
];

export const colorCategories = [
  { id: 'natural', nameKo: '내추럴' },
  { id: 'fashion', nameKo: '패션컬러' },
  { id: 'highlight', nameKo: '하이라이트' },
  { id: 'ombre', nameKo: '옴브레' },
];

export const getColorsByCategory = (category: string) => {
  return hairColors.filter(c => c.category === category);
};

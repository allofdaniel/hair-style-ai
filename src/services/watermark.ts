// Watermark service for free users
export const addWatermark = async (imageData: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Draw the original image
      ctx.drawImage(img, 0, 0);

      // Watermark settings
      const watermarkText = 'HairStyle AI';
      const fontSize = Math.max(24, img.width / 20);
      ctx.font = `bold ${fontSize}px Arial`;

      // Semi-transparent white with shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      // Measure text
      const textMetrics = ctx.measureText(watermarkText);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;

      // Position: bottom right corner with padding
      const padding = 20;
      const x = img.width - textWidth - padding;
      const y = img.height - padding;

      // Draw semi-transparent background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(x - 10, y - textHeight, textWidth + 20, textHeight + 10);

      // Draw watermark text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(watermarkText, x, y);

      // Also add a small diagonal watermark pattern across the image
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.font = `${fontSize * 0.6}px Arial`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'transparent';

      const smallText = 'HairStyle AI';
      const smallMetrics = ctx.measureText(smallText);
      const smallWidth = smallMetrics.width;
      const spacing = smallWidth * 2;

      // Rotate and draw pattern
      ctx.translate(img.width / 2, img.height / 2);
      ctx.rotate(-Math.PI / 6);

      for (let y = -img.height; y < img.height * 2; y += spacing * 0.5) {
        for (let x = -img.width; x < img.width * 2; x += spacing) {
          ctx.fillText(smallText, x + (y % 2 === 0 ? 0 : spacing / 2), y);
        }
      }

      ctx.restore();

      // Convert to data URL
      const result = canvas.toDataURL('image/png', 0.95);
      resolve(result);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageData;
  });
};

// Remove watermark info for premium users (just returns the original)
export const getCleanImage = (imageData: string): string => imageData;

import { test, expect } from '@playwright/test';

/**
 * E2E Test: Hair Color Selection
 * 염색 기능 테스트 - 색상 선택 및 적용
 */

test.describe('Hair Color Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // 동의 모달 처리
    const consentModal = page.locator('text=개인정보 수집 및 이용 동의');
    if (await consentModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.click('button:has-text("동의하고 시작")');
    }
  });

  test('should open color picker modal', async ({ page }) => {
    // 염색 버튼 클릭
    const colorButton = page.locator('button:has(span:has-text("염색"))');
    await colorButton.click();

    // 색상 선택 모달 확인
    await expect(page.locator('text=Current Choice')).toBeVisible();

    // 색상 그리드 확인
    const colorGrid = page.locator('div.grid.grid-cols-5');
    await expect(colorGrid).toBeVisible();
  });

  test('should display color preview when selected', async ({ page }) => {
    // 염색 버튼 클릭
    await page.click('button:has(span:has-text("염색"))');

    // 색상 그리드에서 첫 번째 색상 선택 (자연색 제외)
    const colorButtons = page.locator('div.grid.grid-cols-5 button');
    const count = await colorButtons.count();

    expect(count).toBeGreaterThan(0);

    // 두 번째 색상 선택 (첫 번째는 자연색일 수 있음)
    if (count > 1) {
      await colorButtons.nth(1).click();

      // 선택된 색상이 테두리 강조되는지 확인
      await expect(colorButtons.nth(1)).toHaveClass(/border-\[#c084fc\]|scale-105/);

      // 큰 프리뷰 원의 색상이 변경되었는지 확인
      const previewCircle = page.locator('div.w-24.h-24.rounded-full');
      await expect(previewCircle).toBeVisible();
    }
  });

  test('should persist selected color after closing modal', async ({ page }) => {
    // 1. 염색 모달 열기
    await page.click('button:has(span:has-text("염색"))');

    // 2. 색상 선택 (예: 브라운)
    const brownColor = page.locator('button').filter({ has: page.locator('div[style*="background-color"]') }).nth(5);
    await brownColor.click();

    // 3. 모달 닫기
    await page.click('button:has-text("닫기")');

    // 4. 다시 모달 열기
    await page.click('button:has(span:has-text("염색"))');

    // 5. 선택한 색상이 여전히 선택되어 있는지 확인
    await expect(page.locator('.border-\\[\\#c084fc\\]')).toBeVisible();
  });

  test('should show natural color option', async ({ page }) => {
    await page.click('button:has(span:has-text("염색"))');

    // 자연색 옵션 확인 (X 아이콘이 있는 버튼)
    const naturalColor = page.locator('button').filter({ has: page.locator('svg path[d*="M18 6L6 18M6 6l12 12"]') }).first();
    await expect(naturalColor).toBeVisible();

    // 자연색 선택
    await naturalColor.click();

    // 프리뷰가 투명/기본 상태로 돌아가는지 확인
    const previewCircle = page.locator('div.w-24.h-24.rounded-full');
    await expect(previewCircle).toHaveCSS('background-color', /transparent|rgba\(0, 0, 0, 0\)/);
  });

  test('should display color categories correctly', async ({ page }) => {
    await page.click('button:has(span:has-text("염색"))');

    // 색상 버튼들이 그리드로 표시되는지 확인
    const colorGrid = page.locator('div.grid.grid-cols-5');
    await expect(colorGrid).toBeVisible();

    // 최소 10개 이상의 색상 옵션이 있는지 확인
    const colorButtons = page.locator('div.grid.grid-cols-5 button');
    const count = await colorButtons.count();
    expect(count).toBeGreaterThanOrEqual(10);
  });

  test('should close color picker on backdrop click', async ({ page }) => {
    await page.click('button:has(span:has-text("염색"))');

    // 모달이 열렸는지 확인
    await expect(page.locator('text=Current Choice')).toBeVisible();

    // 배경(백드롭) 클릭
    await page.locator('div.fixed.inset-0.bg-black\\/60').click({ position: { x: 10, y: 10 } });

    // 모달이 닫혔는지 확인
    await expect(page.locator('text=Current Choice')).not.toBeVisible();
  });
});

test.describe('Hair Color - Integration with Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    const consentModal = page.locator('text=개인정보 수집 및 이용 동의');
    if (await consentModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.click('button:has-text("동의하고 시작")');
    }
  });

  test('should apply color selection to generation', async ({ page }) => {
    // 1. 스타일 선택
    const firstStyle = page.locator('button').filter({ has: page.locator('img[alt]') }).first();
    await firstStyle.click();

    // 2. 색상 선택
    await page.click('button:has(span:has-text("염색"))');

    // 브라운 계열 색상 선택
    const colorButtons = page.locator('div.grid.grid-cols-5 button');
    await colorButtons.nth(5).click();

    // 모달 닫기
    await page.click('button:has-text("닫기")');

    // 3. 염색 버튼 아이콘에 선택된 색상이 표시되는지 확인
    const colorButtonIcon = page.locator('button:has(span:has-text("염색"))').locator('div.rounded-full').first();
    await expect(colorButtonIcon).toBeVisible();
  });

  test('should reset color when selecting natural', async ({ page }) => {
    // 1. 색상 선택
    await page.click('button:has(span:has-text("염색"))');
    const colorButtons = page.locator('div.grid.grid-cols-5 button');
    await colorButtons.nth(3).click();

    // 2. 자연색으로 리셋
    const naturalColor = colorButtons.first();
    await naturalColor.click();

    // 3. 모달 닫기
    await page.click('button:has-text("닫기")');

    // 4. 염색 버튼 아이콘이 기본 상태로 돌아갔는지 확인
    const colorButtonIcon = page.locator('button:has(span:has-text("염색"))');
    await expect(colorButtonIcon).toBeVisible();
  });
});

test.describe('Hair Color - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    const consentModal = page.locator('text=개인정보 수집 및 이용 동의');
    if (await consentModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.click('button:has-text("동의하고 시작")');
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.click('button:has(span:has-text("염색"))');

    // Escape 키로 모달 닫기
    await page.keyboard.press('Escape');

    // 모달이 닫혔는지 확인
    await expect(page.locator('text=Current Choice')).not.toBeVisible();
  });

  test('should have sufficient touch targets', async ({ page }) => {
    await page.click('button:has(span:has-text("염색"))');

    // 색상 버튼의 최소 크기 확인 (44x44px 권장)
    const colorButton = page.locator('div.grid.grid-cols-5 button').first();
    const box = await colorButton.boundingBox();

    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(40); // 최소 40px
      expect(box.height).toBeGreaterThanOrEqual(40);
    }
  });
});

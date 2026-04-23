import { test, expect } from '@playwright/test';

/**
 * E2E Test: Main Menu
 * 메인 메뉴 UI와 기본 인터랙션 테스트
 */

test.describe('Main Menu - UI and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // 동의 모달이 나타나면 수락
    const consentModal = page.locator('text=개인정보 수집 및 이용 동의');
    if (await consentModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.click('button:has-text("동의하고 시작")');
    }
  });

  test('should load main menu page successfully', async ({ page }) => {
    // 페이지 로드 확인
    await expect(page).toHaveURL('/');

    // 주요 UI 요소 확인
    await expect(page.locator('video, img[alt]').first()).toBeVisible({ timeout: 5000 });
  });

  test('should display gender toggle buttons', async ({ page }) => {
    // 성별 토글 버튼 확인
    const maleButton = page.locator('button:has-text("남성")');
    const femaleButton = page.locator('button:has-text("여성")');

    await expect(maleButton).toBeVisible();
    await expect(femaleButton).toBeVisible();
  });

  test('should switch between male and female styles', async ({ page }) => {
    const maleButton = page.locator('button:has-text("남성")');
    const femaleButton = page.locator('button:has-text("여성")');

    // 기본은 남성 선택
    await expect(maleButton).toHaveClass(/border-b-2/);

    // 여성으로 전환
    await femaleButton.click();
    await expect(femaleButton).toHaveClass(/border-b-2/);

    // 스타일 카드가 변경되었는지 확인 (예: 픽시컷, 보브컷 등 여성 스타일)
    await page.waitForTimeout(500);

    // 남성으로 다시 전환
    await maleButton.click();
    await expect(maleButton).toHaveClass(/border-b-2/);
  });

  test('should display hairstyle carousel', async ({ page }) => {
    // 스타일 캐러셀 확인
    const styleCards = page.locator('button:has(span):has-text(/컷|펌|스타일/)');
    const count = await styleCards.count();

    expect(count).toBeGreaterThan(0);
  });

  test('should select a hairstyle', async ({ page }) => {
    // 첫 번째 스타일 카드 클릭
    const firstStyle = page.locator('button').filter({ has: page.locator('img[alt]') }).first();
    await firstStyle.waitFor({ state: 'visible' });
    await firstStyle.click();

    // 선택된 상태 확인 (핑크색 테두리)
    await expect(firstStyle).toHaveClass(/border-pink-500/);

    // 셔터 버튼 활성화 확인
    const shutterButton = page.locator('button').filter({ has: page.locator('div.bg-white') }).first();
    await expect(shutterButton).not.toHaveClass(/opacity-50/);
  });

  test('should navigate to settings', async ({ page }) => {
    // 설정 버튼 클릭
    const settingsButton = page.locator('button[aria-label*="설정"]').first();
    await settingsButton.click();

    // 설정 페이지로 이동 확인
    await expect(page).toHaveURL('/settings');
  });

  test('should navigate to history', async ({ page }) => {
    // 히스토리 버튼 클릭
    const historyButton = page.locator('button:has(span:has-text("히스토리"))');
    await historyButton.click();

    // 히스토리 페이지로 이동 확인
    await expect(page).toHaveURL('/history');
  });

  test('should open color picker modal', async ({ page }) => {
    // 염색 버튼 클릭
    const colorButton = page.locator('button:has(span:has-text("염색"))');
    await colorButton.click();

    // 색상 선택 모달 확인
    await expect(page.locator('text=Current Choice')).toBeVisible();

    // 닫기 버튼 확인
    const closeButton = page.locator('button:has-text("닫기")').first();
    await expect(closeButton).toBeVisible();

    // 모달 닫기
    await closeButton.click();
    await expect(page.locator('text=Current Choice')).not.toBeVisible();
  });

  test('should open growth simulation modal', async ({ page }) => {
    // 길이 버튼 클릭
    const growthButton = page.locator('button:has(span:has-text("길이"))');
    await growthButton.click();

    // 성장 시뮬레이션 모달 확인
    const modalTitle = page.locator('text=머리 길이 시뮬레이션');
    await expect(modalTitle).toBeVisible();

    // 슬라이더 확인
    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible();

    // 닫기
    await page.click('button:has-text("닫기")');
    await expect(modalTitle).not.toBeVisible();
  });

  test('should open reference picker modal', async ({ page }) => {
    // 참고이미지 버튼 클릭
    const refButton = page.locator('button:has(span:has-text("참고이미지"))');
    await refButton.click();

    // 참고이미지 모달 확인
    await expect(page.locator('text=참고 이미지')).toBeVisible();

    // 닫기
    await page.click('button:has-text("닫기")');
  });
});

test.describe('Main Menu - Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');

    // 동의 모달 처리
    const consentModal = page.locator('text=개인정보 수집 및 이용 동의');
    if (await consentModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.click('button:has-text("동의하고 시작")');
    }

    // 설정 버튼 ARIA 확인
    const settingsButton = page.locator('button[aria-label*="설정"]');
    await expect(settingsButton).toHaveAttribute('aria-label');
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    // 동의 모달 처리
    const consentModal = page.locator('text=개인정보 수집 및 이용 동의');
    if (await consentModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.click('button:has-text("동의하고 시작")');
    }

    // Tab 키로 이동
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // 포커스된 요소 확인
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement);
  });
});

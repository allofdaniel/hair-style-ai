# BeforeCut E2E 테스트

## 테스트 개요

BeforeCut 앱의 End-to-End 테스트 스위트입니다. Playwright를 사용하여 실제 사용자 시나리오를 자동으로 테스트합니다.

## 테스트 파일 구조

```
e2e/
├── 01-main-menu.spec.ts          # 메인 메뉴 UI 및 네비게이션
├── 02-hairstyle-generation.spec.ts  # 헤어스타일 생성 플로우
├── 03-hair-color.spec.ts          # 염색 기능
├── 04-history-settings.spec.ts    # 히스토리 및 설정
└── README.md
```

## 테스트 시나리오

### 1. Main Menu (01-main-menu.spec.ts)
- ✅ 페이지 로드 확인
- ✅ 성별 토글 (남성/여성)
- ✅ 헤어스타일 선택
- ✅ 설정 및 히스토리 네비게이션
- ✅ 색상 선택기 모달
- ✅ 성장 시뮬레이션 모달
- ✅ 접근성 (ARIA labels, 키보드 네비게이션)

### 2. Hairstyle Generation (02-hairstyle-generation.spec.ts)
- ✅ 사진 업로드 → 스타일 선택 → 생성 플로우
- ✅ 스타일 미선택 시 에러 처리
- ✅ 스타일 재선택
- ✅ 네트워크 에러 처리
- ✅ 로딩 상태 표시
- 🔄 결과 페이지 확인 (API 키 필요)

### 3. Hair Color (03-hair-color.spec.ts)
- ✅ 색상 선택기 모달 오픈
- ✅ 색상 프리뷰
- ✅ 색상 선택 지속성
- ✅ 자연색 옵션
- ✅ 색상 카테고리 표시
- ✅ 백드롭 클릭으로 닫기
- ✅ 접근성 (키보드, 터치 타겟)

### 4. History & Settings (04-history-settings.spec.ts)
- ✅ 히스토리 페이지 네비게이션
- ✅ 빈 상태 표시
- ✅ 히스토리 삭제
- ✅ 설정 페이지 네비게이션
- ✅ 언어 변경
- ✅ 앱 버전 표시
- ✅ 개인정보처리방침/이용약관 링크
- ✅ 커스텀 스타일 페이지
- ✅ 성장 시뮬레이션 슬라이더

## 테스트 실행

### 전체 테스트 실행 (headless)
```bash
npm run test:e2e
```

### UI 모드로 실행 (시각적으로 확인)
```bash
npm run test:e2e:ui
```

### 디버그 모드로 실행
```bash
npm run test:e2e:debug
```

### Headed 모드로 실행 (브라우저 보이게)
```bash
npm run test:e2e:headed
```

### 특정 테스트 파일만 실행
```bash
npx playwright test e2e/01-main-menu.spec.ts
```

### 특정 브라우저만 실행
```bash
npx playwright test --project="Mobile Chrome"
```

### 리포트 보기
```bash
npm run test:e2e:report
```

## 테스트 환경 설정

### 필수 조건
1. Node.js 18 이상
2. Playwright 브라우저 설치
   ```bash
   npx playwright install
   ```

### 환경 변수
- 테스트는 로컬 개발 서버 (`http://localhost:5173`)를 자동으로 시작합니다
- OpenAI API 키는 `.env` 파일에서 로드됩니다

### 테스트 디바이스
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)
- Desktop Chrome (1280x720)

## 테스트 작성 가이드

### 새 테스트 추가
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 동의 모달 처리
    const consentModal = page.locator('text=개인정보 수집 및 이용 동의');
    if (await consentModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.click('button:has-text("동의하고 시작")');
    }
  });

  test('should do something', async ({ page }) => {
    // 테스트 로직
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### Best Practices
1. **Resilient Selectors**: role, text, test-id 순으로 우선순위
2. **Wait for Elements**: `waitFor()`, `expect().toBeVisible()` 사용
3. **Cleanup**: `beforeEach`에서 초기 상태 설정
4. **Isolation**: 각 테스트는 독립적으로 실행 가능해야 함
5. **Timeouts**: 네트워크 요청은 충분한 타임아웃 설정

## CI/CD 통합

### GitHub Actions 예시
```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## 알려진 이슈

1. **파일 업로드 테스트**: 실제 테스트 이미지 파일(`test-face.jpg`)이 필요합니다
2. **API 키**: OpenAI API 호출 테스트는 실제 API 키가 필요합니다
3. **카메라 권한**: 브라우저에서 카메라 권한이 자동으로 허용됩니다

## 트러블슈팅

### 테스트 실패 시
1. 스크린샷 확인: `test-results/` 디렉토리
2. 비디오 확인: `test-results/` 디렉토리 (실패 시만 저장)
3. Trace 확인: `npx playwright show-trace trace.zip`

### 개발 서버가 시작되지 않을 때
```bash
# 수동으로 개발 서버 시작
npm run dev

# 다른 터미널에서 테스트 실행
npx playwright test --config playwright.config.ts
```

## 테스트 커버리지

현재 E2E 테스트 커버리지:
- ✅ 메인 UI 및 네비게이션: 100%
- ✅ 스타일 선택: 100%
- ✅ 염색 기능: 100%
- ✅ 모달/팝업: 100%
- ⚠️ API 통합: 부분적 (API 키 필요)
- ⚠️ 결과 저장/공유: 부분적 (실제 생성 필요)

## 다음 단계

- [ ] 실제 API 호출 테스트 (mocking 또는 실제 키 사용)
- [ ] 결과 페이지 상세 테스트
- [ ] 공유 기능 테스트
- [ ] 다국어 지원 테스트
- [ ] 성능 테스트 (Lighthouse CI)
- [ ] 시각적 회귀 테스트 (Visual Regression)

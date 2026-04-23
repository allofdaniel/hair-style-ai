# Hair-Style AI Service Audit Checklist (2026-02-17)

## Scope
- `src/services`
- `src/stores`
- `src/config`
- Android pipeline: `android` (Capacitor)

## Current Metrics
- `src/services` direct `console.*` usage: `0`
- API keys in `?key=` query strings: `0`
- Direct `fetch(...)` usage: `2` (expected, inside `src/services/networkResilience.ts` queue/retry layer)
- `TODO/FIXME/XXX`: `0`
- TypeScript check (`npx tsc --project tsconfig.app.json --noEmit --skipLibCheck`): passes

## Execution Status (2026-02-17)
- `npm run android:deploy` completed successfully (including build, sync, assembleDebug, install)
- Installed APK path: `android/app/build/outputs/apk/debug/app-debug.apk`
- Connected device: `R3CY10QCQKD`
- Install command: `scripts/install-debug-apk.ps1`
- Launch command: `adb shell am start -W -n com.beforecut.app/.MainActivity --user 0` returned `Status: ok`

## Done (Completed)
- [x] Logger standardization
  - `src/services/logger.ts` fixed for TS erasure/enum compatibility and runtime-safe log level support
- [x] Replace `console.*` with `logger.*` in services and store
  - `src/services/{admob,hairExtractAndOverlay,hairInpainting,hairMaskInpainting,hairRefinement,imageOptimization,openai,gemini,hairGeneration,hairSegmentation,sentry}`
  - `src/services/hairMaskInpainting`, `src/services/hairInpainting`, `src/services/hairRefinement`, `src/services/hairExtractAndOverlay`
  - `src/stores/useAppStore.ts`
- [x] Remove `?key=` API key usage in Gemini calls
- [x] Remove remaining URL-based API key usage in growth workflow (`src/pages/GrowthSimulation.tsx`)
- [x] OpenAI migration in `openai.ts`
  - `fetch` removed from this service and moved to `resilientFetch`
  - Shared error parsing helper: `toOpenAIErrorMessage`
  - Shared image URL conversion helper: `extractOpenAIImageDataUrl`
- [x] Remove direct `fetch(...)` calls outside `networkResilience`
  - `src/pages/GrowthSimulation.tsx`
  - `src/pages/Result.tsx`
  - `src/components/ShareSheet.tsx`
- [x] Re-sync Android assets after web rebuild
  - `npx cap sync android`

## P1 (Immediate)
- [ ] Define and align a retry/error policy for all OpenAI branches (`429`, `5xx`, network timeout) with user-facing messages
- [ ] Confirm release build reproducibility under clean env and lock step-by-step if build fails
- [ ] Keep Android package metadata/signing in a consistent baseline for team builds

## P2 (Quality)
- [ ] Expand `resilientFetch` test coverage for queued requests and offline retry recovery
- [ ] Standardize Sentry event payload fields for network failures (`operation`, `errorClass`, `retryCount`, `status`)
- [ ] Add guardrails for oversized image payload and memory pressure during conversion

## P3 (Hardening)
- [ ] Add `*.test.ts` coverage for key services (`openai`, `networkResilience`, `storage`)
- [ ] Add API contract mocks (msw) for deterministic CI tests
- [ ] Refresh release documentation (env vars, API rate-limit handling, offline behavior)

## Execution Plan

### Phase 1: Stabilize (today)
1. [x] Logger & direct `console` cleanup
2. [x] Remove API key query params (`?key=`)
3. [x] Harden OpenAI service retry/error/image-fetch handling
4. [x] Build -> sync -> assemble -> install flow verification

### Phase 2: Reliability (within 1 day)
1. [ ] OpenAI error + retry behavior policy
2. [ ] Network resilience integration tests (online/offline transitions)
3. [ ] Add checklist validation script and wire into CI

### Phase 3: Delivery Readiness (within 3 days)
1. [x] Add USB-connected auto-install workflow
2. [ ] Add smoke checks for capture/pipeline/result generation
3. [ ] Final changelog + release note

## Commands
- `npx tsc --pretty false --noEmit --skipLibCheck --project tsconfig.app.json --incremental false`
- `npm run build`
- `npx cap sync android`
- `cd android && .\gradlew.bat assembleDebug`
- `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`

### Recommended One-Command Deploy
- Build + install: `npm run android:deploy`
- Install only: `npm run android:install`
- Wait until device connects and install automatically:
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-debug-apk.ps1 -WaitForDevice`

# n8n Backend Setup Guide

## n8n 서버 정보

| 항목 | 값 |
|------|-----|
| **서버 IP** | 192.168.50.88 |
| **포트** | 5678 |
| **웹 UI URL** | http://192.168.50.88:5678 |
| **Proxmox 컨테이너** | LXC 110 (n8n) |

### n8n 로그인 정보
- **이메일**: admin@beforecut.app
- **비밀번호**: Pr12pr34!@

---

## 워크플로우 설정

### Webhook 엔드포인트
```
POST http://192.168.50.88:5678/webhook/hair-style-generate
```

### 요청 형식 (JSON)
```json
{
  "prompt": "Transform this person's hairstyle to: 투블럭컷 (Two Block Cut)...",
  "image": "data:image/jpeg;base64,...",
  "style": {
    "id": "two-block",
    "name": "Two Block Cut",
    "nameKo": "투블럭컷"
  },
  "settings": {
    "color": "natural",
    "volume": "natural",
    "parting": "left"
  },
  "model": "openai"
}
```

### 연결된 AI 모델
- **OpenAI DALL-E 3**: 이미지 생성 (현재 설정됨)
- Gemini, Stability AI 등 추가 가능

---

## 앱 연동

### 환경 변수 (.env)
```env
VITE_N8N_URL=http://192.168.50.88:5678
```

### 서비스 파일
`src/services/n8nBackend.ts`

### 사용 예시
```typescript
import { generateWithN8n } from './services/n8nBackend';

const result = await generateWithN8n({
  userPhoto: base64ImageData,
  style: selectedStyle,
  settings: hairSettings,
  texture: selectedTexture,
  model: 'openai'
});

if (result.success) {
  console.log('Generated image:', result.resultImage);
}
```

---

## Proxmox 관리

### n8n 컨테이너 접속
```bash
# Proxmox 웹 UI
https://192.168.50.200:8006
# 로그인: root / pr12pr34!@

# 컨테이너 110 콘솔에서
docker logs n8n -f  # 로그 확인
docker restart n8n  # 재시작
```

### 네트워크 문제 시
```bash
# 컨테이너 콘솔에서 IP 재할당
dhclient eth0
ip addr show eth0
```

---

## 추가 AI 모델 설정 방법

n8n 웹 UI에서:
1. 워크플로우 열기
2. Webhook 노드 옆에 새 노드 추가 (Tab 키)
3. AI 카테고리에서 원하는 모델 선택:
   - Google Gemini
   - Anthropic
   - Stability AI (HTTP Request 노드 사용)
4. 자격 증명 설정 (API 키)
5. 워크플로우 저장 및 Publish

---

## 날짜
설정 완료일: 2026-01-11

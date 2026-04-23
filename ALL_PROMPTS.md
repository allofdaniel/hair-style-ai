# BeforeCut - 모든 헤어 생성 프롬프트 모음

## 1. AI 생성 메인 프롬프트 (Gemini API)

### 헤어스타일 변환 프롬프트 (색상 변경 포함)
```
Transform this person's hairstyle to {스타일명 한글} ({스타일명 영문}) style.

CRITICAL - HAIR COLOR: {색상 프롬프트}. This color change is MANDATORY - the entire hair MUST be this exact color.

Style details: {스타일 상세 프롬프트}.

RULES:
1. The hair color MUST change to {색상명} - this is the most important requirement
2. Keep the face, background, and clothes EXACTLY the same
3. Only modify the hair - style and color
```

### 헤어스타일 변환 프롬프트 (원래 색상 유지)
```
Transform this person's hairstyle to {스타일명 한글} ({스타일명 영문}) style.

Style details: {스타일 상세 프롬프트}.

RULES:
1. Keep the original hair color
2. Keep the face, background, and clothes EXACTLY the same
3. Only modify the hairstyle, not the color
```

### 레퍼런스 사진 기반 프롬프트
```
이 사진에 세련된 새로운 헤어스타일을 적용해주세요.
머리 색상은 {색상 프롬프트}으로 해주세요.
얼굴, 배경, 옷은 그대로 유지하세요.
```

### 뒷모습 생성 프롬프트
```
이 {스타일명} 헤어스타일의 뒷모습을 보여주세요.
머리 색상은 {색상 프롬프트}입니다.
뒷목, 뒷머리 레이어, 전체적인 실루엣을 뒤에서 본 모습으로 보여주세요.
```

### 커스텀 헤어스타일 프롬프트
```
이 사진에 다음 커스텀 헤어스타일을 적용해주세요:
{커스텀 설정 프롬프트}

중요: 얼굴, 배경, 옷은 절대 변경하지 마세요. 오직 머리카락만 위의 사양대로 수정하세요.
```

---

## 2. 남성 헤어스타일 프롬프트 (90개)

| ID | 한글명 | 영문명 | 프롬프트 |
|---|--------|--------|----------|
| 360-waves | 360 웨이브 | 360 Waves | Korean male 360 웨이브 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| jpop-visual | JPOP 비주얼 | JPOP Visual | Korean male jpop visual hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| kpop-comma | KPOP 쉼표머리 | KPop Comma Hair | Korean male kpop 쉼표머리 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| s-curl-perm | S컬펌 | S Curl Perm | Korean male S컬펌 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| garma-perm | 가르마펌 | Garma Perm | Korean male 가르마펌 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| gile-perm | 가일펌 | Gile Perm | Korean male 가일펌 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| curly-perm | 곱슬펌 | Curly Perm | Korean male 곱슬펌 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| military-cut | 군인머리 | Military Cut | Korean male 군인머리 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| basic-down-perm | 기본 다운펌 | Basic Down Perm | Korean male 기본 다운펌 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| natural-down | 내추럴 다운 | Natural Down | Korean male 내추럴 다운 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| dandy-cut | 댄디컷 | Dandy Cut | Korean male 댄디컷 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| dreadlock | 드레드락 | Dreadlock | Korean male 드레드락 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| drop-fade | 드롭 페이드 | Drop Fade | Korean male 드롭 페이드 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| latin-fade | 라틴 페이드 | Latin Fade | Korean male 라틴 페이드 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| reggaeton-twist | 레게톤 트위스트 | Reggaeton Twist | Korean male 레게톤 트위스트 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| lebanese-chic | 레바논 시크 | Lebanese Chic | Korean male 레바논 시크 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| layered-cut | 레이어드 컷 | Layered Cut | Korean male 레이어드 컷 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| low-fade | 로우페이드 | Low Fade | Korean male 로우페이드 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| long-layered | 롱 레이어드 | Long Layered | Korean male 롱 레이어드 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| regent-perm | 리젠트펌 | Regent Perm | Korean male 리젠트펌 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| leaf-cut | 리프컷 | Leaf Cut | Korean male 리프컷 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| malaysian-modern | 말레이시안 모던 | Malaysian Modern | Korean male 말레이시안 모던 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| magic-straight | 매직 스트레이트 | Magic Straight | Korean male 매직 스트레이트 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| man-bun | 맨번 | Man Bun | Korean male 맨번 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| messy-medium | 메시 미디엄 | Messy Medium | Korean male 메시 미디엄 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| mexican-pomade | 멕시칸 포마드 | Mexican Pomade | Korean male 멕시칸 포마드 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| modern-mullet | 모던 멀릿 | Modern Mullet | Korean male 모던 멀릿 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| mohawk-two-block | 모히칸 투블럭 | Mohawk Two Block | Korean male 모히칸 투블럭 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| mid-fade | 미드페이드 | Mid Fade | Korean male 미드페이드 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| bowl-cut | 바가지머리 | Bowl Cut | Korean male 바가지머리 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| box-braids | 박스 브레이드 | Box Braids | Korean male 박스 브레이드 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| burst-fade | 버스트 페이드 | Burst Fade | Korean male 버스트 페이드 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| buzz-cut | 버즈컷 | Buzz Cut | Korean male 버즈컷 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| vietnamese-classic | 베트남 클래식 | Vietnamese Classic | Korean male 베트남 클래식 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| volume-perm | 볼륨 펌 | Volume Perm | Korean male 볼륨 펌 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| bollywood-classic | 볼리우드 클래식 | Bollywood Classic | Korean male 볼리우드 클래식 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| brazilian-surfer | 브라질 서퍼 | Brazilian Surfer | Korean male 브라질 서퍼 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| samurai-bun | 사무라이 번 | Samurai Bun | Korean male 사무라이 번 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| side-swept | 사이드 스웹트 | Side Swept | Korean male 사이드 스웹트 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| side-part-cut | 사이드 파트 컷 | Side Part Cut | Korean male 사이드 파트 컷 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| sanggo-cut | 상고머리 | Sanggo Cut | Korean male 상고머리 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| setting-perm | 세팅 펌 | Setting Perm | Korean male 세팅 펌 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| shadow-perm | 쉐도우펌 | Shadow Perm | Korean male 쉐도우펌 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| comma-hair | 쉼표머리 | Comma Hair | Korean male 쉼표머리 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| skin-fade | 스킨페이드 | Skin Fade | Korean male 스킨페이드 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| sports-cut | 스포츠컷 | Sports Cut | Korean male 스포츠컷 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| slick-back | 슬릭백 | Slick Back | Korean male 슬릭백 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| sikh-style | 시크교 스타일 | Sikh Style | Korean male 시크교 스타일 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| arabian-classic | 아라비안 클래식 | Arabian Classic | Korean male 아라비안 클래식 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| argentine-wave | 아르헨틴 웨이브 | Argentine Wave | Korean male 아르헨틴 웨이브 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| irish-perm | 아이리쉬펌 | Irish Perm | Korean male 아이리쉬펌 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| ivy-league-cut | 아이비리그컷 | Ivy League Cut | Korean male 아이비리그컷 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| afro | 아프로 | Afro | Korean male 아프로 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| anime-spike | 애니메 스파이크 | Anime Spike | Korean male 애니메 스파이크 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| ez-perm | 애즈펌 | EZ Perm | Korean male 애즈펌 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| undercut | 언더컷 | Undercut | Korean male 언더컷 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| emirates-modern | 에미레이트 모던 | Emirates Modern | Korean male 에미레이트 모던 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| wolf-cut | 울프컷 | Wolf Cut | Korean male 울프컷 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| european-fade | 유러피안 페이드 | European Fade | Korean male 유러피안 페이드 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| indonesian-texture | 인도네시안 텍스처 | Indonesian Texture | Korean male 인도네시안 텍스처 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| indian-fade | 인디언 페이드 | Indian Fade | Korean male 인디언 페이드 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| chinese-classic | 차이니즈 클래식 | Chinese Classic | Korean male 차이니즈 클래식 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| curtain-hair | 커튼 헤어 | Curtain Hair | Korean male 커튼 헤어 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| curly-top-fade | 컬리탑 페이드 | Curly Top Fade | Korean male 컬리탑 페이드 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| cornrow | 콘로우 | Cornrow | Korean male 콘로우 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| colombian-modern | 콜롬비아 모던 | Colombian Modern | Korean male 콜롬비아 모던 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| quiff | 퀴프 | Quiff | Korean male 퀴프 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| crew-cut | 크루컷 | Crew Cut | Korean male 크루컷 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| tamil-wave | 타밀 웨이브 | Tamil Wave | Korean male 타밀 웨이브 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| thai-undercut | 타이 언더컷 | Thai Undercut | Korean male 타이 언더컷 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| taiwanese-wave | 타이완 웨이브 | Taiwanese Wave | Korean male 타이완 웨이브 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| turkish-fade | 터키쉬 페이드 | Turkish Fade | Korean male 터키쉬 페이드 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| taper-afro | 테이퍼 아프로 | Taper Afro | Korean male 테이퍼 아프로 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| taper-fade | 테이퍼 페이드 | Taper Fade | Korean male 테이퍼 페이드 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| texture-perm | 텍스처 펌 | Texture Perm | Korean male 텍스처 펌 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| textured-crop | 텍스처드 크롭 | Textured Crop | Korean male 텍스처드 크롭 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| temp-fade | 템퍼 페이드 | Temp Fade | Korean male 템퍼 페이드 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| two-strand-twist | 투 스탠드 트위스트 | Two Strand Twist | Korean male 투 스탠드 트위스트 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| two-block | 투블럭 | Two Block | Korean male 투블럭 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| punjabi-style | 펀자비 스타일 | Punjabi Style | Korean male 펀자비 스타일 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| persian-wave | 페르시안 웨이브 | Persian Wave | Korean male 페르시안 웨이브 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| pomade-down-perm | 포마드 다운펌 | Pomade Down Perm | Korean male 포마드 다운펌 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| pompadour | 폼파두르 | Pompadour | Korean male 폼파두르 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| french-crop-curly | 프렌치 크롭 컬리 | French Crop Curly | Korean male 프렌치 크롭 컬리 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| french-crop | 프렌치 크롭 | French Crop | Korean male 프렌치 크롭 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| pixie-cut | 픽시컷 | Pixie Cut | Korean male 픽시컷 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| filipino-pomade | 필리핀 포마드 | Filipino Pomade | Korean male 필리핀 포마드 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| high-top-fade | 하이탑 페이드 | High Top Fade | Korean male 하이탑 페이드 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| high-fade | 하이페이드 | High Fade | Korean male 하이페이드 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| host-club-style | 호스트 클럽 스타일 | Host Club Style | Korean male 호스트 클럽 스타일 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| hippie-perm | 히피펌 | Hippie Perm | Korean male 히피펌 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |

---

## 3. 여성 헤어스타일 프롬프트 (80개)

| ID | 한글명 | 영문명 | 프롬프트 |
|---|--------|--------|----------|
| c-curl-perm | C컬펌 | C Curl Perm | Korean female C컬펌 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| kpop-idol | KPOP 아이돌 | KPop Idol | Korean female kpop 아이돌 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| goddess-locs | 가디스 락 | Goddess Locs | Korean female 가디스 락 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| gyaru-style | 갸루 스타일 | Gyaru Style | Korean female 갸루 스타일 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| ear-tuck-bob | 귀넘김 단발 | Ear Tuck Bob | Korean female 귀넘김 단발 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| glam-perm | 글램펌 | Glam Perm | Korean female 글램펌 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| long-straight | 긴생머리 | Long Straight | Korean female 긴생머리 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| south-indian-bun | 남 인디언 번 | South Indian Bun | Korean female 남 인디언 번 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| knotless-braids | 낫리스 브레이즈 | Knotless Braids | Korean female 낫리스 브레이즈 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| natural-afro | 네추럴 아프로 | Natural Afro | Korean female 네추럴 아프로 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| dubai-glam | 두바이 글램 | Dubai Glam | Korean female 두바이 글램 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| dreadlock-f | 드레드락 | Dreadlock | Korean female 드레드락 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| digital-perm | 디지털 펌 | Digital Perm | Korean female 디지털 펌 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| latina-curl | 라티나 컬 | Latina Curl | Korean female 라티나 컬 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| layered-medium | 레이어드 중단발 | Layered Medium | Korean female 레이어드 중단발 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| layered-cut-f | 레이어드컷 | Layered Cut | Korean female 레이어드컷 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| romantic-upstyle | 로맨틱 업스타일 | Romantic Upstyle | Korean female 로맨틱 업스타일 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| low-bun | 로우번 | Low Bun | Korean female 로우번 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| long-s-curl | 롱 S컬펌 | Long S Curl | Korean female 롱 S컬펌 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| long-layered-f | 롱 레이어드 | Long Layered | Korean female 롱 레이어드 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| marley-twist | 말리 트위스트 | Marley Twist | Korean female 말리 트위스트 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| magic-straight-f | 매직 스트레이트 | Magic Straight | Korean female 매직 스트레이트 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| messy-bun | 메시번 | Messy Bun | Korean female 메시번 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| mexican-braid | 멕시칸 브레이드 | Mexican Braid | Korean female 멕시칸 브레이드 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| modern-indian | 모던 인디언 | Modern Indian | Korean female 모던 인디언 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| moroccan-style | 모로칸 스타일 | Moroccan Style | Korean female 모로칸 스타일 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| wave-perm | 물결펌 | Wave Perm | Korean female 물결펌 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| body-perm | 바디펌 | Body Perm | Korean female 바디펌 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| box-braids-f | 박스 브레이드 | Box Braids | Korean female 박스 브레이드 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| bantu-knots | 반투 노트 | Bantu Knots | Korean female 반투 노트 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| bali-wave | 발리 웨이브 | Bali Wave | Korean female 발리 웨이브 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| vietnamese-long-straight | 베트남 긴 생머리 | Vietnamese Long Straight | Korean female 베트남 긴 생머리 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| bob-cut | 보브컷 | Bob Cut | Korean female 보브컷 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| volume-magic | 볼륨 매직 | Volume Magic | Korean female 볼륨 매직 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| bollywood-glam | 볼리우드 글램 | Bollywood Glam | Korean female 볼리우드 글램 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| brazilian-blowout | 브라질리언 블로우아웃 | Brazilian Blowout | Korean female 브라질리언 블로우아웃 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| blunt-cut | 블런트 컷 | Blunt Cut | Korean female 블런트 컷 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| beach-wave | 비치 웨이브 | Beach Wave | Korean female 비치 웨이브 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| side-bang | 사이드뱅 | Side Bang | Korean female 사이드뱅 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| shaggy-cut | 샤기컷 | Shaggy Cut | Korean female 샤기컷 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| senegalese-twist | 세네갈 트위스트 | Senegalese Twist | Korean female 세네갈 트위스트 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| setting-perm-f | 세팅펌 | Setting Perm | Korean female 세팅펌 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| short-straight | 숏 생머리 | Short Straight | Korean female 숏 생머리 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| short-wolf-cut | 숏 울프컷 | Short Wolf Cut | Korean female 숏 울프컷 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| sleek-straight | 슬릭 스트레이트 | Sleek Straight | Korean female 슬릭 스트레이트 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| see-through-bang | 시스루뱅 | See Through Bang | Korean female 시스루뱅 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| singapore-chic | 싱가포르 시크 | Singapore Chic | Korean female 싱가포르 시크 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| arabian-long | 아라비안 긴머리 | Arabian Long | Korean female 아라비안 긴머리 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| long-bob-bangs | 앞머리 있는 롱보브 | Long Bob with Bangs | Korean female 앞머리 있는 롱보브 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| bob-with-bangs | 앞머리 있는 보브컷 | Bob with Bangs | Korean female 앞머리 있는 보브컷 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| anime-twintail | 애니메이션 트윈테일 | Anime Twintail | Korean female 애니메이션 트윈테일 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| ulzzang-style | 얼짱 스타일 | Ulzzang Style | Korean female 얼짱 스타일 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| goddess-wave | 여신웨이브 | Goddess Wave | Korean female 여신웨이브 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| indian-braid | 인디언 브레이드 | Indian Braid | Korean female 인디언 브레이드 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| chinese-ancient-updo | 중국 고대식 올림머리 | Chinese Ancient Updo | Korean female 중국 고대식 올림머리 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| choppy-bob | 쵸피 보브 | Choppy Bob | Korean female 쵸피 보브 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| curtain-bang | 커튼뱅 | Curtain Bang | Korean female 커튼뱅 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| kerala-style | 케랄라 스타일 | Kerala Style | Korean female 케랄라 스타일 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| cornrow-f | 콘로우 | Cornrow | Korean female 콘로우 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| colombian-wave | 콜롬비안 웨이브 | Colombian Wave | Korean female 콜롬비안 웨이브 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| cuban-updo | 쿠반 업도 | Cuban Updo | Korean female 쿠반 업도 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| thai-chic | 태국 시크 | Thai Chic | Korean female 태국 시크 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| tassel-cut | 태슬컷 | Tassel Cut | Korean female 태슬컷 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| turkish-drama | 터키 드라마 | Turkish Drama | Korean female 터키 드라마 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| twist-out | 트위스트 아웃 | Twist Out | Korean female 트위스트 아웃 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| passion-twist | 패션 트위스트 | Passion Twist | Korean female 패션 트위스트 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| persian-curl | 페르시안 컬 | Persian Curl | Korean female 페르시안 컬 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| puerto-rican-coily | 푸에르토리칸 코일리 | Puerto Rican Coily | Korean female 푸에르토리칸 코일리 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| fulani-braid | 풀라니 브레이드 | Fulani Braid | Korean female 풀라니 브레이드 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| full-bang | 풀뱅 | Full Bang | Korean female 풀뱅 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| french-bob | 프렌치 보브 | French Bob | Korean female 프렌치 보브 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| platinum-bob | 플래티넘 보브 | Platinum Bob | Korean female 플래티넘 보브 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| pixie-cut-f | 픽시컷 | Pixie Cut | Korean female 픽시컷 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| filipino-wave | 필리핀 웨이브 | Filipino Wave | Korean female 필리핀 웨이브 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| high-ponytail | 하이 포니테일 | High Ponytail | Korean female 하이 포니테일 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| half-up | 하프업 | Half Up | Korean female 하프업 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| hollywood-curl | 할리우드 컬 | Hollywood Curl | Korean female 할리우드 컬 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| hush-cut | 허쉬컷 | Hush Cut | Korean female 허쉬컷 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| hime-cut | 히메 컷 | Hime Cut | Korean female 히메 컷 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| hime-cut-2 | 히메컷 | Hime Cut | Korean female 히메컷 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |
| hippie-perm-f | 히피펌 | Hippie Perm | Korean female 히피펌 hairstyle, professional hair salon reference photo, clear details of hair texture, length, and styling |

---

## 4. 헤어 색상 프롬프트

### 자연색 (Natural)
| ID | 한글명 | 프롬프트 |
|---|--------|----------|
| natural | 자연색 | keep the natural existing hair color unchanged |
| natural-black | 내추럴 블랙 | pure jet black colored hair - the hair must be completely BLACK |
| dark-brown | 다크 브라운 | dark chocolate brown colored hair - the hair must be DARK BROWN |
| medium-brown | 미디엄 브라운 | medium brown colored hair - the hair must be MEDIUM BROWN |
| light-brown | 라이트 브라운 | light golden brown colored hair - the hair must be LIGHT BROWN |
| chestnut | 밤색 | warm reddish chestnut brown colored hair - the hair must be CHESTNUT (reddish brown) |
| auburn | 적갈색 | auburn reddish brown colored hair - the hair must be AUBURN (red-brown) |
| honey-blonde | 허니 블론드 | golden honey blonde colored hair - the hair must be BLONDE with golden honey tones |
| platinum-blonde | 플래티넘 블론드 | bright platinum blonde almost white colored hair - the hair must be PLATINUM BLONDE (very light, almost white) |

### 패션컬러 (Fashion)
| ID | 한글명 | 프롬프트 |
|---|--------|----------|
| ash-gray | 애쉬 그레이 | ash gray colored hair with cool tones - the hair must be ASH GRAY |
| silver | 실버 | silver metallic colored hair - the hair must be SILVER |
| blue-black | 블루 블랙 | blue-black colored hair with visible blue sheen - the hair must show BLUE undertones |
| burgundy | 버건디 | deep burgundy wine red colored hair - the hair must be BURGUNDY RED (dark red wine color) |
| wine-red | 와인 레드 | wine red colored hair - the hair must be WINE RED |
| rose-pink | 로즈 핑크 | rose pink colored hair - the hair must be ROSE PINK |
| lavender | 라벤더 | lavender purple colored hair - the hair must be LAVENDER |
| pastel-pink | 파스텔 핑크 | pastel pink colored hair - the hair must be PASTEL PINK |
| pastel-blue | 파스텔 블루 | pastel blue colored hair - the hair must be PASTEL BLUE |
| mint-green | 민트 그린 | mint green colored hair - the hair must be MINT GREEN |
| coral | 코랄 | coral colored hair - the hair must be CORAL |
| copper | 카퍼 | copper colored hair - the hair must be COPPER |

### 하이라이트 (Highlight)
| ID | 한글명 | 프롬프트 |
|---|--------|----------|
| blonde-highlight | 금발 하이라이트 | hair with BLONDE HIGHLIGHTS - add visible blonde streaks throughout the hair |
| caramel-highlight | 카라멜 하이라이트 | hair with CARAMEL HIGHLIGHTS - add visible caramel streaks throughout the hair |
| red-highlight | 레드 하이라이트 | hair with RED HIGHLIGHTS - add visible red streaks throughout the hair |

### 옴브레 (Ombre)
| ID | 한글명 | 프롬프트 |
|---|--------|----------|
| brown-ombre | 브라운 옴브레 | BROWN OMBRE hair - dark roots gradually fading to light brown at the tips |
| blonde-ombre | 블론드 옴브레 | BLONDE OMBRE hair - dark roots gradually fading to blonde at the tips |
| red-ombre | 레드 옴브레 | RED OMBRE hair - dark roots gradually fading to red at the tips |

---

## 5. 헤어 텍스처 프롬프트

| ID | 한글명 | 프롬프트 |
|---|--------|----------|
| straight | 직모 | naturally straight hair texture |

---

## 6. 볼륨 옵션 프롬프트

| 옵션 | 프롬프트 |
|------|----------|
| flat | with flat sleek low volume |
| natural | with natural medium volume |
| voluminous | with high volume and body |

---

## 7. 가르마 옵션 프롬프트

| 옵션 | 프롬프트 |
|------|----------|
| left | parted on the left side |
| center | parted in the center |
| right | parted on the right side |
| none | with no visible part |

---

## 8. 커스텀 설정 프롬프트 빌더

### 길이 설정
```
머리 길이: 앞머리 {X}cm, 옆머리 {X}cm, 윗머리 {X}cm, 뒷머리 {X}cm
```

### 숱치기 설정
```
{부위} {약간|중간|많이} 숱치기
```

### 펌 타입
| 타입 | 프롬프트 |
|------|----------|
| down | 다운펌 (자연스럽게 내려오는) |
| volume | 볼륨펌 (풍성하게) |
| wave | 웨이브펌 (부드러운 S컬) |

### 투블럭/페이드
| 타입 | 프롬프트 |
|------|----------|
| low | 로우 페이드 |
| mid | 미드 페이드 |
| high | 하이 페이드 |
| skin | 스킨 페이드 |

---

**총 프롬프트 수: 약 200개+**
- 남성 헤어스타일: 90개
- 여성 헤어스타일: 80개
- 헤어 색상: 28개
- 기타 옵션: 10개+




<a href="marketing/App%20Store/header/header.mp4"><img src="marketing/App%20Store/header/header.gif" alt="코코가 덜덜 떨며 레코코 영수증을 뱉는 헤더 동영상" width="100%"></a>
# RECoco - 레코코
읽은 책, 본 영화, 쓴 돈, 떠난 여행, 함께 찍은 네컷을 **진짜 영수증·티켓처럼 출력**해서
세로로 길게 이어진 롤에 쌓아두는 기록 앱.

[![iOS](https://img.shields.io/badge/iOS-App_Store_심사_중-FF7A2F)](https://recoco.pages.dev)
![Android](https://img.shields.io/badge/Android-준비_중-9CA3AF)
[![Support](https://img.shields.io/badge/Support-recoco.pages.dev-FFB18C)](https://recoco.pages.dev)
[![Portfolio](https://img.shields.io/badge/Portfolio-yge--portfolio.vercel.app-1A1A2E)](https://yge-portfolio.vercel.app/projects/recoco)
![Stack](https://img.shields.io/badge/Expo_SDK_57-React_Native_0.86-3A2A22)
![기간](https://img.shields.io/badge/개발_기간-2026.09_~_2026.11-6B7280)
[![License](https://img.shields.io/badge/License-All_rights_reserved-red)](LICENSE)


## 기능

- 카테고리 12개 (책·영화·소비·여행·인생네컷 + 선물·카페맛집·공연전시·콘서트·운동·음악·일상)
- 마스코트 **코코**(흰 말랑이) 밑에서 영수증이 나오면 아래로 **잡아당겨 뜯어서** 기록. 영수증을 모으면 코코 옷장에 옷이 하나씩 열림
- 롤에서는 접힌 채로 보이고, 손잡이를 당기면 **펼쳐짐**
- 인생네컷은 탭하면 **앞(사진) ↔ 뒤(오늘의 하루)** 로 뒤집힘
- 포토부스 QR을 찍거나 링크를 붙여넣어 완성본 가져오기. 포토그레이는 페이지 대신 원본 사진(2880×3600)을 바로 받고, 그 밖의 업체는 페이지에서 사진을 찾는다 (안 되면 갤러리에서 선택). 코코몬 카드·코코치는 한 컷만, 하우스네컷은 1×4 띠·2×2 격자를 알아보고 창마다 한 컷씩 자른다
- 인생네컷 유료 테마: **코코몬 카드**(등급 C~R 은 기록 id 로 뽑힘) · **코코치**(열쇠고리) · **하우스네컷**
- 달력에 기록한 날마다 도장, 날짜를 누르면 그날 영수증이 펼쳐짐
- 백업 파일 내보내기·불러오기, 영수증 10장부터 코코가 백업을 권함
- 서버·로그인 없음 — 기록은 폰 안에만 저장. v1.0 은 모든 카테고리·테마를 연 채로 무료 출시 (`docs/출시_계획.md`)

### 빠르게 채우기

칸을 손으로 다 채우지 않게, 폰 안에 이미 있는 것을 읽는다.

| 무엇을 | 어떻게 | 코드 |
|---|---|---|
| 책 | 뒷면 ISBN 바코드 · Kakao 책 검색 | `components/IsbnScan.tsx` · `lib/search.ts` |
| 영화 | TMDB 검색 · 예매 문자·카톡 알림 붙여넣기 | `lib/movieSms.ts` |
| 소비 | 카드 결제 문자 · 은행 앱 거래내역 캡처 (여러 건이면 골라서 한 장에) | `lib/cardSms.ts` |
| 여행 | 탑승권 바코드(IATA BCBP) · 한글 도시 이름 → 공항 코드 | `lib/boardingPass.ts` · `lib/airports.ts` |
| 카페맛집·소비 | Kakao 장소 검색으로 가게 이름·동네·종류 | `components/PlaceSearch.tsx` |
| 캡처 | 폰 안에서 한국어 글자 읽기 (ML Kit, 서버로 안 보냄) | `lib/ocr.native.ts` |
| 일상 | 사진첩에서 공유하기 → 레코코 (공유 확장) | `lib/shareIntent.native.ts` |

## 구조

```
app/                  Expo (SDK 57) 앱
  src/templates/      영수증·티켓 양식 (.tsx, react-native-svg) ← 양식의 원본
  src/components/     롤, 프린터 출력/뜯기, 접기, 뒤집기, 입력 폼, QR 가져오기
  assets/paper/       종이 질감 오버레이 PNG
  assets/samples/     상점 미리보기 예시 그림 (design/tools/make_samples.js 로 그림)
design/
  previews/           앱 양식을 그대로 렌더링한 미리보기 PNG (배경 없음)
  tools/              미리보기 렌더러 · 종이 질감 · 예시 그림 · 코코몬 카드 생성기
  logo/               RECoco 글자 로고(주황 벡터) · 앱 아이콘 시안
  이전_svg_보관/       초기 SVG 시안
docs/                 기획 메모 (출시 계획, 유료화 아이디어, 로드맵)
landing/              지원·개인정보 처리방침 페이지 (한/영) → https://recoco.pages.dev
marketing/
  App Store/          스토어 등록 문구, 앱 개인정보 설문 답안, 상품 ID 표, header/ 헤더 동영상
  Instagram/          인스타 스토리 동영상 (1080×1920)
  insta/              인스타 피드 게시물 틀
  store/              스토어 스크린샷 틀 (figma/ 에 규격별 SVG)
```

메인은 한 화면을 꽉 채우는 주황(`#ff7a2f`) 배경 + 큰 흰 코코 + 주간 도장 달력. ＋를 누르면 카테고리 알약이 올라오고, 영수증 목록은 따로 올라오는 화면. 색은 `app/src/theme.ts` 의 `COLORS`.

## 실행

```bash
cd app
npm install
npx expo start          # 개발 빌드 앱으로 열기
npx expo start --go     # Expo Go 로 열기 (네이티브 기능 빼고)
```

## 내보내기

```bash
# JS·그림만 바뀐 수정 → 심사 없이 폰에 (OTA)
cd app
npx eas-cli@latest update --channel production --platform ios --environment production --message "고친 내용"

# 새 빌드 (네이티브가 바뀌었을 때) — 끝나면 App Store Connect 로 바로 올라간다
npx eas-cli@latest build -p ios --profile production --auto-submit

# 안드로이드 에뮬레이터에 바로 까는 APK
npx eas-cli@latest build -p android --profile preview

# 지원·개인정보 페이지
npx wrangler pages deploy landing --project-name recoco --branch main
```

네이티브(패키지·권한·app.json 플러그인)가 바뀌면 OTA 가 아니라 새 빌드. 순서와 함정은 `docs/출시_계획.md`.
권한 문구는 플러그인이 기본 영어 문장을 몰래 넣기도 한다(마이크 권한으로 심사 반려된 적 있음). 플러그인을 더하면 `npx expo config --type introspect` 로 `*UsageDescription` 이 전부 한국어 실제 쓰임인지 본다.

## 미리보기 다시 뽑기

```bash
cd design/tools
npm install
npm run preview              # 전체
npm run preview -- 인생네컷   # 파일 이름에 포함된 것만
npm run textures             # 종이 질감 PNG 재생성 (app/assets/paper 덮어씀)
npm run character            # 코코 표정별 PNG (주황/흰색)
npm run icons                # 코코로 앱 아이콘·스플래시 재생성 (app/assets 덮어씀)
node make_samples.js         # 상점 미리보기 예시 그림 (app/assets/samples 덮어씀)

# 헤더·스토리 동영상 (앱의 코코 SVG 로 프레임을 그려 ffmpeg 로 묶음, 몇 분 걸림)
node make_header_video.mjs "../../marketing/App Store/header/header.mp4" "../../marketing/App Store/header/header-poster.png"
node make_header_video.mjs ../../marketing/Instagram/story.mp4 ../../marketing/Instagram/story-poster.png --story
```

앱 이름을 바꾸면 `app/src/theme.ts` 의 `BRAND` 만 고치면 영수증 헤더와 네컷 로고까지 함께 바뀐다.

## 라이선스

[All rights reserved](LICENSE). 학습·참고 목적의 코드 열람은 자유롭지만, 복제·배포·상업적 이용은 허용하지 않는다. 코코 캐릭터·로고·카드 틀 그림 같은 브랜드 에셋은 열람 허용 범위에도 들지 않는다.

책 정보는 Kakao, 영화 정보는 [TMDB](https://www.themoviedb.org) API 를 쓴다. This product uses the TMDB API but is not endorsed or certified by TMDB.

## 문의

[recoco.pages.dev](https://recoco.pages.dev)
<br>
[yge0307@gmail.com](mailto:yge0307@gmail.com) · 앱 안 설정 → 버그 신고

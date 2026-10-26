# RECoco - 레코코

읽은 책, 본 영화, 쓴 돈, 떠난 여행, 함께 찍은 네컷을 **진짜 영수증·티켓처럼 출력**해서
세로로 길게 이어진 롤에 쌓아두는 기록 앱.

- 카테고리 12개 (책·영화·소비·여행·인생네컷 + 선물·카페맛집·공연전시·콘서트·운동·음악·일상)
- 마스코트 **코코**(흰 말랑이) 밑에서 영수증이 나오면 아래로 **잡아당겨 뜯어서** 기록. 영수증을 모으면 코코 옷장에 옷이 하나씩 열림
- 롤에서는 접힌 채로 보이고, 손잡이를 당기면 **펼쳐짐**
- 인생네컷은 탭하면 **앞(사진) ↔ 뒤(오늘의 하루)** 로 뒤집힘
- 포토부스 QR을 찍어 사진 페이지에서 완성본을 가져오기 (안 되면 갤러리에서 선택)
- 서버·로그인 없음 — 기록은 폰 안에만 저장. v1.0 은 모든 카테고리·테마를 연 채로 무료 출시 (`docs/출시_계획.md`)

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
  이전_svg_보관/       초기 SVG 시안
docs/                 기획 메모 (출시 계획, 유료화 아이디어, 로드맵)
landing/              지원·개인정보 처리방침 페이지 → https://recoco.pages.dev
marketing/
  App Store/          스토어 등록 문구, 앱 개인정보 설문 답안, 상품 ID 표
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

# 지원·개인정보 페이지
npx wrangler pages deploy landing --project-name recoco --branch main
```

네이티브(패키지·권한·app.json 플러그인)가 바뀌면 OTA 가 아니라 새 빌드. 순서와 함정은 `docs/출시_계획.md`.

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
```

앱 이름을 바꾸면 `app/src/theme.ts` 의 `BRAND` 만 고치면 영수증 헤더와 네컷 로고까지 함께 바뀐다.

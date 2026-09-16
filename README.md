# RECoco - 레코코

읽은 책, 본 영화, 쓴 돈, 떠난 여행, 함께 찍은 네컷을 **진짜 영수증·티켓처럼 출력**해서
세로로 길게 이어진 롤에 쌓아두는 기록 앱.

- 마스코트 **코코**(주황색 말랑이) 밑에서 영수증이 나오면 아래로 **잡아당겨 뜯어서** 기록
- 롤에서는 접힌 채로 보이고, 손잡이를 당기면 **펼쳐짐**
- 인생네컷은 탭하면 **앞(사진) ↔ 뒤(오늘의 하루)** 로 뒤집힘
- 포토부스 QR을 찍어 사진 페이지에서 완성본을 가져오기 (안 되면 갤러리에서 선택)

## 구조

```
app/                  Expo (SDK 57) 앱
  src/templates/      영수증·티켓 양식 (.tsx, react-native-svg) ← 양식의 원본
  src/components/     롤, 프린터 출력/뜯기, 접기, 뒤집기, 입력 폼, QR 가져오기
  assets/paper/       종이 질감 오버레이 PNG
design/
  previews/           앱 양식을 그대로 렌더링한 미리보기 PNG (배경 없음)
  tools/              미리보기 렌더러 · 종이 질감 생성기
  이전_svg_보관/       초기 SVG 시안
docs/                 기획 메모 (유료화 아이디어 등)
```

UI는 흰 배경 + 코코 주황(`#ff7a2f`) 포인트. 색은 `app/src/theme.ts` 의 `COLORS`.

## 실행

```bash
cd app
npm install
npx expo start      # 폰의 Expo Go 앱으로 QR 스캔
```

## 미리보기 다시 뽑기

```bash
cd design/tools
npm install
npm run preview              # 전체
npm run preview -- 인생네컷   # 파일 이름에 포함된 것만
npm run textures             # 종이 질감 PNG 재생성 (app/assets/paper 덮어씀)
npm run character            # 코코 표정별 PNG
npm run icons                # 코코로 앱 아이콘·스플래시 재생성 (app/assets 덮어씀)
```

앱 이름을 바꾸면 `app/src/theme.ts` 의 `BRAND` 만 고치면 영수증 헤더와 네컷 로고까지 함께 바뀐다.

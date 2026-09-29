# 스토어 스크린샷

SubFlow(`C:\dev\SubFlow\marketing\store`)에서 쓴 틀을 레코코 주황으로 옮긴 것.
다른 점은 **앱 화면을 손으로 그리지 않고 실제 캡처를 끼운다**는 것이다.
SubFlow 는 화면까지 SVG 로 그려서 한 장에 100~170KB 였다.

## 쓰는 순서

1. **폰에서 10장을 찍는다** (개발 빌드로 켜고 캡처)
2. `ios/screens/` 에 아래 이름으로 넣는다
3. `node marketing/store/make-svg.mjs` — 캡처가 끼워진 SVG 10장
4. `node marketing/store/render-png.mjs 6.9` — 업로드용 PNG

캡처가 없는 자리는 "여기에 폰 캡처를 넣으세요" 자리표시가 대신 보이므로,
한 장씩 채워가며 돌려봐도 된다.

## 찍을 화면 10장

앱 설치 시트에는 **앞 3장만** 보인다. 그래서 홈 → 영수증들 → 롤 순으로 뒀다.

| 파일 | 무엇을 찍나 | 붙는 말 |
|---|---|---|
| `01-home.png` | 코코가 있는 홈 | 오늘 하루도 / **영수증으로** |
| `02-receipts.png` | 여러 카테고리 영수증이 보이는 목록 | 열한 가지 기록, / **저마다 다른 종이** |
| `03-roll.png` | 롤(이어 붙인 영수증) 화면 | 모으면 / **길게 이어져요** |
| `04-write.png` | 독서나 영화 폼 — 검색 결과가 뜬 순간 | 제목만 치면 / **나머지는 저절로** |
| `05-themes.png` | 종이·모양 고르는 칸 (색 동그라미까지) | 같은 기록도 / **종이를 바꾸면** |
| `06-card.png` | 코코몬 카드 (등급 좋은 걸로) | 네컷 사진이 / **수집 카드로** |
| `07-calendar.png` | 달력 도장 화면 | 달력에 / **도장이 쌓여요** |
| `08-coco.png` | 코코 옷장 (몇 개 받은 상태로) | 모을수록 / **코코가 꾸며져요** |
| `09-private.png` | 설정 화면 (백업·구매 복원이 보이게) | 서버도 / **로그인도 없어요** |
| `10-share.png` | 자세히보기에서 공유·저장 | 예쁘게 뽑아서 / **나눠 보세요** |

문구를 고치려면 `make-svg.mjs` 의 `SHOTS` 표만 손대면 된다.

## 규격

```
node marketing/store/render-png.mjs 6.9   # 1290x2796
node marketing/store/render-png.mjs 6.7   # 1284x2778
node marketing/store/render-png.mjs 6.5   # 1242x2688
```

⚠️ **6.5·6.7 슬롯에 1290×2796 을 올리면 거부당한다.** SubFlow 때 겪었다.
6.9 슬롯에만 1290×2796 을 쓸 것.

## 함정 두 가지

- **`<img src="x.svg">` 로 렌더하면 안 된다.** SVG 가 '보안 정적 모드'로 들어가서
  끼워 넣은 캡처(`<image href>`)와 @font-face 가 통째로 무시된다. SubFlow 의
  `render_png.py` 가 그 방식이었는데, 화면을 전부 SVG 안에 그려 넣어서 문제가 없었던 것.
  여기서는 SVG 를 HTML 에 **그대로 붙여** 넣는다 (`render-png.mjs`).
- **Pretendard 는 이 PC 에 설치돼 있지 않다.** `app/assets/fonts/*.otf` 를 @font-face 로
  불러 쓴다. 폰트가 안 먹으면 글자가 다른 꼴로 나오니 렌더 뒤 눈으로 볼 것.

## 만들어지는 것

```
ios/
  01-home.svg …  10-share.svg     ← make-svg.mjs 가 만든다 (고치지 말 것, 다시 만들어진다)
  screens/                        ← 폰 캡처를 여기에
  png-6.9/                        ← 업로드용
```

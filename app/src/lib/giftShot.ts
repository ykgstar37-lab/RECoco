// 모바일 교환권(기프티콘) 캡처에서 읽은 글자로 상품명·브랜드·보낸 사람·유효기간·교환권 번호를 뽑는다.
// 카카오 선물하기·기프티쇼·쿠팡 등 화면마다 배치가 달라서 줄 모양으로 짐작한다.

export interface GiftShot {
  item: string; // 상품 이름
  brand: string; // 교환처
  person: string; // 보낸 사람
  code: string; // 교환권 번호 (숫자만)
  until: string | null; // 유효기간 YYYY-MM-DD
}

const pad = (n: number) => String(n).padStart(2, '0');

// 교환권 화면의 버튼·안내 글자 (상품 이름이 될 수 없다)
const UI_NOISE =
  /^(교환권.*|쿠폰.*|바코드.*|기프티쇼|기프티콘|카카오선물하기|선물하기.*|쿠팡.*|네이버.*|11번가.*|티몬.*|위메프.*|교환하기|사용하기|선물하기|유효기간.*|교환처.*|주문번호.*|상품번호.*|사용\s*완료|연장하기|환불.*|배송.*|상세.*|안내.*|더보기|확인|닫기|취소|공유|저장|카카오톡?|톡딜|선물함|받은\s*선물|보낸\s*선물|메시지|축하해요?|알림|홈|전체)$/;
const FROM = /(?:from|From|FROM|보낸\s*사람|보낸분|보낸이)\s*[.:：]?\s*([가-힣A-Za-z][가-힣A-Za-z\s]{0,11})/;

function parseUntil(text: string): string | null {
  const near = /(?:유효기간|사용기한|교환기한)[^\d]{0,12}(20\d{2})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/.exec(text);
  const any = near ?? /(20\d{2})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/.exec(text);
  if (!any) return null;
  const [, y, m, d] = any;
  if (+m < 1 || +m > 12 || +d < 1 || +d > 31) return null;
  return `${y}-${pad(+m)}-${pad(+d)}`;
}

/** 캡처 글자에서 교환권 정보를 뽑는다 (상품 이름도 번호도 없으면 null) */
export function parseGiftShot(raw: string): GiftShot | null {
  const text = raw.replace(/\r/g, '');
  if (!text.trim()) return null;
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // 교환권 번호: 8~24자리 숫자 (4자리씩 띄어 있어도)
  let code = '';
  for (const line of lines) {
    if (/유효|기한|주문|전화|고객|\d{4}[.\-/]\d{1,2}/.test(line)) continue;
    const digits = line.replace(/[^0-9]/g, '');
    if (digits.length >= 8 && digits.length <= 24 && /^[\d\s-]+$/.test(line)) {
      code = digits;
      break;
    }
  }

  const person = FROM.exec(text)?.[1]?.trim() ?? '';
  const until = parseUntil(text);

  // 상품 이름·교환처: 안내 글자가 아닌 줄 중에서
  const names = lines.filter(
    (l) =>
      !UI_NOISE.test(l) &&
      !/\d{4}[.\-/]\d{1,2}|유효기간|사용기한|교환기한|원$|^\d+$|^[\d\s-]+$/.test(l) &&
      !FROM.test(l) &&
      /[가-힣A-Za-z]/.test(l) &&
      l.length >= 2 &&
      l.length <= 40,
  );
  // 가장 긴 줄을 상품 이름으로, 그 바로 앞의 짧은 줄을 교환처로
  const item = names.slice().sort((a, b) => b.length - a.length)[0] ?? '';
  // 교환처: 상품 이름 앞뒤의 짧은 줄 중에서, 상품 이름에 들어 있는 말이면 더 믿는다 (BBQ 황금올리브 → BBQ)
  const at = names.indexOf(item);
  const around = [names[at + 1], names[at - 1]].filter((l): l is string => !!l && l !== item && l.length <= 16);
  const brand = around.find((l) => item.includes(l)) ?? around[0] ?? '';

  if (!item && !code) return null;
  return { item, brand, person, code, until };
}

// 카드 결제 문자(승인 알림)에서 가게·금액·날짜를 뽑는다.
// 카드사마다 줄바꿈·순서가 달라서 특정 형식에 맞추지 않고 "금액 원", "월/일 시:분", 그 뒤 가게 이름을 찾는다.

export interface CardPayment {
  store: string;
  amount: number;
  date: string | null; // YYYY-MM-DD
  time: string | null; // HH:mm
  canceled: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');

// 금액이 아닌 숫자 (누적·잔액·한도 등) 앞에 붙는 말
const NOT_PAYMENT = /(누적|잔액|한도|사용가능|포인트|적립)\s*[:：]?\s*$/;
// 가게 이름에서 떼어낼 말
const NOISE = /(일시불|할부\s*\d*\s*개?월?|승인|체크|신용|결제|사용|님|누적.*$|잔액.*$|\([^)]*\))/g;

export function parseCardSms(text: string, today = new Date()): CardPayment | null {
  const raw = text.replace(/\[[^\]]*발신\]/g, ' ').replace(/\r/g, '');
  if (!raw.trim()) return null;

  // 금액: "12,500원" 중 누적/잔액이 아닌 첫 번째
  let amount = 0;
  const amountRe = /([\d,]{1,12})\s*원/g;
  for (let m = amountRe.exec(raw); m; m = amountRe.exec(raw)) {
    const before = raw.slice(Math.max(0, m.index - 8), m.index);
    const value = parseInt(m[1].replace(/,/g, ''), 10);
    if (!value || NOT_PAYMENT.test(before)) continue;
    amount = value;
    break;
  }
  if (!amount) return null;

  // 날짜·시간: "09/17 13:22", "09.17 13:22", "9월17일 13:22"
  const dt = /(\d{1,2})\s*[/.월-]\s*(\d{1,2})\s*일?\s*(\d{1,2}):(\d{2})/.exec(raw);
  let date: string | null = null;
  let time: string | null = null;
  let afterTime = '';
  if (dt) {
    const month = parseInt(dt[1], 10);
    const day = parseInt(dt[2], 10);
    // 1월에 12월 결제 문자를 붙여넣은 경우 등은 작년
    const year = month > today.getMonth() + 2 ? today.getFullYear() - 1 : today.getFullYear();
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) date = `${year}-${pad(month)}-${pad(day)}`;
    time = `${pad(parseInt(dt[3], 10))}:${dt[4]}`;
    afterTime = raw.slice(dt.index + dt[0].length);
  }

  // 가게: 시간 바로 뒤에 오는 글자 (없으면 다음 줄)
  const clean = (s: string) =>
    s
      .replace(NOISE, ' ')
      .replace(/[\d,]+\s*원/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  let store = '';
  for (const line of afterTime.split('\n')) {
    const c = clean(line);
    if (c) {
      store = c;
      break;
    }
  }
  // 시간 앞에 가게가 오는 형식 대비: 금액·날짜·카드사가 아닌 줄 중 마지막
  if (!store) {
    const lines = raw.split('\n').map(clean).filter((l) => l && !/카드|\d{1,2}[/.]\d{1,2}|\*/.test(l));
    store = lines[lines.length - 1] ?? '';
  }

  return { store: store.slice(0, 30), amount, date, time, canceled: /취소/.test(raw) };
}

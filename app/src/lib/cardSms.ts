// 카드 결제 문자(승인 알림)와 은행·카드 앱 "이용내역/거래내역" 캡처에서 가게·금액·날짜를 뽑는다.
// 카드사마다 줄바꿈·순서가 달라서 특정 형식에 맞추지 않고, 줄을 분류한 뒤 (날짜 · 가게 · 금액) 묶음을 만든다.

export interface CardPayment {
  store: string;
  amount: number;
  date: string | null; // YYYY-MM-DD
  time: string | null; // HH:mm
  canceled: boolean;
  /** 금액이 결제액이 아니라 잔액일 수도 있을 때 (캡처에서 −금액을 못 읽은 경우) */
  uncertain?: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');

// 금액이 아니라 잔액·누적인 줄
const BALANCE = /(잔액|한도|사용가능|누적|포인트|적립|합계금액)/;
// 가게 이름이 될 수 없는 줄 (앱 화면 글자·버튼·표 제목)
const UI_NOISE =
  /^(확인|취소|닫기|완료|메모|메모\s*입력.*|거래내역.*|이용내역.*|상세내역.*|거래일시|거래유형|거래구분|출금계좌|입금계좌|승인번호|카드번호|가맹점.*|결제금액|이용금액|승인금액|잔액표기|잔액|전체|최신순|과거순|더보기|검색|기간|조회|체크카드|신용카드|일시불|오픈뱅킹|자동이체|이체|입금|출금|카드|은행|원)$/;
// 가게 이름에서 떼어낼 말
// 가게보다는 카드사·은행 이름에 가까운 말
const WEAK_STORE = /(카드|은행|페이|뱅크|증권|머니)/;
const NOISE = /(일시불|할부\s*\d*\s*개?월?|승인취소|승인|체크카드|신용카드|체크|신용|결제|사용|님|\([^)]*\))/g;

interface Line {
  text: string;
  date?: { year?: number; month: number; day: number };
  time?: string;
  amount?: { value: number; minus: boolean; balance: boolean };
  store?: string;
}

const cleanStore = (s: string) =>
  s
    .replace(NOISE, ' ')
    .replace(/[\d,]+\s*원/g, ' ')
    .replace(/[_\-·]+\s*\d+\s*$/, ' ') // 뒤에 붙는 카드 끝자리 (_3, -1234)
    .replace(/\s+\d{1,2}$/, '') // 이름 뒤에 남은 한두 자리 숫자
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s.,·\-_|]+|[\s.,·\-_|]+$/g, '')
    .trim();

/** 한 줄을 날짜·시간·금액·가게로 분류한다 */
function classify(raw: string): Line {
  const text = raw.trim();
  const line: Line = { text };
  if (!text) return line;

  // 2026.09.16 / 2026-09-16 (연도 포함)
  const full = /(20\d{2})\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*(\d{1,2})/.exec(text);
  // 09.16 / 09/16 / 9월 16일 (연도 없음)
  const short = /(?:^|[^\d])(\d{1,2})\s*(?:[./-]|월)\s*(\d{1,2})\s*일?(?![\d])/.exec(text);
  const md = full ? { year: +full[1], month: +full[2], day: +full[3] } : short ? { month: +short[1], day: +short[2] } : null;
  if (md && md.month >= 1 && md.month <= 12 && md.day >= 1 && md.day <= 31) line.date = md;

  // 시간은 날짜가 같이 있는 줄에서만 (상태바 시계 "3:28" 을 거르려고)
  if (line.date) {
    const t = /(\d{1,2}):(\d{2})/.exec(text);
    if (t && +t[1] < 24) line.time = `${pad(+t[1])}:${t[2]}`;
  }

  // 금액: "-2,000원", "2,000 원"
  const money = /(-|−)?\s*([\d,]{2,12})\s*원/.exec(text);
  if (money) {
    const value = parseInt(money[2].replace(/,/g, ''), 10);
    if (value) line.amount = { value, minus: !!money[1], balance: BALANCE.test(text) };
  }

  // 가게 후보: 날짜·금액·UI 글자가 아닌 줄
  if (!line.date && !line.amount && !UI_NOISE.test(text) && !/^[\s\d:%|.,\-~+()]+$/.test(text)) {
    const store = cleanStore(text);
    // 상태바(ll 69)·숫자 조각이 가게로 잡히지 않게: 한글이 있거나 영문 3글자 이상
    const looksLikeName = /[가-힣]/.test(store) || (store.match(/[A-Za-z]/g) ?? []).length >= 3;
    // 계좌·카드번호가 든 줄은 가게가 아니다
    if (looksLikeName && !/\d{6,}/.test(store) && store.length >= 2 && store.length <= 30) line.store = store;
  }
  return line;
}

interface Draft {
  date?: Line['date'];
  time?: string;
  store?: string;
  amounts: { value: number; minus: boolean; balance: boolean }[];
}

/** 캡처·문자에서 찾은 결제를 모두 (화면에 보이는 순서대로) 돌려준다 */
export function parseCardPayments(text: string, today = new Date()): CardPayment[] {
  const raw = text.replace(/\[[^\]]*발신\]/g, ' ').replace(/\r/g, '');
  if (!raw.trim()) return [];
  const lines = raw.split('\n').map(classify);
  // "2026.09" 같은 머리글에서 연도를 가져온다
  const yearHint = /(20\d{2})\s*[.\-/]\s*(\d{1,2})(?![\d.])/.exec(raw);

  const drafts: Draft[] = [];
  const start = (): Draft => {
    const d: Draft = { amounts: [] };
    drafts.push(d);
    return d;
  };
  let cur: Draft = start();

  for (const line of lines) {
    if (line.date) {
      // 새 날짜가 나오면 새 묶음 (이미 금액이나 날짜를 받은 뒤라면)
      if (cur.date || cur.amounts.length) cur = start();
      cur.date = line.date;
      cur.time = cur.time ?? line.time;
      continue;
    }
    if (line.amount) {
      cur.amounts.push(line.amount);
      continue;
    }
    if (line.store) {
      // 한 묶음에 가게 이름은 처음 나온 것만 (금액 뒤에 오는 건 다음 건의 가게)
      if (cur.amounts.length && cur.store) {
        cur = start();
        cur.store = line.store;
      } else if (!cur.store) {
        cur.store = line.store;
      }
    }
  }

  // 문자처럼 금액이 먼저 나오고 날짜·가게가 뒤에 오는 경우 앞 묶음에 붙인다
  for (let i = drafts.length - 1; i > 0; i--) {
    const b = drafts[i];
    const a = drafts[i - 1];
    if (b.amounts.length || !a.amounts.length || a.date) continue;
    if (b.date) {
      a.date = b.date;
      a.time = a.time ?? b.time;
    }
    // 카드사·은행 이름보다 날짜와 함께 온 진짜 가게 이름을 더 믿는다
    if (b.store && (!a.store || WEAK_STORE.test(a.store))) a.store = b.store;
    drafts.splice(i, 1);
  }

  const hasMinus = drafts.some((d) => d.amounts.some((a) => a.minus));
  const list: CardPayment[] = [];
  for (const d of drafts) {
    // 결제 금액: 마이너스가 붙은 것 → 잔액이 아닌 첫 번째
    const pick = d.amounts.find((a) => a.minus && !a.balance) ?? d.amounts.find((a) => !a.balance) ?? d.amounts[0];
    if (!pick) continue;
    let date: string | null = null;
    if (d.date) {
      const year = d.date.year ?? (yearHint ? +yearHint[1] : d.date.month > today.getMonth() + 2 ? today.getFullYear() - 1 : today.getFullYear());
      date = `${year}-${pad(d.date.month)}-${pad(d.date.day)}`;
    }
    list.push({
      store: (d.store ?? '').slice(0, 30),
      amount: pick.value,
      date,
      time: d.time ?? null,
      canceled: /취소/.test(raw),
      // 다른 줄에는 -금액이 있는데 이 건만 없으면 잔액을 읽었을 수 있다
      uncertain: hasMinus && !pick.minus,
    });
  }

  // 같은 날짜·금액·가게가 두 번 잡히면 하나만
  const seen = new Set<string>();
  return list.filter((p) => {
    const key = `${p.date}|${p.time}|${p.amount}|${p.store}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** 한 건만 필요할 때 (가장 먼저 찾은 결제) */
export function parseCardSms(text: string, today = new Date()): CardPayment | null {
  return parseCardPayments(text, today)[0] ?? null;
}

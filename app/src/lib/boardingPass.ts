// 탑승권 바코드(IATA BCBP, "M1..." 로 시작)에서 이름·공항·편명·날짜·좌석을 읽는다.
// 고정 길이 필드: https://www.iata.org/en/programs/passenger/common-use/#tab-2 (Resolution 792)

export interface BoardingPass {
  name: string; // KIM COCO
  from: string; // ICN
  to: string; // HND
  flight: string; // KE 703
  date: string | null; // YYYY-MM-DD
  seat: string; // 12A
}

const pad = (n: number) => String(n).padStart(2, '0');

/** 1년 중 며칠째(1~366) → 날짜. 오늘보다 한참 뒤면 작년 여행으로 본다 */
function julianToDate(day: number, today: Date) {
  const make = (year: number) => new Date(year, 0, day);
  let d = make(today.getFullYear());
  if (d.getTime() - today.getTime() > 45 * 86400000) d = make(today.getFullYear() - 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseBoardingPass(raw: string, today = new Date()): BoardingPass | null {
  const s = raw.replace(/\r?\n/g, '');
  if (!/^M[1-9]/.test(s) || s.length < 58) return null;

  const field = (start: number, len: number) => s.slice(start, start + len).trim();
  const from = field(30, 3).toUpperCase();
  const to = field(33, 3).toUpperCase();
  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) return null;

  // "KIM/COCO MS" → "KIM COCO"
  const [last = '', first = ''] = field(2, 20).split('/');
  const name = `${last} ${first.replace(/\s+(MR|MS|MRS|MISS|MSTR)$/i, '')}`.trim().toUpperCase();

  const carrier = field(36, 3);
  const number = field(39, 5).replace(/^0+(?=\d)/, '');
  const julian = parseInt(field(44, 3), 10);
  const seat = field(48, 4).replace(/^0+(?=\d)/, '');

  return {
    name,
    from,
    to,
    flight: [carrier, number].filter(Boolean).join(' '),
    date: julian >= 1 && julian <= 366 ? julianToDate(julian, today) : null,
    seat: /^\d+[A-Z]$/i.test(seat) ? seat.toUpperCase() : '',
  };
}

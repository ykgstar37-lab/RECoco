// 모바일 탑승권 캡처(항공사 앱·메일 화면)에서 읽은 글자로 공항·편명·날짜·좌석·게이트를 뽑는다.
// 바코드(BCBP)가 아니라 사람이 보는 글자를 읽는다. 항공사마다 배치가 달라서 줄 모양으로 짐작한다.
import { airportOf, findAirports } from './airports';
import type { BoardingPass } from './boardingPass';

export interface BoardingPassText extends BoardingPass {
  gate: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
// 공항 코드로 오해하기 쉬운 말
const NOT_AIRPORT = /^(QR|PDF|APP|SMS|VIP|NEW|MAP|ALL|ETC|PNR|SKY|WEB)$/;

function parseDate(text: string, today: Date): string | null {
  const full = /(20\d{2})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/.exec(text);
  if (full) return `${full[1]}-${pad(+full[2])}-${pad(+full[3])}`;
  // 01SEP / 01 SEP 2026
  const iata = /(?:^|[^A-Z0-9])(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(20\d{2})?/i.exec(text);
  if (iata) {
    const month = MONTHS.indexOf(iata[2].toUpperCase()) + 1;
    const year = iata[3] ? +iata[3] : today.getFullYear();
    return `${year}-${pad(month)}-${pad(+iata[1])}`;
  }
  const short = /(?:^|[^\d])(\d{1,2})\s*[./월]\s*(\d{1,2})\s*일?(?![\d])/.exec(text);
  if (!short) return null;
  const month = +short[1];
  const day = +short[2];
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  let year = today.getFullYear();
  if (new Date(year, month - 1, day).getTime() - today.getTime() > 183 * 86400000) year -= 1;
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** 캡처 글자에서 탑승권 정보를 뽑는다 (공항 두 곳을 못 찾으면 null) */
export function parseBoardingText(raw: string, today = new Date()): BoardingPassText | null {
  const text = raw.replace(/\r/g, '');
  if (!text.trim()) return null;
  const lines = text.split('\n').map((l) => l.trim());

  // 공항: 세 글자 코드 먼저, 없으면 한글 도시 이름
  const codes: string[] = [];
  for (const m of text.matchAll(/(?:^|[^A-Za-z])([A-Z]{3})(?![A-Za-z])/g)) {
    const code = m[1];
    if (NOT_AIRPORT.test(code) || !airportOf(code)) continue;
    if (!codes.includes(code)) codes.push(code);
  }
  if (codes.length < 2) {
    for (const line of lines) {
      for (const word of line.split(/[\s/→>~\-|,]+/)) {
        if (!/^[가-힣]{2,6}$/.test(word)) continue;
        const hit = findAirports(word, 1)[0];
        if (hit && !codes.includes(hit.code)) codes.push(hit.code);
      }
    }
  }
  if (codes.length < 2) return null;

  // 편명: KE703 / KE 703 / 7C 1234
  const flightMatch = /(?:^|[^A-Z0-9])([A-Z]{2}|[0-9][A-Z])\s?(\d{2,4})(?![\d])/.exec(text.toUpperCase());
  const flight = flightMatch ? `${flightMatch[1]} ${flightMatch[2]}` : '';

  // 좌석: "좌석 12A", "SEAT 12A", 또는 홀로 있는 12A
  const seat = (/(?:좌석|SEAT)\s*[:：]?\s*(\d{1,2}\s*[A-K])/i.exec(text) ?? /(?:^|[^A-Z0-9])(\d{1,2}[A-K])(?![A-Za-z0-9])/.exec(text))?.[1]?.replace(/\s+/g, '') ?? '';

  // 게이트: "게이트 25", "GATE 25A"
  const gate = /(?:게이트|탑승구|GATE)\s*[:：]?\s*(\d{1,3}[A-Z]?)/i.exec(text)?.[1] ?? '';

  // 이름: HONG/GILDONG MR
  const name = lines.find((l) => /^[A-Z]{2,}\s*\/\s*[A-Z\s]{2,}$/.test(l))?.replace(/\s*\/\s*/, '/').replace(/\s+(MR|MS|MRS|MSTR)$/i, '') ?? '';

  return { from: codes[0], to: codes[1], flight, seat, gate, name, date: parseDate(text, today) };
}

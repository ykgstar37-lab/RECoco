// 영화 예매 완료 문자·알림톡에서 제목·극장·날짜·시간·상영관·좌석·인원을 뽑는다.
// 체인마다 문구가 달라서 "영화: …" 같은 라벨을 먼저 보고, 없으면 줄 모양(날짜 줄, "N관" 줄 등)으로 짐작한다.
import { THEATER_CHAINS } from './search';

export interface MovieBooking {
  title: string;
  theater: string; // 예: CGV 강남
  screen: string; // 예: 4관
  format: string; // 2D, IMAX, 4DX …
  date: string | null; // YYYY-MM-DD
  time: string | null; // HH:mm
  seat: string; // 예: H11, H12
  people: number;
}

const pad = (n: number) => String(n).padStart(2, '0');
const CHAIN_ALIASES: [RegExp, (typeof THEATER_CHAINS)[number]][] = [
  [/CGV/i, 'CGV'],
  [/메가박스|MEGABOX/i, '메가박스'],
  [/롯데\s*시네마|LOTTE\s*CINEMA/i, '롯데시네마'],
  [/씨네\s*Q|CINE\s*Q/i, '씨네Q'],
];
const SCREEN = /((?:리클라이너|컴포트|프리미엄|부티크|스위트)?\s*\d{1,2}\s*관|IMAX\s*관|4DX\s*관|SCREENX\s*관|돌비\s*시네마|DOLBY\s*CINEMA|샤롯데)/i;
const LABEL = (names: string) => new RegExp(`(?:^|\\n)\\s*(?:${names})\\s*[:：]\\s*([^\\n]+)`);

function label(text: string, names: string) {
  return LABEL(names).exec(text)?.[1].trim() ?? '';
}

function parseDate(text: string, today: Date) {
  const full = /(20\d{2})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/.exec(text);
  if (full) return `${full[1]}-${pad(+full[2])}-${pad(+full[3])}`;
  const short = /(?:^|[^\d])(\d{1,2})\s*[./월]\s*(\d{1,2})\s*일?\s*(?:\(|\s|$)/.exec(text);
  if (!short) return null;
  const month = +short[1];
  const day = +short[2];
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  // 반년 넘게 뒤의 날짜면 작년 관람으로
  let year = today.getFullYear();
  if (new Date(year, month - 1, day).getTime() - today.getTime() > 183 * 86400000) year -= 1;
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function parseMovieBooking(raw: string, today = new Date()): MovieBooking | null {
  const text = raw
    .replace(/\r/g, '')
    .replace(/\[[^\]]*발신\]/g, '')
    .replace(/^[\s■□▶▷•·\-*※]+/gm, '')
    .trim();
  if (!text) return null;

  const chain = CHAIN_ALIASES.find(([re]) => re.test(text))?.[1] ?? '';
  const date = parseDate(label(text, '일시|관람일시|상영일시|관람일|관람일자|상영일자|날짜') || text, today);
  const time = /(\d{1,2}):(\d{2})/.exec(label(text, '상영시간|관람시간|시간|일시|관람일시|상영일시') || text);
  if (!date && !time) return null;

  // 극장·상영관
  let place = label(text, '극장명|극장|영화관|관람극장|지점|장소|상영관');
  if (!place) place = text.split('\n').find((l) => SCREEN.test(l) && !/좌석|인원|예매번호/.test(l)) ?? '';
  const screenMatch = SCREEN.exec(place) ?? SCREEN.exec(text);
  const screen = screenMatch ? screenMatch[1].replace(/\s+/g, ' ').trim() : '';
  // 지점: "CGV강남 IMAX관"처럼 체인 바로 뒤에 붙은 이름이 있으면 그걸, 아니면 상영관 앞 글자에서
  const CHAIN_WORD = 'CGV|메가박스|MEGABOX|롯데\\s*시네마|씨네\\s*Q';
  const attached = new RegExp(`(?:${CHAIN_WORD})\\s*([가-힣A-Za-z]{2,12}?)\\s*점?[\\s/|]*(?=${SCREEN.source})`, 'i').exec(text);
  let branch = attached?.[1] ?? '';
  if (!branch) {
    const beforeScreen = screenMatch && place.includes(screenMatch[1]) ? place.slice(0, place.indexOf(screenMatch[1])) : place;
    branch =
      beforeScreen
        .split(/[\/|]/)
        .map((seg) => seg.replace(new RegExp(CHAIN_WORD, 'gi'), ' ').replace(/[\[\]()\d:.~-]+/g, ' ').trim())
        .filter(Boolean)
        .pop() ?? '';
    branch = branch.replace(/\s*점$/, '').replace(/\s+/g, ' ');
  }
  if (/^(영화|예매|완료)/.test(branch) || /님/.test(branch)) branch = '';
  const theater = [chain, branch].filter(Boolean).join(' ');

  // 좌석: "H11", "H열 11번"
  const seatText = label(text, '좌석|좌석번호') || text.split('\n').filter((l) => !/예매번호|번호\s*[:：]|\d{4}-\d{4}/.test(l)).join('\n');
  const seats = new Set<string>();
  for (const m of seatText.matchAll(/(?:^|[^A-Za-z0-9])([A-Z])\s*열?\s*(\d{1,2})\s*번?(?![\d:])/g)) seats.add(`${m[1]}${+m[2]}`);
  const seat = [...seats].join(', ');

  // 인원: "일반 2", "성인2 청소년1", "2명"
  const peopleText = label(text, '인원|관람인원');
  let people = peopleText ? [...peopleText.matchAll(/\d+/g)].reduce((sum, m) => sum + +m[0], 0) : 0;
  if (!people) people = +(/(\d+)\s*명/.exec(text)?.[1] ?? 0);
  if (!people) people = Math.max(1, seats.size);

  // 제목: 라벨이 있으면 그대로, 없으면 날짜·극장·좌석·안내가 아닌 첫 줄
  let title = label(text, '영화|영화명|작품|작품명|제목');
  if (!title) {
    title =
      text
        .split('\n')
        .map((l) => l.trim())
        .find(
          (l) =>
            l &&
            !/예매|완료|고객|님|안내|감사|번호|좌석|인원|명$|\d{1,2}:\d{2}|관람|CGV|메가박스|롯데|씨네/.test(l) &&
            !SCREEN.test(l) &&
            !/^\d/.test(l),
        ) ?? '';
  }
  title = title.replace(/\s*\(?(2D|3D|IMAX|4DX|SCREENX|자막|더빙|ATMOS)[^)]*\)?\s*/gi, ' ').trim();

  const formatMatch = /(IMAX|4DX|SCREENX|3D|DOLBY|ATMOS)/i.exec(text);
  const format = formatMatch ? formatMatch[1].toUpperCase().replace('DOLBY', 'Dolby') : '2D';

  return { title, theater, screen, format, date, time: time ? `${pad(+time[1])}:${time[2]}` : null, seat, people };
}

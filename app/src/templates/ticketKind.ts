// 콘서트와 공연·전시가 같이 쓰는 티켓 모양(포토 티켓·팔찌 티켓)에서,
// 카테고리마다 달라지는 낱말과 줄만 모아둔다. 나머지 생김새는 두 카테고리가 똑같다.
import { won } from '../lib/format';
import { ConcertRecord, ShowRecord } from '../types';
import { SHOW_TYPES } from './ShowTicket';

/** 두 카테고리가 같이 쓰는 모양에 들어갈 수 있는 기록 */
export type TicketRecord = ConcertRecord | ShowRecord;

export interface TicketKind {
  band: string; // 큰 글자 띠
  chant: string; // 반복 무늬 낱말
  seatKey: string; // 좌석 줄 이름
  seatValue: string;
  price: string; // 금액 (콘서트만, 없으면 빈 글자)
  place: string; // 장소가 비었을 때
  title: string; // 제목이 비었을 때
}

export function ticketKindOf(r: TicketRecord): TicketKind {
  if (r.kind === 'concert')
    return {
      band: 'CONCERT',
      chant: 'LIVE',
      seatKey: 'SEAT',
      seatValue: r.seat.trim() || `${r.people}명`,
      price: r.price > 0 ? `₩ ${won(r.price)}` : '',
      place: '공연장',
      title: '콘서트',
    };
  const t = SHOW_TYPES[r.type] ?? SHOW_TYPES.play;
  return r.type === 'exhibition'
    ? { band: 'EXHIBITION', chant: 'ART', seatKey: 'GUEST', seatValue: `${r.people}명 관람`, price: '', place: t.placeWord, title: t.label }
    : { band: 'STAGE', chant: 'SHOW', seatKey: 'SEAT', seatValue: r.seat.trim() || `${r.people}명`, price: '', place: t.placeWord, title: t.label };
}

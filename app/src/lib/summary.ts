import { RecoRecord } from '../types';
import { airportOf } from './airports';
import { EXERCISE_TYPES } from '../templates/ExerciseSlip';

/** 쌓인 영수증 칸에 적을 짧은 이름: 책·영화는 제목, 네컷은 날짜, 여행은 여행지, 소비는 가게 */
export function shortLabel(r: RecoRecord) {
  switch (r.kind) {
    case 'reading':
    case 'movie':
      return r.title.trim() || '제목 없음';
    case 'fourcut':
      return `${r.date.replace(/-/g, '.')}${r.title.trim() ? ` · ${r.title.trim()}` : ''}`;
    case 'travel': {
      const code = r.to.trim().toUpperCase();
      const airport = airportOf(code);
      return airport ? `${airport.city} (${code})` : code || '여행';
    }
    case 'spending':
      return r.store.trim() || '소비';
    case 'gift':
      return r.item.trim() || '선물';
    case 'food':
      return r.place.trim() || '카페·맛집';
    case 'show':
      return r.title.trim() || '공연·전시';
    case 'concert':
      return r.artist.trim() || r.title.trim() || '콘서트';
    case 'exercise':
      return EXERCISE_TYPES[r.type]?.label ?? '운동';
    case 'music':
      return r.title.trim() || r.artist.trim() || '음악';
  }
}

import { RecoRecord } from '../types';

// 자주 가는 공항 코드 → 도시 이름 (없으면 코드 그대로)
const AIRPORTS: Record<string, string> = {
  ICN: '인천', GMP: '김포', CJU: '제주', PUS: '부산', TAE: '대구',
  HND: '도쿄', NRT: '도쿄', KIX: '오사카', ITM: '오사카', FUK: '후쿠오카', CTS: '삿포로', OKA: '오키나와', NGO: '나고야',
  TPE: '타이베이', TSA: '타이베이', HKG: '홍콩', MFM: '마카오', PVG: '상하이', PEK: '베이징',
  BKK: '방콕', DAD: '다낭', SGN: '호치민', HAN: '하노이', CEB: '세부', MNL: '마닐라', SIN: '싱가포르', KUL: '쿠알라룸푸르', DPS: '발리',
  GUM: '괌', SPN: '사이판', HNL: '하와이', LAX: 'LA', JFK: '뉴욕', SFO: '샌프란시스코',
  CDG: '파리', LHR: '런던', FCO: '로마', BCN: '바르셀로나', FRA: '프랑크푸르트', PRG: '프라하', IST: '이스탄불', SYD: '시드니',
};

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
      return AIRPORTS[code] ? `${AIRPORTS[code]} (${code})` : code || '여행';
    }
    case 'spending':
      return r.store.trim() || '소비';
  }
}

export type RecordKind = 'reading' | 'movie' | 'spending' | 'travel' | 'fourcut' | 'gift';

interface BaseRecord {
  id: string;
  createdAt: string; // ISO
}

export type ReadingStatus = '완독' | '읽는 중' | '잠시 멈춤';

export interface ReadingRecord extends BaseRecord {
  kind: 'reading';
  date: string; // YYYY-MM-DD
  title: string;
  author: string;
  publisher: string;
  genre: string;
  status: ReadingStatus;
  place: string; // 어디서 읽었는지/샀는지 (예: 교보문고 광화문점, 동네 도서관)
  memo: string;
}

export interface MovieRecord extends BaseRecord {
  kind: 'movie';
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string;
  originalTitle: string;
  theater: string; // 예: CGV 강남점, 롯데시네마 월드타워
  screen: string; // 관
  seat: string;
  people: number;
  format: string; // 2D, IMAX ...
  ageRating: string;
  stars: number; // 0~5
  runtime: string; // 분
  paper?: MoviePaper; // 없으면 분홍 (예전 기록)
}

export type MoviePaper = 'pink' | 'white';

export interface SpendingItem {
  name: string;
  qty: number;
  price: number;
}

export interface SpendingRecord extends BaseRecord {
  kind: 'spending';
  date: string; // YYYY-MM-DD
  store: string;
  category: string; // 업태/종목
  address: string;
  items: SpendingItem[];
  memo: string;
  theme?: PaperTheme; // 없으면 기본 간이영수증
}

/** 유료 영수증 테마 (종이·무늬만 바뀜) */
export type PaperTheme = 'plain' | 'grid';

/** 앱 안에 복사해 둔 사진 */
export interface Photo {
  uri: string;
  width: number;
  height: number;
}

export interface TravelRecord extends BaseRecord {
  kind: 'travel';
  date: string; // 출발일 YYYY-MM-DD
  from: string; // ICN
  to: string; // HND
  name: string; // 탑승객 이름 (영문)
  flight: string;
  seat: string;
  gate: string;
  photos: (Photo | null)[]; // 0~4장, 장수에 따라 배치가 바뀜
}

export type FourcutFrame = 'white' | 'black' | 'pink' | 'sky';

/**
 * strip: 세로 1×4 (2x6 스트립)
 * grid:  2×2 세로사진 (4x6 엽서형)
 * wide:  가로 카드 2×2
 */
export type FourcutLayout = 'strip' | 'grid' | 'wide';

export interface FourcutRecord extends BaseRecord {
  kind: 'fourcut';
  date: string;
  title: string; // 오늘의 제목
  place: string;
  withWhom: string;
  diary: string; // 뒷면 일기
  /**
   * qr: 포토부스 QR로 받은 완성본 이미지(프레임째) 한 장
   * photos: 갤러리에서 고른 사진 4장을 앱 프레임에 넣음
   */
  source: 'qr' | 'photos';
  frameImage: Photo | null;
  photos: (Photo | null)[];
  layout: FourcutLayout;
  frame: FourcutFrame;
  sourceUrl: string; // QR 링크 (있으면)
  theme?: PaperTheme; // 뒷면 종이 (없으면 기본 크림 줄노트)
}

export type GiftCard = 'yellow' | 'pink' | 'mint' | 'sky';

/** 선물: 받은/준 선물을 모바일 교환권처럼 */
export interface GiftRecord extends BaseRecord {
  kind: 'gift';
  date: string; // YYYY-MM-DD
  direction: 'received' | 'given';
  person: string; // 보낸 사람 또는 받는 사람
  item: string; // 상품 이름
  brand: string; // 교환처·브랜드 (선택)
  price: number; // 0 이면 표시 안 함
  message: string;
  photo: Photo | null;
  card: GiftCard;
}

export type RecoRecord = ReadingRecord | MovieRecord | SpendingRecord | TravelRecord | FourcutRecord | GiftRecord;

export type RecordKind = 'reading' | 'movie' | 'spending' | 'travel' | 'fourcut' | 'gift' | 'food' | 'show' | 'concert';

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
  cover?: Photo | null; // 책 표지 (검색으로 고르면 자동, 갤러리에서도)
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
  /** 여러 곳에서 쓴 걸 한 장에 적을 때: 이 줄의 가게·날짜·시간 */
  store?: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
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
  themeColor?: GridColor; // 모눈종이 격자 색
  /** 여러 가게를 한 장에 적을 때 표 첫 칸 (없으면 날짜가 다 같으면 시간, 다르면 날짜) */
  listBy?: 'date' | 'time';
}

/** 영수증 종이 테마 (종이·무늬만 바뀜). plain(흰 무지)은 무료, grid(모눈종이)는 유료 */
export type PaperTheme = 'plain' | 'grid';

/** 모눈종이 격자 색 */
export type GridColor = 'green' | 'sky' | 'pink' | 'gray';

/** 사진에서 실제로 보여줄 네모 (원본 픽셀 기준) */
export interface PhotoCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 앱 안에 복사해 둔 사진 */
export interface Photo {
  uri: string;
  width: number;
  height: number;
  /** 교환권 캡처에서 상품 그림만 찾아낸 자리 (없으면 사진 전체를 쓴다) */
  crop?: PhotoCrop | null;
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
  themeColor?: GridColor; // 모눈종이 격자 색
}

export type GiftCard = 'yellow' | 'pink' | 'mint' | 'sky' | 'plain';

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
  couponCode?: string; // 찍어 온 진짜 교환권 번호 (없으면 무작위)
}

export type FoodType = 'cafe' | 'meal' | 'dessert' | 'bar';

/** order: 맛집 주문서 (무료) / house: 집 모양 · plain 은 예전 '단색 주문서' (= 주문서 먹색) */
export type FoodDesign = 'order' | 'house' | 'plain';

/** 집 모양의 지붕·차양 색 */
export type HouseColor = 'orange' | 'red' | 'pink' | 'blue' | 'green';

/** 주문서 인쇄 색 */
export type OrderColor = 'green' | 'ink' | 'navy' | 'wine';

/** 모양마다 고를 수 있는 색 (모양을 고른 다음 고른다) */
export type FoodColor = HouseColor | OrderColor;

export interface FoodMenu {
  name: string;
  stars: number; // 0~5
}

/** 카페·맛집: 먹은 메뉴마다 별점을 매기는 주문서 */
export interface FoodRecord extends BaseRecord {
  kind: 'food';
  date: string; // YYYY-MM-DD
  place: string; // 가게 이름
  area: string; // 동네·위치 (선택)
  type: FoodType;
  withWhom: string;
  menus: FoodMenu[]; // 0~6개
  total: number; // 0 이면 표시 안 함
  revisit: 'yes' | 'maybe' | 'no';
  memo: string; // 한 줄 후기
  photo: Photo | null;
  design?: FoodDesign; // 없으면 주문서
  color?: FoodColor; // 모양의 색 (모양을 고를 때 무작위로 정해준다)
}

export type ShowType = 'play' | 'exhibition';

/**
 * plain: 흰 무지 티켓, poster: 포스터 입장권 (여기까지 무료)
 * retro: 레트로 티켓, holo: 별빛 티켓, kpop: 포토 티켓, band: 스탠딩 팔찌 (홀로 빼고 콘서트와 같이 씀)
 * ticket 은 예전 이름 (= retro)
 */
export type ShowDesign = 'plain' | 'poster' | 'retro' | 'holo' | 'kpop' | 'band' | 'ticket';

/** 공연·전시: 뮤지컬·연극·전시 입장권 */
export interface ShowRecord extends BaseRecord {
  kind: 'show';
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (전시는 비어도 됨)
  type: ShowType;
  title: string;
  artist: string; // 아티스트·출연·작가
  place: string; // 공연장·전시장
  seat: string;
  people: number;
  stars: number; // 0~5
  memo: string;
  photo: Photo | null; // 포스터·현장 사진
  design?: ShowDesign; // 없으면 기본 입장권
  color?: TicketColor; // 모양의 색 (팔찌·포토 티켓·별빛 티켓)
}

/** ticket: 밤하늘 티켓(가로), plain: 흰 무지 티켓 (여기까지 무료) / retro: 레트로 티켓, band: 스탠딩 팔찌, kpop: 포토 티켓 (전부 공연·전시와 같이 씀) */
export type ConcertDesign = 'ticket' | 'plain' | 'retro' | 'band' | 'kpop';

/** 스탠딩 팔찌 끈 색 */
export type BandColor = 'lime' | 'pink' | 'sky' | 'orange';

/** 포토 티켓 색 */
export type PhotoColor = 'pink' | 'sky' | 'butter' | 'mint';

/** 별빛 티켓 색 */
export type HoloColor = 'blue' | 'violet' | 'teal' | 'wine' | 'black';

/** 레트로 티켓 색 (크림 종이에 얹는 조각·포인트 색) */
export type RetroColor = 'navy' | 'forest' | 'burgundy' | 'sepia' | 'charcoal';

/** 티켓 모양들이 같이 쓰는 색 (어느 팔레트인지는 고른 모양이 정한다) */
export type TicketColor = BandColor | PhotoColor | HoloColor | RetroColor;

/** 콘서트: 공연·전시와 따로, 티켓 모양을 골라 뽑는다 */
export interface ConcertRecord extends BaseRecord {
  kind: 'concert';
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string; // 공연 이름
  artist: string;
  place: string; // 공연장
  seat: string; // 스탠딩 A구역 132번 / 2층 3열 7번
  people: number;
  price: number; // 0 이면 표시 안 함
  stars: number; // 0~5
  memo: string;
  photo: Photo | null;
  design?: ConcertDesign; // 없으면 기본 티켓
  color?: TicketColor; // 모양의 색 (팔찌·포토 티켓)
}

export type RecoRecord = ReadingRecord | MovieRecord | SpendingRecord | TravelRecord | FourcutRecord | GiftRecord | FoodRecord | ShowRecord | ConcertRecord;

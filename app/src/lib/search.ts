// 제목으로 책(카카오)·영화(TMDB)를 찾아 폼을 채운다. 키는 app/.env.local 에 둔다.
import type { FoodType } from '../types';

const KAKAO_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_KEY ?? '';
const TMDB_KEY = process.env.EXPO_PUBLIC_TMDB_TOKEN ?? '';

export const canSearchBooks = !!KAKAO_KEY;
export const canSearchMovies = !!TMDB_KEY;
/** 카카오 키 하나로 책도 장소도 찾는다 */
export const canSearchPlaces = canSearchBooks;

export interface BookHit {
  id: string;
  title: string;
  author: string;
  publisher: string;
  year: string;
  thumbnail: string;
  /** 영수증에 넣을 큰 표지 (썸네일 주소 안의 원본 이미지) */
  cover: string;
}

export interface MovieHit {
  id: number;
  title: string;
  originalTitle: string;
  year: string;
  poster: string;
}

export interface MovieDetail {
  title: string;
  originalTitle: string;
  runtime: string;
  ageRating: string;
}

// 카카오 썸네일(120×174) 주소의 fname 에 원본 표지 주소가 들어 있다
function bigCover(thumbnail: string) {
  const m = /[?&]fname=([^&]+)/.exec(thumbnail);
  return m ? decodeURIComponent(m[1]).replace(/^http:/, 'https:') : thumbnail;
}

const toBook = (d: any): BookHit => ({
  id: d.isbn || d.url,
  title: d.title,
  author: (d.authors as string[]).join(', '),
  publisher: d.publisher,
  year: (d.datetime as string).slice(0, 4),
  thumbnail: d.thumbnail,
  cover: d.thumbnail ? bigCover(d.thumbnail) : '',
});

export async function searchBooks(query: string, signal?: AbortSignal): Promise<BookHit[]> {
  const url = `https://dapi.kakao.com/v3/search/book?size=8&query=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` }, signal });
  if (!res.ok) throw new Error(`kakao ${res.status}`);
  const data = await res.json();
  return (data.documents as any[]).map(toBook);
}

/** 책 뒷표지 바코드(EAN-13)가 ISBN인지: 978/979로 시작하고 체크 숫자가 맞아야 한다 */
export function isIsbn13(code: string) {
  if (!/^97[89]\d{10}$/.test(code)) return false;
  const sum = code
    .slice(0, 12)
    .split('')
    .reduce((acc, d, i) => acc + Number(d) * (i % 2 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === Number(code[12]);
}

/** ISBN으로 딱 그 책 찾기 */
export async function bookByIsbn(isbn: string): Promise<BookHit | null> {
  const url = `https://dapi.kakao.com/v3/search/book?target=isbn&size=1&query=${encodeURIComponent(isbn)}`;
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } });
  if (!res.ok) throw new Error(`kakao ${res.status}`);
  const d = (await res.json()).documents?.[0];
  return d ? toBook(d) : null;
}

export const THEATER_CHAINS = ['CGV', '롯데시네마', '메가박스', '씨네Q'] as const;

export interface TheaterHit {
  id: string;
  name: string; // 예: CGV 강남
  address: string;
}

const squash = (t: string) => t.replace(/\s/g, '');

/** 카카오 지도(장소) 검색으로 체인 + 지역에 맞는 영화관 지점 찾기 */
export async function searchTheaters(chain: string, query: string, signal?: AbortSignal): Promise<TheaterHit[]> {
  const q = encodeURIComponent(`${chain} ${query}`.trim());
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?category_group_code=CT1&size=15&query=${q}`;
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` }, signal });
  if (!res.ok) throw new Error(`kakao-local ${res.status}`);
  const docs = (await res.json()).documents as any[];
  return docs
    .filter((d) => String(d.category_name).includes('영화관') && squash(d.place_name).startsWith(squash(chain)))
    .map((d) => ({ id: d.id, name: d.place_name, address: d.road_address_name || d.address_name }));
}

export interface PlaceHit {
  id: string;
  name: string;
  /** 동네 (예: 연남동) */
  area: string;
  /** 도로명 주소 */
  address: string;
  /** 카카오 분류로 짐작한 종류 */
  type: FoodType;
}

/**
 * "음식점 > 카페 > 커피전문점" 같은 분류를 카페·식당·디저트·술집 중 하나로.
 * 카페를 디저트보다 먼저 보므로 "테마카페 > 디저트카페"는 카페가 된다
 */
function foodType(category: string): FoodType {
  if (/술집|포차|포장마차/.test(category)) return 'bar';
  if (/카페|커피|찻집/.test(category)) return 'cafe';
  if (/간식|제과|베이커리|디저트|아이스크림|빙수/.test(category)) return 'dessert';
  return 'meal';
}

/** "서울 마포구 연남동 487-378" → "연남동" (동 이름이 없으면 시·구까지) */
function dong(address: string): string {
  const parts = address.split(' ').filter(Boolean);
  const found = parts.find((p) => /[동읍면리가]$/.test(p) && !/^\d/.test(p));
  return found ?? parts.slice(1, 3).join(' ');
}

/** 카카오 지도(장소)에서 카페·맛집 찾기. area 를 주면 그 동네 안에서 찾는다 */
export async function searchPlaces(query: string, area: string, signal?: AbortSignal): Promise<PlaceHit[]> {
  const q = encodeURIComponent(`${area} ${query}`.trim());
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?size=15&query=${q}`;
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` }, signal });
  if (!res.ok) throw new Error(`kakao-local ${res.status}`);
  const docs = (await res.json()).documents as any[];
  return docs
    // FD6 음식점 · CE7 카페만 (병원·학원 같은 건 빼고)
    .filter((d) => d.category_group_code === 'FD6' || d.category_group_code === 'CE7')
    .map((d) => ({
      id: d.id,
      name: d.place_name,
      area: dong(d.address_name || d.road_address_name || ''),
      address: d.road_address_name || d.address_name || '',
      type: foodType(d.category_name || ''),
    }));
}

// API 키(32자)면 쿼리로, 읽기 토큰(eyJ…)이면 헤더로 보낸다
function tmdb(path: string, params: Record<string, string>, signal?: AbortSignal) {
  const bearer = TMDB_KEY.startsWith('eyJ');
  const qs = new URLSearchParams({ language: 'ko-KR', ...params, ...(bearer ? {} : { api_key: TMDB_KEY }) });
  return fetch(`https://api.themoviedb.org/3${path}?${qs}`, {
    headers: bearer ? { Authorization: `Bearer ${TMDB_KEY}` } : undefined,
    signal,
  }).then((res) => {
    if (!res.ok) throw new Error(`tmdb ${res.status}`);
    return res.json();
  });
}

export async function searchMovies(query: string, signal?: AbortSignal): Promise<MovieHit[]> {
  const data = await tmdb('/search/movie', { query, region: 'KR' }, signal);
  return (data.results as any[]).slice(0, 8).map((m) => ({
    id: m.id,
    title: m.title,
    originalTitle: m.original_title,
    year: (m.release_date ?? '').slice(0, 4),
    poster: m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : '',
  }));
}

const KR_RATING: Record<string, string> = {
  ALL: '전체관람가',
  '12': '12세이상관람가',
  '15': '15세이상관람가',
  '18': '청소년관람불가',
  '19': '청소년관람불가',
};

/** 고른 영화의 러닝타임·한국 관람등급까지 가져온다 */
export async function movieDetail(id: number): Promise<MovieDetail> {
  const d = await tmdb(`/movie/${id}`, { append_to_response: 'release_dates' });
  const kr = (d.release_dates?.results as any[] | undefined)?.find((r) => r.iso_3166_1 === 'KR');
  const cert = (kr?.release_dates as any[] | undefined)?.map((r) => r.certification).find(Boolean) ?? '';
  return {
    title: d.title,
    originalTitle: d.original_title,
    runtime: d.runtime ? String(d.runtime) : '',
    ageRating: KR_RATING[cert.toUpperCase()] ?? '',
  };
}

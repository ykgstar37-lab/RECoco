// 제목으로 책(카카오)·영화(TMDB)를 찾아 폼을 채운다. 키는 app/.env.local 에 둔다.
const KAKAO_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_KEY ?? '';
const TMDB_KEY = process.env.EXPO_PUBLIC_TMDB_TOKEN ?? '';

export const canSearchBooks = !!KAKAO_KEY;
export const canSearchMovies = !!TMDB_KEY;

export interface BookHit {
  id: string;
  title: string;
  author: string;
  publisher: string;
  year: string;
  thumbnail: string;
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

const toBook = (d: any): BookHit => ({
  id: d.isbn || d.url,
  title: d.title,
  author: (d.authors as string[]).join(', '),
  publisher: d.publisher,
  year: (d.datetime as string).slice(0, 4),
  thumbnail: d.thumbnail,
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

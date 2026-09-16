export const pad2 = (n: number) => String(n).padStart(2, '0');

export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function nowTime() {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

export function parseDate(s: string) {
  const [y, m, d] = s.split(/[-./]/).map((v) => parseInt(v, 10));
  const date = new Date(y, (m || 1) - 1, d || 1);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

/** 2026.09.12(토) */
export function dotDateWithDay(s: string) {
  const d = parseDate(s);
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}(${WEEK[d.getDay()]})`;
}

/** 2026. 9. 16. */
export function handDate(s: string) {
  const d = parseDate(s);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

export const won = (n: number) => Math.round(n).toLocaleString('ko-KR');

/** 문자열 → 결정적 난수 (바코드, 위치코드 등이 기록마다 고정되도록) */
export function seededRandom(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = h >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 48271) % 2147483647) >>> 0 || 1;
    return (s & 0x7fffffff) / 2147483647;
  };
}

export const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** 받침에 따라 '와/과' */
export function withParticle(word: string) {
  const last = word.charCodeAt(word.length - 1);
  if (last >= 0xac00 && last <= 0xd7a3) return `${word}${(last - 0xac00) % 28 ? '과' : '와'}`;
  return `${word}와`;
}

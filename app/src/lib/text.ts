// SVG 텍스트는 측정 API가 없어서 폰트에서 추출한 글자 폭 표로 계산한다.
import { FONT_METRICS, FontMetric } from './metrics';

export type { FontMetric };

const isWide = (ch: string) => /[ᄀ-ᇿ㄰-㆏가-힣　-鿿＀-￯☀-➿]/.test(ch);

export function measure(text: string, size: number, metric: FontMetric, letterSpacing = 0) {
  const m = FONT_METRICS[metric];
  let em = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 32;
    if (code >= 32 && code < 127) em += m.ascii[code - 32];
    else em += isWide(ch) ? m.hangul : 0.6;
  }
  return em * size + letterSpacing * [...text].length;
}

/** 단어 단위(안 되면 글자 단위)로 줄바꿈 */
export function wrap(text: string, maxWidth: number, size: number, metric: FontMetric): string[] {
  const lines: string[] = [];
  let cur = '';
  const push = () => {
    if (cur.trim()) lines.push(cur.trim());
    cur = '';
  };
  for (const word of text.split(/(\s+)/)) {
    if (measure(cur + word, size, metric) <= maxWidth) {
      cur += word;
      continue;
    }
    if (measure(word, size, metric) <= maxWidth) {
      push();
      cur = word.trimStart();
      continue;
    }
    for (const ch of word) {
      if (measure(cur + ch, size, metric) > maxWidth) push();
      cur += ch;
    }
  }
  push();
  return lines.length ? lines : [''];
}

/** 한 줄에 들어가도록 글자 크기를 줄이고, 그래도 넘치면 말줄임 */
export function fitLine(text: string, maxWidth: number, size: number, minSize: number, metric: FontMetric) {
  let s = size;
  while (s > minSize && measure(text, s, metric) > maxWidth) s -= 1;
  if (measure(text, s, metric) <= maxWidth) return { text, size: s };
  let t = text;
  while (t.length > 1 && measure(t + '…', s, metric) > maxWidth) t = t.slice(0, -1);
  return { text: t + '…', size: s };
}

/** 여러 줄 허용: 크기를 줄여가며 maxLines 안에 넣고, 넘치면 마지막 줄 말줄임 */
export function fitLines(text: string, maxWidth: number, size: number, minSize: number, maxLines: number, metric: FontMetric) {
  let s = size;
  let lines = wrap(text, maxWidth, s, metric);
  while (lines.length > maxLines && s > minSize) {
    s -= 2;
    lines = wrap(text, maxWidth, s, metric);
  }
  if (lines.length > maxLines) {
    const rest = lines.slice(maxLines - 1).join(' ');
    lines = [...lines.slice(0, maxLines - 1), fitLine(rest, maxWidth, s, s, metric).text];
  }
  return { lines, size: s };
}

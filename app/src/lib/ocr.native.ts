// 사진 속 글자 읽기 (폰 안에서, ML Kit 한국어). Expo Go 에는 이 네이티브 모듈이 없어서 개발 빌드에서만 된다.
import TextRecognition, { TextRecognitionScript } from '@react-native-ml-kit/text-recognition';
import { NativeModules } from 'react-native';

import { OcrLine } from './ocrTypes';

export { OcrLine } from './ocrTypes';

export const canReadImageText = !!NativeModules.TextRecognition;

export class OcrUnavailable extends Error {}

/** 읽은 글자 + 줄마다 사진 속 자리 (자리를 모르는 줄은 width 0) */
export async function readImageDetail(uri: string): Promise<{ text: string; lines: OcrLine[] }> {
  if (!canReadImageText) throw new OcrUnavailable();
  const result = await TextRecognition.recognize(uri, TextRecognitionScript.KOREAN);
  const found = result.blocks
    .flatMap((b) => (b.lines.length ? b.lines.map((l) => ({ text: l.text, frame: l.frame ?? b.frame })) : [{ text: b.text, frame: b.frame }]))
    .sort((a, b) => (a.frame?.top ?? 0) - (b.frame?.top ?? 0) || (a.frame?.left ?? 0) - (b.frame?.left ?? 0))
    .map((l) => ({ text: l.text.trim(), frame: l.frame }))
    .filter((l) => l.text);
  if (!found.length) return { text: result.text, lines: [] };

  // 줄 목록에서 빠진 글자가 전체 글자에는 있을 수 있어서(오른쪽 정렬된 값 등) 뒤에 덧붙인다
  const joined = found.map((l) => l.text).join('\n');
  const missed = result.text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !joined.includes(l));
  const lines: OcrLine[] = [
    ...found.map((l) => ({ text: l.text, x: l.frame?.left ?? 0, y: l.frame?.top ?? 0, width: l.frame?.width ?? 0, height: l.frame?.height ?? 0 })),
    ...missed.map((text) => ({ text, x: 0, y: 0, width: 0, height: 0 })),
  ];
  return { text: [joined, ...missed].join('\n'), lines };
}

/** 줄 단위로 합친 글자 (위→아래 순서) */
export async function readImageText(uri: string): Promise<string> {
  return (await readImageDetail(uri)).text;
}

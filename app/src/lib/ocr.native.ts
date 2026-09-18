// 사진 속 글자 읽기 (폰 안에서, ML Kit 한국어). Expo Go 에는 이 네이티브 모듈이 없어서 개발 빌드에서만 된다.
import TextRecognition, { TextRecognitionScript } from '@react-native-ml-kit/text-recognition';
import { NativeModules } from 'react-native';

export const canReadImageText = !!NativeModules.TextRecognition;

export class OcrUnavailable extends Error {}

/** 줄 단위로 합친 글자 (위→아래 순서) */
export async function readImageText(uri: string): Promise<string> {
  if (!canReadImageText) throw new OcrUnavailable();
  const result = await TextRecognition.recognize(uri, TextRecognitionScript.KOREAN);
  const lines = result.blocks
    .flatMap((b) => (b.lines.length ? b.lines.map((l) => ({ text: l.text, frame: l.frame ?? b.frame })) : [{ text: b.text, frame: b.frame }]))
    .sort((a, b) => (a.frame?.top ?? 0) - (b.frame?.top ?? 0) || (a.frame?.left ?? 0) - (b.frame?.left ?? 0))
    .map((l) => l.text.trim())
    .filter(Boolean);
  if (!lines.length) return result.text;
  // 줄 목록에서 빠진 글자가 전체 글자에는 있을 수 있어서(오른쪽 정렬된 값 등) 뒤에 덧붙인다
  const joined = lines.join('\n');
  const missed = result.text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !joined.includes(l));
  return [...lines, ...missed].join('\n');
}

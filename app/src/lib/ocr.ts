// 웹: 사진 속 글자 읽기는 지원하지 않음 (폰 개발 빌드 전용, ocr.native.ts)
import { OcrLine } from './ocrTypes';

export { OcrLine } from './ocrTypes';

export const canReadImageText = false;

export class OcrUnavailable extends Error {}

export async function readImageDetail(_uri: string): Promise<{ text: string; lines: OcrLine[] }> {
  throw new OcrUnavailable();
}

export async function readImageText(_uri: string): Promise<string> {
  throw new OcrUnavailable();
}

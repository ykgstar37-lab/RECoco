/** 읽은 글자 한 줄과 사진 속 자리 (원본 사진 픽셀 기준, 자리를 모르면 width·height 가 0) */
export interface OcrLine {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

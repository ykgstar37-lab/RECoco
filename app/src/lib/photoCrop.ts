// 교환권 캡처에서 "상품 그림"만 잘라내기.
// 캡처 전체를 작은 네모에 욱여넣으면 바코드·안내 글자까지 쪼그라들어서, 글자 자리를 보고 그림만 고른다.
//   캡처 생김새: [상품 그림] → [교환처] → [상품 이름] → [바코드] → [교환처·유효기간 표]
// 그래서 "상품 이름/교환처 줄보다 위"가 상품 그림 자리고, 그 안에 있는 글자들(브랜드 로고·금액)의
// 네모를 조금 넓히면 카드 그림에 거의 딱 맞는다.

import { GiftShot } from './giftShot';
import { OcrLine } from './ocrTypes';
import { Photo, PhotoCrop } from '../types';

/** 숫자만 8~24자리인 줄 (바코드 아래 번호) */
const isCodeLine = (text: string) => /^[\d\s-]+$/.test(text) && text.replace(/\D/g, '').length >= 8 && text.replace(/\D/g, '').length <= 24;

/** 교환권 캡처(lines)에서 상품 그림 자리를 찾는다. 못 찾으면 null (사진 전체를 쓴다) */
export function findGiftCrop(lines: OcrLine[], gift: GiftShot, imgW: number, imgH: number): PhotoCrop | null {
  if (imgW <= 0 || imgH <= 0) return null;
  const placed = lines.filter((l) => l.width > 0 && l.height > 0);
  if (placed.length < 3) return null;

  // 바코드 번호 줄을 기준으로 삼는다 (그 아래는 교환처·유효기간 표)
  const codeLine = placed.find((l) => (gift.code ? l.text.replace(/\D/g, '') === gift.code : isCodeLine(l.text)));
  if (!codeLine) return null;

  // 바코드 바로 위에 붙어 있는 줄들 = 교환처·상품 이름. 그 위가 상품 그림 자리.
  const above = placed.filter((l) => l.y + l.height <= codeLine.y).sort((a, b) => b.y - a.y);
  if (!above.length) return null;
  const glue = imgH * 0.06; // 이만큼 안에 붙어 있으면 같은 글자 덩어리로 본다
  let titleTop = above[0].y;
  for (const l of above.slice(1)) {
    if (titleTop - (l.y + l.height) > glue) break;
    titleTop = Math.min(titleTop, l.y);
  }
  if (titleTop < imgH * 0.12) return null;

  // 그 위에 있는 글자들(브랜드 로고·금액)을 감싸는 네모가 곧 상품 카드
  const inside = placed.filter((l) => l.y + l.height <= titleTop);
  let box: PhotoCrop;
  if (inside.length) {
    const left = Math.min(...inside.map((l) => l.x));
    const right = Math.max(...inside.map((l) => l.x + l.width));
    const top = Math.min(...inside.map((l) => l.y));
    const bottom = Math.max(...inside.map((l) => l.y + l.height));
    // 글자 바깥으로 그림이 더 있으니 넉넉히 넓힌다
    const padX = Math.max((right - left) * 0.14, imgW * 0.04);
    const padY = Math.max((bottom - top) * 0.14, imgH * 0.02);
    box = { x: left - padX, y: top - padY, width: right - left + padX * 2, height: bottom - top + padY * 2 };
  } else {
    // 그림 안에 글자가 없으면 맨 위부터 상품 이름 바로 위까지
    box = { x: 0, y: 0, width: imgW, height: titleTop };
  }

  const x = Math.max(0, box.x);
  const y = Math.max(0, box.y);
  const width = Math.min(imgW - x, box.width);
  const height = Math.min(titleTop - y, box.height);
  // 너무 작게 잡혔으면 잘못 읽은 것으로 보고 사진 전체를 쓴다
  if (width < imgW * 0.25 || height < imgH * 0.08) return null;
  return { x, y, width, height };
}

/** 캡처에서 상품 그림 자리를 찾아 사진에 붙여준다 */
export function withGiftCrop(photo: Photo, lines: OcrLine[], gift: GiftShot): Photo {
  const crop = findGiftCrop(lines, gift, photo.width, photo.height);
  return crop ? { ...photo, crop } : photo;
}

/**
 * 사진을 네모 칸에 놓을 자리.
 * 그냥 사진이면 칸을 꽉 채우고(넘치는 쪽은 잘림), 잘라낸 상품 그림이면 가로로 길쭉해도
 * 브랜드·금액이 안 잘리게 통째로 들어가게 놓는다.
 */
export function fillRect(photo: Photo, box: { x: number; y: number; width: number; height: number }) {
  const whole = { x: 0, y: 0, width: photo.width, height: photo.height };
  const c = photo.crop ?? whole;
  if (!photo.width || !photo.height || !c.width || !c.height) return box;
  const fit = box.width / c.width;
  const fill = box.height / c.height;
  const scale = photo.crop ? Math.min(fit, fill) : Math.max(fit, fill);
  return {
    x: box.x + box.width / 2 - (c.x + c.width / 2) * scale,
    y: box.y + box.height / 2 - (c.y + c.height / 2) * scale,
    width: photo.width * scale,
    height: photo.height * scale,
  };
}

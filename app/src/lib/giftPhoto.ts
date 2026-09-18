import { parseGiftShot } from './giftShot';
import { readImageDetail } from './ocr';
import { findGiftCrop } from './photoCrop';
import { Photo } from '../types';

/** 고른 사진이 교환권 캡처면 상품 그림 자리를 찾아 붙여준다 (아니면 사진 그대로) */
export async function cropIfCoupon(photo: Photo): Promise<Photo> {
  try {
    const { text, lines } = await readImageDetail(photo.uri);
    const gift = parseGiftShot(text);
    if (!gift) return photo;
    const crop = findGiftCrop(lines, gift, photo.width, photo.height);
    return crop ? { ...photo, crop } : photo;
  } catch {
    // 글자를 못 읽으면(Expo Go 등) 사진 그대로 쓴다
    return photo;
  }
}

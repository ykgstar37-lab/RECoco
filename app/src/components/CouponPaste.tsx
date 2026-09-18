import { GiftShot, parseGiftShot } from '../lib/giftShot';
import { OcrLine } from '../lib/ocr';
import { withGiftCrop } from '../lib/photoCrop';
import { Photo } from '../types';
import { PasteFill } from './PasteFill';

/** 교환권 번호 4자리씩 띄우기 */
export const formatCoupon = (code: string) => code.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');

interface Props {
  visible: boolean;
  onClose: () => void;
  /** 읽은 내용 + 고른 캡처(선물 사진으로 쓸 수 있게) */
  onFill: (gift: GiftShot, photo: Photo | null) => void;
}

/** 모바일 교환권 캡처를 읽어 상품·브랜드·보낸 사람·번호를 채우고, 캡처를 선물 사진으로도 쓴다 */
export function CouponPaste({ visible, onClose, onFill }: Props) {
  let picked: Photo | null = null;
  let lines: OcrLine[] = [];
  return (
    <PasteFill
      visible={visible}
      title="교환권 캡처로 채우기"
      help="카카오 선물하기·기프티쇼 같은 모바일 교환권 화면을 캡처해서 골라주세요. 고른 캡처는 선물 사진으로도 쓸 수 있어요."
      placeholder={'스타벅스\n아이스 카페 아메리카노 T\nFrom. 지민\n9812 3456 7890\n유효기간 2026.12.31 까지'}
      parse={(t) => parseGiftShot(t)}
      onImage={(photo, found) => {
        picked = photo;
        lines = found;
      }}
      rows={(g) => [
        { label: '상품', value: g.item, strong: true },
        { label: '교환처', value: g.brand },
        { label: '보낸 이', value: g.person },
        { label: '번호', value: g.code ? formatCoupon(g.code) : '' },
      ]}
      warning={(g) => (g.code ? null : '교환권 번호를 못 찾았어요. 번호가 보이는 캡처면 같이 읽어요.')}
      failMessage="교환권 내용을 찾지 못했어요. 상품 이름이 보이는 캡처인지 확인해 주세요."
      onClose={onClose}
      onFill={(g) => onFill(g, picked ? withGiftCrop(picked, lines, g) : null)}
    />
  );
}

import { CardPayment, parseCardSms } from '../lib/cardSms';
import { won } from '../lib/format';
import { PasteFill } from './PasteFill';

interface Props {
  visible: boolean;
  onClose: () => void;
  onFill: (payment: CardPayment) => void;
}

/** 카드 결제 문자를 붙여넣으면 가게·금액·날짜를 읽어서 소비 기록을 채운다 */
export function CardSmsPaste({ visible, onClose, onFill }: Props) {
  return (
    <PasteFill
      visible={visible}
      title="카드 결제 문자로 채우기"
      help="문자 앱에서 카드 승인 문자를 길게 눌러 복사한 뒤, 아래 칸을 길게 눌러 붙여넣어 주세요."
      placeholder={'[Web발신]\n○○카드 승인\n홍*동\n12,500원 일시불\n09/17 13:22\n달밤커피'}
      parse={(t) => parseCardSms(t)}
      rows={(p) => [
        { label: '가게', value: p.store },
        { label: '금액', value: `${won(p.amount)}원`, strong: true },
        { label: '날짜', value: p.date ? `${p.date.replace(/-/g, '.')}${p.time ? `  ${p.time}` : ''}` : '' },
      ]}
      warning={(p) => (p.canceled ? '승인 취소 문자예요. 그래도 채울까요?' : null)}
      failMessage="결제 금액을 찾지 못했어요. 카드 승인 문자인지 확인해 주세요."
      onClose={onClose}
      onFill={onFill}
    />
  );
}

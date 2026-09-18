import { CardPayment, parseCardPayments, parseCardSms } from '../lib/cardSms';
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
      title="결제 문자·알림으로 채우기"
      help="카드 승인 문자를 복사해 붙여넣거나, 카드 앱 결제 알림·이용내역 화면을 캡처해서 골라주세요. 여러 건이 보이면 그중 하나를 고를 수 있어요."
      placeholder={'[Web발신]\n○○카드 승인\n홍*동\n12,500원 일시불\n09/17 13:22\n달밤커피'}
      parse={(t) => parseCardSms(t)}
      parseAll={(t) => parseCardPayments(t)}
      optionLabel={(p) => ({
        title: `${p.store || '가게 모름'}  ${won(p.amount)}원`,
        sub: p.date ? `${p.date.replace(/-/g, '.')}${p.time ? `  ${p.time}` : ''}` : '날짜 없음',
      })}
      rows={(p) => [
        { label: '가게', value: p.store },
        { label: '금액', value: `${won(p.amount)}원`, strong: true },
        { label: '날짜', value: p.date ? `${p.date.replace(/-/g, '.')}${p.time ? `  ${p.time}` : ''}` : '' },
      ]}
      warning={(p) =>
        p.canceled ? '승인 취소 문자예요. 그래도 채울까요?' : p.uncertain ? '금액이 결제액이 아니라 잔액일 수 있어요. 채운 뒤 확인해 주세요.' : null
      }
      failMessage="결제 금액을 찾지 못했어요. 카드 승인 문자인지 확인해 주세요."
      onClose={onClose}
      onFill={onFill}
    />
  );
}

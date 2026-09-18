import { BoardingPassText, parseBoardingText } from '../lib/boardingText';
import { airportOf } from '../lib/airports';
import { PasteFill } from './PasteFill';

interface Props {
  visible: boolean;
  onClose: () => void;
  onFill: (pass: BoardingPassText) => void;
}

const place = (code: string) => {
  const airport = airportOf(code);
  return airport ? `${airport.city} (${code})` : code;
};

/** 모바일 탑승권 캡처(또는 예약 문자)를 읽어 공항·편명·좌석·게이트를 채운다 */
export function BoardingPassPaste({ visible, onClose, onFill }: Props) {
  return (
    <PasteFill
      visible={visible}
      title="탑승권 캡처로 채우기"
      help="항공사 앱의 모바일 탑승권이나 예약 확인 화면을 캡처해서 골라주세요. 문자를 복사해 붙여넣어도 돼요."
      placeholder={'대한항공 KE 703\n인천 ICN → 도쿄/하네다 HND\n2026.09.01 (화)\n탑승시간 09:20  게이트 25\n좌석 12A\nKIM/COCO'}
      parse={(t) => parseBoardingText(t)}
      rows={(b) => [
        { label: '출발', value: place(b.from), strong: true },
        { label: '도착', value: place(b.to), strong: true },
        { label: '편명', value: [b.flight, b.date ? b.date.replace(/-/g, '.') : ''].filter(Boolean).join('  ') },
        { label: '좌석', value: [b.seat, b.gate ? `게이트 ${b.gate}` : '', b.name].filter(Boolean).join('  ·  ') },
      ]}
      warning={(b) => (b.flight ? null : '편명을 못 찾았어요. 채운 뒤 직접 적어주세요.')}
      failMessage="공항 두 곳을 찾지 못했어요. 탑승권 화면 전체가 나온 캡처인지 확인해 주세요."
      onClose={onClose}
      onFill={onFill}
    />
  );
}

import { MovieBooking, parseMovieBooking } from '../lib/movieSms';
import { PasteFill } from './PasteFill';

interface Props {
  visible: boolean;
  onClose: () => void;
  onFill: (booking: MovieBooking) => void;
}

/** 영화 예매 완료 문자·카톡 알림을 붙여넣으면 제목·극장·일시·좌석을 읽어서 영화 기록을 채운다 */
export function MovieSmsPaste({ visible, onClose, onFill }: Props) {
  return (
    <PasteFill
      visible={visible}
      title="예매 문자·캡처로 채우기"
      help="예매 완료 문자·카카오톡 알림을 복사해 붙여넣거나, 예매 내역 화면을 캡처해서 골라주세요."
      placeholder={'[○○시네마] 예매가 완료되었습니다.\n영화: 오디세이\n일시: 2026.09.12(토) 19:30\n극장: 강남 / 4관\n좌석: H11, H12\n인원: 일반 2'}
      parse={(t) => parseMovieBooking(t)}
      rows={(b) => [
        { label: '영화', value: b.title, strong: true },
        { label: '극장', value: [b.theater, b.screen].filter(Boolean).join(' · ') },
        { label: '일시', value: b.date ? `${b.date.replace(/-/g, '.')}${b.time ? `  ${b.time}` : ''}` : (b.time ?? '') },
        { label: '좌석', value: b.seat ? `${b.seat}  (${b.people}명)` : `${b.people}명` },
      ]}
      warning={(b) => (b.title ? null : '영화 제목은 못 찾았어요. 채운 뒤 제목을 적으면 검색돼요.')}
      failMessage="예매 날짜·시간을 찾지 못했어요. 예매 완료 문자인지 확인해 주세요."
      onClose={onClose}
      onFill={onFill}
    />
  );
}

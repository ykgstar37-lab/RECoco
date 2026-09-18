import { memo } from 'react';

import { RecoRecord } from '../types';
import { ConcertRetro, layoutConcertRetro } from './ConcertRetro';
import { ConcertTicket, layoutConcert } from './ConcertTicket';
import { FoodHouse, layoutFoodHouse } from './FoodHouse';
import { FoodOrder, layoutFood } from './FoodOrder';
import { FourcutBack, FourcutFront, layoutFourcut } from './Fourcut';
import { GiftCoupon, layoutGift } from './GiftCoupon';
import { MovieTicket, layoutMovie } from './MovieTicket';
import { PhotoTicket, layoutPhotoTicket } from './PhotoTicket';
import { ReadingReceipt, layoutReading } from './ReadingReceipt';
import { SpendingReceipt, layoutSpending } from './SpendingReceipt';
import { ShowHolo, layoutShowHolo } from './ShowHolo';
import { ShowRetro, layoutShowRetro } from './ShowRetro';
import { ShowTicket, layoutShow } from './ShowTicket';
import { TemplateLayout } from './shared';
import { TravelPass, layoutTravel } from './TravelPass';
import { WristBand, layoutWristBand } from './WristBand';

export type { TemplateLayout };
export { FourcutBack, FourcutFront };

export function layoutOf(record: RecoRecord): TemplateLayout {
  switch (record.kind) {
    case 'reading':
      return layoutReading(record);
    case 'movie':
      return layoutMovie(record);
    case 'spending':
      return layoutSpending(record);
    case 'travel':
      return layoutTravel(record);
    case 'fourcut':
      return layoutFourcut(record);
    case 'gift':
      return layoutGift(record);
    case 'food':
      return record.design === 'house' ? layoutFoodHouse(record) : layoutFood(record);
    case 'show':
      return record.design === 'kpop'
        ? layoutPhotoTicket(record)
        : record.design === 'band'
          ? layoutWristBand(record)
          : record.design === 'holo'
            ? layoutShowHolo(record)
            : record.design === 'poster'
              ? layoutShow(record)
              : layoutShowRetro(record);
    case 'concert':
      return record.design === 'band'
        ? layoutWristBand(record)
        : record.design === 'kpop'
          ? layoutPhotoTicket(record)
          : record.design === 'retro'
            ? layoutConcertRetro(record)
            : layoutConcert(record);
  }
}

/**
 * 롤 폭(rollWidth) 기준 실제 표시 크기.
 * connected: 롤로 이어 붙일 때 — 인생네컷은 레이아웃(1×4·2×2·가로 2×2)마다 폭이 달라서
 * 이으면 줄이 들쭉날쭉해진다. 하나로 통일하되, 1×4 스트립이 너무 길어지지 않게 0.8 로.
 */
const FOURCUT_ROLL_RATIO = 0.8;

export function sizeOf(record: RecoRecord, rollWidth: number, connected = false) {
  const l = layoutOf(record);
  const width = rollWidth * (connected && record.kind === 'fourcut' ? FOURCUT_ROLL_RATIO : l.displayRatio);
  const scale = width / l.width;
  return {
    width,
    height: l.height * scale,
    foldHeight: l.foldAt * scale,
    insetTop: l.inset.top * scale,
    insetBottom: l.inset.bottom * scale,
  };
}

/**
 * 기록의 "앞면" (인생네컷은 사진 면).
 * connected: 롤로 이어 붙일 때 — 위아래 모서리를 각지게 하고 그림자를 빼서 앞뒤 장과 맞물리게 한다
 */
export const RecordPaper = memo(function RecordPaper({ record, width, connected = false }: { record: RecoRecord; width: number; connected?: boolean }) {
  switch (record.kind) {
    case 'reading':
      return <ReadingReceipt record={record} width={width} />;
    case 'movie':
      return <MovieTicket record={record} width={width} connected={connected} />;
    case 'spending':
      return <SpendingReceipt record={record} width={width} />;
    case 'travel':
      return <TravelPass record={record} width={width} connected={connected} />;
    case 'fourcut':
      return <FourcutFront record={record} width={width} connected={connected} />;
    case 'gift':
      return <GiftCoupon record={record} width={width} connected={connected} />;
    case 'food':
      return record.design === 'house' ? <FoodHouse record={record} width={width} /> : <FoodOrder record={record} width={width} connected={connected} />;
    case 'show':
      return record.design === 'kpop' ? (
        <PhotoTicket record={record} width={width} connected={connected} />
      ) : record.design === 'band' ? (
        <WristBand record={record} width={width} />
      ) : record.design === 'holo' ? (
        <ShowHolo record={record} width={width} connected={connected} />
      ) : record.design === 'poster' ? (
        <ShowTicket record={record} width={width} connected={connected} />
      ) : (
        <ShowRetro record={record} width={width} connected={connected} />
      );
    case 'concert':
      return record.design === 'band' ? (
        <WristBand record={record} width={width} />
      ) : record.design === 'kpop' ? (
        <PhotoTicket record={record} width={width} connected={connected} />
      ) : record.design === 'retro' ? (
        <ConcertRetro record={record} width={width} connected={connected} />
      ) : (
        <ConcertTicket record={record} width={width} connected={connected} />
      );
  }
});

export const KIND_LABEL: Record<RecoRecord['kind'], string> = {
  reading: '독서',
  movie: '영화',
  spending: '소비',
  travel: '여행',
  fourcut: '인생네컷',
  gift: '선물',
  food: '카페·맛집',
  show: '공연·전시',
  concert: '콘서트',
};

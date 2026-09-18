import { memo } from 'react';

import { RecoRecord } from '../types';
import { ConcertBand, layoutConcertBand } from './ConcertBand';
import { ConcertKpop, layoutConcertKpop } from './ConcertKpop';
import { ConcertTicket, layoutConcert } from './ConcertTicket';
import { FoodHouse, layoutFoodHouse } from './FoodHouse';
import { FoodOrder, layoutFood } from './FoodOrder';
import { FourcutBack, FourcutFront, layoutFourcut } from './Fourcut';
import { GiftCoupon, layoutGift } from './GiftCoupon';
import { MovieTicket, layoutMovie } from './MovieTicket';
import { ReadingReceipt, layoutReading } from './ReadingReceipt';
import { SpendingReceipt, layoutSpending } from './SpendingReceipt';
import { ShowHolo, layoutShowHolo } from './ShowHolo';
import { ShowRetro, layoutShowRetro } from './ShowRetro';
import { ShowTicket, layoutShow } from './ShowTicket';
import { TemplateLayout } from './shared';
import { TravelPass, layoutTravel } from './TravelPass';

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
      return record.design === 'holo' ? layoutShowHolo(record) : record.design === 'poster' ? layoutShow(record) : layoutShowRetro(record);
    case 'concert':
      return record.design === 'band' ? layoutConcertBand(record) : record.design === 'kpop' ? layoutConcertKpop(record) : layoutConcert(record);
  }
}

/** 롤 폭(rollWidth) 기준 실제 표시 크기 */
export function sizeOf(record: RecoRecord, rollWidth: number) {
  const l = layoutOf(record);
  const width = rollWidth * l.displayRatio;
  const scale = width / l.width;
  return {
    width,
    height: l.height * scale,
    foldHeight: l.foldAt * scale,
    insetTop: l.inset.top * scale,
    insetBottom: l.inset.bottom * scale,
  };
}

/** 기록의 "앞면" (인생네컷은 사진 면) */
export const RecordPaper = memo(function RecordPaper({ record, width }: { record: RecoRecord; width: number }) {
  switch (record.kind) {
    case 'reading':
      return <ReadingReceipt record={record} width={width} />;
    case 'movie':
      return <MovieTicket record={record} width={width} />;
    case 'spending':
      return <SpendingReceipt record={record} width={width} />;
    case 'travel':
      return <TravelPass record={record} width={width} />;
    case 'fourcut':
      return <FourcutFront record={record} width={width} />;
    case 'gift':
      return <GiftCoupon record={record} width={width} />;
    case 'food':
      return record.design === 'house' ? <FoodHouse record={record} width={width} /> : <FoodOrder record={record} width={width} />;
    case 'show':
      return record.design === 'holo' ? (
        <ShowHolo record={record} width={width} />
      ) : record.design === 'poster' ? (
        <ShowTicket record={record} width={width} />
      ) : (
        <ShowRetro record={record} width={width} />
      );
    case 'concert':
      return record.design === 'band' ? (
        <ConcertBand record={record} width={width} />
      ) : record.design === 'kpop' ? (
        <ConcertKpop record={record} width={width} />
      ) : (
        <ConcertTicket record={record} width={width} />
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

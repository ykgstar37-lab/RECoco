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
import { ExerciseCard, layoutExerciseCard } from './ExerciseCard';
import { FourcutCard, layoutFourcutCard } from './FourcutCard';
import { ExerciseSlip, layoutExerciseSlip } from './ExerciseSlip';
import { MusicAlbum, layoutMusicAlbum } from './MusicAlbum';
import { MusicList, layoutMusicList } from './MusicList';
import { PlainTicket, layoutPlainTicket } from './PlainTicket';
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
      return record.design === 'card' ? layoutFourcutCard(record) : layoutFourcut(record);
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
            : record.design === 'retro' || record.design === 'ticket'
              ? layoutShowRetro(record)
              : record.design === 'poster'
                ? layoutShow(record)
                : layoutPlainTicket(record);
    case 'concert':
      return record.design === 'band'
        ? layoutWristBand(record)
        : record.design === 'kpop'
          ? layoutPhotoTicket(record)
          : record.design === 'retro'
            ? layoutConcertRetro(record)
            : record.design === 'plain'
              ? layoutPlainTicket(record)
              : layoutConcert(record);
    case 'exercise':
      return record.design === 'card' ? layoutExerciseCard(record) : layoutExerciseSlip(record);
    case 'music':
      return record.design === 'list' ? layoutMusicList(record) : layoutMusicAlbum(record);
  }
}

/**
 * 롤 폭(rollWidth) 기준 실제 표시 크기.
 * connected: 롤로 이어 붙일 때 — 1×4 처럼 세로로 긴 인생네컷만 조금 줄인다
 * (같은 폭으로 이으면 화면을 한참 넘어가서). 2×2·가로 2×2 는 그대로.
 */
export function sizeOf(record: RecoRecord, rollWidth: number, connected = false) {
  const l = layoutOf(record);
  const tallStrip = connected && record.kind === 'fourcut' && l.displayRatio <= 0.6;
  const width = rollWidth * (tallStrip ? 0.5 : l.displayRatio);
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
      return record.design === 'card' ? <FourcutCard record={record} width={width} connected={connected} /> : <FourcutFront record={record} width={width} connected={connected} />;
    case 'gift':
      return <GiftCoupon record={record} width={width} connected={connected} />;
    case 'food':
      return record.design === 'house' ? <FoodHouse record={record} width={width} connected={connected} /> : <FoodOrder record={record} width={width} connected={connected} />;
    case 'show':
      return record.design === 'kpop' ? (
        <PhotoTicket record={record} width={width} connected={connected} />
      ) : record.design === 'band' ? (
        <WristBand record={record} width={width} connected={connected} />
      ) : record.design === 'holo' ? (
        <ShowHolo record={record} width={width} connected={connected} />
      ) : record.design === 'retro' || record.design === 'ticket' ? (
        <ShowRetro record={record} width={width} connected={connected} />
      ) : record.design === 'poster' ? (
        <ShowTicket record={record} width={width} connected={connected} />
      ) : (
        <PlainTicket record={record} width={width} connected={connected} />
      );
    case 'concert':
      return record.design === 'band' ? (
        <WristBand record={record} width={width} connected={connected} />
      ) : record.design === 'kpop' ? (
        <PhotoTicket record={record} width={width} connected={connected} />
      ) : record.design === 'retro' ? (
        <ConcertRetro record={record} width={width} connected={connected} />
      ) : record.design === 'plain' ? (
        <PlainTicket record={record} width={width} connected={connected} />
      ) : (
        <ConcertTicket record={record} width={width} connected={connected} />
      );
    case 'exercise':
      return record.design === 'card' ? <ExerciseCard record={record} width={width} connected={connected} /> : <ExerciseSlip record={record} width={width} connected={connected} />;
    case 'music':
      return record.design === 'list' ? <MusicList record={record} width={width} connected={connected} /> : <MusicAlbum record={record} width={width} connected={connected} />;
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
  exercise: '운동',
  music: '음악',
};

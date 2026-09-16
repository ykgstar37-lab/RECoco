import { memo } from 'react';

import { RecoRecord } from '../types';
import { FourcutBack, FourcutFront, layoutFourcut } from './Fourcut';
import { MovieTicket, layoutMovie } from './MovieTicket';
import { ReadingReceipt, layoutReading } from './ReadingReceipt';
import { SpendingReceipt, layoutSpending } from './SpendingReceipt';
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
  }
}

/** 롤 폭(rollWidth) 기준 실제 표시 크기 */
export function sizeOf(record: RecoRecord, rollWidth: number) {
  const l = layoutOf(record);
  const width = rollWidth * l.displayRatio;
  const scale = width / l.width;
  return { width, height: l.height * scale, foldHeight: l.foldAt * scale };
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
  }
});

export const KIND_LABEL: Record<RecoRecord['kind'], string> = {
  reading: '독서',
  movie: '영화',
  spending: '소비',
  travel: '여행',
  fourcut: '인생네컷',
};

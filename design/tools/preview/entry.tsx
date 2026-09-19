import { renderToStaticMarkup } from 'react-dom/server';

import { FourcutBack, FourcutFront, RecordPaper, layoutOf } from '@app/templates';
import type { RecoRecord } from '@app/types';

export function render(record: RecoRecord, side: 'front' | 'back' = 'front') {
  const l = layoutOf(record);
  const el =
    record.kind === 'fourcut' && record.design !== 'card'
      ? side === 'back'
        ? <FourcutBack record={record} width={l.width} />
        : <FourcutFront record={record} width={l.width} />
      : <RecordPaper record={record} width={l.width} />;
  return renderToStaticMarkup(el);
}

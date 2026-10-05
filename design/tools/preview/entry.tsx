import { renderToStaticMarkup } from 'react-dom/server';

import { RecordBack, RecordPaper, isFlippable, layoutOf } from '@app/templates';
import type { RecoRecord } from '@app/types';

export function render(record: RecoRecord, side: 'front' | 'back' = 'front') {
  const l = layoutOf(record);
  const el = side === 'back' && isFlippable(record) ? <RecordBack record={record} width={l.width} /> : <RecordPaper record={record} width={l.width} />;
  return renderToStaticMarkup(el);
}

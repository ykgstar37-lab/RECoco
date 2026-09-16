import { renderToStaticMarkup } from 'react-dom/server';

import { CocoArt, CocoMood, CocoTone } from '@app/components/Coco';

export const renderCoco = (mood: CocoMood, tone: CocoTone = 'orange', size = 400) =>
  renderToStaticMarkup(<CocoArt size={size} mood={mood} tone={tone} id={`coco-${tone}-${mood}`} />);

import { renderToStaticMarkup } from 'react-dom/server';

import { Coco, CocoMood } from '@app/components/Coco';

export const renderCoco = (mood: CocoMood, size = 400) => renderToStaticMarkup(<Coco size={size} mood={mood} id={`coco-${mood}`} />);

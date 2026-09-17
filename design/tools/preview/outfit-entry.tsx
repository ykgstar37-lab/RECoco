import { renderToStaticMarkup } from 'react-dom/server';

import { CocoArt } from '@app/components/Coco';
import { OutfitId } from '@app/components/Outfits';

export const renderOutfit = (outfit: OutfitId) =>
  renderToStaticMarkup(<CocoArt size={400} mood="idle" tone="white" outfit={outfit} id={`coco-${outfit}`} />);

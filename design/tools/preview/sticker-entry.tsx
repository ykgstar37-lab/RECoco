import { renderToStaticMarkup } from 'react-dom/server';
import Svg from 'react-native-svg';

import { STICKERS, StickerArt } from '@app/components/Stickers';

export const renderStickers = () =>
  renderToStaticMarkup(
    <Svg width={1200} height={130} viewBox="0 0 600 65">
      {STICKERS.map((s, i) => (
        <StickerArt key={s.emoji} emoji={s.emoji} x={30 + i * 60} y={32} size={52} />
      ))}
    </Svg>,
  );

// 코코 옷(머리 장식). 코코 그림과 같은 viewBox(400×320) 좌표로 그려서 CocoArt 위에 겹친다
import { Circle, G, Path, Rect } from 'react-native-svg';

export type OutfitId = 'ribbon' | 'beanie' | 'straw' | 'beret' | 'crown' | 'party' | 'headphones';

// 모자는 꼭지 기준(225, 104)으로 그려두고, 머리를 푹 덮도록 키워서 코코 가운데로 옮긴다
const FIT: Record<OutfitId, { k: number; x: number; y: number }> = {
  ribbon: { k: 1.7, x: 250, y: 118 },
  beanie: { k: 1.45, x: 203, y: 150 },
  straw: { k: 1.3, x: 203, y: 142 },
  beret: { k: 1.4, x: 200, y: 142 },
  crown: { k: 1.35, x: 203, y: 146 },
  party: { k: 1.45, x: 205, y: 152 },
  headphones: { k: 1, x: 225, y: 104 },
};

/** 머리를 덮는 모자는 만두 꼭지를 숨긴다 (리본·헤드폰은 꼭지가 보이는 게 귀엽다) */
export const COVERS_KNOB: Record<OutfitId, boolean> = {
  ribbon: false,
  beanie: true,
  straw: true,
  beret: true,
  crown: true,
  party: true,
  headphones: false,
};

/** 그림 안에서 모자 원본의 가장 위쪽 y */
const RAW_TOP: Record<OutfitId, number> = { ribbon: 50, beanie: 4, straw: 38, beret: 20, crown: 8, party: 2, headphones: 36 };

/** 옷의 가장 위쪽 y (메인에서 대사를 코코에 붙일 때 모자에 겹치지 않도록) */
export const OUTFIT_TOP = Object.fromEntries(
  (Object.keys(FIT) as OutfitId[]).map((id) => [id, Math.max(0, FIT[id].y - FIT[id].k * (104 - RAW_TOP[id]))]),
) as Record<OutfitId, number>;

export function OutfitArt({ id }: { id: OutfitId }) {
  const { k, x, y } = FIT[id];
  return (
    <G transform={`translate(${x} ${y}) scale(${k}) translate(-225 -104)`}>
      <Hat id={id} />
    </G>
  );
}

function Hat({ id }: { id: OutfitId }) {
  switch (id) {
    case 'ribbon':
      return (
        <G>
          <Path d="M266,80 C236,50 218,86 244,100 Z" fill="#f27ca0" />
          <Path d="M270,80 C302,48 322,84 294,100 Z" fill="#f27ca0" />
          <Path d="M262,84 L252,112 L264,106 Z M274,84 L286,112 L274,106 Z" fill="#e0628a" />
          <Circle cx={268} cy={82} r={10} fill="#e0628a" />
        </G>
      );
    case 'beanie':
      return (
        <G>
          <Path d="M132,104 C130,44 174,18 224,18 C274,18 318,44 318,108 C270,92 180,90 132,104 Z" fill="#4a63a8" />
          {[176, 206, 236, 266].map((x, i) => (
            <Path key={x} d={`M${x},${30 + Math.abs(i - 1.5) * 6} Q${x + (x - 222) * 0.12},70 ${x + (x - 222) * 0.2},96`} stroke="#3d5595" strokeWidth={5} strokeLinecap="round" fill="none" />
          ))}
          <Path d="M124,106 C180,84 272,86 326,112 L322,134 C272,110 182,108 128,128 Z" fill="#3d5595" />
          <Circle cx={224} cy={17} r={13} fill="#f2c14e" />
        </G>
      );
    case 'straw':
      return (
        <G>
          <Path d="M82,114 C108,86 342,88 368,118 C342,136 108,136 82,114 Z" fill="#e8c170" />
          <Path d="M158,106 C156,58 184,38 225,38 C266,38 294,58 292,108 C250,98 200,98 158,106 Z" fill="#f0cf82" />
          <Path d="M157,90 C200,82 250,82 293,92 L292,108 C250,98 200,98 158,106 Z" fill="#e0584a" />
          <Path d="M108,118 C160,104 290,104 342,120" stroke="#d9ad58" strokeWidth={4} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'beret':
      return (
        <G>
          <Path d="M226,36 C222,22 236,16 242,30 Z" fill="#b8403c" />
          <Path d="M118,106 C96,70 148,32 230,32 C314,32 354,70 324,106 C282,90 168,88 118,106 Z" fill="#d9534f" />
          <Path d="M122,104 C170,88 280,88 322,104" stroke="#b8403c" strokeWidth={6} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'crown':
      return (
        <G>
          <Path d="M160,78 L150,28 L190,60 L226,18 L262,60 L302,28 L292,78 C252,70 198,70 160,78 Z" fill="#f5c243" />
          <Path d="M156,102 C196,92 256,92 296,104 L292,76 C252,68 198,68 160,76 Z" fill="#e8ae2a" />
          <Circle cx={150} cy={27} r={8} fill="#f5c243" />
          <Circle cx={226} cy={16} r={8} fill="#f5c243" />
          <Circle cx={302} cy={27} r={8} fill="#f5c243" />
          <Circle cx={226} cy={87} r={8} fill="#e0584a" />
          <Circle cx={186} cy={89} r={6} fill="#4a90d9" />
          <Circle cx={266} cy={89} r={6} fill="#4a90d9" />
        </G>
      );
    case 'party':
      return (
        <G>
          <Path d="M184,98 L236,12 L290,102 C262,92 212,90 184,98 Z" fill="#6cc3a0" />
          <Path d="M204,66 L250,40 L258,52 L199,76 Z M192,88 L270,64 L278,78 L188,96 Z" fill="#fff5d6" />
          <Path d="M184,98 C212,90 262,92 290,102" stroke="#4fa885" strokeWidth={6} strokeLinecap="round" fill="none" />
          <Circle cx={236} cy={13} r={11} fill="#f2c14e" />
        </G>
      );
    case 'headphones':
      return (
        <G>
          <Path d="M66,196 C62,30 338,30 334,196" stroke="#3a3a44" strokeWidth={16} strokeLinecap="round" fill="none" />
          <Rect x={38} y={158} width={50} height={82} rx={22} fill="#ff9a5c" />
          <Rect x={312} y={158} width={50} height={82} rx={22} fill="#ff9a5c" />
          <Rect x={54} y={170} width={18} height={58} rx={9} fill="#3a3a44" />
          <Rect x={328} y={170} width={18} height={58} rx={9} fill="#3a3a44" />
        </G>
      );
  }
}

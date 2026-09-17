// 코코 옷(머리 장식). 코코 그림과 같은 viewBox(400×320) 좌표로 그려서 CocoArt 위에 겹친다
import { Circle, G, Path, Rect } from 'react-native-svg';

export type OutfitId = 'ribbon' | 'beanie' | 'straw' | 'beret' | 'crown' | 'party' | 'headphones' | 'earflap' | 'trapper';

// 모자 그림의 기준점(from)을 코코 머리 위 자리(to)에 맞추고, k배 키우고 r도 기울인다. top = 얹었을 때 가장 위쪽 y
const FIT: Record<OutfitId, { from: [number, number]; to: [number, number]; k: number; r?: number; top: number }> = {
  ribbon: { from: [268, 82], to: [274, 90], k: 1.5, r: 12, top: 40 },
  beanie: { from: [225, 104], to: [203, 150], k: 1.45, top: 5 },
  straw: { from: [225, 114], to: [203, 104], k: 1.25, top: 9 },
  beret: { from: [225, 104], to: [200, 142], k: 1.4, top: 24 },
  crown: { from: [225, 104], to: [203, 146], k: 1.35, top: 16 },
  party: { from: [236, 98], to: [238, 104], k: 1.25, r: 12, top: 6 },
  headphones: { from: [0, 0], to: [0, 0], k: 1, top: 40 },
  earflap: { from: [0, 0], to: [0, 0], k: 1, top: 14 },
  trapper: { from: [0, 0], to: [0, 0], k: 1, top: 62 },
};

/** 머리를 덮는 모자는 만두 꼭지를 숨긴다 (리본은 꼭지가 보이는 게 귀엽다) */
export const COVERS_KNOB: Record<OutfitId, boolean> = {
  ribbon: false,
  beanie: true,
  straw: true,
  beret: true,
  crown: true,
  party: true,
  headphones: true,
  earflap: true,
  trapper: true,
};

/** 옷의 가장 위쪽 y (메인에서 대사를 코코에 붙일 때 모자에 겹치지 않도록) */
export const OUTFIT_TOP = Object.fromEntries((Object.keys(FIT) as OutfitId[]).map((id) => [id, FIT[id].top])) as Record<OutfitId, number>;

export function OutfitArt({ id }: { id: OutfitId }) {
  const { from, to, k, r = 0 } = FIT[id];
  return (
    <G transform={`translate(${to[0]} ${to[1]}) rotate(${r}) scale(${k}) translate(${-from[0]} ${-from[1]})`}>
      <Hat id={id} />
    </G>
  );
}

function Hat({ id }: { id: OutfitId }) {
  switch (id) {
    case 'ribbon':
      return (
        <G>
          {/* 꼬리: 끝이 V자로 파인 리본 끈 */}
          <Path d="M262,88 C257,100 250,112 242,124 L252,121 L255,131 C263,118 268,104 268,90 Z" fill="#e0628a" />
          <Path d="M274,88 C279,100 286,112 294,124 L284,121 L281,131 C273,118 268,104 268,90 Z" fill="#e0628a" />
          {/* 통통한 고리 두 개 + 안쪽 접힌 그림자 */}
          <Path d="M268,83 C254,63 224,57 219,73 C215,89 240,98 268,87 Z" fill="#f27ca0" />
          <Path d="M268,83 C282,63 312,57 317,73 C321,89 296,98 268,87 Z" fill="#f27ca0" />
          <Path d="M267,84 C256,76 241,74 238,80 C237,86 252,89 267,86 Z" fill="#d95a82" />
          <Path d="M269,84 C280,76 295,74 298,80 C299,86 284,89 269,86 Z" fill="#d95a82" />
          {/* 반짝이는 윗면 */}
          <Path d="M230,70 C236,64 246,64 252,68" stroke="#ffc6d8" strokeWidth={3.5} strokeLinecap="round" fill="none" />
          <Path d="M284,68 C290,64 300,64 306,70" stroke="#ffc6d8" strokeWidth={3.5} strokeLinecap="round" fill="none" />
          {/* 매듭 */}
          <Rect x={259} y={75} width={18} height={17} rx={6} fill="#e0628a" />
          <Path d="M262,79 C266,77 270,77 274,79" stroke="#f59bb8" strokeWidth={2.5} strokeLinecap="round" fill="none" />
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
          <Path d="M170,98 L236,30 L302,102 C262,92 210,90 170,98 Z" fill="#6cc3a0" />
          <Path d="M196,70 L204,62 L250,44 L257,52 Z M176,92 L183,84 L272,68 L279,76 Z" fill="#fff5d6" />
          <Path d="M170,98 C210,90 262,92 302,102" stroke="#4fa885" strokeWidth={6} strokeLinecap="round" fill="none" />
          <Circle cx={236} cy={30} r={11} fill="#f2c14e" />
        </G>
      );
    case 'headphones':
      // 에어팟 맥스 느낌: 얇은 프레임 + 메쉬 캐노피 + 둥근 사각 이어컵
      return (
        <G>
          <Path d="M58,168 C52,28 348,28 342,168" stroke="#4d525c" strokeWidth={12} strokeLinecap="round" fill="none" />
          <Path d="M92,112 C120,58 280,58 308,112" stroke="#9aa1ad" strokeWidth={20} strokeLinecap="round" fill="none" />
          <Path d="M92,112 C120,58 280,58 308,112" stroke="#b7bdc7" strokeWidth={2} strokeDasharray="1 5" strokeLinecap="round" fill="none" />
          <Rect x={53} y={160} width={10} height={20} rx={3} fill="#d5d9df" />
          <Rect x={337} y={160} width={10} height={20} rx={3} fill="#d5d9df" />
          <Rect x={14} y={176} width={74} height={104} rx={34} fill="#5f6570" />
          <Rect x={312} y={176} width={74} height={104} rx={34} fill="#5f6570" />
          <Rect x={62} y={186} width={26} height={84} rx={13} fill="#7d8490" />
          <Rect x={312} y={186} width={26} height={84} rx={13} fill="#7d8490" />
        </G>
      );
    case 'earflap':
      // 방울 달린 귀도리 니트 모자 (페어아일 무늬 + 끈)
      return (
        <G>
          <Path d="M70,236 C60,270 74,296 62,318" stroke="#6f5236" strokeWidth={6} strokeLinecap="round" fill="none" />
          <Path d="M330,236 C340,270 326,296 338,318" stroke="#6f5236" strokeWidth={6} strokeLinecap="round" fill="none" />
          <Path d="M48,150 C40,196 44,232 70,246 C96,254 112,222 112,168 Z" fill="#8a6a4a" />
          <Path d="M352,150 C360,196 356,232 330,246 C304,254 288,222 288,168 Z" fill="#8a6a4a" />
          <Path d="M52,160 C52,18 348,18 348,160 C280,140 120,140 52,160 Z" fill="#8a6a4a" />
          <Path d="M60,108 C120,78 280,78 340,108 L344,134 C280,106 120,106 56,134 Z" fill="#efe3cc" />
          {[96, 136, 176, 216, 256, 296].map((x, i) => (
            <Path key={x} d={`M${x},${112 - Math.sin(((i + 0.5) / 6) * Math.PI) * 16} l8,-7 l8,7 l-8,7 Z`} fill={i % 2 ? '#8fa9d6' : '#d9534f'} />
          ))}
          <Path d="M46,158 C120,132 280,132 354,158 L356,188 C280,162 120,162 44,188 Z" fill="#7a5c3e" />
          {[70, 100, 130, 160, 190, 220, 250, 280, 310, 338].map((x) => (
            <Path key={x} d={`M${x},${150 - Math.sin(((x - 46) / 310) * Math.PI) * 14} l0,24`} stroke="#6a4f35" strokeWidth={4} strokeLinecap="round" />
          ))}
          <Circle cx={200} cy={42} r={28} fill="#f4ece0" />
          <Circle cx={180} cy={32} r={13} fill="#f4ece0" />
          <Circle cx={222} cy={30} r={13} fill="#f4ece0" />
          <Circle cx={212} cy={54} r={14} fill="#e9dfd0" />
        </G>
      );
    case 'trapper':
      // 털 달린 방한모 (가죽 + 앞 털 말림 + 귀 덮개)
      return (
        <G>
          <Path d="M50,150 C38,196 42,236 70,252 C98,262 116,228 114,160 Z" fill="#b7773f" />
          <Path d="M350,150 C362,196 358,236 330,252 C302,262 284,228 286,160 Z" fill="#b7773f" />
          <Circle cx={54} cy={244} r={17} fill="#d9d2c9" /><Circle cx={70} cy={256} r={17} fill="#d9d2c9" /><Circle cx={88} cy={258} r={17} fill="#d9d2c9" /><Circle cx={104} cy={250} r={17} fill="#d9d2c9" />
          <Circle cx={346} cy={244} r={17} fill="#d9d2c9" /><Circle cx={330} cy={256} r={17} fill="#d9d2c9" /><Circle cx={312} cy={258} r={17} fill="#d9d2c9" /><Circle cx={296} cy={250} r={17} fill="#d9d2c9" />
          <Path d="M66,152 C66,34 334,34 334,152 Z" fill="#c4854a" />
          <Path d="M200,70 L200,128" stroke="#a5672f" strokeWidth={4} strokeLinecap="round" />
          <Path d="M130,84 C142,100 146,116 146,132 M270,84 C258,100 254,116 254,132" stroke="#a5672f" strokeWidth={4} strokeLinecap="round" fill="none" />
          <Circle cx={62} cy={150} r={24} fill="#cfc7bc" /><Circle cx={82} cy={144} r={24} fill="#cfc7bc" /><Circle cx={101} cy={139} r={24} fill="#cfc7bc" /><Circle cx={121} cy={134} r={24} fill="#cfc7bc" /><Circle cx={141} cy={130} r={24} fill="#cfc7bc" /><Circle cx={161} cy={127} r={24} fill="#cfc7bc" /><Circle cx={180} cy={125} r={24} fill="#cfc7bc" /><Circle cx={200} cy={124} r={24} fill="#cfc7bc" /><Circle cx={220} cy={125} r={24} fill="#cfc7bc" /><Circle cx={239} cy={127} r={24} fill="#cfc7bc" /><Circle cx={259} cy={130} r={24} fill="#cfc7bc" /><Circle cx={279} cy={134} r={24} fill="#cfc7bc" /><Circle cx={299} cy={139} r={24} fill="#cfc7bc" /><Circle cx={318} cy={144} r={24} fill="#cfc7bc" /><Circle cx={338} cy={150} r={24} fill="#cfc7bc" />
          <Circle cx={82} cy={138} r={18} fill="#e6e0d8" /><Circle cx={101} cy={133} r={18} fill="#e6e0d8" /><Circle cx={121} cy={128} r={18} fill="#e6e0d8" /><Circle cx={141} cy={124} r={18} fill="#e6e0d8" /><Circle cx={161} cy={121} r={18} fill="#e6e0d8" /><Circle cx={180} cy={119} r={18} fill="#e6e0d8" /><Circle cx={200} cy={118} r={18} fill="#e6e0d8" /><Circle cx={220} cy={119} r={18} fill="#e6e0d8" /><Circle cx={239} cy={121} r={18} fill="#e6e0d8" /><Circle cx={259} cy={124} r={18} fill="#e6e0d8" /><Circle cx={279} cy={128} r={18} fill="#e6e0d8" /><Circle cx={299} cy={133} r={18} fill="#e6e0d8" /><Circle cx={318} cy={138} r={18} fill="#e6e0d8" />
        </G>
      );
  }
}

// 코코 옷(머리 장식). 코코 그림과 같은 viewBox(400×320) 좌표로 그려서 CocoArt 위에 겹친다
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

export type OutfitId = 'ribbon' | 'heart' | 'cat' | 'dog' | 'straw' | 'beret' | 'crown' | 'party' | 'headphones' | 'earflap' | 'trapper' | 'glasses';

// 모자 그림의 기준점(from)을 코코 머리 위 자리(to)에 맞추고, k배 키우고 r도 기울인다. top = 얹었을 때 가장 위쪽 y
const FIT: Record<OutfitId, { from: [number, number]; to: [number, number]; k: number; r?: number; top: number }> = {
  ribbon: { from: [268, 82], to: [300, 102], k: 1.1, r: 26, top: 70 },
  heart: { from: [0, 0], to: [0, 0], k: 1, top: 4 },
  cat: { from: [0, 0], to: [0, 0], k: 1, top: 50 },
  dog: { from: [0, 0], to: [0, 0], k: 1, top: 86 },
  straw: { from: [225, 114], to: [203, 104], k: 1.25, top: 9 },
  beret: { from: [225, 104], to: [200, 142], k: 1.4, top: 24 },
  crown: { from: [225, 104], to: [203, 146], k: 1.35, top: 16 },
  party: { from: [236, 98], to: [238, 104], k: 1.25, r: 12, top: 6 },
  headphones: { from: [0, 0], to: [0, 0], k: 1, top: 40 },
  earflap: { from: [0, 0], to: [0, 0], k: 1, top: 14 },
  trapper: { from: [0, 0], to: [0, 0], k: 1, top: 62 },
  glasses: { from: [0, 0], to: [0, 0], k: 1, top: 160 },
};

const HEART = '#fff'; // 하트 꼬랑지 (코코와 같은 흰색)
const LINE = '#3a2a22'; // 고양이 귀·수염 (코코 눈과 같은 색)
const EAR = '#2e2a2f'; // 강아지 귀 (흰 코코와 대비되는 검정)

/** 머리를 덮는 옷은 만두 꼭지를 숨긴다 (리본은 꼭지 옆에 묶어서 꼭지가 보이게) */
export const COVERS_KNOB: Record<OutfitId, boolean> = {
  ribbon: false,
  heart: true, // 꼭지 자리에서 하트가 솟는다
  cat: true, // 귀가 꼭지 자리를 대신한다
  dog: true,
  straw: true,
  beret: true,
  crown: true,
  party: true,
  headphones: true,
  earflap: true,
  trapper: true,
  glasses: false, // 눈에 걸치는 거라 머리 꼭지는 그대로 보인다
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
      // 가운데가 조여진 나비 리본: 고리 두 개 + 접힌 주름 + 짧게 퍼지는 꼬리 + 동그란 매듭
      return (
        <G>
          <Path d="M264,88 C260,96 255,104 248,111 L257,111 L261,118 C266,108 268,98 268,89 Z" fill="#e0628a" />
          <Path d="M272,88 C276,96 281,104 288,111 L279,111 L275,118 C270,108 268,98 268,89 Z" fill="#e0628a" />
          <Path d="M268,79 C256,70 236,60 226,66 C216,72 218,94 228,98 C238,102 256,94 268,87 Z" fill="#f58db0" />
          <Path d="M268,79 C280,70 300,60 310,66 C320,72 318,94 308,98 C298,102 280,94 268,87 Z" fill="#f58db0" />
          <Path d="M264,82 C254,79 243,80 234,85" stroke="#d9557d" strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d="M272,82 C282,79 293,80 302,85" stroke="#d9557d" strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d="M230,71 C234,67 240,66 245,67" stroke="#ffd3e2" strokeWidth={2.6} strokeLinecap="round" fill="none" />
          <Path d="M291,67 C296,66 302,67 306,71" stroke="#ffd3e2" strokeWidth={2.6} strokeLinecap="round" fill="none" />
          <Ellipse cx={268} cy={83} rx={8} ry={9} fill="#e0628a" />
          <Ellipse cx={266} cy={80} rx={3} ry={2.2} fill="#f7a8c4" />
        </G>
      );
    case 'heart':
      // 머리 한가운데서 솟아 하트로 끝나는 꼬랑지. 한 붓으로 그려서 끝이 시작점에 닿기 전에 멈춘다
      return (
        <Path
          d="M203,80 C201,74 200,70 200,66 C172.8,50 158.3,37 158.3,25.4 C158.3,15.3 168.3,8 180.1,8 C189.1,8 196.4,12.4 200,18.2 C203.6,12.4 210.9,8 219.9,8 C231.7,8 241.7,15.3 241.7,25.4 C241.7,37 236,44 219,53"
          fill="none"
          stroke={HEART}
          strokeWidth={7}
          strokeLinecap="round"
        />
      );
    case 'cat':
      // 고양이: 머리 위에 작게 벌려 얹은 귀 + 볼 옆 짧은 수염 (코는 입과 붙어 보여서 뺐다)
      return (
        <G>
          {['M132,98 Q140,58 158,52 Q172,66 180,92', 'M268,98 Q260,58 242,52 Q228,66 220,92'].map((d) => (
            <Path key={d} d={d} fill="none" stroke={LINE} strokeWidth={6} strokeLinecap="round" />
          ))}
          {[
            'M146,210 C124,204 100,200 76,198',
            'M146,224 C124,226 100,230 76,235',
            'M254,210 C276,204 300,200 324,198',
            'M254,224 C276,226 300,230 324,235',
          ].map((d) => (
            <Path key={d} d={d} fill="none" stroke={LINE} strokeWidth={5} strokeLinecap="round" opacity={0.9} />
          ))}
        </G>
      );
    case 'dog':
      // 머리 양옆에 늘어진 검은 강아지 귀: 붙는 쪽은 가늘고 아래로 갈수록 불룩한 물방울 모양
      return (
        <G fill={EAR}>
          <Path d="M128,90 C96,96 52,120 34,158 C18,192 26,224 56,228 C84,232 100,208 104,178 C110,142 122,110 128,90 Z" />
          <Path d="M286,90 C318,96 362,120 380,158 C396,192 388,224 358,228 C330,232 314,208 310,178 C304,142 292,110 286,90 Z" />
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
    case 'glasses':
      // 빨간 뿔테: 타원 알 두 개 + 콧대만 (안경다리·경첩 없음). 코코 눈(158,190)·(242,190) 위에 얹는다
      return (
        <G>
          <Path d="M188,179 Q200,170 212,179" stroke="#c9331d" strokeWidth={8} strokeLinecap="round" fill="none" />
          <Ellipse cx={154} cy={190} rx={33} ry={25} fill="none" stroke="#e2402a" strokeWidth={9} />
          <Ellipse cx={246} cy={190} rx={33} ry={25} fill="none" stroke="#e2402a" strokeWidth={9} />
          <Path d="M132,177 Q144,169 162,170" stroke="#ff8a70" strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.9} />
          <Path d="M224,177 Q236,169 254,170" stroke="#ff8a70" strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.9} />
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

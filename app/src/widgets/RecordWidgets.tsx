// 홈 화면 위젯 (iOS). 코드는 앱이 아니라 위젯 안의 따로 된 실행기에서 돈다 —
// 'widget' 표시가 붙은 함수 몸통만 문자열로 넘어가서, 바깥 상수·함수·RN 컴포넌트는 못 쓴다 (@expo/ui/swift-ui 만).
// 그림은 앱이 위젯 공용 폴더에 구워 둔 PNG(lib/widget.ios.ts) 경로를 props 로 받는다.
//
// 이름은 app.json 의 expo-widgets 설정 widgets[].name 과 같아야 한다.
//  - RecocoSmall: 작은 위젯 한 장
//  - RecocoRoll : 큰 위젯. ▲▼ 로 넘기고 위에 다음 장이 걸쳐 보인다
// 길게 눌러 '위젯 편집' 에서 최근 기록 / 앱에서 고른 기록 중 고른다 (source).
import { Button, Circle, Image, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import { aspectRatio, buttonStyle, clipped, containerBackground, font, foregroundStyle, frame, offset, padding, resizable, shadow } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export interface WidgetProps {
  /** 최근 기록 그림 (최신이 앞) */
  recent: string[];
  /** 크게 보기에서 '위젯에 넣기' 한 기록 그림 (넣은 순서) */
  picked: string[];
  /** 큰 위젯에서 지금 보는 자리 (▲▼ 로 바뀐다) */
  index: number;
}

export type WidgetConfig = { source: 'recent' | 'picked' };

const RecocoSmall = (props: WidgetProps, env: WidgetEnvironment<WidgetConfig>) => {
  'widget';
  const list = env.configuration?.source === 'picked' ? props.picked : props.recent;
  const glass = containerBackground({ type: 'material', material: 'ultraThin' }, 'widget');
  if (!list || list.length === 0) {
    return (
      <VStack modifiers={[glass, padding({ all: 12 })]}>
        <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle('#ff7a2f')]}>레코코</Text>
        <Text modifiers={[font({ size: 12 }), foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}>
          {env.configuration?.source === 'picked' ? '크게 보기에서 위젯에 넣어 보세요' : '기록을 남기면 여기에 떠요'}
        </Text>
      </VStack>
    );
  }
  return <Image uiImage={list[0]} modifiers={[resizable(), aspectRatio({ contentMode: 'fit' }), padding({ all: 10 }), glass]} />;
};

const RecocoRoll = (props: WidgetProps, env: WidgetEnvironment<WidgetConfig>) => {
  'widget';
  const list = env.configuration?.source === 'picked' ? props.picked : props.recent;
  const glass = containerBackground({ type: 'material', material: 'ultraThin' }, 'widget');
  const n = list ? list.length : 0;
  if (n === 0) {
    return (
      <VStack spacing={6} modifiers={[glass, padding({ all: 20 })]}>
        <Text modifiers={[font({ size: 17, weight: 'bold' }), foregroundStyle('#ff7a2f')]}>레코코</Text>
        <Text modifiers={[font({ size: 14 }), foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}>
          {env.configuration?.source === 'picked' ? '크게 보기에서 위젯에 넣은 기록이 여기에 줄줄이 떠요' : '기록을 남기면 여기에 줄줄이 떠요'}
        </Text>
      </VStack>
    );
  }
  const i = ((props.index % n) + n) % n;
  // 한 장 높이·걸침: 큰 위젯(약 360pt) 기준. 다음 장은 지금 장 위에 붙어 아랫부분만 보인다
  const H = 300;
  const PEEK = 30;
  const GAP = 10;
  const art = (uri: string) => <Image uiImage={uri} modifiers={[resizable(), aspectRatio({ contentMode: 'fit' }), frame({ height: H })]} />;
  // 버튼: 주황 동그라미 + 흰 화살표, 은은한 그림자
  const arrow = (target: string, symbol: 'chevron.up' | 'chevron.down', next: number) => (
    <Button target={target} onPress={() => ({ ...props, index: next })} modifiers={[buttonStyle('plain')]}>
      <ZStack>
        <Circle
          modifiers={[
            frame({ width: 30, height: 30 }),
            foregroundStyle({ type: 'linearGradient', colors: ['#ff8c4a', '#ff7a2f'], startPoint: { x: 0.5, y: 0 }, endPoint: { x: 0.5, y: 1 } }),
            shadow({ radius: 2, y: 1.5, color: '#00000024' }),
          ]}
        />
        <Image systemName={symbol} size={13} color="#ffffff" modifiers={[font({ size: 13, weight: 'bold' })]} />
      </ZStack>
    </Button>
  );
  return (
    <ZStack alignment="bottomTrailing" modifiers={[glass]}>
      <ZStack alignment="top" modifiers={[frame({ maxWidth: 10000, maxHeight: 10000, alignment: 'top' }), clipped()]}>
        <VStack spacing={GAP} modifiers={[offset({ x: -18, y: -(H + GAP - PEEK) + 8 })]}>
          {n > 1 ? art(list[(i + 1) % n]) : <Text modifiers={[frame({ height: H })]}>{''}</Text>}
          {art(list[i])}
        </VStack>
      </ZStack>
      <VStack spacing={8} modifiers={[padding({ trailing: 12, bottom: 14 })]}>
        <Text modifiers={[font({ size: 10 }), foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}>{`${i + 1} / ${n}`}</Text>
        {arrow('up', 'chevron.up', i - 1)}
        {arrow('down', 'chevron.down', i + 1)}
      </VStack>
    </ZStack>
  );
};

export const SmallWidget = createWidget<WidgetProps, WidgetConfig>('RecocoSmall', RecocoSmall);
export const RollWidget = createWidget<WidgetProps, WidgetConfig>('RecocoRoll', RecocoRoll);

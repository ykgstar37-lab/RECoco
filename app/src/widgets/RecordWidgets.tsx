// 홈 화면 위젯 (iOS). 코드는 앱이 아니라 위젯 안의 따로 된 실행기에서 돈다 —
// 'widget' 표시가 붙은 함수 몸통만 문자열로 넘어가서, 바깥 상수·함수·RN 컴포넌트는 못 쓴다 (@expo/ui/swift-ui 만).
// 그림은 앱이 위젯 공용 폴더에 구워 둔 PNG(components/WidgetShots.ios.tsx) 경로를 props 로 받는다.
//
// 이름은 app.json 의 expo-widgets 설정 widgets[].name 과 같아야 한다.
//  - RecocoSmall: 작은 위젯 한 장. 위젯 편집에서 '고른 기록' 중 한 장을 직접 고른다 (record — plugins/withWidgetRecordPicker.js)
//  - RecocoRoll : 큰 위젯. ▲▼ 로 넘기고 위에 다음 장이 걸쳐 보인다
// 길게 눌러 '위젯 편집' 에서 최근 기록 / 앱에서 고른 기록 중 고른다 (source).
// 바탕은 투명 — 홈 화면을 '투명(Clear)' 모양으로 두면 영수증만 배경화면 위에 뜬다 (기본 모양에서는 iOS 가 흰 판을 깐다).
// 기본 모양에서는 '위젯 배경 맞추기'(lib/widgetBg.ts)로 잘라 둔 배경화면 조각(props.bg)을 맨 밑에 깔아 투명한 것처럼 보이게 한다.
// 그림은 fullColor 로 — 투명·색조 모양에서도 영수증 색을 그대로 둔다.
import { Button, Circle, HStack, Image, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  aspectRatio,
  buttonStyle,
  clipped,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  offset,
  padding,
  resizable,
  shadow,
  widgetAccentedRenderingMode,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { ReactNode } from 'react';

export interface PickedShot {
  id: string;
  /** 위젯 편집 목록에 뜨는 이름 */
  title: string;
  uri: string;
}

export interface WidgetProps {
  /** 최근 기록 그림 (최신이 앞) */
  recent: string[];
  /** 크게 보기에서 '위젯에 넣기' 한 기록 (넣은 순서). 위젯 편집의 기록 목록도 여기서 읽는다 */
  picked: PickedShot[];
  /** 큰 위젯에서 지금 보는 자리 (▲▼ 로 바뀐다) */
  index: number;
  /** 그림을 아직 굽는 중이면 몇 장 남았는지 등 — 빈 위젯에 보여 준다 */
  status: string;
  /** 위젯 자리만큼 잘라 둔 배경화면 (작은 위젯·큰 위젯) */
  bg?: { small?: string; large?: string };
  /** 배경 맞추는 중: 아무것도 없는 하얀 판만 (스크린샷에서 위젯 자리를 찾으려고) */
  calib?: boolean;
}

/** record: 작은 위젯에서 고른 기록 id (없으면 고른 기록 첫 장) */
export type WidgetConfig = { source: 'recent' | 'picked'; record?: string };

const RecocoSmall = (props: WidgetProps, env: WidgetEnvironment<WidgetConfig>) => {
  'widget';
  const picked = props.picked || [];
  const usePicked = env.configuration?.source === 'picked';
  const chosen = usePicked ? picked.find((p) => p.id === env.configuration?.record) || picked[0] : undefined;
  const uri = usePicked ? (chosen ? chosen.uri : undefined) : (props.recent || [])[0];
  if (props.calib)
    return (
      <ZStack modifiers={[containerBackground('#ffffff', 'widget'), frame({ maxWidth: 4000, maxHeight: 4000 })]}>
        <Spacer />
      </ZStack>
    );
  // 잘라 둔 배경은 기본(fullColor) 모양에서만. 위젯 여백만큼 밖으로 늘려 위젯 끝까지 덮는다
  const mode = env.widgetRenderingMode;
  const bgUri = mode !== 'accented' && mode !== 'vibrant' && props.bg ? props.bg.small : undefined;
  const m = env.widgetContentMargins || { top: 16, bottom: 16, leading: 16, trailing: 16 };
  const content = !uri ? (
    <VStack spacing={4} modifiers={[padding({ all: 12 })]}>
      <Text modifiers={[font({ size: 14, weight: 'bold' }), foregroundStyle('#ff7a2f')]}>레코코</Text>
      <Text modifiers={[font({ size: 12 }), foregroundStyle(bgUri ? '#ffffff' : { type: 'hierarchical', style: 'secondary' })]}>
        {props.status || (usePicked ? '기록 크게 보기에서 ＋ 를 눌러 넣어 보세요' : '기록을 남기면 여기에 떠요')}
      </Text>
    </VStack>
  ) : (
    <Image
      uiImage={uri}
      modifiers={[widgetAccentedRenderingMode('fullColor'), resizable(), aspectRatio({ contentMode: 'fit' }), padding({ all: 8 }), shadow({ radius: 4, y: 2, color: '#00000033' })]}
    />
  );
  return (
    <ZStack modifiers={[containerBackground('#00000000', 'widget')]}>
      {bgUri ? (
        <Image uiImage={bgUri} modifiers={[resizable(), padding({ top: -m.top, bottom: -m.bottom, leading: -m.leading, trailing: -m.trailing })]} />
      ) : null}
      {content}
    </ZStack>
  );
};

const RecocoRoll = (props: WidgetProps, env: WidgetEnvironment<WidgetConfig>) => {
  'widget';
  const list = env.configuration?.source === 'picked' ? (props.picked || []).map((p) => p.uri) : props.recent || [];
  if (props.calib)
    return (
      <ZStack modifiers={[containerBackground('#ffffff', 'widget'), frame({ maxWidth: 4000, maxHeight: 4000 })]}>
        <Spacer />
      </ZStack>
    );
  // 큰 위젯은 여백이 없어서(contentMarginsDisabled) 배경을 그대로 꽉 채운다
  const mode = env.widgetRenderingMode;
  const bgUri = mode !== 'accented' && mode !== 'vibrant' && props.bg ? props.bg.large : undefined;
  const clear = containerBackground('#00000000', 'widget');
  const withBg = (content: ReactNode) => (
    <ZStack modifiers={[clear]}>
      {bgUri ? <Image uiImage={bgUri} modifiers={[resizable()]} /> : null}
      {content}
    </ZStack>
  );
  const n = list.length;
  if (n === 0) {
    return withBg(
      <VStack spacing={6} modifiers={[padding({ all: 20 })]}>
        <Text modifiers={[font({ size: 17, weight: 'bold' }), foregroundStyle('#ff7a2f')]}>레코코</Text>
        <Text modifiers={[font({ size: 14 }), foregroundStyle(bgUri ? '#ffffff' : { type: 'hierarchical', style: 'secondary' })]}>
          {props.status ||
            (env.configuration?.source === 'picked' ? '기록 크게 보기에서 ＋ 를 눌러 넣은 기록이 여기에 줄줄이 떠요' : '기록을 남기면 여기에 줄줄이 떠요')}
        </Text>
      </VStack>,
    );
  }
  const i = ((props.index % n) + n) % n;
  // 위에 다음 장의 아랫부분이 PEEK 만큼 걸쳐 보이고, 그 아래 지금 장이 남은 높이를 꽉 채운다.
  // 걸친 장은 H 높이로 그린 뒤 위로 밀어 올려 아랫부분만 남긴다 (frame 이 가운데 맞춤이라 (H - PEEK) / 2)
  const H = 280;
  const PEEK = 34;
  const art = (uri: string) => (
    <Image uiImage={uri} modifiers={[widgetAccentedRenderingMode('fullColor'), resizable(), aspectRatio({ contentMode: 'fit' }), shadow({ radius: 4, y: 2, color: '#00000033' })]} />
  );
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
  return withBg(
    <HStack spacing={6} modifiers={[padding({ top: 0, bottom: 14, leading: 14, trailing: 12 })]}>
      {n > 1 ? (
        <VStack spacing={8}>
          <ZStack modifiers={[frame({ height: PEEK }), clipped()]}>
            <ZStack modifiers={[frame({ height: H }), offset({ y: -(H - PEEK) / 2 })]}>{art(list[(i + 1) % n])}</ZStack>
          </ZStack>
          {art(list[i])}
        </VStack>
      ) : (
        <VStack modifiers={[padding({ top: 14 })]}>{art(list[i])}</VStack>
      )}
      <VStack spacing={8}>
        <Spacer />
        <Text modifiers={[font({ size: 10, weight: 'semibold' }), foregroundStyle(bgUri ? '#ffffff' : { type: 'hierarchical', style: 'secondary' }), shadow({ radius: 2, color: bgUri ? '#00000055' : '#00000000' })]}>{`${i + 1} / ${n}`}</Text>
        {arrow('up', 'chevron.up', i - 1)}
        {arrow('down', 'chevron.down', i + 1)}
      </VStack>
    </HStack>,
  );
};

export const SmallWidget = createWidget<WidgetProps, WidgetConfig>('RecocoSmall', RecocoSmall);
export const RollWidget = createWidget<WidgetProps, WidgetConfig>('RecocoRoll', RecocoRoll);

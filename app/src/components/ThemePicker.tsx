import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { won } from '../lib/format';
import { PreviewProduct, concertDesignProductById, foodDesignProductById, showDesignProductById, themeProductById } from '../lib/products';
import {
  CONCERT_DESIGNS,
  FOOD_DESIGNS,
  FREE_CONCERT_DESIGNS,
  FREE_FOOD_DESIGNS,
  FREE_SHOW_DESIGNS,
  FREE_THEMES,
  SHOW_DESIGNS,
  THEMES,
  concertDesignUnlocked,
  foodDesignUnlocked,
  showDesignUnlocked,
  themeUnlocked,
  useShop,
} from '../lib/shop';
import { RETRO_COLORS, RETRO_COLOR_IDS } from '../templates/ConcertRetro';
import { HOUSE_COLORS, HOUSE_COLOR_IDS } from '../templates/FoodHouse';
import { PHOTO_COLORS, PHOTO_COLOR_IDS } from '../templates/PhotoTicket';
import { GRID_COLORS, GRID_COLOR_IDS } from '../templates/shared';
import { HOLO_COLORS, HOLO_COLOR_IDS } from '../templates/ShowHolo';
import { BAND_COLORS, BAND_COLOR_IDS } from '../templates/WristBand';
import { ORDER_COLORS, ORDER_COLOR_IDS } from '../templates/FoodOrder';
import { COLORS, FONTS } from '../theme';
import { ConcertDesign, FoodColor, FoodDesign, GridColor, HouseColor, PaperTheme, ShowDesign, TicketColor } from '../types';
import { ProductPreview } from './ProductPreview';

/** 모양을 고른 다음 그 모양의 색을 고르는 동그라미 줄 */
export function ColorDots<T extends string>({ colors, value, onPick }: { colors: { id: T; name: string; swatch: string }[]; value: T | undefined; onPick: (id: T) => void }) {
  return (
    <View style={styles.colors}>
      {colors.map((c) => (
        <Pressable key={c.id} onPress={() => onPick(c.id)} hitSlop={6} accessibilityLabel={c.name} style={[styles.dot, value === c.id && styles.dotOn]}>
          <View style={[styles.dotFill, { backgroundColor: c.swatch }]} />
        </Pressable>
      ))}
    </View>
  );
}


/** 티켓 모양마다 고를 수 있는 색 (단색 모양은 빈 배열) */
export const ticketColors = (design: ConcertDesign | ShowDesign | undefined): { id: TicketColor; name: string; swatch: string }[] =>
  design === 'retro' || design === 'ticket'
    ? RETRO_COLOR_IDS.map((id) => ({ id, name: RETRO_COLORS[id].name, swatch: RETRO_COLORS[id].deep }))
    : design === 'band'
      ? BAND_COLOR_IDS.map((id) => ({ id, name: BAND_COLORS[id].name, swatch: BAND_COLORS[id].neon }))
      : design === 'kpop'
        ? PHOTO_COLOR_IDS.map((id) => ({ id, name: PHOTO_COLORS[id].name, swatch: PHOTO_COLORS[id].deep }))
        : design === 'holo'
          ? HOLO_COLOR_IDS.map((id) => ({ id, name: HOLO_COLORS[id].name, swatch: HOLO_COLORS[id].base }))
          : [];

/** 그 모양에서 못 쓰는 색이면 첫 색으로 (단색 모양이면 색 없음) */
const pickTicketColor = (design: ConcertDesign | ShowDesign, color: TicketColor | undefined) => {
  const list = ticketColors(design);
  return !list.length ? undefined : color && list.some((c) => c.id === color) ? color : list[0].id;
};

/** 종이 테마의 색 (모눈종이만 있다) */
export const themeColors = (theme: PaperTheme | undefined): { id: GridColor; name: string; swatch: string }[] =>
  theme === 'grid' ? GRID_COLOR_IDS.map((id) => ({ id, name: GRID_COLORS[id].name, swatch: GRID_COLORS[id].swatch })) : [];

/** 모양마다 고를 수 있는 색 (없으면 단색 모양) */
export const foodColors = (design: FoodDesign): { id: FoodColor; name: string; swatch: string }[] =>
  design === 'house'
    ? HOUSE_COLOR_IDS.map((id) => ({ id, name: HOUSE_COLORS[id].name, swatch: HOUSE_COLORS[id].roof }))
    : ORDER_COLOR_IDS.map((id) => ({ id, name: ORDER_COLORS[id].name, swatch: ORDER_COLORS[id].main }));

/** 그 모양에서 쓸 수 있는 색이 아니면 무작위로 하나 정해준다 */
const pickFoodColor = (design: FoodDesign, color: FoodColor | undefined) => {
  const list = foodColors(design);
  return color && list.some((c) => c.id === color) ? color : list[Math.floor(Math.random() * list.length)].id;
};

/** 종이 테마 견본 그림 (기본 / 흰 무지 / 모눈종이) */
export function ThemeSwatch({ theme, base, size = 44, color }: { theme: PaperTheme | undefined; base: 'spending' | 'fourcut'; size?: number; color?: GridColor }) {
  const g = GRID_COLORS[color && color in GRID_COLORS ? color : 'green'];
  const paper = !theme ? (base === 'spending' ? '#faf8f1' : '#f7f2e8') : theme === 'plain' ? '#ffffff' : g.paper;
  const line = !theme ? (base === 'spending' ? '#5a7ea6' : '#e0d6c3') : theme === 'plain' ? '#c9c9cf' : g.ink;
  return (
    <Svg width={size} height={size * 1.3} viewBox="0 0 40 52">
      <Rect x={1} y={1} width={38} height={50} rx={3} fill={paper} stroke={COLORS.line} strokeWidth={1} />
      {theme === 'grid' &&
        [8, 16, 24, 32].map((v) => <Line key={`v${v}`} x1={v} y1={3} x2={v} y2={49} stroke={g.major} strokeWidth={0.8} />)}
      {theme === 'grid' &&
        [9, 17, 25, 33, 41].map((v) => <Line key={`h${v}`} x1={3} y1={v} x2={37} y2={v} stroke={g.major} strokeWidth={0.8} />)}
      {[14, 22, 30, 38].map((y) => (
        <Line key={y} x1={7} y1={y} x2={33} y2={y} stroke={line} strokeWidth={1.2} />
      ))}
    </Svg>
  );
}

interface Props {
  label: string;
  base: 'spending' | 'fourcut';
  value: PaperTheme | undefined;
  color: GridColor | undefined;
  /** 종이를 고르면 그 종이에서 쓸 수 있는 색도 같이 준다 (색이 없는 종이면 undefined) */
  onChange: (theme: PaperTheme | undefined, color: GridColor | undefined) => void;
}

/** 기록 폼의 종이 고르기: 산 테마는 바로 고르고, 안 산 테마는 미리보기에서 사기 */
export function ThemePicker({ label, base, value, color, onChange }: Props) {
  const { owned } = useShop();
  const [preview, setPreview] = useState<{ id: PaperTheme; product: PreviewProduct } | null>(null);

  const pick = (id: PaperTheme | undefined) => onChange(id, id === 'grid' ? (themeColors(id).some((c) => c.id === color) ? color : 'green') : undefined);

  const choose = (id: PaperTheme | undefined) => {
    if (themeUnlocked(id, owned)) return pick(id);
    setPreview({ id: id!, product: themeProductById(id!) });
  };

  const options: { id: PaperTheme | undefined; name: string }[] = [{ id: undefined, name: '기본' }, ...FREE_THEMES, ...THEMES];

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((o) => {
          const on = value === o.id;
          const locked = !themeUnlocked(o.id, owned);
          const price = THEMES.find((t) => t.id === o.id)?.price ?? 0;
          return (
            <Pressable key={o.name} onPress={() => choose(o.id)} style={[styles.option, on && styles.optionOn]} accessibilityLabel={`${o.name} 종이${locked ? ' (잠김)' : ''}`}>
              <View style={locked && { opacity: 0.55 }}>
                <ThemeSwatch theme={o.id} base={base} color={on ? color : undefined} />
              </View>
              <Text style={[styles.name, on && { color: COLORS.orange }]}>
                {locked ? '🔒 ' : ''}
                {o.name}
              </Text>
              {locked && <Text style={styles.price}>{won(price)}원</Text>}
            </Pressable>
          );
        })}
      </View>

      {/* 고른 종이의 색 (모눈종이만) */}
      <ColorDots colors={themeColors(value)} value={color} onPick={(c) => onChange(value, c)} />

      <ProductPreview
        product={preview?.product ?? null}
        onClose={() => setPreview(null)}
        onBought={() => {
          if (preview) pick(preview.id);
          setPreview(null);
        }}
      />
    </View>
  );
}

/** 카페·맛집 모양 견본 (주문서 / 집). 집은 고른 지붕 색으로 그린다 */
export function FoodDesignSwatch({ design, size = 44, color = 'orange' }: { design: FoodDesign | undefined; size?: number; color?: HouseColor }) {
  if (design === 'plain')
    return (
      <Svg width={size} height={size * 1.3} viewBox="0 0 40 52">
        <Rect x={1} y={1} width={38} height={50} rx={3} fill="#fcfbf7" stroke={COLORS.line} strokeWidth={1} />
        <Rect x={8} y={7} width={24} height={3} rx={1} fill="#3b3a36" />
        <Rect x={6} y={20} width={28} height={20} rx={2} fill="none" stroke="#3b3a36" strokeWidth={1.2} />
        <Rect x={6} y={20} width={28} height={5} fill="#3b3a36" />
        {[31, 36].map((y) => (
          <Line key={y} x1={9} y1={y} x2={31} y2={y} stroke="#dcdad2" strokeWidth={1.2} />
        ))}
        <Line x1={6} y1={14} x2={34} y2={14} stroke="#3b3a36" strokeWidth={1} />
      </Svg>
    );
  if (design === 'house') {
    const c = HOUSE_COLORS[color] ?? HOUSE_COLORS.orange;
    return (
      <Svg width={size} height={size * 1.3} viewBox="0 0 40 52">
        <Rect x={6} y={18} width={28} height={33} rx={1.5} fill="#fbf3e4" stroke={COLORS.line} strokeWidth={1} />
        <Path d="M2,20 L20,4 L38,20 Z" fill={c.roof} stroke={c.roof} strokeWidth={2} strokeLinejoin="round" />
        <Rect x={10} y={23} width={20} height={5} rx={1} fill="#fff" stroke="#6b4a3a" strokeWidth={1} />
        <Rect x={10} y={31} width={20} height={9} rx={1} fill="#dcecf2" stroke="#6b4a3a" strokeWidth={1.4} />
        <Path d="M24,51 V45 Q24,42 27,42 Q30,42 30,45 V51 Z" fill={c.deep} />
        <Circle cx={20} cy={13} r={2.4} fill="#fbf3e4" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size * 1.3} viewBox="0 0 40 52">
      <Rect x={1} y={1} width={38} height={50} rx={3} fill="#fbf7ec" stroke={COLORS.line} strokeWidth={1} />
      <Rect x={8} y={7} width={24} height={3} rx={1} fill="#2f6b52" />
      <Rect x={6} y={20} width={28} height={20} rx={2} fill="none" stroke="#2f6b52" strokeWidth={1.2} />
      <Rect x={6} y={20} width={28} height={5} fill="#2f6b52" />
      {[31, 36].map((y) => (
        <Line key={y} x1={9} y1={y} x2={31} y2={y} stroke="#cfe1d6" strokeWidth={1.2} />
      ))}
      <Line x1={6} y1={14} x2={34} y2={14} stroke="#2f6b52" strokeWidth={1} />
    </Svg>
  );
}

/** 카페·맛집 폼의 영수증 모양 고르기: 기본 주문서 + 산 모양 테마, 안 산 건 미리보기에서 사기 */
export function FoodDesignPicker({
  value,
  color,
  onChange,
}: {
  value: FoodDesign | undefined;
  color: FoodColor | undefined;
  /** 모양을 고르면 그 모양에서 쓸 수 있는 색도 같이 정해서 준다 */
  onChange: (design: FoodDesign, color: FoodColor) => void;
}) {
  const { owned } = useShop();
  const [preview, setPreview] = useState<{ id: FoodDesign; product: PreviewProduct } | null>(null);
  const options: { id: FoodDesign; name: string; price: number }[] = [...FREE_FOOD_DESIGNS.map((d) => ({ ...d, price: 0 })), ...FOOD_DESIGNS];
  // 예전 '단색 주문서' 기록은 주문서 + 먹색으로 보여준다
  const design = value === 'plain' ? 'order' : (value ?? 'order');
  const shown = value === 'plain' && !color ? 'ink' : color;

  const pick = (id: FoodDesign) => onChange(id, pickFoodColor(id, shown));

  const choose = (id: FoodDesign) => {
    if (foodDesignUnlocked(id, owned)) return pick(id);
    setPreview({ id, product: foodDesignProductById(id as Exclude<FoodDesign, 'order'>) });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>영수증 모양</Text>
      <View style={styles.row}>
        {options.map((o) => {
          const on = design === o.id;
          const locked = !foodDesignUnlocked(o.id, owned);
          return (
            <Pressable key={o.id} onPress={() => choose(o.id)} style={[styles.option, on && styles.optionOn]} accessibilityLabel={`${o.name}${locked ? ' (잠김)' : ''}`}>
              <View style={locked && { opacity: 0.55 }}>
                <FoodDesignSwatch design={o.id} color={on ? (shown as HouseColor) : undefined} />
              </View>
              <Text style={[styles.name, on && { color: COLORS.orange }]}>
                {locked ? '🔒 ' : ''}
                {o.name}
              </Text>
              {locked && <Text style={styles.price}>{won(o.price)}원</Text>}
            </Pressable>
          );
        })}
      </View>

      {/* 고른 모양의 색 */}
      <ColorDots colors={foodColors(design)} value={shown} onPick={(c) => onChange(design, c)} />

      <ProductPreview
        product={preview?.product ?? null}
        onClose={() => setPreview(null)}
        onBought={() => {
          if (preview) pick(preview.id);
          setPreview(null);
        }}
      />
    </View>
  );
}

/** 콘서트 티켓 모양 견본 (레트로 / 팔찌 / 핑크 포토) */
export function ConcertDesignSwatch({ design, size = 44, color }: { design: ConcertDesign | undefined; size?: number; color?: TicketColor }) {
  const neon = BAND_COLORS[(color as keyof typeof BAND_COLORS) in BAND_COLORS ? (color as keyof typeof BAND_COLORS) : 'lime'].neon;
  const ph = PHOTO_COLORS[(color as keyof typeof PHOTO_COLORS) in PHOTO_COLORS ? (color as keyof typeof PHOTO_COLORS) : 'pink'];
  const rt = RETRO_COLORS[(color as keyof typeof RETRO_COLORS) in RETRO_COLORS ? (color as keyof typeof RETRO_COLORS) : 'navy'];
  if (design === 'plain')
    return (
      <Svg width={size} height={size * 1.3} viewBox="0 0 40 52">
        <Rect x={2} y={2} width={36} height={48} rx={4} fill="#ffffff" stroke={COLORS.line} strokeWidth={1} />
        <Rect x={7} y={8} width={10} height={2} rx={1} fill="#9a9aa2" />
        <Line x1={7} y1={13} x2={33} y2={13} stroke="#2a2a2e" strokeWidth={1.4} />
        <Rect x={7} y={17} width={20} height={4} rx={1} fill="#2a2a2e" />
        {[26, 32].map((y) => (
          <Line key={y} x1={7} y1={y} x2={33} y2={y} stroke="#e4e4e8" strokeWidth={1.2} />
        ))}
        <Line x1={4} y1={38} x2={36} y2={38} stroke="#e4e4e8" strokeWidth={1.2} strokeDasharray="2 2" />
        <Rect x={7} y={42} width={13} height={3} rx={1} fill="#2a2a2e" />
      </Svg>
    );
  if (design === 'retro')
    return (
      <Svg width={size} height={size * 1.3} viewBox="0 0 40 52">
        <Rect x={2} y={2} width={36} height={48} rx={3} fill="#fbf5ea" stroke={COLORS.line} strokeWidth={1} />
        <Rect x={5} y={5} width={30} height={30} rx={2} fill="none" stroke={rt.deep} strokeWidth={1} />
        {[16, 19, 22].map((x, i) => (
          <Rect key={x} x={x} y={13 - i} width={2} height={8 + i * 2} rx={1} fill={rt.accent} />
        ))}
        <Line x1={9} y1={26} x2={31} y2={26} stroke={rt.deep} strokeWidth={1.4} />
        <Rect x={2} y={38} width={36} height={12} fill={rt.deep} />
        <Rect x={12} y={42} width={16} height={4} rx={2} fill={rt.accent} />
      </Svg>
    );
  if (design === 'band')
    return (
      <Svg width={size} height={size * 1.3} viewBox="0 0 40 52">
        <Rect x={13} y={4} width={14} height={45} rx={4} fill="#191a22" />
        <Rect x={8} y={4} width={24} height={10} rx={3} fill="#2b2d3a" />
        <Rect x={16} y={18} width={8} height={2} rx={1} fill={neon} />
        <Rect x={16} y={40} width={8} height={2} rx={1} fill={neon} />
        {[24, 28, 32].map((y) => (
          <Line key={y} x1={16} y1={y} x2={24} y2={y} stroke="#fff" strokeWidth={1} opacity={0.5} />
        ))}
      </Svg>
    );
  if (design === 'kpop')
    return (
      <Svg width={size} height={size * 1.3} viewBox="0 0 40 52">
        <Rect x={2} y={2} width={36} height={48} rx={2} fill={ph.paper} stroke={COLORS.line} strokeWidth={1} />
        <Rect x={2} y={2} width={36} height={13} fill={ph.light} />
        <Rect x={2} y={19} width={36} height={6} fill="#141118" />
        <Rect x={7} y={28} width={26} height={14} rx={1} fill={ph.light} />
        <Rect x={2} y={45} width={36} height={5} fill="#141118" />
      </Svg>
    );
  // 기본: 가로로 긴 공연 티켓
  return (
    <Svg width={size} height={size * 1.3} viewBox="0 0 40 52">
      <Rect x={1} y={14} width={38} height={24} rx={3} fill="#241a4a" />
      <Rect x={27} y={14} width={12} height={24} rx={3} fill="#c231d8" />
      <Line x1={27} y1={16} x2={27} y2={36} stroke="#fff" strokeWidth={1} strokeDasharray="2 2" />
      <Rect x={5} y={20} width={17} height={4} rx={2} fill="#fff" />
      <Rect x={5} y={27} width={12} height={3} rx={1.5} fill="#5bd1ff" />
      {[30, 33, 36].map((x) => (
        <Rect key={x} x={x} y={20} width={1.4} height={12} fill="#fff" />
      ))}
    </Svg>
  );
}

/** 콘서트 폼의 티켓 모양 고르기 */
export function ConcertDesignPicker({
  value,
  color,
  onChange,
}: {
  value: ConcertDesign | undefined;
  color: TicketColor | undefined;
  onChange: (design: ConcertDesign, color: TicketColor | undefined) => void;
}) {
  const { owned } = useShop();
  const [preview, setPreview] = useState<{ id: ConcertDesign; product: PreviewProduct } | null>(null);
  const options: { id: ConcertDesign; name: string; price: number }[] = [...FREE_CONCERT_DESIGNS.map((d) => ({ ...d, price: 0 })), ...CONCERT_DESIGNS];
  const design = value ?? 'ticket';

  const pick = (id: ConcertDesign) => onChange(id, pickTicketColor(id, color));

  const choose = (id: ConcertDesign) => {
    if (concertDesignUnlocked(id, owned)) return pick(id);
    setPreview({ id, product: concertDesignProductById(id as Exclude<ConcertDesign, 'ticket'>) });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>티켓 모양</Text>
      <View style={styles.row}>
        {options.map((o) => {
          const on = design === o.id;
          const locked = !concertDesignUnlocked(o.id, owned);
          return (
            <Pressable key={o.id} onPress={() => choose(o.id)} style={[styles.option, on && styles.optionOn]} accessibilityLabel={`${o.name}${locked ? ' (잠김)' : ''}`}>
              <View style={locked && { opacity: 0.55 }}>
                <ConcertDesignSwatch design={o.id} color={on ? color : undefined} />
              </View>
              <Text style={[styles.name, on && { color: COLORS.orange }]} numberOfLines={1}>
                {locked ? '🔒 ' : ''}
                {o.name}
              </Text>
              {locked && <Text style={styles.price}>{won(o.price)}원</Text>}
            </Pressable>
          );
        })}
      </View>

      {/* 고른 모양의 색 */}
      <ColorDots colors={ticketColors(design)} value={color} onPick={(c) => onChange(design, c)} />

      <ProductPreview
        product={preview?.product ?? null}
        onClose={() => setPreview(null)}
        onBought={() => {
          if (preview) pick(preview.id);
          setPreview(null);
        }}
      />
    </View>
  );
}

/** 공연·전시 모양 견본 (입장권 / 홀로그램 기록표) */
export function ShowDesignSwatch({ design, size = 44, color }: { design: ShowDesign | undefined; size?: number; color?: TicketColor }) {
  const holo = HOLO_COLORS[(color as keyof typeof HOLO_COLORS) in HOLO_COLORS ? (color as keyof typeof HOLO_COLORS) : 'blue'];
  if (design === 'plain')
    return (
      <Svg width={size} height={size * 1.3} viewBox="0 0 40 52">
        <Rect x={2} y={2} width={36} height={48} rx={4} fill="#ffffff" stroke={COLORS.line} strokeWidth={1} />
        <Rect x={7} y={8} width={10} height={2} rx={1} fill="#9a9aa2" />
        <Line x1={7} y1={13} x2={33} y2={13} stroke="#2a2a2e" strokeWidth={1.4} />
        <Rect x={7} y={17} width={20} height={4} rx={1} fill="#2a2a2e" />
        {[26, 32].map((y) => (
          <Line key={y} x1={7} y1={y} x2={33} y2={y} stroke="#e4e4e8" strokeWidth={1.2} />
        ))}
        <Line x1={4} y1={38} x2={36} y2={38} stroke="#e4e4e8" strokeWidth={1.2} strokeDasharray="2 2" />
        <Rect x={7} y={42} width={13} height={3} rx={1} fill="#2a2a2e" />
      </Svg>
    );
  if (design === 'poster')
    return (
      <Svg width={size} height={size * 1.3} viewBox="0 0 40 52">
        <Rect x={2} y={2} width={36} height={48} rx={4} fill="#fdf3f6" stroke={COLORS.line} strokeWidth={1} />
        <Rect x={2} y={2} width={36} height={11} rx={4} fill="#a4325a" />
        <Rect x={10} y={17} width={20} height={16} rx={2} fill="#a4325a" opacity={0.25} />
        <Line x1={2} y1={38} x2={38} y2={38} stroke={COLORS.line} strokeWidth={1.4} strokeDasharray="3 3" />
        <Rect x={8} y={41} width={24} height={6} rx={1} fill="#a4325a" opacity={0.55} />
      </Svg>
    );
  if (design === 'holo')
    return (
      <Svg width={size} height={size * 1.3} viewBox="0 0 40 52">
        <Rect x={2} y={2} width={36} height={48} rx={2} fill={holo.base} />
        <Path d="M2,50 L20,2 L27,2 L9,50 Z" fill={holo.holo[0]} opacity={0.18} />
        <Rect x={7} y={8} width={26} height={12} fill="none" stroke="#fff" strokeWidth={1} opacity={0.6} />
        <Rect x={14} y={12} width={12} height={4} rx={1} fill={holo.gold} />
        {[24, 34].map((y) => (
          <Rect key={y} x={7} y={y} width={26} height={8} fill="none" stroke="#fff" strokeWidth={1} opacity={0.6} />
        ))}
      </Svg>
    );
  // 핑크 포토 티켓·스탠딩 팔찌는 콘서트와 같은 모양이라 견본도 같이 쓴다
  if (design === 'kpop' || design === 'band' || design === 'retro' || design === 'ticket')
    return <ConcertDesignSwatch design={design === 'ticket' ? 'retro' : design} size={size} color={color} />;
  // 기본: 크림 레트로 입장권
  return (
    <Svg width={size} height={size * 1.3} viewBox="0 0 40 52">
      <Rect x={2} y={2} width={36} height={48} rx={3} fill="#fbf5ea" stroke={COLORS.line} strokeWidth={1} />
      <Rect x={5} y={5} width={30} height={30} rx={2} fill="none" stroke="#1f2a44" strokeWidth={1} />
      <Rect x={13} y={11} width={14} height={5} rx={2.5} fill="#e2685c" />
      <Line x1={9} y1={22} x2={31} y2={22} stroke="#1f2a44" strokeWidth={1.2} />
      <Line x1={9} y1={27} x2={31} y2={27} stroke="#1f2a44" strokeWidth={1.2} opacity={0.6} />
      <Rect x={2} y={38} width={36} height={12} fill="#1f2a44" />
      <Rect x={12} y={42} width={16} height={4} rx={2} fill="#e2685c" />
    </Svg>
  );
}

/** 공연·전시 폼의 모양 고르기 */
export function ShowDesignPicker({
  value,
  color,
  onChange,
}: {
  value: ShowDesign | undefined;
  color: TicketColor | undefined;
  onChange: (design: ShowDesign, color: TicketColor | undefined) => void;
}) {
  const { owned } = useShop();
  const [preview, setPreview] = useState<{ id: ShowDesign; product: PreviewProduct } | null>(null);
  const options: { id: ShowDesign; name: string; price: number }[] = [...FREE_SHOW_DESIGNS.map((d) => ({ ...d, price: 0 })), ...SHOW_DESIGNS];
  // 'ticket' 은 레트로의 예전 이름
  const design = value === 'ticket' ? 'retro' : (value ?? 'plain');

  const pick = (id: ShowDesign) => onChange(id, pickTicketColor(id, color));

  const choose = (id: ShowDesign) => {
    if (showDesignUnlocked(id, owned)) return pick(id);
    setPreview({ id, product: showDesignProductById(id as Exclude<ShowDesign, 'ticket'>) });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>입장권 모양</Text>
      <View style={styles.row}>
        {options.map((o) => {
          const on = design === o.id;
          const locked = !showDesignUnlocked(o.id, owned);
          return (
            <Pressable key={o.id} onPress={() => choose(o.id)} style={[styles.option, on && styles.optionOn]} accessibilityLabel={`${o.name}${locked ? ' (잠김)' : ''}`}>
              <View style={locked && { opacity: 0.55 }}>
                <ShowDesignSwatch design={o.id} color={on ? color : undefined} />
              </View>
              <Text style={[styles.name, on && { color: COLORS.orange }]} numberOfLines={1}>
                {locked ? '🔒 ' : ''}
                {o.name}
              </Text>
              {locked && <Text style={styles.price}>{won(o.price)}원</Text>}
            </Pressable>
          );
        })}
      </View>

      {/* 고른 모양의 색 */}
      <ColorDots colors={ticketColors(design)} value={color} onPick={(c) => onChange(design, c)} />

      <ProductPreview
        product={preview?.product ?? null}
        onClose={() => setPreview(null)}
        onBought={() => {
          if (preview) pick(preview.id);
          setPreview(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sansBold },
  row: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionOn: { borderColor: COLORS.orange, backgroundColor: COLORS.orangeSoft },
  name: { color: COLORS.ink, fontSize: 13, fontFamily: FONTS.sansBold },
  price: { color: COLORS.sub, fontSize: 11, fontFamily: FONTS.sans, marginTop: -2 },
  colors: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 2 },
  dot: { padding: 3, borderRadius: 999, borderWidth: 2, borderColor: 'transparent' },
  dotOn: { borderColor: COLORS.orange },
  dotFill: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' },
});

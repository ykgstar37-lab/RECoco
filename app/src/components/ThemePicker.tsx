import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { won } from '../lib/format';
import { PreviewProduct, concertDesignProductById, foodDesignProductById, themeProductById } from '../lib/products';
import { CONCERT_DESIGNS, FOOD_DESIGNS, THEMES, concertDesignUnlocked, foodDesignUnlocked, themeUnlocked, useShop } from '../lib/shop';
import { COLORS, FONTS } from '../theme';
import { ConcertDesign, FoodDesign, PaperTheme } from '../types';
import { ProductPreview } from './ProductPreview';

/** 종이 테마 견본 그림 (기본 / 흰 무지 / 모눈종이) */
export function ThemeSwatch({ theme, base, size = 44 }: { theme: PaperTheme | undefined; base: 'spending' | 'fourcut'; size?: number }) {
  const paper = !theme ? (base === 'spending' ? '#faf8f1' : '#f7f2e8') : theme === 'plain' ? '#ffffff' : '#fbfdf8';
  const line = !theme ? (base === 'spending' ? '#5a7ea6' : '#e0d6c3') : theme === 'plain' ? '#c9c9cf' : '#8fb9a0';
  return (
    <Svg width={size} height={size * 1.3} viewBox="0 0 40 52">
      <Rect x={1} y={1} width={38} height={50} rx={3} fill={paper} stroke={COLORS.line} strokeWidth={1} />
      {theme === 'grid' &&
        [8, 16, 24, 32].map((v) => <Line key={`v${v}`} x1={v} y1={3} x2={v} y2={49} stroke="#dcebe1" strokeWidth={0.8} />)}
      {theme === 'grid' &&
        [9, 17, 25, 33, 41].map((v) => <Line key={`h${v}`} x1={3} y1={v} x2={37} y2={v} stroke="#dcebe1" strokeWidth={0.8} />)}
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
  onChange: (theme: PaperTheme | undefined) => void;
}

/** 기록 폼의 종이 고르기: 산 테마는 바로 고르고, 안 산 테마는 미리보기에서 사기 */
export function ThemePicker({ label, base, value, onChange }: Props) {
  const { owned } = useShop();
  const [preview, setPreview] = useState<{ id: PaperTheme; product: PreviewProduct } | null>(null);

  const choose = (id: PaperTheme | undefined) => {
    if (themeUnlocked(id, owned)) return onChange(id);
    setPreview({ id: id!, product: themeProductById(id!) });
  };

  const options: { id: PaperTheme | undefined; name: string }[] = [{ id: undefined, name: '기본' }, ...THEMES];

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
                <ThemeSwatch theme={o.id} base={base} />
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
      <ProductPreview
        product={preview?.product ?? null}
        onClose={() => setPreview(null)}
        onBought={() => {
          if (preview) onChange(preview.id);
          setPreview(null);
        }}
      />
    </View>
  );
}

/** 카페·맛집 모양 견본 (주문서 / 집) */
export function FoodDesignSwatch({ design, size = 44 }: { design: FoodDesign | undefined; size?: number }) {
  if (design === 'house') {
    return (
      <Svg width={size} height={size * 1.3} viewBox="0 0 40 52">
        <Rect x={6} y={18} width={28} height={33} rx={1.5} fill="#fbf3e4" stroke={COLORS.line} strokeWidth={1} />
        <Path d="M2,20 L20,4 L38,20 Z" fill="#d9774f" stroke="#d9774f" strokeWidth={2} strokeLinejoin="round" />
        <Rect x={10} y={23} width={20} height={5} rx={1} fill="#fff" stroke="#6b4a3a" strokeWidth={1} />
        <Rect x={10} y={31} width={20} height={9} rx={1} fill="#dcecf2" stroke="#6b4a3a" strokeWidth={1.4} />
        <Path d="M24,51 V45 Q24,42 27,42 Q30,42 30,45 V51 Z" fill="#b95c38" />
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
export function FoodDesignPicker({ value, onChange }: { value: FoodDesign | undefined; onChange: (design: FoodDesign) => void }) {
  const { owned } = useShop();
  const [preview, setPreview] = useState<{ id: FoodDesign; product: PreviewProduct } | null>(null);
  const options: { id: FoodDesign; name: string; price: number }[] = [{ id: 'order', name: '주문서', price: 0 }, ...FOOD_DESIGNS];

  const choose = (id: FoodDesign) => {
    if (foodDesignUnlocked(id, owned)) return onChange(id);
    setPreview({ id, product: foodDesignProductById(id as Exclude<FoodDesign, 'order'>) });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>영수증 모양</Text>
      <View style={styles.row}>
        {options.map((o) => {
          const on = (value ?? 'order') === o.id;
          const locked = !foodDesignUnlocked(o.id, owned);
          return (
            <Pressable key={o.id} onPress={() => choose(o.id)} style={[styles.option, on && styles.optionOn]} accessibilityLabel={`${o.name}${locked ? ' (잠김)' : ''}`}>
              <View style={locked && { opacity: 0.55 }}>
                <FoodDesignSwatch design={o.id} />
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
      <ProductPreview
        product={preview?.product ?? null}
        onClose={() => setPreview(null)}
        onBought={() => {
          if (preview) onChange(preview.id);
          setPreview(null);
        }}
      />
    </View>
  );
}

/** 콘서트 티켓 모양 견본 (레트로 / 팔찌 / K-POP) */
export function ConcertDesignSwatch({ design, size = 44 }: { design: ConcertDesign | undefined; size?: number }) {
  if (design === 'band')
    return (
      <Svg width={size} height={size * 1.3} viewBox="0 0 40 52">
        <Rect x={13} y={4} width={14} height={45} rx={4} fill="#191a22" />
        <Rect x={8} y={4} width={24} height={10} rx={3} fill="#2b2d3a" />
        <Rect x={16} y={18} width={8} height={2} rx={1} fill="#d6f24a" />
        <Rect x={16} y={40} width={8} height={2} rx={1} fill="#d6f24a" />
        {[24, 28, 32].map((y) => (
          <Line key={y} x1={16} y1={y} x2={24} y2={y} stroke="#fff" strokeWidth={1} opacity={0.5} />
        ))}
      </Svg>
    );
  if (design === 'kpop')
    return (
      <Svg width={size} height={size * 1.3} viewBox="0 0 40 52">
        <Rect x={2} y={2} width={36} height={48} rx={2} fill="#fdf3f6" stroke={COLORS.line} strokeWidth={1} />
        <Rect x={2} y={2} width={36} height={13} fill="#f7b8cc" />
        <Rect x={2} y={19} width={36} height={6} fill="#141118" />
        <Rect x={7} y={28} width={26} height={14} rx={1} fill="#f7b8cc" />
        <Rect x={2} y={45} width={36} height={5} fill="#141118" />
      </Svg>
    );
  return (
    <Svg width={size} height={size * 1.3} viewBox="0 0 40 52">
      <Rect x={2} y={2} width={36} height={48} rx={3} fill="#fbf5ea" stroke={COLORS.line} strokeWidth={1} />
      <Rect x={5} y={5} width={30} height={30} rx={2} fill="none" stroke="#1f2a44" strokeWidth={1} />
      {[16, 19, 22].map((x, i) => (
        <Rect key={x} x={x} y={13 - i} width={2} height={8 + i * 2} rx={1} fill="#e2685c" />
      ))}
      <Line x1={9} y1={26} x2={31} y2={26} stroke="#1f2a44" strokeWidth={1.4} />
      <Rect x={2} y={38} width={36} height={12} fill="#1f2a44" />
      <Rect x={12} y={42} width={16} height={4} rx={2} fill="#e2685c" />
    </Svg>
  );
}

/** 콘서트 폼의 티켓 모양 고르기 */
export function ConcertDesignPicker({ value, onChange }: { value: ConcertDesign | undefined; onChange: (design: ConcertDesign) => void }) {
  const { owned } = useShop();
  const [preview, setPreview] = useState<{ id: ConcertDesign; product: PreviewProduct } | null>(null);
  const options: { id: ConcertDesign; name: string; price: number }[] = [{ id: 'ticket', name: '레트로 티켓', price: 0 }, ...CONCERT_DESIGNS];

  const choose = (id: ConcertDesign) => {
    if (concertDesignUnlocked(id, owned)) return onChange(id);
    setPreview({ id, product: concertDesignProductById(id as Exclude<ConcertDesign, 'ticket'>) });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>티켓 모양</Text>
      <View style={styles.row}>
        {options.map((o) => {
          const on = (value ?? 'ticket') === o.id;
          const locked = !concertDesignUnlocked(o.id, owned);
          return (
            <Pressable key={o.id} onPress={() => choose(o.id)} style={[styles.option, on && styles.optionOn]} accessibilityLabel={`${o.name}${locked ? ' (잠김)' : ''}`}>
              <View style={locked && { opacity: 0.55 }}>
                <ConcertDesignSwatch design={o.id} />
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
      <ProductPreview
        product={preview?.product ?? null}
        onClose={() => setPreview(null)}
        onBought={() => {
          if (preview) onChange(preview.id);
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
});

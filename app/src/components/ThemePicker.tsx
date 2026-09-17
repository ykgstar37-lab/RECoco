import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

import { won } from '../lib/format';
import { THEMES, buy, purchaseErrorMessage, themeUnlocked, useShop } from '../lib/shop';
import { COLORS, FONTS } from '../theme';
import { PaperTheme } from '../types';

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

/** 기록 폼의 종이 고르기: 산 테마는 바로 고르고, 안 산 테마는 눌러서 사기 */
export function ThemePicker({ label, base, value, onChange }: Props) {
  const { owned } = useShop();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const choose = async (id: PaperTheme | undefined) => {
    setNotice('');
    if (themeUnlocked(id, owned)) return onChange(id);
    if (busy) return;
    const item = THEMES.find((t) => t.id === id)!;
    setBusy(true);
    try {
      await buy(item.productId);
      onChange(id);
    } catch (e) {
      setNotice(purchaseErrorMessage(e));
    } finally {
      setBusy(false);
    }
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
      {!!notice && <Text style={styles.notice}>{notice}</Text>}
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
  notice: { color: COLORS.danger, fontSize: 12, fontFamily: FONTS.sansBold },
});

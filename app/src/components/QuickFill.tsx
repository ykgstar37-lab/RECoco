import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { COLORS, FONTS } from '../theme';

type Icon = 'barcode' | 'card';

/** 폼 맨 위 "빠르게 채우기" 버튼: 아이콘 타일 + 제목·설명 + 화살표 */
export function QuickFill({ icon, title, sub, onPress }: { icon: Icon; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wrap, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={title}>
      <View style={styles.tile}>
        <QuickIcon icon={icon} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub} numberOfLines={1}>
          {sub}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function QuickIcon({ icon }: { icon: Icon }) {
  if (icon === 'card') {
    return (
      <Svg width={26} height={26} viewBox="0 0 26 26">
        <Rect x={2} y={5} width={22} height={16} rx={3.5} fill={COLORS.orange} />
        <Rect x={2} y={9} width={22} height={3.5} fill="#c9551a" />
        <Rect x={5} y={15.5} width={7} height={2.5} rx={1.2} fill="#fff" />
        <Circle cx={19.5} cy={16.8} r={2} fill="#ffd2b3" />
      </Svg>
    );
  }
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      <Path d="M3,8 V4.5 Q3,3 4.5,3 H8 M18,3 H21.5 Q23,3 23,4.5 V8 M23,18 V21.5 Q23,23 21.5,23 H18 M8,23 H4.5 Q3,23 3,21.5 V18" stroke={COLORS.orange} strokeWidth={2} strokeLinecap="round" fill="none" />
      {[
        [7, 1.6],
        [9.6, 1],
        [11.6, 2],
        [14.6, 1],
        [16.6, 1.8],
        [19, 1],
      ].map(([x, w]) => (
        <Rect key={x} x={x} y={8} width={w} height={10} fill={COLORS.ink} />
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.line,
    shadowColor: '#7a2c00',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pressed: { backgroundColor: COLORS.orangeSoft, borderColor: COLORS.orange },
  tile: { width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.orangeSoft, alignItems: 'center', justifyContent: 'center' },
  title: { color: COLORS.ink, fontSize: 15, fontFamily: FONTS.sansBold },
  sub: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans, marginTop: 2 },
  chevron: { color: COLORS.placeholder, fontSize: 24, lineHeight: 26, fontFamily: FONTS.sans },
});

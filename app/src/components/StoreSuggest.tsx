import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { COLORS, FONTS } from '../theme';
import { RecoRecord } from '../types';

export interface StoreHit {
  name: string;
  /** 소비: 종류 / 카페·맛집: 종류 라벨 */
  category: string;
  /** 위치 */
  area: string;
  count: number;
}

/** 지금까지 적은 기록에서 자주 간 가게를 뽑는다 (많이 간 순 → 최근 순) */
export function frequentStores(records: RecoRecord[], kind: 'spending' | 'food'): StoreHit[] {
  const map = new Map<string, StoreHit>();
  // 최근 기록이 먼저 오도록 (기록은 만든 순)
  for (const r of [...records].reverse()) {
    const name = r.kind === 'spending' && kind === 'spending' ? r.store.trim() : r.kind === 'food' && kind === 'food' ? r.place.trim() : '';
    if (!name) continue;
    const found = map.get(name);
    if (found) {
      found.count += 1;
      continue;
    }
    map.set(name, {
      name,
      category: r.kind === 'spending' ? r.category.trim() : '',
      area: r.kind === 'spending' ? r.address.trim() : r.kind === 'food' ? r.area.trim() : '',
      count: 1,
    });
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

/** 가게 이름 칸 아래 자주 가는 가게 알약. 누르면 이름·종류·위치가 채워진다 */
export function StoreSuggest({ records, kind, query, onPick }: { records: RecoRecord[]; kind: 'spending' | 'food'; query: string; onPick: (hit: StoreHit) => void }) {
  const q = query.trim();
  const all = frequentStores(records, kind);
  const hits = (q ? all.filter((s) => s.name.includes(q) && s.name !== q) : all).slice(0, 6);
  if (!hits.length) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.row}>
      {!q && <Text style={styles.lead}>자주 가는 곳</Text>}
      {hits.map((s) => (
        <Pressable key={s.name} onPress={() => onPick(s)} style={({ pressed }) => [styles.chip, pressed && styles.chipOn]}>
          <Text style={styles.text} numberOfLines={1}>
            {s.name}
          </Text>
          {s.count > 1 && <Text style={styles.count}>{s.count}</Text>}
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2, paddingRight: 8 },
  lead: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sansBold, marginRight: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.line,
    maxWidth: 190,
  },
  chipOn: { backgroundColor: COLORS.orangeSoft, borderColor: COLORS.orange },
  text: { color: COLORS.ink, fontSize: 14, fontFamily: FONTS.sansBold, flexShrink: 1 },
  count: { color: COLORS.orange, fontSize: 12, fontFamily: FONTS.sansBold },
});

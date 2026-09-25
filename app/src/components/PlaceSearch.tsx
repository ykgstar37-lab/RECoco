import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { PlaceHit, canSearchPlaces, searchPlaces } from '../lib/search';
import { FOOD_TYPES } from '../templates/FoodOrder';
import { COLORS, FONTS } from '../theme';

interface Props {
  /** 가게 이름 칸에 적은 말 */
  query: string;
  /** 위치 칸에 적은 동네 (있으면 그 동네에서 찾는다) */
  area: string;
  active: boolean;
  onPick: (hit: PlaceHit) => void;
  onDismiss: () => void;
}

/** 가게 이름 칸 아래에 뜨는 카카오 지도 검색 결과. 입력을 멈추면 잠깐 뒤에 찾는다 */
export function PlaceSearch({ query, area, active, onPick, onDismiss }: Props) {
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const q = query.trim();
  const where = area.trim();

  useEffect(() => {
    if (!canSearchPlaces || !active || !q) {
      setHits([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setFailed(false);
      try {
        setHits(await searchPlaces(q, where, ctrl.signal));
      } catch {
        if (!ctrl.signal.aborted) setFailed(true);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 450);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [active, q, where]);

  if (!canSearchPlaces || !active || !q) return null;

  return (
    <View style={styles.box}>
      <View style={styles.head}>
        <Text style={styles.headText}>가게 찾기</Text>
        {loading && <ActivityIndicator size="small" color={COLORS.orange} />}
        <View style={{ flex: 1 }} />
        <Pressable onPress={onDismiss} hitSlop={8}>
          <Text style={styles.dismiss}>직접 적을게요</Text>
        </Pressable>
      </View>
      {failed && <Text style={styles.note}>지금은 검색이 안 돼요. 직접 적어주세요.</Text>}
      {!loading && !failed && hits.length === 0 && <Text style={styles.note}>찾는 가게가 없어요. 적은 그대로 저장돼요.</Text>}
      {hits.slice(0, 6).map((h) => (
        <Pressable key={h.id} onPress={() => onPick(h)} style={({ pressed }) => [styles.row, pressed && { backgroundColor: COLORS.orangeSoft }]}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={styles.name}>
              {h.name}
            </Text>
            <Text numberOfLines={1} style={styles.sub}>
              {h.address}
            </Text>
          </View>
          <Text style={styles.type}>{FOOD_TYPES[h.type]}</Text>
        </Pressable>
      ))}
      {hits.length > 0 && <Text style={styles.credit}>장소 정보 제공: 카카오맵</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: COLORS.line, paddingVertical: 6, marginTop: -4 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6 },
  headText: { color: COLORS.orange, fontSize: 12, fontFamily: FONTS.sansBold },
  dismiss: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans },
  note: { color: COLORS.sub, fontSize: 13, fontFamily: FONTS.sans, paddingHorizontal: 12, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8 },
  name: { color: COLORS.ink, fontSize: 14, fontFamily: FONTS.sansBold },
  sub: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans, marginTop: 2 },
  type: { color: COLORS.orange, fontSize: 12, fontFamily: FONTS.sansBold },
  credit: { color: COLORS.placeholder, fontSize: 10, fontFamily: FONTS.sans, textAlign: 'right', paddingHorizontal: 12, paddingTop: 4 },
});

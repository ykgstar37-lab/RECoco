import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KIND_LABEL } from '../templates';
import { COLORS, FONTS } from '../theme';
import { RecoRecord } from '../types';
import { FlipCard } from './FlipCard';
import { FoldableReceipt } from './FoldableReceipt';

interface Props {
  visible: boolean;
  records: RecoRecord[];
  /** YYYY-MM-DD 로 거르기 (null이면 전체) */
  date: string | null;
  onClearDate: () => void;
  onClose: () => void;
  onLongPress: (record: RecoRecord) => void;
}

/** 모아둔 영수증을 세로로 길게 이어서 보는 화면 */
export function RollScreen({ visible, records, date, onClearDate, onClose, onLongPress }: Props) {
  const { width: screenW } = useWindowDimensions();
  const paperW = Math.min(screenW - 44, 440);
  const list = date ? records.filter((r) => r.date === date) : records;
  const title = date ? `${Number(date.slice(5, 7))}월 ${Number(date.slice(8))}일의 영수증` : '나의 영수증';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {/* Modal 안에서도 제스처(펼치기·뒤집기)가 동작하도록 */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.count}>{list.length}장</Text>
            </View>
            {date && (
              <Pressable onPress={onClearDate} hitSlop={8} style={styles.chip}>
                <Text style={styles.chipText}>전체 보기</Text>
              </Pressable>
            )}
            <Pressable onPress={onClose} hitSlop={10} style={styles.close} accessibilityLabel="닫기">
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {list.length === 0 && <Text style={styles.empty}>아직 뽑은 영수증이 없어요.</Text>}
            {list.map((record) => (
              <Animated.View key={record.id} layout={LinearTransition.springify().damping(18)} style={styles.item}>
                <Text style={styles.itemLabel}>
                  {record.date.replace(/-/g, '.')} · {KIND_LABEL[record.kind]}
                </Text>
                {record.kind === 'fourcut' ? (
                  <FlipCard record={record} rollWidth={paperW} onLongPress={onLongPress} />
                ) : (
                  <FoldableReceipt record={record} rollWidth={paperW} onLongPress={onLongPress} />
                )}
              </Animated.View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 22, color: COLORS.ink, fontFamily: FONTS.sansHeavy },
  count: { fontSize: 13, color: COLORS.sub, fontFamily: FONTS.sans, marginTop: 2 },
  chip: { backgroundColor: COLORS.orangeSoft, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  chipText: { color: COLORS.orange, fontSize: 13, fontFamily: FONTS.sansBold },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: COLORS.ink, fontSize: 15, fontFamily: FONTS.sansBold },
  list: { alignItems: 'center', paddingBottom: 60 },
  item: { alignItems: 'center', width: '100%', paddingHorizontal: 22 },
  itemLabel: { fontSize: 12, color: COLORS.sub, fontFamily: FONTS.sans, paddingTop: 18, paddingBottom: 10 },
  empty: { color: COLORS.sub, fontSize: 15, fontFamily: FONTS.sans, paddingTop: 80 },
});

import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loadHaptics, setHaptics } from '../lib/haptics';
import { purchaseErrorMessage, restorePurchases } from '../lib/shop';
import { COLORS, FONTS } from '../theme';

interface Props {
  visible: boolean;
  recordCount: number;
  onClose: () => void;
  onBought: (productId: string) => void;
}

const VERSION = '1.0.0';

/** 환경설정: 진동, 내 기록 저장 위치 안내, 구매 복원, 정보 */
export function Settings({ visible, recordCount, onClose, onBought }: Props) {
  const [haptics, setHapticsOn] = useState(true);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!visible) return;
    setNotice('');
    loadHaptics().then(setHapticsOn);
  }, [visible]);

  const restore = async () => {
    setNotice('');
    try {
      const restored = await restorePurchases();
      restored.forEach(onBought);
      setNotice(restored.length ? '구매 내역을 불러왔어요.' : '복원할 구매 내역이 없어요.');
    } catch (e) {
      setNotice(purchaseErrorMessage(e));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>설정</Text>
          <Pressable onPress={onClose} hitSlop={10} style={styles.close} accessibilityLabel="닫기">
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <Group title="앱">
            <View style={styles.row}>
              <Text style={styles.rowLabel}>진동</Text>
              <Switch
                value={haptics}
                onValueChange={(v) => {
                  setHapticsOn(v);
                  setHaptics(v);
                }}
                trackColor={{ true: COLORS.orange, false: COLORS.line }}
                thumbColor="#fff"
              />
            </View>
          </Group>

          <Group title="내 기록">
            <View style={styles.row}>
              <Text style={styles.rowLabel}>모은 영수증</Text>
              <Text style={styles.rowValue}>{recordCount}장</Text>
            </View>
            <Text style={styles.help}>
              기록은 로그인 없이 이 폰 안에만 저장돼요. 앱을 지우거나 폰을 바꾸면 사라질 수 있으니, 아끼는 영수증은 크게 보기에서 앨범에 저장해 두세요.
            </Text>
          </Group>

          <Group title="구매">
            <Pressable onPress={restore} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
              <Text style={styles.rowLabel}>구매 복원</Text>
              <Text style={styles.rowValue}>›</Text>
            </Pressable>
            {!!notice && <Text style={styles.help}>{notice}</Text>}
          </Group>

          <Group title="정보">
            <View style={styles.row}>
              <Text style={styles.rowLabel}>버전</Text>
              <Text style={styles.rowValue}>{VERSION}</Text>
            </View>
            <Text style={styles.help}>
              책 정보: 카카오 · 영화 정보: TMDB (This product uses the TMDB API but is not endorsed or certified by TMDB.){'\n'}글꼴: Pretendard, 나눔글꼴 (SIL Open Font
              License)
            </Text>
          </Group>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.group}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 12 },
  title: { fontSize: 22, color: COLORS.ink, fontFamily: FONTS.sansHeavy },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: COLORS.ink, fontSize: 15, fontFamily: FONTS.sansBold },
  body: { paddingHorizontal: 18, paddingBottom: 32, gap: 20 },
  groupTitle: { color: COLORS.sub, fontSize: 13, fontFamily: FONTS.sansBold, paddingHorizontal: 4 },
  group: { backgroundColor: COLORS.surface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  rowLabel: { color: COLORS.ink, fontSize: 15, fontFamily: FONTS.sans },
  rowValue: { color: COLORS.sub, fontSize: 15, fontFamily: FONTS.sans },
  help: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans, lineHeight: 18, paddingBottom: 10 },
});

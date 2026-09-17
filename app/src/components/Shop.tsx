import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { won } from '../lib/format';
import { BUNDLE, OUTFITS, purchase, purchaseErrorMessage, restorePurchases } from '../lib/shop';
import { COLORS, FONTS } from '../theme';
import { CocoArt } from './Coco';

interface Props {
  visible: boolean;
  owned: string[];
  onClose: () => void;
  onBought: (productId: string) => void;
  onOpenCloset: () => void;
}

/** 상점: 전부 해금 묶음, 코코 모자(옷장으로), 곧 나올 새 카테고리·영수증 테마 */
export function Shop({ visible, owned, onClose, onBought, onOpenCloset }: Props) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const hasBundle = owned.includes(BUNDLE.productId);
  const paidHats = OUTFITS.filter((o) => o.unlock.type === 'paid');

  useEffect(() => {
    if (visible) setNotice('');
  }, [visible]);

  const run = async (job: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setNotice('');
    try {
      await job();
    } catch (e) {
      setNotice(purchaseErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>상점</Text>
          <Pressable onPress={onClose} hitSlop={10} style={styles.close} accessibilityLabel="닫기">
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.hero}>
            <CocoArt size={120} tone="white" mood="happy" outfit="crown" id="shop-hero" />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.heroTitle}>전부 해금</Text>
              <Text style={styles.heroSub}>코코 모자 전부 + 앞으로 나올 새 카테고리·영수증 테마까지</Text>
            </View>
          </View>
          <Pressable
            disabled={hasBundle || busy}
            onPress={() => run(async () => onBought(await purchase(BUNDLE.productId)))}
            style={({ pressed }) => [styles.buy, hasBundle && styles.buyOff, pressed && { opacity: 0.85 }]}>
            <Text style={[styles.buyText, hasBundle && styles.buyTextOff]}>{hasBundle ? '이미 전부 해금했어요' : `${won(BUNDLE.price)}원에 전부 해금`}</Text>
          </Pressable>

          <Section title="코코 모자" sub={`${paidHats.length}종 · 하나에 ${won(1000)}원 · 기록하면 받는 모자도 있어요`}>
            <Pressable onPress={onOpenCloset} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
              <View style={styles.hats}>
                {paidHats.map((o) => (
                  <View key={o.id} style={styles.hat}>
                    <CocoArt size={54} tone="white" outfit={o.id} id={`shop-${o.id}`} />
                  </View>
                ))}
              </View>
              <Text style={styles.rowLink}>옷장에서 입어보기 ›</Text>
            </Pressable>
          </Section>

          <Section title="새 카테고리" sub="곧 나와요">
            <Text style={styles.soon}>독서·영화·소비·여행·인생네컷은 계속 무료예요.{'\n'}새로운 기록 양식을 준비하고 있어요.</Text>
          </Section>

          <Section title="영수증 테마" sub="곧 나와요">
            <Text style={styles.soon}>같은 기록을 다른 느낌의 종이·양식으로 뽑을 수 있게 준비하고 있어요.</Text>
          </Section>

          <Pressable onPress={() => run(async () => (await restorePurchases()).forEach(onBought))} hitSlop={8} style={styles.restore}>
            <Text style={styles.restoreText}>구매 복원</Text>
          </Pressable>
          {!!notice && <Text style={styles.notice}>{notice}</Text>}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSub}>{sub}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 12 },
  title: { fontSize: 22, color: COLORS.ink, fontFamily: FONTS.sansHeavy },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: COLORS.ink, fontSize: 15, fontFamily: FONTS.sansBold },
  body: { paddingHorizontal: 18, paddingBottom: 32, gap: 14 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.orange, borderRadius: 22, padding: 16, paddingLeft: 10 },
  heroTitle: { color: '#fff', fontSize: 20, fontFamily: FONTS.sansHeavy },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: FONTS.sans, lineHeight: 19 },
  buy: { backgroundColor: COLORS.ink, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  buyOff: { backgroundColor: COLORS.surface },
  buyText: { color: '#fff', fontSize: 16, fontFamily: FONTS.sansBold },
  buyTextOff: { color: COLORS.sub },
  section: { backgroundColor: COLORS.surface, borderRadius: 18, padding: 16, gap: 10 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  sectionTitle: { color: COLORS.ink, fontSize: 16, fontFamily: FONTS.sansHeavy },
  sectionSub: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans, flexShrink: 1 },
  row: { gap: 10 },
  hats: { flexDirection: 'row', gap: 8 },
  hat: { backgroundColor: COLORS.orange, borderRadius: 12, paddingHorizontal: 2, paddingTop: 4 },
  rowLink: { color: COLORS.orange, fontSize: 14, fontFamily: FONTS.sansBold },
  soon: { color: COLORS.sub, fontSize: 13, fontFamily: FONTS.sans, lineHeight: 20 },
  restore: { alignSelf: 'center', paddingVertical: 6 },
  restoreText: { color: COLORS.sub, fontSize: 13, fontFamily: FONTS.sans, textDecorationLine: 'underline' },
  notice: { color: COLORS.sub, fontSize: 13, fontFamily: FONTS.sans, textAlign: 'center' },
});

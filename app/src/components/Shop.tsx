import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg from 'react-native-svg';

import { won } from '../lib/format';
import { OUTFITS, PAID_CATEGORIES, THEMES, buy, isUnlocked, purchaseErrorMessage, restorePurchases } from '../lib/shop';
import { COLORS, FONTS } from '../theme';
import { CocoArt } from './Coco';
import { StickerArt } from './Stickers';
import { ThemeSwatch } from './ThemePicker';

interface Props {
  visible: boolean;
  owned: string[];
  onClose: () => void;
  onBought: (productId: string) => void;
  onOpenCloset: () => void;
}

/** 상점: 코코 모자(눌러서 옷장에서 입어보고 사기), 영수증 테마, 곧 나올 새 카테고리 */
export function Shop({ visible, owned, onClose, onBought, onOpenCloset }: Props) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
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
          <Section title="코코 모자" sub={`하나에 ${won(1000)}원 · 기록하면 받는 모자도 있어요`}>
            <View style={styles.hats}>
              {paidHats.map((o) => {
                const have = isUnlocked(o, owned, 0);
                return (
                  <Pressable key={o.id} onPress={onOpenCloset} style={({ pressed }) => [styles.hatCell, pressed && { opacity: 0.7 }]}>
                    <View style={styles.hat}>
                      <CocoArt size={60} tone="white" outfit={o.id} id={`shop-${o.id}`} />
                    </View>
                    <Text style={styles.hatName} numberOfLines={1}>
                      {o.name}
                    </Text>
                    <Text style={[styles.hatPrice, have && { color: COLORS.orange }]}>{have ? '보유' : o.unlock.type === 'paid' ? `${won(o.unlock.price)}원` : ''}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable onPress={onOpenCloset} hitSlop={8}>
              <Text style={styles.rowLink}>옷장에서 입어보기 ›</Text>
            </Pressable>
          </Section>

          <Section title="새 카테고리" sub="독서·영화·소비·여행·인생네컷은 계속 무료예요">
            {Object.values(PAID_CATEGORIES).map((c) => {
              const have = owned.includes(c!.productId);
              return (
                <View key={c!.productId} style={styles.themeRow}>
                  <View style={styles.categoryIcon}>
                    <Svg width={34} height={34} viewBox="0 0 48 48">
                      <StickerArt emoji="🎁" />
                    </Svg>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.themeName}>{c!.name}</Text>
                    <Text style={styles.themeDesc}>{c!.desc}</Text>
                  </View>
                  <Pressable
                    disabled={have || busy}
                    onPress={() => run(() => buy(c!.productId))}
                    style={({ pressed }) => [styles.buyBtn, have && styles.buyBtnOff, pressed && { opacity: 0.8 }]}>
                    <Text style={[styles.buyText, have && styles.buyTextOff]}>{have ? '보유' : `${won(c!.price)}원`}</Text>
                  </Pressable>
                </View>
              );
            })}
            <Text style={styles.soon}>공연·전시, 카페·맛집, 운동, 음악도 준비하고 있어요.</Text>
          </Section>

          <Section title="영수증 테마" sub="소비 영수증 · 인생네컷 뒷면에 쓸 수 있어요">
            {THEMES.map((t) => {
              const have = owned.includes(t.productId);
              return (
                <View key={t.id} style={styles.themeRow}>
                  <ThemeSwatch theme={t.id} base="spending" size={34} />
                  <ThemeSwatch theme={t.id} base="fourcut" size={34} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.themeName}>{t.name}</Text>
                    <Text style={styles.themeDesc}>{t.desc}</Text>
                  </View>
                  <Pressable
                    disabled={have || busy}
                    onPress={() => run(() => buy(t.productId))}
                    style={({ pressed }) => [styles.buyBtn, have && styles.buyBtnOff, pressed && { opacity: 0.8 }]}>
                    <Text style={[styles.buyText, have && styles.buyTextOff]}>{have ? '보유' : `${won(t.price)}원`}</Text>
                  </Pressable>
                </View>
              );
            })}
            <Text style={styles.soon}>산 테마는 기록을 쓸 때 "종이"에서 고르면 돼요.</Text>
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
  section: { backgroundColor: COLORS.surface, borderRadius: 18, padding: 16, gap: 10 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  sectionTitle: { color: COLORS.ink, fontSize: 16, fontFamily: FONTS.sansHeavy },
  sectionSub: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans, flexShrink: 1 },
  // 한 줄에 4칸
  hats: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, rowGap: 10 },
  hatCell: { width: '25%', paddingHorizontal: 4, alignItems: 'center' },
  hat: { backgroundColor: COLORS.orange, borderRadius: 12, paddingHorizontal: 2, paddingTop: 4 },
  hatName: { color: COLORS.ink, fontSize: 12, fontFamily: FONTS.sansBold, marginTop: 5 },
  hatPrice: { color: COLORS.sub, fontSize: 11, fontFamily: FONTS.sans, marginTop: 1 },
  rowLink: { color: COLORS.orange, fontSize: 14, fontFamily: FONTS.sansBold },
  categoryIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#ffe36b', alignItems: 'center', justifyContent: 'center' },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  themeName: { color: COLORS.ink, fontSize: 15, fontFamily: FONTS.sansBold },
  themeDesc: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans, marginTop: 1 },
  buyBtn: { backgroundColor: COLORS.orange, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  buyBtnOff: { backgroundColor: COLORS.line },
  buyText: { color: '#fff', fontSize: 13, fontFamily: FONTS.sansBold },
  buyTextOff: { color: COLORS.sub },
  soon: { color: COLORS.sub, fontSize: 13, fontFamily: FONTS.sans, lineHeight: 20 },
  restore: { alignSelf: 'center', paddingVertical: 6 },
  restoreText: { color: COLORS.sub, fontSize: 13, fontFamily: FONTS.sans, textDecorationLine: 'underline' },
  notice: { color: COLORS.sub, fontSize: 13, fontFamily: FONTS.sans, textAlign: 'center' },
});

import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { won } from '../lib/format';
import { PreviewProduct, THEME_TAGS, categoryProduct, foodDesignProduct, themeProduct } from '../lib/products';
import { FOOD_DESIGNS, OUTFITS, PAID_CATEGORIES, THEMES, buy, isUnlocked, purchaseErrorMessage, restorePurchases } from '../lib/shop';
import { KIND_LABEL } from '../templates';
import { COLORS, FONTS } from '../theme';
import { RecordKind } from '../types';
import { CocoArt } from './Coco';
import { CategoryTags, ProductPreview } from './ProductPreview';
import { StickerArt } from './Stickers';
import { FoodDesignSwatch, ThemeSwatch } from './ThemePicker';

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
  const [preview, setPreview] = useState<PreviewProduct | null>(null);
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
            <Pressable onPress={onOpenCloset} hitSlop={8} style={styles.closetLink}>
              <HangerIcon />
              <Text style={styles.rowLink}>옷장에서 입어보기 ›</Text>
            </Pressable>
          </Section>

          <Section title="새 카테고리" sub="독서·영화·소비·여행·인생네컷은 계속 무료예요">
            {(Object.entries(PAID_CATEGORIES) as [RecordKind, (typeof PAID_CATEGORIES)[RecordKind]][]).map(([kind, c]) => {
              const have = owned.includes(c!.productId);
              return (
                <Pressable
                  key={c!.productId}
                  onPress={() => setPreview(categoryProduct(kind))}
                  style={({ pressed }) => [styles.themeRow, pressed && { opacity: 0.7 }]}>
                  <View style={styles.categoryIcon}>
                    <Svg width={34} height={34} viewBox="0 0 48 48">
                      <StickerArt emoji={c!.icon} />
                    </Svg>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.themeName}>{c!.name}</Text>
                    <Text style={styles.themeDesc}>{c!.desc}</Text>
                    <Text style={styles.peek}>미리보기 ›</Text>
                  </View>
                  <Pressable
                    disabled={have || busy}
                    onPress={() => run(() => buy(c!.productId))}
                    style={({ pressed }) => [styles.buyBtn, have && styles.buyBtnOff, pressed && { opacity: 0.8 }]}>
                    <Text style={[styles.buyText, have && styles.buyTextOff]}>{have ? '보유' : `${won(c!.price)}원`}</Text>
                  </Pressable>
                </Pressable>
              );
            })}
            <Text style={styles.soon}>공연·전시, 운동, 음악도 준비하고 있어요.</Text>
          </Section>

          <Section title="영수증 테마" sub="같은 기록을 다른 종이로">
            {THEMES.map((t) => {
              const have = owned.includes(t.productId);
              return (
                <Pressable key={t.id} onPress={() => setPreview(themeProduct(t))} style={({ pressed }) => [styles.themeRow, pressed && { opacity: 0.7 }]}>
                  <ThemeSwatch theme={t.id} base="spending" size={34} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.themeName}>{t.name}</Text>
                      <CategoryTags tags={THEME_TAGS} />
                    </View>
                    <Text style={styles.themeDesc}>{t.desc}</Text>
                    <Text style={styles.peek}>미리보기 ›</Text>
                  </View>
                  <Pressable
                    disabled={have || busy}
                    onPress={() => run(() => buy(t.productId))}
                    style={({ pressed }) => [styles.buyBtn, have && styles.buyBtnOff, pressed && { opacity: 0.8 }]}>
                    <Text style={[styles.buyText, have && styles.buyTextOff]}>{have ? '보유' : `${won(t.price)}원`}</Text>
                  </Pressable>
                </Pressable>
              );
            })}
            {FOOD_DESIGNS.map((d) => {
              const have = owned.includes(d.productId);
              return (
                <Pressable key={d.id} onPress={() => setPreview(foodDesignProduct(d))} style={({ pressed }) => [styles.themeRow, pressed && { opacity: 0.7 }]}>
                  <FoodDesignSwatch design={d.id} size={34} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.themeName}>{d.name}</Text>
                      <CategoryTags tags={[KIND_LABEL.food]} />
                    </View>
                    <Text style={styles.themeDesc}>{d.desc}</Text>
                    <Text style={styles.peek}>미리보기 ›</Text>
                  </View>
                  <Pressable
                    disabled={have || busy}
                    onPress={() => run(() => buy(d.productId))}
                    style={({ pressed }) => [styles.buyBtn, have && styles.buyBtnOff, pressed && { opacity: 0.8 }]}>
                    <Text style={[styles.buyText, have && styles.buyTextOff]}>{have ? '보유' : `${won(d.price)}원`}</Text>
                  </Pressable>
                </Pressable>
              );
            })}
            <Text style={styles.soon}>산 테마는 기록을 쓸 때 "종이"나 "영수증 모양"에서 고르면 돼요.</Text>
          </Section>

          <Pressable onPress={() => run(async () => (await restorePurchases()).forEach(onBought))} hitSlop={8} style={styles.restore}>
            <Text style={styles.restoreText}>구매 복원</Text>
          </Pressable>
          {!!notice && <Text style={styles.notice}>{notice}</Text>}
        </ScrollView>
        <ProductPreview product={preview} onClose={() => setPreview(null)} onBought={() => setPreview(null)} />
      </SafeAreaView>
    </Modal>
  );
}

/** 옷걸이에 걸린 티셔츠 (옷장 링크 아이콘) */
function HangerIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M12,4.6 Q12,2.4 10.2,2.4 Q8.9,2.4 8.9,3.7" stroke={COLORS.orange} strokeWidth={1.6} strokeLinecap="round" fill="none" />
      <Path d="M7.4,8.4 L12,4.9 L16.6,8.4" stroke={COLORS.orange} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M9.4,8 H14.6 L19.2,10.8 L17.6,13.4 L15.8,12.3 V19.4 Q12,21 8.2,19.4 V12.3 L6.4,13.4 L4.8,10.8 Z" fill={COLORS.orange} />
      <Path d="M10.1,8.1 Q12,10.2 13.9,8.1" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" fill="none" />
    </Svg>
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
  closetLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end' },
  rowLink: { color: COLORS.orange, fontSize: 14, fontFamily: FONTS.sansBold },
  categoryIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#ffe36b', alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  peek: { color: COLORS.orange, fontSize: 11, fontFamily: FONTS.sansBold, marginTop: 3, alignSelf: 'flex-end' },
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

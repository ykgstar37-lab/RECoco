import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { won } from '../lib/format';
import { PreviewProduct } from '../lib/products';
import { buy, categoryUnlocked, purchaseErrorMessage, useShop } from '../lib/shop';
import { RecordBack, RecordPaper, isFlippable, layoutOf } from '../templates';
import { COLORS, FONTS } from '../theme';
import { KIND_LABEL } from '../templates';

/** 상품을 사기 전에 실제 양식으로 그린 예시를 보여주고, 여기서 바로 산다 */
export function ProductPreview({ product, onClose, onBought }: { product: PreviewProduct | null; onClose: () => void; onBought?: () => void }) {
  const { owned } = useShop();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (product) setNotice('');
  }, [product]);

  const have = !!product && owned.includes(product.productId);
  // 영수증 모양 테마는 그 카테고리를 사야 쓸 수 있다 (공용 모양은 둘 중 하나만 있어도 된다)
  const needKinds = product?.requires?.every((k) => !categoryUnlocked(k, owned)) ? product.requires : null;

  const purchase = async () => {
    if (!product || busy) return;
    setBusy(true);
    setNotice('');
    try {
      await buy(product.productId);
      onBought?.();
    } catch (e) {
      setNotice(purchaseErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  // 한 장은 크게, 여러 장이면 옆으로 넘겨 보기
  const many = (product?.samples.length ?? 0) > 1;
  const maxH = screenH * 0.5;
  // 칸마다 종이 폭·높이를 먼저 재서, 가장 높은 칸에 나머지를 맞춘다
  const cellW = many ? screenW * 0.62 : screenW - 60;
  const sized = (product?.samples ?? []).map((sample) => {
    const l = layoutOf(sample.record);
    const stack = [sample.record, ...(sample.more ?? [])];
    if (sample.connected) {
      // 롤처럼 틈 없이 이어 붙인 칸: 장마다 높이가 달라서 모두 더한 높이로 폭을 정한다 (위아래 여백은 겹친다)
      const ls = stack.map(layoutOf);
      const units = ls.reduce((n, x, j) => n + (x.height - (j > 0 ? x.inset.top + ls[j - 1].inset.bottom : 0)) / x.width, 0);
      const w = Math.min(cellW, maxH / units);
      return { sample, stack, w, h: w * units, total: w * units };
    }
    const room = (maxH - (stack.length - 1) * 10) / stack.length;
    const w = Math.min(cellW, (room * l.width) / l.height);
    const h = (w * l.height) / l.width;
    return { sample, stack, w, h, total: h * stack.length };
  });
  const rowH = sized.reduce((m, s) => Math.max(m, s.total), 0);

  return (
    <Modal visible={!!product} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>미리보기</Text>
          <Pressable onPress={onClose} hitSlop={10} style={styles.close} accessibilityLabel="닫기">
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        {product && (
          <ScrollView contentContainerStyle={styles.body}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{product.title}</Text>
              {product.tags.length > 0 && <CategoryTags tags={product.tags} />}
            </View>
            <Text style={styles.desc}>{product.desc}</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.samples}>
              {sized.map(({ sample: s, stack, w, h }, i) => {
                // 쌓은 칸은 옆 칸만큼 키운다 (남는 자리를 장 사이에 나눠 넣는다)
                const gap = stack.length > 1 && !s.connected ? Math.max(10, (rowH - h * stack.length) / (stack.length - 1)) : 0;
                return (
                  <View key={i} style={styles.sample}>
                    <View style={styles.paper}>
                      {!!s.badge && (
                        // 종이 위 가장자리에 걸쳐 둔다 (안에 두면 소분류 알약·날짜를 가린다)
                        <View style={styles.badgeRow} pointerEvents="none">
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{s.badge}</Text>
                          </View>
                        </View>
                      )}
                      {stack.map((record, j) => {
                        // 이어 붙인 칸은 앞 장의 아래 여백 + 이 장의 위 여백만큼 당긴다
                        const pull = s.connected && j > 0 ? ((layoutOf(stack[j - 1]).inset.bottom + layoutOf(record).inset.top) * w) / layoutOf(record).width : 0;
                        return (
                          <View key={j} style={j > 0 && { marginTop: s.connected ? -pull : gap }}>
                            {s.side === 'back' && isFlippable(record) ? (
                              <RecordBack record={record} width={w} />
                            ) : (
                              <RecordPaper record={record} width={w} connected={s.connected} />
                            )}
                          </View>
                        );
                      })}
                    </View>
                    <Text style={styles.caption}>{s.caption}</Text>
                  </View>
                );
              })}
            </ScrollView>
            <Text style={styles.help}>{product.help ?? '글자는 예시예요. 내 기록 내용으로 채워져요.'}</Text>
            {!!notice && <Text style={styles.notice}>{notice}</Text>}
          </ScrollView>
        )}

        {product && (
          <Pressable
            disabled={have || busy || !!needKinds}
            onPress={purchase}
            style={({ pressed }) => [styles.buy, (have || !!needKinds) && styles.buyOff, pressed && { opacity: 0.85 }]}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.buyText, (have || !!needKinds) && styles.buyTextOff]}>
                {have
                  ? '이미 가지고 있어요'
                  : needKinds
                    ? `${needKinds.map((k) => KIND_LABEL[k]).join(' 또는 ')}을(를) 먼저 사야 써요`
                    : `${won(product.price)}원에 사기`}
              </Text>
            )}
          </Pressable>
        )}
      </SafeAreaView>
    </Modal>
  );
}

/** 이름 옆에 붙는 작은 원형 카테고리 태그 (상점 목록은 이름과 한 줄에 들어가야 해서 tight) */
export function CategoryTags({ tags, tight }: { tags: string[]; tight?: boolean }) {
  return (
    <View style={[styles.tags, tight && styles.tagsTight]}>
      {tags.map((t) => (
        <View key={t} style={[styles.tag, tight && styles.tagTight]}>
          <Text style={[styles.tagText, tight && styles.tagTextTight]} numberOfLines={1}>
            {t}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 12 },
  title: { fontSize: 17, color: COLORS.sub, fontFamily: FONTS.sansBold },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: COLORS.ink, fontSize: 15, fontFamily: FONTS.sansBold },
  body: { paddingBottom: 24, gap: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingHorizontal: 22 },
  name: { color: COLORS.ink, fontSize: 24, fontFamily: FONTS.sansHeavy },
  desc: { color: COLORS.sub, fontSize: 14, fontFamily: FONTS.sans, paddingHorizontal: 22 },
  samples: { paddingHorizontal: 22, paddingVertical: 14, gap: 14, alignItems: 'flex-end' },
  sample: { alignItems: 'center', gap: 8 },
  paper: { backgroundColor: COLORS.surface, borderRadius: 18, padding: 8 },
  caption: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sansBold },
  badgeRow: { position: 'absolute', top: -11, left: 0, right: 0, alignItems: 'center', zIndex: 2 },
  badge: { backgroundColor: COLORS.ink, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { color: '#fff', fontSize: 11, fontFamily: FONTS.sansBold },
  help: { color: COLORS.placeholder, fontSize: 12, fontFamily: FONTS.sans, textAlign: 'center' },
  notice: { color: COLORS.danger, fontSize: 13, fontFamily: FONTS.sansBold, textAlign: 'center' },
  tags: { flexDirection: 'row', gap: 4 },
  tagsTight: { gap: 3, flexShrink: 0 },
  tag: { borderWidth: 1.2, borderColor: COLORS.orange, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 1.5, backgroundColor: '#fff' },
  tagTight: { borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1 },
  tagText: { color: COLORS.orange, fontSize: 10.5, fontFamily: FONTS.sansBold },
  tagTextTight: { fontSize: 9.5 },
  buy: { marginHorizontal: 16, marginBottom: 8, backgroundColor: COLORS.orange, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  buyOff: { backgroundColor: COLORS.surface },
  buyText: { color: '#fff', fontSize: 16, fontFamily: FONTS.sansBold },
  buyTextOff: { color: COLORS.sub },
});

import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { won } from '../lib/format';
import { tick } from '../lib/haptics';
import { BUNDLE, OUTFITS, OutfitItem, PurchaseUnavailable, isUnlocked, purchase } from '../lib/shop';
import { COLORS, FONTS } from '../theme';
import { Coco, CocoArt } from './Coco';
import { OutfitId } from './Outfits';

interface Props {
  visible: boolean;
  owned: string[];
  recordCount: number;
  outfit: OutfitId | null;
  onClose: () => void;
  onWear: (outfit: OutfitId | null) => void;
  onBought: (productId: string) => void;
}

/** 코코 옷장: 눌러서 입혀보고, 해금된 옷은 입히고, 잠긴 옷은 사거나 기록으로 받는다 */
export function Closet({ visible, owned, recordCount, outfit, onClose, onWear, onBought }: Props) {
  // 입어보는 중인 옷 (null = 맨머리)
  const [trying, setTrying] = useState<OutfitId | null>(outfit);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!visible) return;
    setTrying(outfit);
    setNotice('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const item = OUTFITS.find((o) => o.id === trying) ?? null;
  const unlocked = !item || isUnlocked(item, owned, recordCount);
  const hasBundle = owned.includes(BUNDLE.productId);

  const buy = async (productId: string) => {
    if (busy) return;
    setBusy(true);
    setNotice('');
    try {
      onBought(await purchase(productId));
      setNotice('고마워요! 코코가 신났어요');
    } catch (e) {
      setNotice(e instanceof PurchaseUnavailable ? '결제는 스토어 출시 버전에서 열려요.' : '결제를 완료하지 못했어요.');
    } finally {
      setBusy(false);
    }
  };

  let action: { label: string; onPress?: () => void };
  if (!item) {
    action = outfit ? { label: '모자 벗기', onPress: () => onWear(null) } : { label: '지금 맨머리예요' };
  } else if (unlocked) {
    action = outfit === item.id ? { label: '입는 중' } : { label: `${item.name} 입히기`, onPress: () => onWear(item.id) };
  } else if (item.unlock.type === 'reward') {
    action = { label: `영수증 ${item.unlock.records - recordCount}장 더 모으면 받아요` };
  } else {
    const { productId, price } = item.unlock;
    action = { label: `${item.name} ${won(price)}원에 사기`, onPress: () => buy(productId) };
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>코코 옷장</Text>
          <Pressable onPress={onClose} hitSlop={10} style={styles.close} accessibilityLabel="닫기">
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.stage}>
            <Coco size={200} tone="white" mood={unlocked ? 'happy' : 'idle'} outfit={trying} interactive id="closet-coco" />
            <Text style={styles.stageName}>{item ? item.name : '맨머리'}</Text>
          </View>

          <View style={styles.grid}>
            <Tile label="맨머리" status={outfit === null ? '입는 중' : ''} selected={trying === null} onPress={() => setTrying(null)} />
            {OUTFITS.map((o) => (
              <Tile
                key={o.id}
                outfit={o.id}
                label={o.name}
                status={statusOf(o, owned, recordCount, outfit)}
                locked={!isUnlocked(o, owned, recordCount)}
                selected={trying === o.id}
                onPress={() => setTrying(o.id)}
              />
            ))}
          </View>

          {!hasBundle && (
            <Pressable onPress={() => buy(BUNDLE.productId)} style={({ pressed }) => [styles.bundle, pressed && { opacity: 0.85 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bundleTitle}>전부 해금</Text>
                <Text style={styles.bundleSub}>모자 전부 + 앞으로 나올 새 카테고리까지</Text>
              </View>
              <Text style={styles.bundlePrice}>{won(BUNDLE.price)}원</Text>
            </Pressable>
          )}
          {!!notice && <Text style={styles.notice}>{notice}</Text>}
        </ScrollView>

        <Pressable
          disabled={!action.onPress || busy}
          onPress={action.onPress}
          style={({ pressed }) => [styles.action, !action.onPress && styles.actionOff, pressed && { opacity: 0.85 }]}>
          <Text style={[styles.actionText, !action.onPress && styles.actionTextOff]}>{action.label}</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

function statusOf(o: OutfitItem, owned: string[], recordCount: number, outfit: OutfitId | null) {
  if (outfit === o.id) return '입는 중';
  if (isUnlocked(o, owned, recordCount)) return '';
  return o.unlock.type === 'reward' ? `영수증 ${o.unlock.records}장` : `${won(o.unlock.price)}원`;
}

function Tile({
  outfit,
  label,
  status,
  locked,
  selected,
  onPress,
}: {
  outfit?: OutfitId;
  label: string;
  status: string;
  locked?: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPressIn={tick}
      onPress={onPress}
      style={[styles.tile, selected && styles.tileOn]}
      accessibilityLabel={`${label}${locked ? ' (잠김)' : ''}`}>
      <View style={[styles.tileArt, locked && { opacity: 0.45 }]}>
        <CocoArt size={70} tone="white" outfit={outfit} id={`tile-${outfit ?? 'none'}`} />
      </View>
      <Text style={styles.tileLabel} numberOfLines={1}>
        {locked ? '🔒 ' : ''}
        {label}
      </Text>
      <Text style={[styles.tileStatus, status === '입는 중' && { color: COLORS.orange }]} numberOfLines={1}>
        {status || ' '}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 12 },
  title: { fontSize: 22, color: COLORS.ink, fontFamily: FONTS.sansHeavy },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: COLORS.ink, fontSize: 15, fontFamily: FONTS.sansBold },
  body: { paddingHorizontal: 18, paddingBottom: 24, gap: 16 },
  stage: { backgroundColor: COLORS.orange, borderRadius: 24, alignItems: 'center', paddingTop: 22, paddingBottom: 14, gap: 6 },
  stageName: { color: '#fff', fontSize: 16, fontFamily: FONTS.sansBold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  tile: {
    width: '23.5%',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 6,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tileOn: { borderColor: COLORS.orange, backgroundColor: COLORS.orangeSoft },
  tileArt: { backgroundColor: COLORS.orange, borderRadius: 12, paddingHorizontal: 2, paddingTop: 4 },
  tileLabel: { color: COLORS.ink, fontSize: 12, fontFamily: FONTS.sansBold, marginTop: 6 },
  tileStatus: { color: COLORS.sub, fontSize: 10, fontFamily: FONTS.sans, marginTop: 1 },
  bundle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.orange,
    backgroundColor: COLORS.orangeSoft,
  },
  bundleTitle: { color: COLORS.ink, fontSize: 15, fontFamily: FONTS.sansHeavy },
  bundleSub: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans, marginTop: 2 },
  bundlePrice: { color: COLORS.orange, fontSize: 17, fontFamily: FONTS.sansHeavy },
  notice: { color: COLORS.sub, fontSize: 13, fontFamily: FONTS.sans, textAlign: 'center' },
  action: { marginHorizontal: 16, marginBottom: 8, backgroundColor: COLORS.orange, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  actionOff: { backgroundColor: COLORS.surface },
  actionText: { color: '#fff', fontSize: 16, fontFamily: FONTS.sansBold },
  actionTextOff: { color: COLORS.sub },
});

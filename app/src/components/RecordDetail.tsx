import { useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOut, FlipInEasyY } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { bump } from '../lib/haptics';
import { canCapture, saveCard, shareCard } from '../lib/share';
import { KIND_LABEL, RecordBack, RecordPaper, isFlippable, sizeOf } from '../templates';
import { BRAND, COLORS, FONTS } from '../theme';
import { RecoRecord } from '../types';
import { CocoArt } from './Coco';
import { LoadingOverlay } from './Loading';
import { DotsIcon, PencilIcon, SaveIcon, ShareIcon, TrashIcon } from './MenuIcons';
import { ModalSafeArea } from './ModalSafeArea';
import { RecordForm } from './RecordForm';

interface Props {
  record: RecoRecord | null;
  onClose: () => void;
  onSave: (record: RecoRecord) => void;
  onDelete: (record: RecoRecord) => void;
}

/** 카드 둘레(위아래 여백·브랜드 표시) — 화면에 꽉 맞출 때 빼는 높이 */
const CARD_CHROME = 100;

/** 영수증 크게 보기 + 이미지로 공유/저장 + 고치기/버리기 */
export function RecordDetail({ record, onClose, onSave, onDelete }: Props) {
  const { width: screenW } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cardRef = useRef<View>(null);
  const [back, setBack] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menu, setMenu] = useState(false);
  const [areaH, setAreaH] = useState(0);

  const show = (msg: string, ms = 1800) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  };

  const run = async (job: () => Promise<void>, done: string) => {
    if (!canCapture) return show('이미지 저장·공유는 앱에서만 할 수 있어요');
    setBusy(true);
    try {
      await job();
      if (done) show(done);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      show(msg === 'permission-denied' ? '사진 앨범 접근을 허용해 주세요' : '앗, 잠시 후 다시 시도해 주세요');
    } finally {
      setBusy(false);
    }
  };

  if (!record) return null;
  const rollW = Math.min(screenW - 48, 440);
  // 롤에서 쓰는 크기보다 작아지지는 않게, 화면 높이가 남으면 그만큼 키운다 (코코치처럼 작게 보이던 양식)
  const base = sizeOf(record, rollW);
  const fitW = areaH ? ((areaH - CARD_CHROME) * base.width) / base.height : 0;
  const width = Math.max(base.width, Math.min(rollW * 0.94, fitW));
  // 인생네컷·일상은 뒤집어 볼 수 있다 (코코몬 카드는 뒷면이 없다)
  const flippable = isFlippable(record);
  const flipCard = () => {
    bump();
    setBack((b) => !b);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <ModalSafeArea style={styles.root}>
        <View style={styles.top}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.iconBtn} accessibilityLabel="닫기">
            <Text style={styles.iconText}>✕</Text>
          </Pressable>
          <Text style={styles.topTitle}>
            {record.date.replace(/-/g, '.')} · {KIND_LABEL[record.kind]}
          </Text>
          <Pressable onPress={() => setMenu(true)} hitSlop={10} style={styles.iconBtn} accessibilityLabel="더 보기">
            <DotsIcon color="#fff" size={20} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          onLayout={(e) => setAreaH(e.nativeEvent.layout.height)}>
          {/* 이 카드가 그대로 이미지로 저장된다. 인생네컷·일상은 누르면 뒷면(오늘의 하루)으로 뒤집힌다 */}
          <Pressable onPress={flipCard} disabled={!flippable} accessibilityHint={flippable ? '누르면 뒤집혀요' : undefined}>
            <View ref={cardRef} collapsable={false} style={styles.card}>
              <Animated.View key={back ? 'back' : 'front'} entering={flippable ? FlipInEasyY.duration(380) : undefined}>
                {flippable && back ? <RecordBack record={record} width={width} /> : <RecordPaper record={record} width={width} />}
              </Animated.View>
              <View style={styles.mark}>
                <CocoArt size={26} tone="white" id="detail-mark" />
                <Text style={styles.markText}>{BRAND.ko}</Text>
              </View>
            </View>
          </Pressable>
        </ScrollView>

        <View style={styles.actions}>
          <Action label="앨범에 저장" short="저장" Icon={SaveIcon} disabled={busy} onPress={() => run(() => saveCard(cardRef), '앨범에 저장했어요')} />
          <Action label="고치기" Icon={PencilIcon} disabled={busy} onPress={() => setEditing(true)} />
          <Action label="버리기" Icon={TrashIcon} disabled={busy} danger onPress={() => setConfirmDelete(true)} />
        </View>

        {/* ⋯ 메뉴: 공유하기 */}
        {menu && (
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenu(false)}>
            <Animated.View entering={FadeIn.duration(120)} style={[styles.menu, { top: insets.top + 60 }]}>
              <MenuItem
                label="공유하기"
                icon={<ShareIcon color={COLORS.ink} size={20} />}
                onPress={() => {
                  setMenu(false);
                  run(() => shareCard(cardRef), '');
                }}
              />
            </Animated.View>
          </Pressable>
        )}

        {confirmDelete && (
          <Animated.View entering={FadeInUp.duration(160)} exiting={FadeOut.duration(100)} style={styles.confirm}>
            <Text style={styles.confirmTitle}>이 영수증을 버릴까요?</Text>
            <Text style={styles.confirmSub}>버린 뒤 잠깐은 되돌릴 수 있어요.</Text>
            <View style={styles.confirmRow}>
              <Pressable style={[styles.confirmBtn, styles.confirmCancel]} onPress={() => setConfirmDelete(false)}>
                <Text style={styles.confirmCancelText}>그냥 둘래요</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmBtn, styles.confirmDanger]}
                onPress={() => {
                  setConfirmDelete(false);
                  onDelete(record);
                }}>
                <Text style={styles.confirmDangerText}>버리기</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {toast && (
          <Animated.View entering={FadeInUp.duration(160)} exiting={FadeOut.duration(160)} style={styles.toast} pointerEvents="none">
            <Text style={styles.toastText}>{toast}</Text>
          </Animated.View>
        )}

        {/* 고치기 폼은 이 화면 위에 겹쳐 띄운다 (iOS에서 모달 위 모달) */}
        <RecordForm
          visible={editing}
          editing={record}
          onClose={() => setEditing(false)}
          onSubmit={(next) => {
            setEditing(false);
            onSave(next);
            setTimeout(() => show('고쳤어요'), Platform.OS === 'ios' ? 450 : 50);
          }}
        />
        <LoadingOverlay visible={busy} />
      </ModalSafeArea>
    </Modal>
  );
}

function MenuItem({ label, icon, onPress }: { label: string; icon: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: COLORS.surface }]}>
      <View style={styles.menuIcon}>{icon}</View>
      <Text style={styles.menuText}>{label}</Text>
    </Pressable>
  );
}

/** 아래 버튼 — 동그라미 아이콘 + 아래 짧은 이름 */
function Action({
  label,
  short,
  Icon,
  onPress,
  danger,
  disabled,
}: {
  label: string;
  /** 동그라미 아래 이름 (없으면 label) */
  short?: string;
  Icon: (p: { color: string; size?: number }) => React.JSX.Element;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.action, (pressed || disabled) && { opacity: 0.7 }]}>
      <View style={[styles.actionCircle, danger && styles.actionDanger]}>
        <Icon color={danger ? '#fff' : COLORS.orange} size={24} />
      </View>
      <Text style={styles.actionText}>{short ?? label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.orange },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
  iconText: { color: '#fff', fontSize: 16, fontFamily: FONTS.sansBold },
  topTitle: { color: '#fff', fontSize: 16, fontFamily: FONTS.sansBold },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  card: { backgroundColor: COLORS.orange, alignItems: 'center', paddingHorizontal: 12, paddingTop: 20, paddingBottom: 16 },
  mark: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  markText: { color: '#fff', fontSize: 13, fontFamily: FONTS.sansHeavy },
  menu: {
    position: 'absolute',
    right: 16,
    minWidth: 200,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  menuIcon: { width: 22, alignItems: 'center' },
  menuText: { color: COLORS.ink, fontSize: 15, fontFamily: FONTS.sansBold },
  actions: { flexDirection: 'row', justifyContent: 'space-evenly', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  action: { alignItems: 'center', gap: 6, minWidth: 64 },
  actionCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  actionDanger: { backgroundColor: 'rgba(255,255,255,0.2)' },
  actionText: { color: '#fff', fontSize: 12, fontFamily: FONTS.sansBold },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 110,
    backgroundColor: COLORS.ink,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
  },
  toastText: { color: '#fff', fontSize: 14, fontFamily: FONTS.sansBold },
  confirm: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 90,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  confirmTitle: { color: COLORS.ink, fontSize: 17, fontFamily: FONTS.sansHeavy },
  confirmSub: { color: COLORS.sub, fontSize: 14, fontFamily: FONTS.sans },
  confirmRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  confirmBtn: { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  confirmCancel: { backgroundColor: COLORS.surface },
  confirmCancelText: { color: COLORS.ink, fontSize: 15, fontFamily: FONTS.sansBold },
  confirmDanger: { backgroundColor: COLORS.danger },
  confirmDangerText: { color: '#fff', fontSize: 15, fontFamily: FONTS.sansBold },
});

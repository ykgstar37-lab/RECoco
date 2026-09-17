import { useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated';

import { canCapture, saveCard, shareCard } from '../lib/share';
import { FourcutBack, KIND_LABEL, RecordPaper, sizeOf } from '../templates';
import { BRAND, COLORS, FONTS } from '../theme';
import { RecoRecord } from '../types';
import { CocoArt } from './Coco';
import { ModalSafeArea } from './ModalSafeArea';
import { RecordForm } from './RecordForm';

interface Props {
  record: RecoRecord | null;
  onClose: () => void;
  onSave: (record: RecoRecord) => void;
  onDelete: (record: RecoRecord) => void;
}

/** 영수증 크게 보기 + 이미지로 공유/저장 + 고치기/버리기 */
export function RecordDetail({ record, onClose, onSave, onDelete }: Props) {
  const { width: screenW } = useWindowDimensions();
  const cardRef = useRef<View>(null);
  const [back, setBack] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const show = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
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
  const { width } = sizeOf(record, rollW);
  const isFourcut = record.kind === 'fourcut';

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
          <View style={styles.iconBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* 이 카드가 그대로 이미지로 저장된다 */}
          <View ref={cardRef} collapsable={false} style={styles.card}>
            {isFourcut && back ? <FourcutBack record={record} width={width} /> : <RecordPaper record={record} width={width} />}
            <View style={styles.mark}>
              <CocoArt size={26} tone="white" id="detail-mark" />
              <Text style={styles.markText}>{BRAND.ko}</Text>
            </View>
          </View>

          {isFourcut && (
            <Pressable onPress={() => setBack((b) => !b)} style={styles.flip}>
              <Text style={styles.flipText}>{back ? '앞면 보기' : '뒷면 보기 (오늘의 하루)'}</Text>
            </Pressable>
          )}
        </ScrollView>

        <View style={styles.actions}>
          <Action label="공유" disabled={busy} onPress={() => run(() => shareCard(cardRef), '')} />
          <Action label="앨범에 저장" disabled={busy} onPress={() => run(() => saveCard(cardRef), '앨범에 저장했어요')} />
          <Action label="고치기" disabled={busy} onPress={() => setEditing(true)} />
          <Action label="버리기" disabled={busy} danger onPress={() => setConfirmDelete(true)} />
        </View>

        {confirmDelete && (
          <Animated.View entering={FadeInUp.duration(160)} exiting={FadeOut.duration(100)} style={styles.confirm}>
            <Text style={styles.confirmTitle}>이 영수증을 버릴까요?</Text>
            <Text style={styles.confirmSub}>버리면 되돌릴 수 없어요.</Text>
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
      </ModalSafeArea>
    </Modal>
  );
}

function Action({ label, onPress, danger, disabled }: { label: string; onPress: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.action, danger && styles.actionDanger, (pressed || disabled) && { opacity: 0.7 }]}>
      <Text style={[styles.actionText, danger && styles.actionTextDanger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.orange },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
  iconText: { color: '#fff', fontSize: 16, fontFamily: FONTS.sansBold },
  topTitle: { color: '#fff', fontSize: 16, fontFamily: FONTS.sansBold },
  scroll: { alignItems: 'center', paddingVertical: 12, paddingBottom: 40 },
  card: { backgroundColor: COLORS.orange, alignItems: 'center', paddingHorizontal: 12, paddingTop: 20, paddingBottom: 16 },
  mark: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  markText: { color: '#fff', fontSize: 13, fontFamily: FONTS.sansHeavy },
  flip: { marginTop: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: '#fff' },
  flipText: { color: COLORS.orange, fontSize: 14, fontFamily: FONTS.sansBold },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  action: { flex: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  actionDanger: { backgroundColor: 'rgba(255,255,255,0.2)' },
  actionText: { color: COLORS.orange, fontSize: 14, fontFamily: FONTS.sansBold },
  actionTextDanger: { color: '#fff' },
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

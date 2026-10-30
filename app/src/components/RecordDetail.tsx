import { useRef, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOut, FlipInEasyY } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { bump } from '../lib/haptics';
import { canCapture, saveCard, shareCard } from '../lib/share';
import { MAX_PICKS, defaultPickName, setPickName, togglePick, useWidgetPickNames, useWidgetPicks, widgetStatus, widgetsAvailable } from '../lib/widgetPicks';
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
  const picks = useWidgetPicks();
  const pickNames = useWidgetPickNames();

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
  const inWidget = picks.includes(record.id);
  // 위젯 편집에서 이 이름으로 고른다 — 날짜만으로는 같은 날 기록끼리 헷갈려서 넣을 때 직접 붙인다 (iOS 만이라 Alert.prompt)
  const askName = (title: string, then: (name: string) => void) =>
    Alert.prompt(
      title,
      '홈 화면 위젯을 길게 눌러 편집할 때 이 이름으로 골라요.',
      [
        { text: '취소', style: 'cancel' },
        { text: '확인', onPress: (text?: string) => then(text?.trim() || defaultPickName(record)) },
      ],
      'plain-text',
      pickNames[record.id] || defaultPickName(record),
    );
  const toggleWidget = () => {
    if (inWidget) {
      togglePick(record.id);
      return show('위젯에서 뺐어요');
    }
    askName('위젯에 넣을 이름', (name) => {
      if (!togglePick(record.id)) return show(`위젯에는 ${MAX_PICKS}장까지 넣을 수 있어요`);
      setPickName(record.id, name);
      show(`'${name}' 으로 위젯 목록에 넣었어요 · 홈 화면 위젯을 길게 눌러 골라 보세요`, 2600);
    });
  };
  const renameWidget = () =>
    askName('위젯 이름 바꾸기', (name) => {
      setPickName(record.id, name);
      show('이름을 바꿨어요');
    });
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
          <Action label="앨범에 저장" Icon={SaveIcon} disabled={busy} onPress={() => run(() => saveCard(cardRef), '앨범에 저장했어요')} />
          <Action label="고치기" Icon={PencilIcon} disabled={busy} onPress={() => setEditing(true)} />
          <Action label="버리기" Icon={TrashIcon} disabled={busy} danger onPress={() => setConfirmDelete(true)} />
        </View>

        {/* ⋯ 메뉴: 공유하기 · 위젯 목록 (iOS) */}
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
              {/* 위젯 목록에 넣고 빼기. 길게 누르면 위젯 상태 — 위젯이 빌 때 원인 찾기용 */}
              {widgetsAvailable && (
                <MenuItem
                  label={inWidget ? '위젯 목록에서 빼기' : '위젯 목록에 넣기'}
                  icon={<Text style={styles.menuGlyph}>{inWidget ? '✓' : '＋'}</Text>}
                  onPress={() => {
                    setMenu(false);
                    toggleWidget();
                  }}
                  onLongPress={() => {
                    setMenu(false);
                    show(widgetStatus(), 5000);
                  }}
                />
              )}
              {widgetsAvailable && inWidget && (
                <MenuItem
                  label="위젯 이름 바꾸기"
                  icon={<PencilIcon color={COLORS.ink} size={20} />}
                  onPress={() => {
                    setMenu(false);
                    renameWidget();
                  }}
                />
              )}
            </Animated.View>
          </Pressable>
        )}

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
        <LoadingOverlay visible={busy} />
      </ModalSafeArea>
    </Modal>
  );
}

function MenuItem({ label, icon, onPress, onLongPress }: { label: string; icon: React.ReactNode; onPress: () => void; onLongPress?: () => void }) {
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: COLORS.surface }]}>
      <View style={styles.menuIcon}>{icon}</View>
      <Text style={styles.menuText}>{label}</Text>
    </Pressable>
  );
}

/** 아래 버튼 — 글씨 대신 아이콘 (이름은 읽어 주기용으로 남긴다) */
function Action({
  label,
  Icon,
  onPress,
  danger,
  disabled,
}: {
  label: string;
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
      style={({ pressed }) => [styles.action, danger && styles.actionDanger, (pressed || disabled) && { opacity: 0.7 }]}>
      <Icon color={danger ? '#fff' : COLORS.orange} size={24} />
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
  menuGlyph: { color: COLORS.ink, fontSize: 18, fontFamily: FONTS.sansBold },
  menuText: { color: COLORS.ink, fontSize: 15, fontFamily: FONTS.sansBold },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  action: { flex: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  actionDanger: { backgroundColor: 'rgba(255,255,255,0.2)' },
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

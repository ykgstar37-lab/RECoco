import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BadBackup, canBackup, exportBackup, pickBackup } from '../lib/backup';
import { loadHaptics, setHaptics } from '../lib/haptics';
import { purchaseErrorMessage, restorePurchases } from '../lib/shop';
import { APP_VERSION } from '../lib/support';
import { COLORS, FONTS } from '../theme';
import { RecoRecord } from '../types';
import { BugReport } from './BugReport';

interface Props {
  visible: boolean;
  records: RecoRecord[];
  onClose: () => void;
  /** 백업에서 불러온 기록 (합쳐진 뒤 새로 더해진 장수를 돌려준다) */
  onImport: (records: RecoRecord[]) => number;
  onBought: (productId: string) => void;
}

/** 환경설정: 진동, 내 기록·백업, 구매 복원, 버그 신고, 정보 */
export function Settings({ visible, records, onClose, onImport, onBought }: Props) {
  const [haptics, setHapticsOn] = useState(true);
  const [notice, setNotice] = useState('');
  const [backupNotice, setBackupNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [bugOpen, setBugOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setNotice('');
    setBackupNotice('');
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

  const backup = async () => {
    if (busy) return;
    setBusy(true);
    setBackupNotice('');
    try {
      await exportBackup(records);
      setBackupNotice('백업 파일을 만들었어요. 파일·드라이브 같은 안전한 곳에 저장해 두세요.');
    } catch {
      setBackupNotice('백업 파일을 만들지 못했어요.');
    } finally {
      setBusy(false);
    }
  };

  const restoreBackup = async () => {
    if (busy) return;
    setBusy(true);
    setBackupNotice('');
    try {
      const picked = await pickBackup();
      if (picked) {
        const added = onImport(picked);
        setBackupNotice(added ? `영수증 ${added}장을 불러왔어요.` : '이미 다 있는 영수증이에요.');
      }
    } catch (e) {
      setBackupNotice(e instanceof BadBackup ? '레코코 백업 파일이 아니에요.' : '백업 파일을 불러오지 못했어요.');
    } finally {
      setBusy(false);
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
              <Text style={styles.rowValue}>{records.length}장</Text>
            </View>
            <Text style={styles.help}>
              기록은 로그인 없이 이 폰 안에만 저장돼요. 앱을 지우거나 폰을 바꾸기 전에 백업 파일을 만들어 두세요.
            </Text>
          </Group>

          <Group title="백업">
            <Pressable disabled={!canBackup || busy} onPress={backup} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
              <Text style={[styles.rowLabel, !canBackup && styles.off]}>백업 파일 만들기</Text>
              <Text style={styles.rowValue}>›</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable disabled={!canBackup || busy} onPress={restoreBackup} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
              <Text style={[styles.rowLabel, !canBackup && styles.off]}>백업 파일 불러오기</Text>
              <Text style={styles.rowValue}>›</Text>
            </Pressable>
            <Text style={styles.help}>
              {canBackup
                ? backupNotice || '기록과 사진이 파일 하나에 담겨요. 불러오면 지금 기록에 합쳐지고, 이미 있는 영수증은 건너뛰어요.'
                : '백업은 폰 앱에서만 할 수 있어요.'}
            </Text>
          </Group>

          <Group title="구매">
            <Pressable onPress={restore} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
              <Text style={styles.rowLabel}>구매 복원</Text>
              <Text style={styles.rowValue}>›</Text>
            </Pressable>
            {!!notice && <Text style={styles.help}>{notice}</Text>}
          </Group>

          <Group title="도움">
            <Pressable onPress={() => setBugOpen(true)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
              <Text style={styles.rowLabel}>버그 신고하기</Text>
              <Text style={styles.rowValue}>›</Text>
            </Pressable>
            <Text style={styles.help}>이상한 점이 있으면 알려주세요. 메일 앱으로 보내져요.</Text>
          </Group>

          <Group title="정보">
            <View style={styles.row}>
              <Text style={styles.rowLabel}>버전</Text>
              <Text style={styles.rowValue}>{APP_VERSION}</Text>
            </View>
            <Text style={styles.help}>
              책 정보: 카카오 · 영화 정보: TMDB (This product uses the TMDB API but is not endorsed or certified by TMDB.){'\n'}글꼴: Pretendard, 나눔글꼴 (SIL Open Font
              License)
            </Text>
          </Group>
        </ScrollView>
        <BugReport visible={bugOpen} recordCount={records.length} onClose={() => setBugOpen(false)} />
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
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.line },
  off: { color: COLORS.placeholder },
  help: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans, lineHeight: 18, paddingBottom: 10 },
});

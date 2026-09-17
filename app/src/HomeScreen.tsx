import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CATEGORIES, CategoryPicker } from './components/CategoryPicker';
import { Closet } from './components/Closet';
import { COCO_RATIO, Coco } from './components/Coco';
import { BagIcon, DotsIcon, GearIcon, HatIcon } from './components/MenuIcons';
import { OUTFIT_TOP } from './components/Outfits';
import { PrintJob } from './components/Printer';
import { ProductPreview } from './components/ProductPreview';
import { RecordForm } from './components/RecordForm';
import { RollScreen } from './components/RollScreen';
import { Settings } from './components/Settings';
import { Shop } from './components/Shop';
import { WeekStamps, dateKey } from './components/WeekStamps';
import { loadHaptics, tick } from './lib/haptics';
import { PreviewProduct, categoryProduct } from './lib/products';
import { OUTFITS, addOwned, categoryUnlocked, initShop, useShop, wearOutfit } from './lib/shop';
import { loadRecords, saveRecords } from './lib/storage';
import { BRAND, COLORS, FONTS } from './theme';
import { RecoRecord, RecordKind } from './types';

const LOGO_WHITE = require('../assets/logo/recoco-logo-white.png');

const HEADLINE_H = 70; // 대사 두 줄 높이
const MIN_TOP_GAP = 36; // 상단 바와 대사 사이 최소 여백
const COCO_TOP_EMPTY = 34 / 320; // 코코 그림에서 꼭지 위쪽 빈 공간 비율 (모자를 쓰면 더 줄어듦)

// 코코를 누를 때마다 바뀌는 한마디
const POKES = ['간지러워!', '말랑말랑~', '헤헤 또 눌러봐', '영수증 뽑아줄까?', '기록은 내가 챙길게', '만두 아니고 코코야!'];

/** 메인: 한 화면에 코코 + 주간 도장 + 기록 버튼. 영수증 목록은 따로 올라오는 화면 */
export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState<RecoRecord[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [formKind, setFormKind] = useState<RecordKind>('reading');
  const [picking, setPicking] = useState(false);
  const [focusKind, setFocusKind] = useState<RecordKind | null>(null);
  const [printing, setPrinting] = useState<RecoRecord | null>(null);
  const [rollOpen, setRollOpen] = useState(false);
  const [rollDate, setRollDate] = useState<string | null>(null);
  const [cheer, setCheer] = useState(false);
  const [poke, setPoke] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const pokeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [closetOpen, setClosetOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { owned, outfit } = useShop();
  const [gift, setGift] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ kind: RecordKind; product: PreviewProduct } | null>(null);

  useEffect(() => {
    loadRecords().then(setRecords);
    loadHaptics().catch(() => {});
    initShop().catch(() => {});
  }, []);

  const update = useCallback((next: RecoRecord[]) => {
    setRecords(next);
    saveRecords(next).catch(() => {});
  }, []);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of records) map[r.date] = (map[r.date] ?? 0) + 1;
    return map;
  }, [records]);

  const openPicker = () => {
    setFocusKind(null);
    setPicking(true);
  };

  const pickCategory = (kind: RecordKind) => {
    // 새 카테고리는 미리보기에서 사고 나서 연다
    if (!categoryUnlocked(kind, owned)) {
      setPicking(false);
      setPreview({ kind, product: categoryProduct(kind)! });
      return;
    }
    setFormKind(kind);
    setPicking(false);
    setFocusKind(null);
    setFormOpen(true);
  };

  const handleSubmit = (record: RecoRecord) => {
    setFormOpen(false);
    // 시트가 내려간 뒤 출력 시작
    setTimeout(() => setPrinting(record), Platform.OS === 'ios' ? 450 : 250);
  };

  const handleTorn = (record: RecoRecord) => {
    setPrinting(null);
    // 기록한 날짜가 있는 주로 이동해서 도장이 찍히는 걸 보여준다
    const today = new Date();
    const d = new Date(`${record.date}T00:00:00`);
    if (!Number.isNaN(d.getTime())) {
      const sundayToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
      const sundayRecord = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
      setWeekOffset(Math.min(0, Math.round((sundayRecord.getTime() - sundayToday.getTime()) / (7 * 86400000))));
    }
    // 영수증 장수가 보상 기준에 닿으면 모자 선물
    const reward = OUTFITS.find((o) => o.unlock.type === 'reward' && o.unlock.records === records.length + 1);
    setGift(reward ? `${reward.name} 받았다!\n옷장에서 씌워줘` : null);
    setCheer(true);
    setTimeout(() => {
      setCheer(false);
      setGift(null);
    }, reward ? 5000 : 3500);
    update([record, ...records]);
  };

  const handleEdit = useCallback((next: RecoRecord) => update(records.map((r) => (r.id === next.id ? next : r))), [records, update]);
  const handleDelete = useCallback((record: RecoRecord) => update(records.filter((r) => r.id !== record.id)), [records, update]);

  // 코코가 잠깐 한마디 하고 원래 대사로 돌아온다
  const say = (text: string, ms = 1800) => {
    setPoke(text);
    if (pokeTimer.current) clearTimeout(pokeTimer.current);
    pokeTimer.current = setTimeout(() => setPoke(null), ms);
  };
  const pokeCoco = () => say(POKES[Math.floor(Math.random() * POKES.length)]);

  const todayCount = counts[dateKey(new Date())] ?? 0;
  const focusHint = CATEGORIES.find((c) => c.kind === focusKind)?.hint;
  const headline = gift
    ? gift
    : cheer
      ? '영수증 나왔다!\n도장 쾅 찍어줄게'
      : picking
        ? (focusHint ?? '오늘은\n뭘 기록할까?')
        : poke
          ? poke
          : todayCount > 0
            ? `오늘 벌써\n${todayCount}장이나 남겼어!`
            : '오늘 하루도\n영수증으로 남겨볼까?';

  // 모자를 쓰면 그림 위쪽 빈 공간이 줄어든다
  const topEmpty = outfit ? Math.min(COCO_TOP_EMPTY, OUTFIT_TOP[outfit] / 320) : COCO_TOP_EMPTY;
  // 코코는 (대사 + 위쪽 여백)을 뺀 세로 공간을 꽉 채우고, 양옆은 화면 밖으로 살짝 잘릴 만큼 크게
  const cocoSize = stage.width
    ? Math.min((stage.width - 80) * 1.32, (stage.height - HEADLINE_H - MIN_TOP_GAP) / (COCO_RATIO * (1 - topEmpty)))
    : 0;
  // 그림 위쪽의 빈 공간(꼭지 위)만큼 대사를 코코 쪽으로 내려서 딱 붙인다
  const hug = -cocoSize * COCO_RATIO * topEmpty;

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 8 }]}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View>
          <Image source={LOGO_WHITE} style={styles.logo} resizeMode="contain" accessibilityLabel={BRAND.ko} />
          <Text style={styles.count}>모은 영수증 {records.length}장</Text>
        </View>
        <View style={styles.headerBtns}>
          <Pressable
            onPress={() => {
              tick();
              setMenuOpen(!menuOpen);
            }}
            disabled={!!printing}
            accessibilityLabel={menuOpen ? '메뉴 닫기' : '메뉴'}
            style={({ pressed }) => [styles.menuBtn, menuOpen && styles.menuBtnOn, pressed && { transform: [{ scale: 0.92 }] }]}>
            <DotsIcon color={menuOpen ? COLORS.orange : '#fff'} />
          </Pressable>
          <Pressable
            onPress={picking ? () => setPicking(false) : openPicker}
            disabled={!!printing}
            accessibilityLabel={picking ? '카테고리 닫기' : '기록 추가'}
            style={({ pressed }) => [styles.addBtn, pressed && { transform: [{ scale: 0.92 }] }]}>
            <Text style={[styles.addBtnText, picking && { transform: [{ rotate: '45deg' }] }]}>＋</Text>
          </Pressable>
        </View>
      </View>

      {/* 메뉴: 점 세 개를 누르면 아래로 주르륵 */}
      {menuOpen && (
        <>
          <Animated.View entering={FadeIn.duration(150)} style={[StyleSheet.absoluteFill, styles.menuBackdrop]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} accessibilityLabel="메뉴 닫기" />
          </Animated.View>
          <View style={[styles.menu, { top: insets.top + 24 + 48 + 10 }]} pointerEvents="box-none">
            {[
              { label: '상점', icon: BagIcon, open: () => setShopOpen(true) },
              { label: '코코 옷장', icon: HatIcon, open: () => setClosetOpen(true) },
              { label: '설정', icon: GearIcon, open: () => setSettingsOpen(true) },
            ].map((m, i) => (
              <Animated.View key={m.label} entering={FadeInUp.delay(i * 50).springify().damping(15)}>
                <Pressable
                  onPress={() => {
                    setMenuOpen(false);
                    m.open();
                  }}
                  style={({ pressed }) => [styles.menuItem, pressed && { transform: [{ scale: 0.95 }] }]}>
                  <Text style={styles.menuLabel}>{m.label}</Text>
                  <View style={styles.menuIcon}>
                    <m.icon color={COLORS.orange} />
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </>
      )}

      {/* 상단 바와 대사 사이는 비워두고, 대사와 코코는 붙여서 아래쪽에 모은다 */}
      <View style={styles.stage} onLayout={(e) => setStage(e.nativeEvent.layout)}>
        {/* 한 줄 대사여도 코코 바로 위에 붙도록 아래 정렬 */}
        <View style={[styles.headlineBox, { marginBottom: hug }]}>
          <Text style={styles.headline}>{headline}</Text>
        </View>
        {cocoSize > 0 && (
          <Coco
            size={cocoSize}
            tone="white"
            mood={cheer || focusKind ? 'happy' : picking ? 'wow' : 'idle'}
            interactive
            onPress={picking ? undefined : pokeCoco}
            outfit={outfit}
            id="coco-home"
          />
        )}
      </View>

      <WeekStamps
        offset={weekOffset}
        onOffset={setWeekOffset}
        counts={counts}
        selected={null}
        onSelect={(date) => {
          setRollDate(date);
          setRollOpen(true);
        }}
      />

      <View style={styles.bottom}>
        {picking ? (
          <CategoryPicker focused={focusKind} onFocus={setFocusKind} onPick={pickCategory} />
        ) : (
          <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(80)} style={styles.bottomRow}>
            <Pressable
              style={({ pressed }) => [styles.rollBtn, pressed && { opacity: 0.85 }]}
              onPress={() => {
                setRollDate(null);
                setRollOpen(true);
              }}>
              <Text style={styles.rollBtnText}>나의 영수증 {records.length}장 보기</Text>
              <Text style={styles.rollBtnArrow}>›</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>

      {printing && <PrintJob record={printing} rollWidth={Math.min((stage.width - 80) * 0.72, 360) || 280} onDone={handleTorn} onCancel={() => setPrinting(null)} outfit={outfit} />}

      <RollScreen
        visible={rollOpen}
        records={records}
        date={rollDate}
        onClearDate={() => setRollDate(null)}
        onClose={() => setRollOpen(false)}
        onAdd={(kind) => {
          setRollOpen(false);
          // 카테고리를 골라둔 목록이면 바로 그 기록 화면, 전체면 메인의 카테고리 알약
          // (iOS는 모달이 완전히 닫힌 뒤에야 다음 모달이 뜬다)
          setTimeout(() => (kind ? pickCategory(kind) : openPicker()), Platform.OS === 'ios' ? 450 : 50);
        }}
        onSave={handleEdit}
        onDelete={handleDelete}
      />
      <Closet
        visible={closetOpen}
        owned={owned}
        recordCount={records.length}
        outfit={outfit}
        onClose={() => setClosetOpen(false)}
        onWear={wearOutfit}
        onBought={addOwned}
      />
      <Shop
        visible={shopOpen}
        owned={owned}
        onClose={() => setShopOpen(false)}
        onBought={addOwned}
        onOpenCloset={() => {
          setShopOpen(false);
          // 시트가 내려간 뒤 옷장을 연다
          setTimeout(() => setClosetOpen(true), Platform.OS === 'ios' ? 450 : 250);
        }}
      />
      <Settings
        visible={settingsOpen}
        records={records}
        onClose={() => setSettingsOpen(false)}
        onImport={(incoming) => {
          // 같은 영수증(id)은 건너뛰고 합친 뒤 날짜 최신순으로
          const have = new Set(records.map((r) => r.id));
          const added = incoming.filter((r) => !have.has(r.id));
          if (added.length) update([...added, ...records].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)));
          return added.length;
        }}
        onBought={addOwned}
      />
      <ProductPreview
        product={preview?.product ?? null}
        onClose={() => setPreview(null)}
        onBought={() => {
          const kind = preview?.kind;
          setPreview(null);
          // 미리보기 시트가 내려간 뒤 기록 화면
          if (kind) setTimeout(() => pickCategory(kind), Platform.OS === 'ios' ? 450 : 50);
        }}
      />
      <RecordForm visible={formOpen} initialKind={formKind} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.orange, overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 24,
    zIndex: 7, // 메뉴를 열어도 버튼은 어두워지지 않게
  },
  // 로고 원본(523×119) 비율 그대로
  logo: { height: 30, width: (30 * 523) / 119, marginLeft: -2, marginBottom: 2 },
  count: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontFamily: FONTS.sans, marginTop: 2 },
  headerBtns: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnOn: { backgroundColor: '#fff' },
  // 메뉴 버튼(＋ 왼쪽) 바로 아래에 세로로
  menu: { position: 'absolute', right: 22 + 48 + 10, zIndex: 6, alignItems: 'flex-end', gap: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuBackdrop: { zIndex: 5, backgroundColor: 'rgba(60,20,0,0.35)' },
  menuLabel: {
    color: COLORS.ink,
    fontSize: 14,
    fontFamily: FONTS.sansBold,
    backgroundColor: '#fff',
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7a2c00',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  addBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: COLORS.orange, fontSize: 28, lineHeight: 32, fontFamily: FONTS.sansBold },
  headline: {
    color: '#fff',
    fontSize: 25,
    lineHeight: 34,
    textAlign: 'center',
    fontFamily: FONTS.sansHeavy,
  },
  headlineBox: { height: HEADLINE_H, justifyContent: 'flex-end', zIndex: 1 },
  // 코코가 남는 세로 공간을 전부 차지한다
  stage: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6, marginHorizontal: -40 },
  bottom: { minHeight: 92, justifyContent: 'center', marginTop: 8 },
  bottomRow: { paddingHorizontal: 18 },
  rollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 17,
  },
  rollBtnText: { color: '#fff', fontSize: 16, fontFamily: FONTS.sansBold },
  rollBtnArrow: { color: '#fff', fontSize: 26, lineHeight: 26, fontFamily: FONTS.sansBold },
});

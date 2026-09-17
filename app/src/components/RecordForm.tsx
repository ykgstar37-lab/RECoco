import { useEffect, useState, type ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { newId, nowTime, today, won } from '../lib/format';
import { pickPhotos } from '../lib/photos';
import { COLORS, FONTS } from '../theme';
import {
  FourcutFrame,
  FourcutLayout,
  FourcutRecord,
  MovieRecord,
  Photo,
  ReadingRecord,
  ReadingStatus,
  RecoRecord,
  RecordKind,
  SpendingItem,
  SpendingRecord,
  TravelRecord,
} from '../types';
import { DateField } from './DateField';
import { QrImport } from './QrImport';

interface Props {
  visible: boolean;
  /** 메인에서 고른 카테고리로 열기 */
  initialKind?: RecordKind;
  /** 있으면 새로 만들지 않고 이 기록을 고친다 */
  editing?: RecoRecord | null;
  onClose: () => void;
  onSubmit: (record: RecoRecord) => void;
}

const KINDS: { kind: RecordKind; label: string; ready: boolean }[] = [
  { kind: 'reading', label: '독서', ready: true },
  { kind: 'movie', label: '영화', ready: true },
  { kind: 'spending', label: '소비', ready: true },
  { kind: 'travel', label: '여행', ready: true },
  { kind: 'fourcut', label: '인생네컷', ready: true },
];

const FRAMES: { key: FourcutFrame; label: string; color: string }[] = [
  { key: 'white', label: '화이트', color: '#fbfbf9' },
  { key: 'black', label: '블랙', color: '#171717' },
  { key: 'pink', label: '핑크', color: '#f6d9e0' },
  { key: 'sky', label: '물결', color: '#cfe3f6' },
];

/** 레이아웃 미리보기용 사진 칸 (0~1 비율 좌표) */
const LAYOUTS: { key: FourcutLayout; label: string; ratio: number; cells: [number, number, number, number][] }[] = [
  { key: 'strip', label: '1×4 스트립', ratio: 1 / 3, cells: [0, 1, 2, 3].map((i) => [0.08, 0.03 + i * 0.22, 0.84, 0.2]) },
  { key: 'grid', label: '2×2', ratio: 600 / 760, cells: [0, 1, 2, 3].map((i) => [0.06 + (i % 2) * 0.47, 0.05 + Math.floor(i / 2) * 0.44, 0.41, 0.4]) },
  { key: 'wide', label: '가로 2×2', ratio: 900 / 600, cells: [0, 1, 2, 3].map((i) => [0.04 + (i % 2) * 0.44, 0.06 + Math.floor(i / 2) * 0.46, 0.41, 0.42]) },
];

const STATUSES: ReadingStatus[] = ['완독', '읽는 중', '잠시 멈춤'];

const emptyReading = (): Omit<ReadingRecord, 'id' | 'createdAt'> => ({
  kind: 'reading',
  date: today(),
  title: '',
  author: '',
  publisher: '',
  genre: '',
  status: '완독',
  place: '',
  memo: '',
});

const emptyMovie = (): Omit<MovieRecord, 'id' | 'createdAt'> => ({
  kind: 'movie',
  date: today(),
  time: nowTime(),
  title: '',
  originalTitle: '',
  theater: '',
  screen: '',
  seat: '',
  people: 1,
  format: '2D',
  ageRating: '',
  stars: 4,
  runtime: '',
});

const emptyTravel = (): Omit<TravelRecord, 'id' | 'createdAt'> => ({
  kind: 'travel',
  date: today(),
  from: '',
  to: '',
  name: '',
  flight: '',
  seat: '',
  gate: '',
  photos: [null, null, null, null],
});

const emptyFourcut = (): Omit<FourcutRecord, 'id' | 'createdAt'> => ({
  kind: 'fourcut',
  date: today(),
  title: '',
  place: '',
  withWhom: '',
  diary: '',
  source: Platform.OS === 'web' ? 'photos' : 'qr',
  frameImage: null,
  photos: [null, null, null, null],
  layout: 'strip',
  frame: 'white',
  sourceUrl: '',
});

interface ItemDraft {
  name: string;
  qty: string;
  price: string;
}

export function RecordForm({ visible, initialKind, editing, onClose, onSubmit }: Props) {
  const [kind, setKind] = useState<RecordKind>(initialKind ?? 'reading');
  const [reading, setReading] = useState(emptyReading);
  const [movie, setMovie] = useState(emptyMovie);
  const [spending, setSpending] = useState({ date: today(), store: '', category: '', address: '', memo: '' });
  const [items, setItems] = useState<ItemDraft[]>([{ name: '', qty: '1', price: '' }]);
  const [travel, setTravel] = useState(emptyTravel);
  const [fourcut, setFourcut] = useState(emptyFourcut);
  const [qrOpen, setQrOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (!editing) {
      if (initialKind) setKind(initialKind);
      return;
    }
    // 고치기: 기존 기록 내용으로 채운다
    setKind(editing.kind);
    setError('');
    const { id: _id, createdAt: _c, ...rest } = editing;
    switch (rest.kind) {
      case 'reading':
        setReading(rest);
        break;
      case 'movie':
        setMovie(rest);
        break;
      case 'spending':
        setSpending({ date: rest.date, store: rest.store, category: rest.category, address: rest.address, memo: rest.memo });
        setItems(rest.items.map((it) => ({ name: it.name, qty: String(it.qty), price: String(it.price) })));
        break;
      case 'travel':
        setTravel({ ...rest, photos: [0, 1, 2, 3].map((i) => rest.photos[i] ?? null) });
        break;
      case 'fourcut':
        setFourcut({ ...emptyFourcut(), ...rest, photos: [0, 1, 2, 3].map((i) => rest.photos[i] ?? null) });
        break;
    }
  }, [visible, initialKind, editing]);

  const reset = () => {
    setTravel(emptyTravel());
    setFourcut(emptyFourcut());
    setReading(emptyReading());
    setMovie(emptyMovie());
    setSpending({ date: today(), store: '', category: '', address: '', memo: '' });
    setItems([{ name: '', qty: '1', price: '' }]);
    setError('');
  };

  const parsedItems: SpendingItem[] = items
    .filter((it) => it.name.trim())
    .map((it) => ({
      name: it.name.trim(),
      qty: Math.max(1, parseInt(it.qty, 10) || 1),
      price: parseInt(it.price.replace(/[^0-9]/g, ''), 10) || 0,
    }));
  const total = parsedItems.reduce((s, it) => s + it.qty * it.price, 0);

  const submit = () => {
    const base = editing ? { id: editing.id, createdAt: editing.createdAt } : { id: newId(), createdAt: new Date().toISOString() };
    let record: RecoRecord;
    if (kind === 'reading') {
      if (!reading.title.trim()) return setError('책 제목을 적어주세요.');
      record = { ...base, ...reading } as ReadingRecord;
    } else if (kind === 'movie') {
      if (!movie.title.trim()) return setError('영화 제목을 적어주세요.');
      record = { ...base, ...movie } as MovieRecord;
    } else if (kind === 'spending') {
      if (!spending.store.trim()) return setError('어디서 썼는지(상호)를 적어주세요.');
      if (!parsedItems.length) return setError('품목을 하나 이상 적어주세요.');
      record = { ...base, kind: 'spending', ...spending, items: parsedItems } as SpendingRecord;
    } else if (kind === 'travel') {
      if (!travel.from.trim() || !travel.to.trim()) return setError('출발지와 도착지를 적어주세요. (예: ICN → HND)');
      record = { ...base, ...travel } as TravelRecord;
    } else {
      if (fourcut.source === 'qr' && !fourcut.frameImage) {
        return setError('QR로 사진을 가져오거나, "사진 4장 고르기"로 바꿔주세요.');
      }
      if (fourcut.source === 'photos' && !fourcut.photos.some(Boolean)) return setError('사진을 한 장 이상 골라주세요.');
      record = { ...base, ...fourcut } as FourcutRecord;
    }
    onSubmit(record);
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.sheet} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.close}>닫기</Text>
          </Pressable>
          <Text style={styles.title}>{editing ? '기록 고치기' : '무엇을 기록할까요?'}</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kindsScroll} contentContainerStyle={styles.kinds}>
          {KINDS.map((k) => {
            const selected = k.kind === kind;
            return (
              <Pressable
                key={k.kind}
                disabled={!k.ready || (!!editing && k.kind !== kind)}
                onPress={() => {
                  setKind(k.kind as RecordKind);
                  setError('');
                }}
                style={[styles.chip, selected && styles.chipOn, (!k.ready || (!!editing && !selected)) && styles.chipOff]}>
                <Text style={[styles.chipText, selected && styles.chipTextOn]}>{k.label}</Text>
                {!k.ready && <Text style={styles.soon}>준비 중</Text>}
              </Pressable>
            );
          })}
        </ScrollView>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {kind === 'reading' && (
              <>
                <Field label="책 제목 *" value={reading.title} onChange={(v) => setReading({ ...reading, title: v })} placeholder="오디세이아" />
                <Row>
                  <Field label="저자" value={reading.author} onChange={(v) => setReading({ ...reading, author: v })} placeholder="호메로스" />
                  <Field label="출판사" value={reading.publisher} onChange={(v) => setReading({ ...reading, publisher: v })} placeholder="현대지성" />
                </Row>
                <Row>
                  <Field label="분야" value={reading.genre} onChange={(v) => setReading({ ...reading, genre: v })} placeholder="문학 / 인문 / 예술…" />
                  <DateField label="날짜" value={reading.date} onChange={(v) => setReading({ ...reading, date: v })} />
                </Row>
                <Field label="어디서 읽었나요? (서점·도서관·카페 등)" value={reading.place} onChange={(v) => setReading({ ...reading, place: v })} placeholder="교보문고 광화문점" />
                <Label text="상태" />
                <View style={styles.segment}>
                  {STATUSES.map((s) => (
                    <Pressable key={s} onPress={() => setReading({ ...reading, status: s })} style={[styles.seg, reading.status === s && styles.segOn]}>
                      <Text style={[styles.segText, reading.status === s && styles.segTextOn]}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
                <Field label="남기고 싶은 문장 / 한 줄 감상" value={reading.memo} onChange={(v) => setReading({ ...reading, memo: v })} placeholder="돌아갈 곳이 있다는 건…" multiline />
              </>
            )}

            {kind === 'movie' && (
              <>
                <Field label="영화 제목 *" value={movie.title} onChange={(v) => setMovie({ ...movie, title: v })} placeholder="오디세이" />
                <Field label="원제 (선택)" value={movie.originalTitle} onChange={(v) => setMovie({ ...movie, originalTitle: v })} placeholder="Odyssey" />
                <Field label="어디서 봤나요?" value={movie.theater} onChange={(v) => setMovie({ ...movie, theater: v })} placeholder="CGV 강남점 / 롯데시네마 월드타워" />
                <Row>
                  <DateField label="날짜" value={movie.date} onChange={(v) => setMovie({ ...movie, date: v })} />
                  <Field label="시간" value={movie.time} onChange={(v) => setMovie({ ...movie, time: v })} placeholder="19:30" />
                </Row>
                <Row>
                  <Field label="상영관" value={movie.screen} onChange={(v) => setMovie({ ...movie, screen: v })} placeholder="4관" />
                  <Field label="좌석" value={movie.seat} onChange={(v) => setMovie({ ...movie, seat: v })} placeholder="H11" />
                  <Field label="인원" value={String(movie.people)} onChange={(v) => setMovie({ ...movie, people: parseInt(v, 10) || 1 })} keyboardType="number-pad" />
                </Row>
                <Row>
                  <Field label="포맷" value={movie.format} onChange={(v) => setMovie({ ...movie, format: v })} placeholder="2D / IMAX" />
                  <Field label="관람등급" value={movie.ageRating} onChange={(v) => setMovie({ ...movie, ageRating: v })} placeholder="12세이상관람가" />
                  <Field label="러닝타임(분)" value={movie.runtime} onChange={(v) => setMovie({ ...movie, runtime: v.replace(/[^0-9]/g, '') })} keyboardType="number-pad" placeholder="156" />
                </Row>
                <Label text="관람평" />
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable key={n} onPress={() => setMovie({ ...movie, stars: movie.stars === n ? n - 1 : n })} hitSlop={6}>
                      <Text style={[styles.star, n <= movie.stars && styles.starOn]}>{n <= movie.stars ? '★' : '☆'}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {kind === 'spending' && (
              <>
                <Row>
                  <Field label="어디서? (상호) *" value={spending.store} onChange={(v) => setSpending({ ...spending, store: v })} placeholder="달밤커피" />
                  <Field label="종류" value={spending.category} onChange={(v) => setSpending({ ...spending, category: v })} placeholder="카페" />
                </Row>
                <Row>
                  <DateField label="날짜" value={spending.date} onChange={(v) => setSpending({ ...spending, date: v })} />
                  <Field label="비고" value={spending.memo} onChange={(v) => setSpending({ ...spending, memo: v })} placeholder="☕" />
                </Row>
                <Field label="위치 (선택)" value={spending.address} onChange={(v) => setSpending({ ...spending, address: v })} placeholder="서울 마포구 연남동" />
                <Label text="품목" />
                {items.map((it, i) => (
                  <View key={i} style={styles.itemRow}>
                    <TextInput
                      style={[styles.input, { flex: 3 }]}
                      value={it.name}
                      placeholder="아이스 아메리카노"
                      placeholderTextColor={COLORS.placeholder}
                      onChangeText={(v) => setItems(items.map((x, j) => (j === i ? { ...x, name: v } : x)))}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1, textAlign: 'center' }]}
                      value={it.qty}
                      keyboardType="number-pad"
                      onChangeText={(v) => setItems(items.map((x, j) => (j === i ? { ...x, qty: v } : x)))}
                    />
                    <TextInput
                      style={[styles.input, { flex: 2, textAlign: 'right' }]}
                      value={it.price}
                      placeholder="단가"
                      placeholderTextColor={COLORS.placeholder}
                      keyboardType="number-pad"
                      onChangeText={(v) => setItems(items.map((x, j) => (j === i ? { ...x, price: v } : x)))}
                    />
                    <Pressable onPress={() => setItems(items.length > 1 ? items.filter((_, j) => j !== i) : items)} hitSlop={8}>
                      <Text style={styles.remove}>−</Text>
                    </Pressable>
                  </View>
                ))}
                {items.length < 15 && (
                  <Pressable onPress={() => setItems([...items, { name: '', qty: '1', price: '' }])} style={styles.addItem}>
                    <Text style={styles.addItemText}>+ 품목 추가</Text>
                  </Pressable>
                )}
                <Text style={styles.total}>합계 ₩ {won(total)}</Text>
              </>
            )}

            {kind === 'travel' && (
              <>
                <Row>
                  <Field label="출발 *" value={travel.from} onChange={(v) => setTravel({ ...travel, from: v.toUpperCase() })} placeholder="ICN" />
                  <Field label="도착 *" value={travel.to} onChange={(v) => setTravel({ ...travel, to: v.toUpperCase() })} placeholder="HND" />
                  <DateField label="출발일" value={travel.date} onChange={(v) => setTravel({ ...travel, date: v })} />
                </Row>
                <Field label="이름 (영문)" value={travel.name} onChange={(v) => setTravel({ ...travel, name: v })} placeholder="KIM COCO" />
                <Row>
                  <Field label="편명" value={travel.flight} onChange={(v) => setTravel({ ...travel, flight: v })} placeholder="NP 2203" />
                  <Field label="좌석" value={travel.seat} onChange={(v) => setTravel({ ...travel, seat: v })} placeholder="12A" />
                  <Field label="게이트" value={travel.gate} onChange={(v) => setTravel({ ...travel, gate: v })} placeholder="05" />
                </Row>
                <Label text="여행 사진 (0~4장 · 장수에 따라 배치가 바뀌어요)" />
                <PhotoSlots photos={travel.photos} onChange={(photos) => setTravel({ ...travel, photos })} />
              </>
            )}

            {kind === 'fourcut' && (
              <>
                <Label text="앞면 사진" />
                <View style={styles.segment}>
                  {Platform.OS !== 'web' && (
                    <Pressable onPress={() => setFourcut({ ...fourcut, source: 'qr' })} style={[styles.seg, fourcut.source === 'qr' && styles.segOn]}>
                      <Text style={[styles.segText, fourcut.source === 'qr' && styles.segTextOn]}>QR로 가져오기</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={() => setFourcut({ ...fourcut, source: 'photos' })} style={[styles.seg, fourcut.source === 'photos' && styles.segOn]}>
                    <Text style={[styles.segText, fourcut.source === 'photos' && styles.segTextOn]}>사진 4장 고르기</Text>
                  </Pressable>
                </View>
                {fourcut.source === 'qr' ? (
                  <View style={styles.qrBox}>
                    {fourcut.frameImage ? (
                      <Image source={{ uri: fourcut.frameImage.uri }} style={styles.qrPreview} resizeMode="contain" />
                    ) : (
                      <Text style={styles.qrHint}>
                        포토부스에서 받은 QR을 찍으면{'\n'}사진 페이지에서 완성본을 가져와 앞면에 그대로 붙여요.
                      </Text>
                    )}
                    <Pressable onPress={() => setQrOpen(true)} style={styles.qrBtn}>
                      <Text style={styles.qrBtnText}>{fourcut.frameImage ? '다른 사진으로 바꾸기' : 'QR 스캔하기'}</Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <Label text="레이아웃" />
                    <View style={styles.row}>
                      {LAYOUTS.map((l) => {
                        const on = fourcut.layout === l.key;
                        const boxH = 58;
                        const boxW = Math.min(boxH * l.ratio, 76);
                        const h = boxW / l.ratio;
                        return (
                          <Pressable key={l.key} onPress={() => setFourcut({ ...fourcut, layout: l.key })} style={[styles.layoutChip, on && styles.layoutChipOn]}>
                            <View style={{ height: boxH, justifyContent: 'center' }}>
                              <View style={[styles.layoutCard, { width: boxW, height: h }]}>
                                {l.cells.map(([x, y, w, ch], i) => (
                                  <View
                                    key={i}
                                    style={[styles.layoutCell, on && styles.layoutCellOn, { left: x * boxW, top: y * h, width: w * boxW, height: ch * h }]}
                                  />
                                ))}
                              </View>
                            </View>
                            <Text style={styles.layoutText}>{l.label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <Label text="사진 (칸 순서대로 들어가요)" />
                    <PhotoSlots photos={fourcut.photos} onChange={(photos) => setFourcut({ ...fourcut, photos })} />
                    <Label text="프레임" />
                    <View style={styles.row}>
                      {FRAMES.map((f) => (
                        <Pressable
                          key={f.key}
                          onPress={() => setFourcut({ ...fourcut, frame: f.key })}
                          style={[styles.frameChip, fourcut.frame === f.key && styles.frameChipOn]}>
                          <View style={[styles.frameDot, { backgroundColor: f.color }]} />
                          <Text style={styles.segText}>{f.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}
                <Label text="뒷면 — 오늘의 하루" />
                <Field label="오늘의 제목" value={fourcut.title} onChange={(v) => setFourcut({ ...fourcut, title: v })} placeholder="여름의 마지막 네컷" />
                <Row>
                  <Field label="어디서" value={fourcut.place} onChange={(v) => setFourcut({ ...fourcut, place: v })} placeholder="연남동" />
                  <Field label="누구랑" value={fourcut.withWhom} onChange={(v) => setFourcut({ ...fourcut, withWhom: v })} placeholder="지민" />
                  <DateField label="날짜" value={fourcut.date} onChange={(v) => setFourcut({ ...fourcut, date: v })} />
                </Row>
                <Field
                  label="오늘 하루는 어땠나요?"
                  value={fourcut.diary}
                  onChange={(v) => setFourcut({ ...fourcut, diary: v })}
                  placeholder="퇴근하고 만나서 떡볶이 먹고…"
                  multiline
                />
                <QrImport
                  visible={qrOpen}
                  onClose={() => setQrOpen(false)}
                  onPicked={(photo, url) => {
                    setQrOpen(false);
                    setFourcut((f) => ({ ...f, source: 'qr', frameImage: photo, sourceUrl: url }));
                  }}
                />
              </>
            )}

            {!!error && <Text style={styles.error}>{error}</Text>}
          </ScrollView>
        </KeyboardAvoidingView>

        <Pressable onPress={submit} style={({ pressed }) => [styles.submit, pressed && { opacity: 0.85 }]}>
          <Text style={styles.submitText}>{editing ? '고친 내용 저장' : '코코에게 영수증 뽑기'}</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

/** 사진 칸: 빈 칸을 누르면 남은 칸 수만큼 한 번에 고를 수 있다 */
function PhotoSlots({ photos, onChange }: { photos: (Photo | null)[]; onChange: (p: (Photo | null)[]) => void }) {
  const [busy, setBusy] = useState(false);
  const pick = async (index: number) => {
    if (busy) return;
    setBusy(true);
    try {
      const empty = photos.map((p, i) => (p ? -1 : i)).filter((i) => i >= 0);
      const targets = photos[index] ? [index] : [index, ...empty.filter((i) => i !== index)];
      const picked = await pickPhotos(targets.length);
      const next = [...photos];
      picked.forEach((p, k) => (next[targets[k]] = p));
      onChange(next);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={styles.slots}>
      {photos.map((p, i) => (
        <Pressable key={i} onPress={() => pick(i)} style={styles.slot}>
          {p ? (
            <>
              <Image source={{ uri: p.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <Pressable hitSlop={8} style={styles.slotRemove} onPress={() => onChange(photos.map((x, j) => (j === i ? null : x)))}>
                <Text style={styles.slotRemoveText}>×</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.slotText}>+{'\n'}{i + 1}</Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

function Row({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'number-pad' | 'default';
}) {
  return (
    <View style={styles.field}>
      <Label text={label} />
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.placeholder}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14 },
  close: { color: COLORS.sub, fontSize: 15, fontFamily: FONTS.sans },
  title: { color: COLORS.ink, fontSize: 17, fontFamily: FONTS.sansHeavy },
  kindsScroll: { flexGrow: 0 },
  kinds: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  chipOn: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  chipOff: { opacity: 0.45 },
  chipText: { color: COLORS.ink, fontSize: 14, fontFamily: FONTS.sansBold },
  chipTextOn: { color: '#fff' },
  soon: { fontSize: 9, color: COLORS.sub, fontFamily: FONTS.sans, marginTop: 1 },
  body: { paddingHorizontal: 18, paddingBottom: 30, gap: 12 },
  row: { flexDirection: 'row', gap: 10 },
  field: { flex: 1, gap: 6 },
  label: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sansBold },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 11 : 8,
    fontSize: 15,
    color: COLORS.ink,
    fontFamily: FONTS.sans,
  },
  multiline: { minHeight: 84, textAlignVertical: 'top' },
  segment: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 10, padding: 3 },
  seg: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  segOn: { backgroundColor: '#fff' },
  segText: { color: COLORS.sub, fontSize: 14, fontFamily: FONTS.sans },
  segTextOn: { color: COLORS.orange, fontFamily: FONTS.sansBold },
  stars: { flexDirection: 'row', gap: 6 },
  star: { fontSize: 32, color: COLORS.line },
  starOn: { color: COLORS.orange },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  remove: { fontSize: 22, color: COLORS.sub, paddingHorizontal: 4 },
  addItem: { alignSelf: 'flex-start', paddingVertical: 6 },
  addItemText: { color: COLORS.orange, fontSize: 14, fontFamily: FONTS.sansBold },
  total: { textAlign: 'right', color: COLORS.ink, fontSize: 16, fontFamily: FONTS.sansBold },
  error: { color: COLORS.danger, fontSize: 14, fontFamily: FONTS.sansBold },
  slots: { flexDirection: 'row', gap: 8 },
  slot: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  layoutChip: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  layoutChipOn: { borderColor: COLORS.orange, borderWidth: 2 },
  layoutCard: { backgroundColor: COLORS.surface, borderRadius: 3, borderWidth: 1, borderColor: COLORS.line },
  layoutCell: { position: 'absolute', backgroundColor: '#dedee3', borderRadius: 1.5 },
  layoutCellOn: { backgroundColor: COLORS.orange },
  layoutText: { fontSize: 10, color: COLORS.sub, fontFamily: FONTS.sansBold },
  slotText: { color: COLORS.sub, fontSize: 13, fontFamily: FONTS.sansBold, textAlign: 'center' },
  slotRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotRemoveText: { color: '#fff', fontSize: 15, lineHeight: 17 },
  frameChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  frameChipOn: { borderColor: COLORS.orange, borderWidth: 2 },
  frameDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: COLORS.line },
  qrBox: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, gap: 12, alignItems: 'center' },
  qrHint: { color: COLORS.sub, fontSize: 13, fontFamily: FONTS.sans, textAlign: 'center', lineHeight: 20 },
  qrPreview: { width: '100%', height: 220 },
  qrBtn: { backgroundColor: COLORS.orange, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 999 },
  qrBtnText: { color: '#fff', fontSize: 14, fontFamily: FONTS.sansBold },
  submit: {
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
    backgroundColor: COLORS.orange,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 16, fontFamily: FONTS.sansBold },
});

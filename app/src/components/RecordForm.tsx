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
import Svg from 'react-native-svg';

import { newId, nowTime, today, won } from '../lib/format';
import { downloadPhoto, pickPhotos } from '../lib/photos';
import { BookHit, MovieHit, canSearchBooks, canSearchMovies, movieDetail, searchMovies } from '../lib/search';
import { categoryUnlocked, useShop } from '../lib/shop';
import { FOOD_TYPES, REVISIT } from '../templates/FoodOrder';
import { MOVIE_PAPERS } from '../templates/MovieTicket';
import { COLORS, FONTS } from '../theme';
import {
  FoodMenu,
  FoodRecord,
  FoodType,
  FourcutFrame,
  FourcutLayout,
  FourcutRecord,
  GiftCard,
  GiftRecord,
  MoviePaper,
  MovieRecord,
  PaperTheme,
  Photo,
  ReadingRecord,
  ReadingStatus,
  RecoRecord,
  RecordKind,
  SpendingItem,
  SpendingRecord,
  TravelRecord,
} from '../types';
import { AirportField } from './AirportField';
import { BoardingPassScan } from './BoardingPassScan';
import { CouponScan, formatCoupon } from './CouponScan';
import { CardSmsPaste } from './CardSmsPaste';
import { DateField } from './DateField';
import { IsbnScan } from './IsbnScan';
import { DISMISS_ON_DRAG, KEYBOARD_DONE_ID, KeyboardDone } from './KeyboardDone';
import { MovieSmsPaste } from './MovieSmsPaste';
import { QrImport } from './QrImport';
import { QuickFill } from './QuickFill';
import { STICKERS, StickerArt, stickerOf } from './Stickers';
import { TheaterField } from './TheaterField';
import { ThemePicker } from './ThemePicker';
import { TitleSearch } from './TitleSearch';

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
  { kind: 'gift', label: '선물', ready: true },
  { kind: 'food', label: '카페·맛집', ready: true },
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

const MOVIE_PAPER_OPTIONS: { key: MoviePaper; label: string }[] = [
  { key: 'pink', label: '분홍' },
  { key: 'white', label: '흰색' },
];

const GIFT_CARDS: { key: GiftCard; label: string; color: string }[] = [
  { key: 'yellow', label: '노랑', color: '#ffe36b' },
  { key: 'pink', label: '분홍', color: '#ffc9d9' },
  { key: 'mint', label: '민트', color: '#c3ecd9' },
  { key: 'sky', label: '하늘', color: '#cfe2fb' },
];

const GIFT_DIRECTIONS: [GiftRecord['direction'], string][] = [
  ['received', '받은 선물'],
  ['given', '보낸 선물'],
];

const emptyGift = (): Omit<GiftRecord, 'id' | 'createdAt'> => ({
  kind: 'gift',
  date: today(),
  direction: 'received',
  person: '',
  item: '',
  brand: '',
  price: 0,
  message: '',
  photo: null,
  card: 'yellow',
});

const MAX_MENUS = 6;

const emptyFood = (): Omit<FoodRecord, 'id' | 'createdAt'> => ({
  kind: 'food',
  date: today(),
  place: '',
  area: '',
  type: 'cafe',
  withWhom: '',
  menus: [{ name: '', stars: 4 }],
  total: 0,
  revisit: 'yes',
  memo: '',
  photo: null,
});

const STATUSES: ReadingStatus[] = ['완독', '읽는 중', '잠시 멈춤'];
// 상태마다 색: 다 읽음 초록 · 읽는 중 주황 · 멈춤 회색
const STATUS_COLORS: Record<ReadingStatus, { main: string; soft: string }> = {
  완독: { main: '#2e9e6a', soft: '#e2f4ea' },
  '읽는 중': { main: COLORS.orange, soft: COLORS.orangeSoft },
  '잠시 멈춤': { main: '#7b8190', soft: '#e9ebf0' },
};

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
  paper: 'pink' as MoviePaper,
});

const emptySpending = (): { date: string; store: string; category: string; address: string; memo: string; theme?: PaperTheme } => ({
  date: today(),
  store: '',
  category: '',
  address: '',
  memo: '',
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
  const [spending, setSpending] = useState(emptySpending);
  const [items, setItems] = useState<ItemDraft[]>([{ name: '', qty: '1', price: '' }]);
  const [travel, setTravel] = useState(emptyTravel);
  const [fourcut, setFourcut] = useState(emptyFourcut);
  const [gift, setGift] = useState(emptyGift);
  const [food, setFood] = useState(emptyFood);
  const [foodSmsOpen, setFoodSmsOpen] = useState(false);
  const { owned } = useShop();
  const [qrOpen, setQrOpen] = useState(false);
  const [isbnOpen, setIsbnOpen] = useState(false);
  const [smsOpen, setSmsOpen] = useState(false);
  const [passOpen, setPassOpen] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [error, setError] = useState('');
  // 제목을 직접 타이핑하는 동안만 검색 결과를 띄운다
  const [searching, setSearching] = useState(false);

  // 고른 영화로 제목·원제를 채우고, 러닝타임·관람등급은 상세 정보에서 (실패해도 제목은 채워진 채로)
  const fillMovie = (m: MovieHit, keepTitle = false) => {
    setSearching(false);
    const originalTitle = m.originalTitle !== m.title ? m.originalTitle : '';
    setMovie((x) => ({ ...x, title: keepTitle ? x.title : m.title, originalTitle }));
    movieDetail(m.id)
      .then((d) => setMovie((x) => ({ ...x, runtime: d.runtime || x.runtime, ageRating: d.ageRating || x.ageRating })))
      .catch(() => {});
  };

  // 고른 책으로 채우고, 표지는 받아서 앱에 저장 (실패하면 표지 없이)
  const fillBook = (b: BookHit) => {
    setSearching(false);
    setReading((r) => ({ ...r, title: b.title, author: b.author, publisher: b.publisher, cover: null }));
    if (b.cover)
      downloadPhoto(b.cover)
        .then((cover) => setReading((r) => (r.title === b.title ? { ...r, cover } : r)))
        .catch(() => {});
  };

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
        setSpending({ date: rest.date, store: rest.store, category: rest.category, address: rest.address, memo: rest.memo, theme: rest.theme });
        setItems(rest.items.map((it) => ({ name: it.name, qty: String(it.qty), price: String(it.price) })));
        break;
      case 'travel':
        setTravel({ ...rest, photos: [0, 1, 2, 3].map((i) => rest.photos[i] ?? null) });
        break;
      case 'fourcut':
        setFourcut({ ...emptyFourcut(), ...rest, photos: [0, 1, 2, 3].map((i) => rest.photos[i] ?? null) });
        break;
      case 'gift':
        setGift(rest);
        break;
      case 'food':
        setFood({ ...rest, menus: rest.menus.length ? rest.menus : [{ name: '', stars: 4 }] });
        break;
    }
  }, [visible, initialKind, editing]);

  const reset = () => {
    setTravel(emptyTravel());
    setFourcut(emptyFourcut());
    setGift(emptyGift());
    setFood(emptyFood());
    setReading(emptyReading());
    setMovie(emptyMovie());
    setSpending(emptySpending());
    setItems([{ name: '', qty: '1', price: '' }]);
    setError('');
    setSearching(false);
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
      if (!travel.from.trim() || !travel.to.trim()) return setError('출발지와 도착지를 골라주세요. (예: 인천 → 도쿄)');
      record = { ...base, ...travel } as TravelRecord;
    } else if (kind === 'gift') {
      if (!gift.item.trim()) return setError('어떤 선물인지 적어주세요.');
      record = { ...base, ...gift } as GiftRecord;
    } else if (kind === 'food') {
      if (!food.place.trim()) return setError('어느 가게인지 적어주세요.');
      const menus = food.menus.filter((m) => m.name.trim()).map((m) => ({ ...m, name: m.name.trim() }));
      record = { ...base, ...food, menus } as FoodRecord;
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
          {KINDS.filter((k) => k.kind === kind || categoryUnlocked(k.kind, owned)).map((k) => {
            const selected = k.kind === kind;
            return (
              <Pressable
                key={k.kind}
                disabled={!k.ready || (!!editing && k.kind !== kind)}
                onPress={() => {
                  setError('');
                  setSearching(false);
                  setKind(k.kind as RecordKind);
                }}
                style={[styles.chip, selected && styles.chipOn, (!k.ready || (!!editing && !selected)) && styles.chipOff]}>
                <Text style={[styles.chipText, selected && styles.chipTextOn]}>{k.label}</Text>
                {!k.ready && <Text style={styles.soon}>준비 중</Text>}
              </Pressable>
            );
          })}
        </ScrollView>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" keyboardDismissMode={DISMISS_ON_DRAG}>
            {kind === 'reading' && (
              <>
                {canSearchBooks ? (
                  <QuickFill icon="barcode" title="바코드로 책 찾기" sub="뒷표지 바코드를 찍거나 ISBN 숫자를 넣어요" onPress={() => setIsbnOpen(true)} />
                ) : (
                  <MissingKey what="책 검색·바코드" />
                )}
                <Field
                  label="책 제목 *"
                  value={reading.title}
                  onChange={(v) => {
                    setReading({ ...reading, title: v });
                    setSearching(true);
                  }}
                  placeholder="오디세이아"
                />
                <TitleSearch
                  type="book"
                  query={reading.title}
                  active={searching}
                  onDismiss={() => setSearching(false)}
                  onPick={fillBook}
                />
                <View style={styles.coverRow}>
                  <Pressable
                    onPress={async () => {
                      const [p] = await pickPhotos(1);
                      if (p) setReading((r) => ({ ...r, cover: p }));
                    }}
                    style={styles.cover}
                    accessibilityLabel="책 표지 고르기">
                    {reading.cover ? (
                      <>
                        <Image source={{ uri: reading.cover.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                        <Pressable hitSlop={8} style={styles.slotRemove} onPress={() => setReading((r) => ({ ...r, cover: null }))}>
                          <Text style={styles.slotRemoveText}>×</Text>
                        </Pressable>
                      </>
                    ) : (
                      <Text style={styles.slotText}>+{'\n'}표지</Text>
                    )}
                  </Pressable>
                  <Text style={styles.coverHelp}>
                    {reading.cover ? '영수증 왼쪽에 표지가 찍혀요.\n눌러서 다른 사진으로 바꿀 수 있어요.' : '책을 검색하거나 바코드로 찾으면 표지가 자동으로 들어가요.\n직접 사진을 골라도 돼요.'}
                  </Text>
                </View>
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
                  {STATUSES.map((s) => {
                    const on = reading.status === s;
                    const c = STATUS_COLORS[s];
                    return (
                      <Pressable key={s} onPress={() => setReading({ ...reading, status: s })} style={[styles.seg, on && { backgroundColor: c.soft }]}>
                        <View style={styles.statusRow}>
                          <View style={[styles.statusDot, { backgroundColor: c.main, opacity: on ? 1 : 0.55 }]} />
                          <Text style={[styles.segText, on && { color: c.main, fontFamily: FONTS.sansBold }]}>{s}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
                <Field label="남기고 싶은 문장 / 한 줄 감상" value={reading.memo} onChange={(v) => setReading({ ...reading, memo: v })} placeholder="돌아갈 곳이 있다는 건…" multiline />
                <IsbnScan
                  visible={isbnOpen}
                  onClose={() => setIsbnOpen(false)}
                  onFound={(b) => {
                    setIsbnOpen(false);
                    fillBook(b);
                  }}
                />
              </>
            )}

            {kind === 'movie' && (
              <>
                {!canSearchMovies && <MissingKey what="영화 검색" />}
                <QuickFill icon="ticket" title="예매 문자·캡처로 채우기" sub="예매 알림을 붙여넣거나 예매 내역 캡처를 골라요" onPress={() => setBookingOpen(true)} />
                <MovieSmsPaste
                  visible={bookingOpen}
                  onClose={() => setBookingOpen(false)}
                  onFill={(b) => {
                    setBookingOpen(false);
                    setMovie((x) => ({
                      ...x,
                      title: b.title || x.title,
                      theater: b.theater || x.theater,
                      screen: b.screen || x.screen,
                      format: b.format || x.format,
                      date: b.date ?? x.date,
                      time: b.time ?? x.time,
                      seat: b.seat || x.seat,
                      people: b.people || x.people,
                    }));
                    // 제목으로 영화를 찾아 원제·러닝타임·관람등급까지 (문자 속 제목은 그대로 둔다)
                    if (b.title && canSearchMovies)
                      searchMovies(b.title)
                        .then((hits) => {
                          const norm = (t: string) => t.replace(/\s/g, '');
                          const best = hits.find((h) => norm(h.title) === norm(b.title)) ?? hits[0];
                          if (best) fillMovie(best, true);
                        })
                        .catch(() => {});
                  }}
                />
                <Field
                  label="영화 제목 *"
                  value={movie.title}
                  onChange={(v) => {
                    setMovie({ ...movie, title: v });
                    setSearching(true);
                  }}
                  placeholder="오디세이"
                />
                <TitleSearch
                  type="movie"
                  query={movie.title}
                  active={searching}
                  onDismiss={() => setSearching(false)}
                  onPick={(m) => fillMovie(m)}
                />
                <Field label="원제 (선택)" value={movie.originalTitle} onChange={(v) => setMovie({ ...movie, originalTitle: v })} placeholder="Odyssey" />
                <TheaterField value={movie.theater} onChange={(v) => setMovie((m) => ({ ...m, theater: v }))} />
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
                <Label text="티켓 종이" />
                <View style={styles.row}>
                  {MOVIE_PAPER_OPTIONS.map((p) => {
                    const on = (movie.paper ?? 'pink') === p.key;
                    return (
                      <Pressable key={p.key} onPress={() => setMovie({ ...movie, paper: p.key })} style={[styles.frameChip, on && styles.frameChipOn]}>
                        <View style={[styles.frameDot, { backgroundColor: MOVIE_PAPERS[p.key] }]} />
                        <Text style={styles.segText}>{p.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
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
                <QuickFill icon="card" title="결제 문자·알림으로 채우기" sub="승인 문자를 붙여넣거나 결제 알림 캡처를 골라요" onPress={() => setSmsOpen(true)} />
                <CardSmsPaste
                  visible={smsOpen}
                  onClose={() => setSmsOpen(false)}
                  onFill={(pay) => {
                    setSmsOpen(false);
                    setSpending((sp) => ({ ...sp, store: pay.store || sp.store, date: pay.date ?? sp.date }));
                    // 품목이 비어 있으면 결제 한 줄로 채우고, 이미 적어둔 게 있으면 아래에 더한다
                    const line = { name: pay.time ? `${pay.time} 카드 결제` : '카드 결제', qty: '1', price: String(pay.amount) };
                    setItems((all) => (all.every((it) => !it.name.trim() && !it.price.trim()) ? [line] : [...all, line]));
                  }}
                />
                <Row>
                  <Field label="어디서? (상호) *" value={spending.store} onChange={(v) => setSpending({ ...spending, store: v })} placeholder="달밤커피" />
                  <Field label="종류" value={spending.category} onChange={(v) => setSpending({ ...spending, category: v })} placeholder="카페" />
                </Row>
                <Row>
                  <DateField label="날짜" value={spending.date} onChange={(v) => setSpending({ ...spending, date: v })} />
                  <Field label="위치 (선택)" value={spending.address} onChange={(v) => setSpending({ ...spending, address: v })} placeholder="연남동" />
                </Row>
                <Label text="비고 스티커 (다시 누르면 빼기)" />
                <View style={styles.stickers}>
                  {STICKERS.map((st) => {
                    const on = stickerOf(spending.memo)?.emoji === st.emoji;
                    return (
                      <Pressable
                        key={st.emoji}
                        onPress={() => setSpending({ ...spending, memo: on ? '' : st.emoji })}
                        style={[styles.sticker, on && styles.stickerOn]}
                        accessibilityLabel={`${st.label} 스티커`}>
                        <Svg width={34} height={34} viewBox="0 0 48 48">
                          <StickerArt emoji={st.emoji} />
                        </Svg>
                      </Pressable>
                    );
                  })}
                </View>
                {!stickerOf(spending.memo) && (
                  <Field label="또는 짧게 적기" value={spending.memo} onChange={(v) => setSpending({ ...spending, memo: v })} placeholder="선물용" />
                )}
                <Label text="품목" />
                {items.map((it, i) => (
                  <View key={i} style={styles.itemRow}>
                    <TextInput
                      inputAccessoryViewID={KEYBOARD_DONE_ID}
                      style={[styles.input, { flex: 3 }]}
                      value={it.name}
                      placeholder="아이스 아메리카노"
                      placeholderTextColor={COLORS.placeholder}
                      onChangeText={(v) => setItems(items.map((x, j) => (j === i ? { ...x, name: v } : x)))}
                    />
                    <TextInput
                      inputAccessoryViewID={KEYBOARD_DONE_ID}
                      style={[styles.input, { flex: 1, textAlign: 'center' }]}
                      value={it.qty}
                      keyboardType="number-pad"
                      onChangeText={(v) => setItems(items.map((x, j) => (j === i ? { ...x, qty: v } : x)))}
                    />
                    <TextInput
                      inputAccessoryViewID={KEYBOARD_DONE_ID}
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
                <ThemePicker label="영수증 종이" base="spending" value={spending.theme} onChange={(theme) => setSpending((sp) => ({ ...sp, theme }))} />
              </>
            )}

            {kind === 'travel' && (
              <>
                <QuickFill icon="ticket" title="탑승권 바코드로 채우기" sub="모바일·종이 탑승권을 찍으면 공항·편명·좌석이 자동으로" onPress={() => setPassOpen(true)} />
                <BoardingPassScan
                  visible={passOpen}
                  onClose={() => setPassOpen(false)}
                  onFound={(bp) => {
                    setPassOpen(false);
                    setTravel((t) => ({
                      ...t,
                      from: bp.from,
                      to: bp.to,
                      name: bp.name || t.name,
                      flight: bp.flight || t.flight,
                      seat: bp.seat || t.seat,
                      date: bp.date ?? t.date,
                    }));
                  }}
                />
                <Row>
                  <AirportField label="출발 *" value={travel.from} onChange={(v) => setTravel((t) => ({ ...t, from: v }))} placeholder="인천 / ICN" />
                  <AirportField label="도착 *" value={travel.to} onChange={(v) => setTravel((t) => ({ ...t, to: v }))} placeholder="도쿄 / HND" />
                </Row>
                <Row>
                  <DateField label="출발일" value={travel.date} onChange={(v) => setTravel({ ...travel, date: v })} />
                  <Field label="이름 (영문)" value={travel.name} onChange={(v) => setTravel({ ...travel, name: v })} placeholder="KIM COCO" />
                </Row>
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
                <ThemePicker label="뒷면 종이" base="fourcut" value={fourcut.theme} onChange={(theme) => setFourcut((f) => ({ ...f, theme }))} />
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

            {kind === 'gift' && (
              <>
                <QuickFill
                  icon="barcode"
                  title={gift.couponCode ? `교환권 번호 ${formatCoupon(gift.couponCode)}` : '교환권 바코드 찍기'}
                  sub={gift.couponCode ? '다시 누르면 새로 찍어요' : '진짜 교환권 번호가 영수증 바코드 아래에 찍혀요'}
                  onPress={() => setCouponOpen(true)}
                />
                <CouponScan
                  visible={couponOpen}
                  onClose={() => setCouponOpen(false)}
                  onFound={(code) => {
                    setCouponOpen(false);
                    setGift((g) => ({ ...g, couponCode: code }));
                  }}
                />
                <View style={styles.segment}>
                  {GIFT_DIRECTIONS.map(([key, text]) => (
                    <Pressable key={key} onPress={() => setGift({ ...gift, direction: key })} style={[styles.seg, gift.direction === key && styles.segOn]}>
                      <Text style={[styles.segText, gift.direction === key && styles.segTextOn]}>{text}</Text>
                    </Pressable>
                  ))}
                </View>
                <Row>
                  <Field
                    label={gift.direction === 'received' ? '보낸 사람' : '받는 사람'}
                    value={gift.person}
                    onChange={(v) => setGift({ ...gift, person: v })}
                    placeholder="지민"
                  />
                  <DateField label={gift.direction === 'received' ? '받은 날' : '보낸 날'} value={gift.date} onChange={(v) => setGift({ ...gift, date: v })} />
                </Row>
                <Field label="어떤 선물? *" value={gift.item} onChange={(v) => setGift({ ...gift, item: v })} placeholder="아이스 아메리카노 2잔" />
                <Row>
                  <Field label="브랜드·교환처" value={gift.brand} onChange={(v) => setGift({ ...gift, brand: v })} placeholder="달밤커피" />
                  <Field
                    label="금액 (선택)"
                    value={gift.price ? String(gift.price) : ''}
                    onChange={(v) => setGift({ ...gift, price: parseInt(v.replace(/[^0-9]/g, ''), 10) || 0 })}
                    keyboardType="number-pad"
                    placeholder="9000"
                  />
                </Row>
                <Field label="메시지" value={gift.message} onChange={(v) => setGift({ ...gift, message: v })} placeholder="시험 끝난 거 축하해!" multiline />
                <Label text="선물 사진 (선택)" />
                <View style={styles.row}>
                  <Pressable
                    onPress={async () => {
                      const [p] = await pickPhotos(1);
                      if (p) setGift((g) => ({ ...g, photo: p }));
                    }}
                    style={styles.giftPhoto}>
                    {gift.photo ? (
                      <>
                        <Image source={{ uri: gift.photo.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                        <Pressable hitSlop={8} style={styles.slotRemove} onPress={() => setGift((g) => ({ ...g, photo: null }))}>
                          <Text style={styles.slotRemoveText}>×</Text>
                        </Pressable>
                      </>
                    ) : (
                      <Text style={styles.slotText}>+</Text>
                    )}
                  </Pressable>
                </View>
                <Label text="카드 색" />
                <View style={styles.row}>
                  {GIFT_CARDS.map((c) => (
                    <Pressable key={c.key} onPress={() => setGift({ ...gift, card: c.key })} style={[styles.frameChip, gift.card === c.key && styles.frameChipOn]}>
                      <View style={[styles.frameDot, { backgroundColor: c.color }]} />
                      <Text style={styles.segText}>{c.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {kind === 'food' && (
              <>
                <QuickFill icon="card" title="결제 문자·알림으로 채우기" sub="가게 이름·날짜·금액을 한 번에" onPress={() => setFoodSmsOpen(true)} />
                <CardSmsPaste
                  visible={foodSmsOpen}
                  onClose={() => setFoodSmsOpen(false)}
                  onFill={(pay) => {
                    setFoodSmsOpen(false);
                    setFood((f) => ({ ...f, place: pay.store || f.place, date: pay.date ?? f.date, total: pay.amount || f.total }));
                  }}
                />
                <View style={styles.segment}>
                  {(Object.entries(FOOD_TYPES) as [FoodType, string][]).map(([key, text]) => (
                    <Pressable key={key} onPress={() => setFood({ ...food, type: key })} style={[styles.seg, food.type === key && styles.segOn]}>
                      <Text style={[styles.segText, food.type === key && styles.segTextOn]}>{text}</Text>
                    </Pressable>
                  ))}
                </View>
                <Row>
                  <Field label="가게 이름 *" value={food.place} onChange={(v) => setFood({ ...food, place: v })} placeholder="달밤커피" />
                  <DateField label="날짜" value={food.date} onChange={(v) => setFood({ ...food, date: v })} />
                </Row>
                <Row>
                  <Field label="위치 (선택)" value={food.area} onChange={(v) => setFood({ ...food, area: v })} placeholder="연남동" />
                  <Field label="누구랑? (선택)" value={food.withWhom} onChange={(v) => setFood({ ...food, withWhom: v })} placeholder="지민" />
                </Row>
                <Label text="먹은 메뉴와 맛" />
                {food.menus.map((m, i) => {
                  const setMenu = (next: Partial<FoodMenu>) => setFood((f) => ({ ...f, menus: f.menus.map((x, j) => (j === i ? { ...x, ...next } : x)) }));
                  return (
                    <View key={i} style={styles.menuRow}>
                      <TextInput
                        inputAccessoryViewID={KEYBOARD_DONE_ID}
                        style={[styles.input, { flex: 1 }]}
                        value={m.name}
                        placeholder={i ? '바스크 치즈케이크' : '아이스 라떼'}
                        placeholderTextColor={COLORS.placeholder}
                        onChangeText={(v) => setMenu({ name: v })}
                      />
                      <View style={styles.menuStars}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Pressable key={n} onPress={() => setMenu({ stars: m.stars === n ? n - 1 : n })} hitSlop={3} accessibilityLabel={`별 ${n}개`}>
                            <Text style={[styles.menuStar, n <= m.stars && styles.starOn]}>{n <= m.stars ? '★' : '☆'}</Text>
                          </Pressable>
                        ))}
                      </View>
                      <Pressable
                        onPress={() => setFood((f) => ({ ...f, menus: f.menus.length > 1 ? f.menus.filter((_, j) => j !== i) : [{ name: '', stars: 4 }] }))}
                        hitSlop={8}>
                        <Text style={styles.remove}>−</Text>
                      </Pressable>
                    </View>
                  );
                })}
                {food.menus.length < MAX_MENUS && (
                  <Pressable onPress={() => setFood((f) => ({ ...f, menus: [...f.menus, { name: '', stars: 4 }] }))} style={styles.addItem}>
                    <Text style={styles.addItemText}>+ 메뉴 추가</Text>
                  </Pressable>
                )}
                <Row>
                  <Field
                    label="모두 얼마? (선택)"
                    value={food.total ? String(food.total) : ''}
                    onChange={(v) => setFood({ ...food, total: parseInt(v.replace(/[^0-9]/g, ''), 10) || 0 })}
                    keyboardType="number-pad"
                    placeholder="12500"
                  />
                  <View style={styles.field}>
                    <Label text="사진 (선택)" />
                    <Pressable
                      onPress={async () => {
                        const [p] = await pickPhotos(1);
                        if (p) setFood((f) => ({ ...f, photo: p }));
                      }}
                      style={styles.foodPhoto}>
                      {food.photo ? (
                        <>
                          <Image source={{ uri: food.photo.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                          <Pressable hitSlop={8} style={styles.slotRemove} onPress={() => setFood((f) => ({ ...f, photo: null }))}>
                            <Text style={styles.slotRemoveText}>×</Text>
                          </Pressable>
                        </>
                      ) : (
                        <Text style={styles.slotText}>+ 사진</Text>
                      )}
                    </Pressable>
                  </View>
                </Row>
                <Label text="또 갈래요?" />
                <View style={styles.segment}>
                  {REVISIT.map(([key, text]) => (
                    <Pressable key={key} onPress={() => setFood({ ...food, revisit: key })} style={[styles.seg, food.revisit === key && styles.segOn]}>
                      <Text style={[styles.segText, food.revisit === key && styles.segTextOn]}>{text}</Text>
                    </Pressable>
                  ))}
                </View>
                <Field label="한 줄 후기 (포스트잇에 적혀요)" value={food.memo} onChange={(v) => setFood({ ...food, memo: v })} placeholder="치즈케이크 꾸덕해서 또 먹고 싶다" multiline />
              </>
            )}

            {!!error && <Text style={styles.error}>{error}</Text>}
          </ScrollView>
          {/* 키보드가 올라와도 버튼이 가려지지 않게 KeyboardAvoidingView 안에 둔다 */}
          <Pressable onPress={submit} style={({ pressed }) => [styles.submit, pressed && { opacity: 0.85 }]}>
            <Text style={styles.submitText}>{editing ? '고친 내용 저장' : '코코에게 영수증 뽑기'}</Text>
          </Pressable>
        </KeyboardAvoidingView>
        <KeyboardDone />
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

/** 개발 중에만: 검색 키가 앱에 안 들어갔을 때 알려준다 (출시 빌드에서는 조용히 숨김) */
function MissingKey({ what }: { what: string }) {
  if (!__DEV__) return null;
  return <Text style={styles.missingKey}>개발 안내: {what} 키가 없어요. app/.env.local 을 넣은 뒤 개발 서버를 껐다 켜주세요 (npx expo start --clear).</Text>;
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
        inputAccessoryViewID={KEYBOARD_DONE_ID}
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
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  stickers: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sticker: { width: 52, height: 52, borderRadius: 14, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  stickerOn: { borderColor: COLORS.orange, backgroundColor: COLORS.orangeSoft },
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
  coverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cover: {
    width: 64,
    height: 92,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverHelp: { flex: 1, color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans, lineHeight: 18 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuStars: { flexDirection: 'row' },
  menuStar: { fontSize: 20, color: COLORS.line, paddingHorizontal: 1 },
  foodPhoto: {
    height: Platform.OS === 'ios' ? 42 : 38,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftPhoto: {
    width: 96,
    height: 96,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingKey: { color: COLORS.danger, fontSize: 12, fontFamily: FONTS.sans, lineHeight: 18 },
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

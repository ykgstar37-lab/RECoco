import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { BookHit, MovieHit, canSearchBooks, canSearchMovies, searchBooks, searchMovies } from '../lib/search';
import { COLORS, FONTS } from '../theme';

type Props =
  | { type: 'book'; query: string; active: boolean; onPick: (hit: BookHit) => void; onDismiss: () => void }
  | { type: 'movie'; query: string; active: boolean; onPick: (hit: MovieHit) => void; onDismiss: () => void };

/** 제목 칸 아래에 뜨는 검색 결과. 입력을 멈추면 잠깐 뒤에 찾는다 */
export function TitleSearch(props: Props) {
  const { type, query, active, onDismiss } = props;
  const [hits, setHits] = useState<(BookHit | MovieHit)[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const enabled = type === 'book' ? canSearchBooks : canSearchMovies;
  const q = query.trim();

  useEffect(() => {
    if (!enabled || !active || !q) {
      setHits([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setFailed(false);
      try {
        setHits(type === 'book' ? await searchBooks(q, ctrl.signal) : await searchMovies(q, ctrl.signal));
      } catch {
        if (!ctrl.signal.aborted) setFailed(true);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 450);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [enabled, active, q, type]);

  if (!enabled || !active || !q) return null;

  return (
    <View style={styles.box}>
      <View style={styles.head}>
        <Text style={styles.headText}>{type === 'book' ? '책 찾기' : '영화 찾기'}</Text>
        {loading && <ActivityIndicator size="small" color={COLORS.orange} />}
        <View style={{ flex: 1 }} />
        <Pressable onPress={onDismiss} hitSlop={8}>
          <Text style={styles.dismiss}>직접 적을게요</Text>
        </Pressable>
      </View>
      {failed && <Text style={styles.note}>지금은 검색이 안 돼요. 직접 적어주세요.</Text>}
      {!loading && !failed && hits.length === 0 && <Text style={styles.note}>찾는 결과가 없어요.</Text>}
      {hits.map((h) => {
        const book = type === 'book' ? (h as BookHit) : null;
        const movie = type === 'movie' ? (h as MovieHit) : null;
        const image = book ? book.thumbnail : movie!.poster;
        const sub = book
          ? [book.author, book.publisher, book.year].filter(Boolean).join(' · ')
          : [movie!.year, movie!.originalTitle !== movie!.title ? movie!.originalTitle : ''].filter(Boolean).join(' · ');
        return (
          <Pressable
            key={String(h.id)}
            onPress={() => (props.type === 'book' ? props.onPick(h as BookHit) : props.onPick(h as MovieHit))}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: COLORS.orangeSoft }]}>
            {image ? <Image source={{ uri: image }} style={styles.thumb} /> : <View style={styles.thumb} />}
            <View style={{ flex: 1 }}>
              <Text numberOfLines={2} style={styles.title}>
                {h.title}
              </Text>
              {!!sub && (
                <Text numberOfLines={1} style={styles.sub}>
                  {sub}
                </Text>
              )}
            </View>
          </Pressable>
        );
      })}
      {type === 'movie' && hits.length > 0 && <Text style={styles.credit}>영화 정보 제공: TMDB</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: COLORS.line, paddingVertical: 6, marginTop: -4 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6 },
  headText: { color: COLORS.orange, fontSize: 12, fontFamily: FONTS.sansBold },
  dismiss: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans },
  note: { color: COLORS.sub, fontSize: 13, fontFamily: FONTS.sans, paddingHorizontal: 12, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 7 },
  thumb: { width: 34, height: 50, borderRadius: 4, backgroundColor: COLORS.surface },
  title: { color: COLORS.ink, fontSize: 14, fontFamily: FONTS.sansBold },
  sub: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans, marginTop: 2 },
  credit: { color: COLORS.placeholder, fontSize: 10, fontFamily: FONTS.sans, textAlign: 'right', paddingHorizontal: 12, paddingTop: 4 },
});

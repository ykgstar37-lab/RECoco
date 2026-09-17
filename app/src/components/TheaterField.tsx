import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { THEATER_CHAINS, TheaterHit, canSearchBooks, searchTheaters } from '../lib/search';
import { COLORS, FONTS } from '../theme';

interface Props {
  value: string;
  onChange: (theater: string) => void;
}

const OTHER = '직접 입력';

/** 저장된 값에서 체인과 지점 부분을 나눈다 (예: "CGV 강남" → CGV / 강남) */
function split(value: string): { chain: string | null; branch: string } {
  const v = value.trim();
  if (!v) return { chain: null, branch: '' };
  const chain = THEATER_CHAINS.find((c) => v.replace(/\s/g, '').startsWith(c));
  if (!chain) return { chain: OTHER, branch: v };
  // 체인 이름 글자 사이 띄어쓰기는 있어도 없어도 되게
  const prefix = new RegExp(`^${chain.split('').join('\\s*')}`);
  return { chain, branch: v.replace(prefix, '').trim() };
}

/** 영화관: 체인을 먼저 고르고, 지역을 치면 카카오 지도에서 지점을 찾아 보여준다 */
export function TheaterField({ value, onChange }: Props) {
  const initial = split(value);
  const [chain, setChain] = useState<string | null>(initial.chain);
  const [branch, setBranch] = useState(initial.branch);
  const [typing, setTyping] = useState(false);
  const [hits, setHits] = useState<TheaterHit[]>([]);
  const [loading, setLoading] = useState(false);
  // 지도 검색이 막혀 있으면(키 설정 등) 조용히 직접 입력만
  const [unavailable, setUnavailable] = useState(false);

  // 이 칸이 내보낸 값이 아니라 바깥에서 바뀐 값(고치기로 열기, 폼 초기화)일 때만 다시 나눈다
  const emitted = useRef(value);
  const emit = (v: string) => {
    emitted.current = v;
    onChange(v);
  };
  useEffect(() => {
    if (value === emitted.current) return;
    emitted.current = value;
    const next = split(value);
    setChain(next.chain);
    setBranch(next.branch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const q = branch.trim();
  const searchable = !!chain && chain !== OTHER && canSearchBooks && !unavailable;

  useEffect(() => {
    if (!searchable || !typing || !q) {
      setHits([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        setHits(await searchTheaters(chain!, q, ctrl.signal));
      } catch {
        if (!ctrl.signal.aborted) setUnavailable(true);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [searchable, typing, q, chain]);

  const pickChain = (c: string) => {
    setChain(c);
    setHits([]);
    emit(c === OTHER ? branch : `${c} ${branch}`.trim());
  };

  const type = (t: string) => {
    setTyping(true);
    setBranch(t);
    emit(chain && chain !== OTHER ? `${chain} ${t}`.trim() : t);
  };

  const pick = (h: TheaterHit) => {
    setTyping(false);
    setHits([]);
    setBranch(split(h.name).branch);
    emit(h.name);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>어디서 봤나요?</Text>
      <View style={styles.chains}>
        {[...THEATER_CHAINS, OTHER].map((c) => {
          const on = chain === c;
          return (
            <Pressable key={c} onPress={() => pickChain(c)} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{c}</Text>
            </Pressable>
          );
        })}
      </View>
      {chain && (
        <TextInput
          style={styles.input}
          value={branch}
          onChangeText={type}
          onBlur={() => setTimeout(() => setTyping(false), 200)}
          placeholder={chain === OTHER ? '영화관 이름 (예: 동네 독립영화관)' : '지역이나 지점 (예: 강남, 월드타워)'}
          placeholderTextColor={COLORS.placeholder}
        />
      )}
      {searchable && typing && !!q && (
        <View style={styles.box}>
          {loading && hits.length === 0 ? (
            <ActivityIndicator style={{ padding: 10 }} color={COLORS.orange} />
          ) : hits.length === 0 ? (
            <Text style={styles.note}>찾는 지점이 없어요. 적은 그대로 저장돼요.</Text>
          ) : (
            hits.slice(0, 6).map((h) => (
              <Pressable key={h.id} onPress={() => pick(h)} style={({ pressed }) => [styles.row, pressed && { backgroundColor: COLORS.orangeSoft }]}>
                <Text style={styles.name}>{h.name}</Text>
                <Text style={styles.address} numberOfLines={1}>
                  {h.address}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sansBold },
  chains: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: COLORS.surface },
  chipOn: { backgroundColor: COLORS.orange },
  chipText: { color: COLORS.ink, fontSize: 13, fontFamily: FONTS.sansBold },
  chipTextOn: { color: '#fff' },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 11 : 8,
    fontSize: 15,
    color: COLORS.ink,
    fontFamily: FONTS.sans,
  },
  box: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: COLORS.line, paddingVertical: 4 },
  row: { paddingHorizontal: 12, paddingVertical: 9, gap: 2 },
  name: { color: COLORS.ink, fontSize: 14, fontFamily: FONTS.sansBold },
  address: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans },
  note: { color: COLORS.sub, fontSize: 13, fontFamily: FONTS.sans, padding: 10 },
});

import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { airportOf, findAirports } from '../lib/airports';
import { COLORS, FONTS } from '../theme';

interface Props {
  label: string;
  /** 공항 코드 (예: ICN) */
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
}

const isCode = (t: string) => /^[A-Za-z]{0,4}$/.test(t.trim());

/** 공항: "인천"·"도쿄"처럼 한글로 치면 공항 코드 후보가 뜨고, 영문 코드는 그대로 입력 */
export function AirportField({ label, value, onChange, placeholder }: Props) {
  const [text, setText] = useState(value);
  const [focused, setFocused] = useState(false);

  // 고치기로 열거나 폼이 비워질 때 바깥 값에 맞춘다
  useEffect(() => {
    if (!focused) setText(value);
  }, [value, focused]);

  // 한글로 치는 중이면(아직 코드가 아니면) 포커스와 상관없이 후보를 보여준다
  const hits = focused || !isCode(text) ? findAirports(text) : [];
  const picked = airportOf(value);

  const type = (t: string) => {
    if (isCode(t)) {
      const code = t.trim().toUpperCase();
      setText(code);
      onChange(code);
    } else {
      setText(t);
    }
  };

  const pick = (code: string) => {
    setText(code);
    onChange(code);
    setFocused(false);
  };

  const blur = () => {
    // 한글로 쳐놓고 안 골랐으면 가장 가까운 공항으로
    setTimeout(() => {
      setFocused(false);
      if (!isCode(text)) {
        const best = findAirports(text, 1)[0];
        if (best) pick(best.code);
        else setText(value);
      }
    }, 150);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={type}
        onFocus={() => setFocused(true)}
        onBlur={blur}
        placeholder={placeholder}
        placeholderTextColor={COLORS.placeholder}
        autoCorrect={false}
      />
      <Text style={styles.city} numberOfLines={1}>
        {picked ? `${picked.city} · ${picked.name}` : value ? '목록에 없는 코드' : '도시 이름으로 찾기'}
      </Text>
      {hits.length > 0 && !(hits.length === 1 && hits[0].code === value) && (
        <View style={styles.box}>
          {hits.map((a) => (
            <Pressable key={a.code} onPress={() => pick(a.code)} style={({ pressed }) => [styles.row, pressed && { backgroundColor: COLORS.orangeSoft }]}>
              <Text style={styles.code}>{a.code}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {a.city} {a.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  city: { color: COLORS.sub, fontSize: 11, fontFamily: FONTS.sans, marginTop: -2, paddingHorizontal: 2 },
  box: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: COLORS.line, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8 },
  code: { color: COLORS.orange, fontSize: 14, fontFamily: FONTS.sansHeavy, width: 36 },
  name: { flex: 1, color: COLORS.ink, fontSize: 13, fontFamily: FONTS.sans },
});

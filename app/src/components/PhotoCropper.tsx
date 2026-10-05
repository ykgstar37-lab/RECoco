// 사진 자르기: 양식의 사진 칸 모양 그대로인 틀 안에서 사진을 끌어 옮기고, 두 손가락(또는 ＋/－)으로 키운다.
// 원본은 건드리지 않고 "쓸 자리"(photo.crop, 원본 픽셀 좌표)만 돌려준다 → 나중에 고치기에서 다시 맞출 수 있다.
import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FREE_ASPECTS } from '../lib/photoSlots';
import { COLORS, FONTS } from '../theme';
import { Photo, PhotoCrop } from '../types';

const MAX_ZOOM = 6;

interface Props {
  /** 자를 사진 (null 이면 닫힘) */
  photo: Photo | null;
  /** 틀 모양 (세로/가로). free 면 처음 비율일 뿐 바꿀 수 있다 */
  aspect: number;
  /** 비율 고르기 줄을 보여줄지 (일상처럼 칸이 넓게 열려 있을 때) */
  free?: boolean;
  /** 여러 장을 차례로 자를 때 '2/4' 같은 표시 */
  step?: string;
  onDone: (photo: Photo) => void;
  onCancel: () => void;
}

export function PhotoCropper({ photo, aspect, free = false, step, onDone, onCancel }: Props) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  // free 모드: null = 원본 비율 그대로 (자르지 않음)
  const [choice, setChoice] = useState<number | null>(aspect);

  const pw = photo?.width || 1;
  const ph = photo?.height || 1;
  const a = free && choice === null ? ph / pw : (choice ?? aspect);

  // 틀 크기: 화면 폭에 맞추되 너무 길면 높이에 맞춘다
  let fw = screenW - 40;
  let fh = fw * a;
  const maxH = screenH * 0.56;
  if (fh > maxH) {
    fh = maxH;
    fw = fh / a;
  }
  const base = Math.max(fw / pw, fh / ph); // 확대 1배 = 틀을 꽉 채우는 크기

  const k = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const start = useSharedValue({ k: 1, tx: 0, ty: 0 });

  // 열 때: 전에 잘라 둔 자리가 있으면 거기서 시작
  useEffect(() => {
    if (!photo) return;
    setChoice(free && !photo.crop ? null : aspect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo]);

  useEffect(() => {
    if (!photo) return;
    const c = photo.crop;
    const sameShape = c && Math.abs(c.height / c.width - a) < 0.02;
    if (c && sameShape) {
      const scale = fw / c.width;
      k.value = Math.max(1, scale / base);
      tx.value = (pw / 2 - (c.x + c.width / 2)) * scale;
      ty.value = (ph / 2 - (c.y + c.height / 2)) * scale;
    } else {
      k.value = 1;
      tx.value = 0;
      ty.value = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo, a]);

  /** 사진이 틀 밖으로 빠져 빈틈이 생기지 않게 옮길 수 있는 범위 */
  const clamp = (v: number, scale: number, frame: number, size: number) => {
    'worklet';
    const room = Math.max(0, (size * base * scale - frame) / 2);
    return Math.min(room, Math.max(-room, v));
  };

  const pan = Gesture.Pan()
    .onStart(() => {
      start.value = { k: k.value, tx: tx.value, ty: ty.value };
    })
    .onUpdate((e) => {
      tx.value = clamp(start.value.tx + e.translationX, k.value, fw, pw);
      ty.value = clamp(start.value.ty + e.translationY, k.value, fh, ph);
    });
  const pinch = Gesture.Pinch()
    .onStart(() => {
      start.value = { k: k.value, tx: tx.value, ty: ty.value };
    })
    .onUpdate((e) => {
      k.value = Math.min(MAX_ZOOM, Math.max(1, start.value.k * e.scale));
      tx.value = clamp(tx.value, k.value, fw, pw);
      ty.value = clamp(ty.value, k.value, fh, ph);
    });

  const zoomBy = (f: number) => {
    const next = Math.min(MAX_ZOOM, Math.max(1, k.value * f));
    k.value = withTiming(next, { duration: 160 });
    tx.value = withTiming(clamp(tx.value, next, fw, pw), { duration: 160 });
    ty.value = withTiming(clamp(ty.value, next, fh, ph), { duration: 160 });
  };

  const imgStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: k.value }],
  }));

  const done = () => {
    if (!photo) return;
    if (free && choice === null) return onDone({ ...photo, crop: null }); // 원본 그대로
    const scale = base * k.value;
    const w = Math.min(pw, fw / scale);
    const h = Math.min(ph, fh / scale);
    const cx = pw / 2 - tx.value / scale;
    const cy = ph / 2 - ty.value / scale;
    const crop: PhotoCrop = {
      x: Math.round(Math.min(pw - w, Math.max(0, cx - w / 2))),
      y: Math.round(Math.min(ph - h, Math.max(0, cy - h / 2))),
      width: Math.round(w),
      height: Math.round(h),
    };
    onDone({ ...photo, crop });
  };

  return (
    <Modal visible={!!photo} animationType="fade" presentationStyle="fullScreen" onRequestClose={onCancel}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
          <View style={styles.top}>
            <Pressable onPress={onCancel} hitSlop={10}>
              <Text style={styles.cancel}>{step ? '건너뛰기' : '취소'}</Text>
            </Pressable>
            <Text style={styles.title}>칸에 맞게 자르기{step ? ` · ${step}` : ''}</Text>
            <Pressable onPress={done} hitSlop={10}>
              <Text style={styles.done}>완료</Text>
            </Pressable>
          </View>

          <View style={styles.stage}>
            {photo && (
              <GestureDetector gesture={Gesture.Simultaneous(pan, pinch)}>
                <View style={[styles.frame, { width: fw, height: fh }]}>
                  <Animated.View
                    style={[
                      { position: 'absolute', left: (fw - pw * base) / 2, top: (fh - ph * base) / 2, width: pw * base, height: ph * base },
                      imgStyle,
                    ]}>
                    <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} resizeMode="stretch" />
                  </Animated.View>
                  {/* 삼등분 안내선 */}
                  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                    {[1, 2].map((i) => (
                      <View key={`v${i}`} style={[styles.guide, { left: (fw * i) / 3, top: 0, bottom: 0, width: StyleSheet.hairlineWidth }]} />
                    ))}
                    {[1, 2].map((i) => (
                      <View key={`h${i}`} style={[styles.guide, { top: (fh * i) / 3, left: 0, right: 0, height: StyleSheet.hairlineWidth }]} />
                    ))}
                  </View>
                </View>
              </GestureDetector>
            )}
          </View>

          <View style={styles.bottom}>
            {free && (
              <View style={styles.aspects}>
                {FREE_ASPECTS.map((o) => {
                  const on = o.value === choice || (o.value !== null && choice !== null && Math.abs(o.value - choice) < 0.01);
                  return (
                    <Pressable key={o.label} onPress={() => setChoice(o.value)} style={[styles.aspect, on && styles.aspectOn]}>
                      <Text style={[styles.aspectText, on && styles.aspectTextOn]}>{o.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            <View style={styles.zoomRow}>
              <Pressable onPress={() => zoomBy(1 / 1.25)} style={styles.zoom} accessibilityLabel="작게">
                <Text style={styles.zoomText}>－</Text>
              </Pressable>
              <Text style={styles.hint}>끌어서 옮기고, 두 손가락으로 키워요</Text>
              <Pressable onPress={() => zoomBy(1.25)} style={styles.zoom} accessibilityLabel="크게">
                <Text style={styles.zoomText}>＋</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#141414' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  cancel: { color: '#cfcfcf', fontSize: 16, fontFamily: FONTS.sans },
  title: { color: '#fff', fontSize: 16, fontFamily: FONTS.sansHeavy },
  done: { color: COLORS.orange, fontSize: 16, fontFamily: FONTS.sansHeavy },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { overflow: 'hidden', borderRadius: 6, borderWidth: 2, borderColor: '#fff', backgroundColor: '#000' },
  guide: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.45)' },
  bottom: { paddingHorizontal: 20, paddingBottom: 18, gap: 14 },
  aspects: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  aspect: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: '#555' },
  aspectOn: { backgroundColor: '#fff', borderColor: '#fff' },
  aspectText: { color: '#ddd', fontSize: 13, fontFamily: FONTS.sansBold },
  aspectTextOn: { color: '#141414' },
  zoomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  zoom: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  zoomText: { color: '#fff', fontSize: 20, fontFamily: FONTS.sansBold },
  hint: { color: '#9a9a9a', fontSize: 13, fontFamily: FONTS.sans },
});

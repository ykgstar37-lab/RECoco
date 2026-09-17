import { Asset, requestPermissionsAsync } from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

export const canCapture = true;

/** 화면의 카드(영수증 + 배경)를 PNG 파일로 굽는다 */
function capture(ref: RefObject<View | null>) {
  return captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
}

export async function shareCard(ref: RefObject<View | null>) {
  const uri = await capture(ref);
  if (!(await Sharing.isAvailableAsync())) throw new Error('sharing-unavailable');
  await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '영수증 공유하기', UTI: 'public.png' });
}

export async function saveCard(ref: RefObject<View | null>) {
  const perm = await requestPermissionsAsync(true, ['photo']);
  if (!perm.granted) throw new Error('permission-denied');
  const uri = await capture(ref);
  await Asset.create(uri);
}

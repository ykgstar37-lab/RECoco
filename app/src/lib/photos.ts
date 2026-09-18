import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Image, Platform } from 'react-native';

import { Photo } from '../types';
import { newId } from './format';

const isNative = Platform.OS !== 'web';

export function photoDir() {
  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

const extOf = (uri: string, fallback = 'jpg') => {
  const m = /\.(jpe?g|png|heic|webp|gif)(?:\?|#|$)/i.exec(uri);
  return (m?.[1] ?? fallback).toLowerCase();
};

export function getImageSize(uri: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) =>
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject),
  );
}

/** 갤러리/캐시에 있는 사진을 앱 전용 폴더로 복사 (갤러리에서 지워져도 기록은 남도록) */
export async function persistPhoto(uri: string, width: number, height: number): Promise<Photo> {
  if (!isNative) return { uri, width, height };
  const dest = new File(photoDir(), `${newId()}.${extOf(uri)}`);
  await new File(uri).copy(dest);
  return { uri: dest.uri, width, height };
}

/**
 * 갤러리에서 사진 고르기.
 * 고른 뒤 앱 폴더로 옮기는 데 시간이 걸려서, 앨범이 닫히는 순간 onPicked 로 알려준다
 * (그때부터 칸에 도는 표시를 띄우면 멈춘 것처럼 보이지 않는다).
 */
export async function pickPhotos(limit: number, onPicked?: (count: number) => void): Promise<Photo[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    quality: 0.85,
  });
  if (result.canceled) return [];
  const assets = result.assets.slice(0, limit);
  onPicked?.(assets.length);
  return Promise.all(assets.map((a) => persistPhoto(a.uri, a.width, a.height)));
}

/** QR 페이지에서 찾은 원격 이미지 저장 */
export async function downloadPhoto(url: string): Promise<Photo> {
  if (!isNative) {
    const size = await getImageSize(url);
    return { uri: url, ...size };
  }
  const dest = new File(photoDir(), `${newId()}.${extOf(url)}`);
  const file = await File.downloadFileAsync(url, dest, { idempotent: true });
  const size = await getImageSize(file.uri);
  return { uri: file.uri, ...size };
}

/** 웹뷰 안에서 blob:/data: 이미지를 base64로 넘겨받은 경우 */
export async function saveBase64Photo(base64: string, mime: string): Promise<Photo> {
  const ext = mime.includes('png') ? 'png' : 'jpg';
  if (!isNative) {
    const uri = `data:${mime};base64,${base64}`;
    return { uri, ...(await getImageSize(uri)) };
  }
  const dest = new File(photoDir(), `${newId()}.${ext}`);
  dest.create({ overwrite: true });
  dest.write(base64, { encoding: 'base64' });
  const size = await getImageSize(dest.uri);
  return { uri: dest.uri, ...size };
}

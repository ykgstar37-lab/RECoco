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

/** 기록 안의 모든 사진 uri 를 바꾼다 ({ uri, width, height } 모양이면 사진으로 본다) */
export function mapPhotos(value: unknown, fn: (uri: string) => string): unknown {
  if (Array.isArray(value)) return value.map((v) => mapPhotos(v, fn));
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.uri === 'string' && typeof obj.width === 'number') return { ...obj, uri: fn(obj.uri) };
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, mapPhotos(v, fn)]));
  }
  return value;
}

/**
 * 앱 사진 폴더를 가리키는 uri 를 지금 폴더로 다시 잇는다.
 * iOS 는 앱을 업데이트하면 앱 폴더 경로(…/Application/<UUID>/Documents)를 바꿀 수 있는데,
 * 기록에는 저장할 때의 전체 경로가 들어 있어서 그대로 두면 업데이트 뒤 사진·책 표지가 전부 안 보인다.
 */
export function relinkPhotos<T>(records: T): T {
  if (!isNative) return records;
  const base = photoDir().uri.replace(/\/?$/, '/');
  return mapPhotos(records, (uri) => {
    const m = /^file:.*\/Documents\/photos\/([^/]+)$/.exec(uri);
    return m && !uri.startsWith(base) ? base + m[1] : uri;
  }) as T;
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

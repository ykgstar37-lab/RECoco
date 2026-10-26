// 가벼운 백업: 기록 + 사진을 JSON 파일 하나로 내보내고(공유 시트로 파일·드라이브·카톡 등에 저장), 그 파일을 다시 불러온다.
// 구매 내역은 넣지 않는다 (스토어의 구매 복원으로 받는다).
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { RecoRecord } from '../types';
import { newId } from './format';
import { mapPhotos, photoDir } from './photos';

export const canBackup = Platform.OS !== 'web';

const PHOTO_REF = 'recoco-photo:';

interface BackupFile {
  app: 'recoco';
  version: 1;
  exportedAt: string;
  records: RecoRecord[];
  /** 사진 이름 → base64 */
  photos: Record<string, string>;
}

const stamp = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');

export async function exportBackup(records: RecoRecord[]) {
  const photos: Record<string, string> = {};
  const packed = mapPhotos(records, (uri) => {
    if (!uri.startsWith('file:')) return uri; // 원격 주소 등은 그대로
    const file = new File(uri);
    if (!file.exists) return uri;
    const name = uri.split('/').pop() ?? `${newId()}.jpg`;
    photos[name] = file.base64Sync();
    return PHOTO_REF + name;
  }) as RecoRecord[];

  const backup: BackupFile = { app: 'recoco', version: 1, exportedAt: new Date().toISOString(), records: packed, photos };
  const out = new File(Paths.cache, `recoco-backup-${stamp()}.json`);
  out.create({ overwrite: true });
  out.write(JSON.stringify(backup));
  await Sharing.shareAsync(out.uri, { mimeType: 'application/json', dialogTitle: '레코코 백업 저장', UTI: 'public.json' });
}

export class BadBackup extends Error {}

/** 백업 파일을 골라 기록을 돌려준다. 고르지 않으면 null */
export async function pickBackup(): Promise<RecoRecord[] | null> {
  const picked = await File.pickFileAsync({ mimeTypes: '*/*' });
  if (picked.canceled) return null;
  let data: BackupFile;
  try {
    data = JSON.parse(await picked.result.text());
  } catch {
    throw new BadBackup();
  }
  if (data?.app !== 'recoco' || !Array.isArray(data.records)) throw new BadBackup();

  const dir = photoDir();
  const saved: Record<string, string> = {};
  return mapPhotos(data.records, (uri) => {
    if (!uri.startsWith(PHOTO_REF)) return uri;
    const name = uri.slice(PHOTO_REF.length);
    if (saved[name]) return saved[name];
    const base64 = data.photos?.[name];
    if (!base64) return uri;
    const ext = name.split('.').pop() ?? 'jpg';
    const dest = new File(dir, `${newId()}.${ext}`);
    dest.create({ overwrite: true });
    dest.write(base64, { encoding: 'base64' });
    saved[name] = dest.uri;
    return dest.uri;
  }) as RecoRecord[];
}

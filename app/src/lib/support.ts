// 버그 신고: 앱 안에서 바로 보내면 구글 Apps Script(웹 앱)가 받아서 메일로 전달한다.
// 설정 방법은 docs/버그신고_메일_설정.md
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

/** 신고가 도착하는 메일 (Apps Script 쪽 TO 와 같게) */
export const SUPPORT_EMAIL = 'yge0307@gmail.com';
export const APP_VERSION = '1.0.0';

const REPORT_URL = process.env.EXPO_PUBLIC_REPORT_URL ?? '';
const REPORT_KEY = process.env.EXPO_PUBLIC_REPORT_KEY ?? '';
export const canReport = !!REPORT_URL;

export const BUG_TYPES = ['앱이 멈춰요', '화면이 이상해요', '기록이 사라졌어요', '결제·구매', '기타'] as const;
export const MAX_REPORT_PHOTOS = 3;

export interface ReportPhoto {
  uri: string;
  base64: string;
  mime: string;
}

/** 신고에 붙일 스크린샷 고르기 (메일 첨부 용량을 줄이려고 화질을 낮춘다) */
export async function pickReportPhotos(limit: number): Promise<ReportPhoto[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    quality: 0.5,
    base64: true,
  });
  if (result.canceled) return [];
  return result.assets
    .filter((a) => a.base64)
    .slice(0, limit)
    .map((a) => ({ uri: a.uri, base64: a.base64!.replace(/^data:[^,]+,/, ''), mime: a.mimeType ?? 'image/jpeg' }));
}

export async function sendBugReport(report: { type: string; detail: string; contact: string; photos: ReportPhoto[]; recordCount: number }) {
  if (!REPORT_URL) throw new Error('report-url-missing');
  const payload = {
    key: REPORT_KEY,
    type: report.type,
    detail: report.detail.trim(),
    contact: report.contact.trim(),
    version: APP_VERSION,
    device: `${Platform.OS} ${Platform.Version}`,
    recordCount: report.recordCount,
    photos: report.photos.map((p, i) => ({ name: `screenshot-${i + 1}.${p.mime.includes('png') ? 'png' : 'jpg'}`, mime: p.mime, base64: p.base64 })),
  };
  // text/plain 으로 보내야 웹에서도 사전 요청(CORS) 없이 Apps Script 로 간다
  const res = await fetch(REPORT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(`report ${res.status}`);
  const data = await res.json().catch(() => ({ ok: true }));
  if (!data.ok) throw new Error(`report ${data.error ?? 'failed'}`);
}

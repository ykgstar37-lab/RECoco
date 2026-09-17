import { Linking, Platform } from 'react-native';

/** 버그 신고를 받을 메일 주소 */
export const SUPPORT_EMAIL = 'ykgstar37@gmail.com';
export const APP_VERSION = '1.0.0';

export const BUG_TYPES = ['앱이 멈춰요', '화면이 이상해요', '기록이 사라졌어요', '결제·구매', '기타'] as const;

/** 메일 앱을 열어 신고 내용을 채운다. 열 수 없으면 false */
export async function sendBugReport(type: string, detail: string, recordCount: number) {
  const subject = `[레코코 버그 신고] ${type}`;
  const body = [
    detail.trim() || '(내용 없음)',
    '',
    '---',
    `앱 버전: ${APP_VERSION}`,
    `기기: ${Platform.OS} ${Platform.Version}`,
    `모은 영수증: ${recordCount}장`,
  ].join('\n');
  const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

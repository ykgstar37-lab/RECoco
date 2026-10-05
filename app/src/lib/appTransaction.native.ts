// iOS: 이 애플 계정이 레코코를 **처음 받은 빌드 번호** (StoreKit AppTransaction.originalAppVersion).
// 앱을 지웠다 다시 깔아도, 폰을 바꿔도 애플 계정에 남는다 → 무료판부터 쓴 사람을 가려내는 가장 확실한 근거.
//
// ⚠️ originalAppVersion 은 '1.0.0' 같은 표시 버전이 아니라 CFBundleVersion(빌드 번호)이다.
// ⚠️ TestFlight·샌드박스에서는 늘 '1.0' 으로 온다 → 실제 스토어(Production)에서 받은 값만 믿는다.
// 한 번 받으면 폰에 적어 둔다 (오프라인이거나 iOS 16 미만이면 못 받을 수 있어서).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAppTransactionIOS } from 'expo-iap';
import { Platform } from 'react-native';

const KEY = 'recoco.firstBuild.v1';

/** 처음 받은 빌드 번호. 안드로이드·못 받음·테스트 환경이면 null */
export async function firstBuildIOS(): Promise<number | null> {
  if (Platform.OS !== 'ios') return null;
  try {
    const saved = await AsyncStorage.getItem(KEY);
    if (saved) return Number(saved) || null;
  } catch {
    // 못 읽으면 애플에 다시 묻는다
  }
  try {
    const tx = await getAppTransactionIOS();
    if (!tx || String(tx.environment).toLowerCase() !== 'production') return null;
    const build = parseInt(tx.originalAppVersion, 10);
    if (!Number.isFinite(build)) return null;
    AsyncStorage.setItem(KEY, String(build)).catch(() => {});
    return build;
  } catch {
    return null; // iOS 16 미만 · 네트워크 없음 등
  }
}

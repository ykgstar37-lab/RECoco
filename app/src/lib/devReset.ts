// 개발용: 폰을 처음 상태로 (스토어 스크린샷 찍기 전에 쓴다). __DEV__ 빌드의 설정에만 버튼이 보인다.
// 기록·받은 상품·옷·소분류·첫 실행 날짜·사진 파일까지 전부 지우고, 예시 기록도 다시 넣지 않는다(빈 상태).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DevSettings, Platform } from 'react-native';

import { photoDir } from './photos';

export async function resetEverything() {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('recoco.'));
  await AsyncStorage.multiRemove(keys);
  // 첫 실행 때 깔리는 예시 기록 7장도 안 넣는다 (스크린샷은 내 기록으로 찍으니까)
  await AsyncStorage.setItem('recoco.seeded.v1', '1');
  if (Platform.OS !== 'web') {
    try {
      photoDir().delete();
    } catch {
      // 폴더가 없으면 그만
    }
  }
  // 앱 안에 들고 있던 상태(기록·상점)도 비우려면 다시 켜는 게 제일 깔끔하다
  if (Platform.OS === 'web') window.location.reload();
  else DevSettings.reload();
}

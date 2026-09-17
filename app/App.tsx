import { NanumGothic_400Regular, NanumGothic_700Bold, NanumGothic_800ExtraBold } from '@expo-google-fonts/nanum-gothic';
import { NanumGothicCoding_400Regular, NanumGothicCoding_700Bold } from '@expo-google-fonts/nanum-gothic-coding';
import { NanumMyeongjo_400Regular, NanumMyeongjo_700Bold } from '@expo-google-fonts/nanum-myeongjo';
import { NanumPenScript_400Regular } from '@expo-google-fonts/nanum-pen-script';
import { SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HomeScreen } from './src/HomeScreen';
import { COLORS } from './src/theme';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    NanumGothic_400Regular,
    NanumGothic_700Bold,
    NanumGothic_800ExtraBold,
    NanumGothicCoding_400Regular,
    NanumGothicCoding_700Bold,
    NanumMyeongjo_400Regular,
    NanumMyeongjo_700Bold,
    NanumPenScript_400Regular,
    SpaceMono_700Bold,
    'Pretendard-Regular': require('./assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-SemiBold': require('./assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('./assets/fonts/Pretendard-Bold.otf'),
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.orange }}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <HomeScreen />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

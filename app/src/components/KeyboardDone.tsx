import { InputAccessoryView, Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, FONTS } from '../theme';

/** 글자 칸에 inputAccessoryViewID={KEYBOARD_DONE_ID} 를 주면 아이폰 키보드 위에 "완료" 막대가 붙는다 */
export const KEYBOARD_DONE_ID = 'recoco-keyboard-done';

/** 화면(Modal)마다 한 번 그려둔다. 안드로이드는 뒤로가기로 키보드가 내려가서 필요 없음 */
export function KeyboardDone() {
  if (Platform.OS !== 'ios') return null;
  return (
    <InputAccessoryView nativeID={KEYBOARD_DONE_ID}>
      <View style={styles.bar}>
        <Pressable onPress={() => Keyboard.dismiss()} hitSlop={10} style={styles.done} accessibilityLabel="키보드 닫기">
          <Text style={styles.doneText}>완료</Text>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

/** 목록을 끌어내리면 키보드도 같이 내려가게 */
export const DISMISS_ON_DRAG = Platform.OS === 'ios' ? ('interactive' as const) : ('on-drag' as const);

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f2f2f4',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.line,
  },
  done: { paddingHorizontal: 12, paddingVertical: 4 },
  doneText: { color: COLORS.orange, fontSize: 16, fontFamily: FONTS.sansBold },
});

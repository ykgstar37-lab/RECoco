// 코코 그림(CocoArt)만 렌더링할 때 쓰는 최소한의 가짜 모듈 (실제로 호출되지는 않음)
const noop = () => {};
module.exports = {
  __esModule: true,
  default: { View: 'div' },
  Platform: { OS: 'web' },
  Pressable: 'div',
  useAnimatedStyle: () => ({}),
  useSharedValue: (v) => ({ value: v }),
  withSequence: noop,
  withSpring: noop,
  withTiming: noop,
  selectionAsync: async () => {},
  impactAsync: async () => {},
  ImpactFeedbackStyle: {},
};

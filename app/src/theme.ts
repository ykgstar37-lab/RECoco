// 앱 이름: RECoco - 레코코 (영수증·티켓 헤더와 네컷 로고에 찍힘)
export const BRAND = {
  en: 'RECoco',
  ko: '레코코',
};
export const APP_NAME = BRAND.en;

// expo-google-fonts 로 로드되는 폰트 이름
export const FONTS = {
  sans: 'NanumGothic_400Regular',
  sansBold: 'NanumGothic_700Bold',
  sansHeavy: 'NanumGothic_800ExtraBold',
  mono: 'NanumGothicCoding_400Regular',
  monoBold: 'NanumGothicCoding_700Bold',
  serif: 'NanumMyeongjo_400Regular',
  serifBold: 'NanumMyeongjo_700Bold',
  hand: 'NanumPenScript_400Regular',
  code: 'SpaceMono_700Bold',
} as const;

export const COLORS = {
  desk: '#e4dfd6',
  deskDark: '#d5cfc4',
  printer: '#2b2a2e',
  printerLight: '#3a393e',
  ink: '#1c1c1f',
  sub: '#6f6a62',
  accent: '#c8553d',
};

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

// 앱 화면(UI)은 흰 배경 + 코코 주황 포인트로 단순하게
export const COLORS = {
  bg: '#ffffff',
  surface: '#f5f5f6',
  line: '#ececee',
  ink: '#1f1f22',
  sub: '#8b8b91',
  placeholder: '#b8b8bd',
  orange: '#ff7a2f',
  orangeSoft: '#fff1e7',
  danger: '#e5484d',
};

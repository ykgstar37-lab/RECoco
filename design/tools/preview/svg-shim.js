// react-native-svg -> plain DOM svg elements, so app templates can be rendered with react-dom/server
const React = require('react');

// expo-google-fonts family names -> real font family + weight (for resvg)
const FONT_MAP = {
  NanumGothic_400Regular: ['NanumGothic', 400],
  NanumGothic_700Bold: ['NanumGothic', 700],
  NanumGothic_800ExtraBold: ['NanumGothicExtraBold', 800],
  NanumGothicCoding_400Regular: ['NanumGothicCoding', 400],
  NanumGothicCoding_700Bold: ['NanumGothicCoding', 700],
  NanumMyeongjo_400Regular: ['NanumMyeongjo', 400],
  NanumMyeongjo_700Bold: ['NanumMyeongjo', 700],
  NanumPenScript_400Regular: ['Nanum Pen', 400],
  SpaceMono_700Bold: ['Space Mono', 700],
};

function fix(props) {
  const p = { ...props };
  if (p.fontFamily && FONT_MAP[p.fontFamily]) {
    const [fam, w] = FONT_MAP[p.fontFamily];
    p.fontFamily = fam;
    if (!p.fontWeight) p.fontWeight = String(w);
  }
  if (p.href && typeof p.href === 'object') p.href = p.href.uri;
  if (typeof p.href === 'number') p.href = String(p.href);
  delete p.onPress;
  return p;
}

const make = (tag) => {
  const C = (props) => React.createElement(tag, fix(props));
  C.displayName = tag;
  return C;
};

const Svg = (props) => React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', ...fix(props) });
module.exports = {
  __esModule: true,
  default: Svg,
  Svg,
  G: make('g'),
  Path: make('path'),
  Rect: make('rect'),
  Circle: make('circle'),
  Ellipse: make('ellipse'),
  Line: make('line'),
  Polygon: make('polygon'),
  Polyline: make('polyline'),
  Text: make('text'),
  TSpan: make('tspan'),
  Defs: make('defs'),
  ClipPath: make('clipPath'),
  Pattern: make('pattern'),
  Image: make('image'),
  LinearGradient: make('linearGradient'),
  RadialGradient: make('radialGradient'),
  Stop: make('stop'),
  Mask: make('mask'),
};

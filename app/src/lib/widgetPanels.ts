// 홈 화면 스크린샷에서 하얀 위젯 판(흰 사각형)을 찾는 함수 — 웹뷰(캔버스) 안에서 돌린다 (components/WidgetBgSetup.tsx).
// Hermes 는 함수 소스를 안 남겨서 문자열로 둔다.
// findPanels(data, w, h): data 는 RGBA 픽셀. 돌려주는 값: [{ x, y, w, h }] (픽셀, 위에서 아래·왼쪽에서 오른쪽 순)
export const FIND_PANELS_JS = `
function findPanels(data, w, h) {
  var step = Math.max(1, Math.round(w / 300));
  var gw = Math.floor(w / step), gh = Math.floor(h / step);
  var white = function (x, y) {
    var i = (y * w + x) * 4;
    return data[i] >= 246 && data[i + 1] >= 246 && data[i + 2] >= 246;
  };
  var mask = new Uint8Array(gw * gh);
  for (var gy = 0; gy < gh; gy++) for (var gx = 0; gx < gw; gx++) mask[gy * gw + gx] = white(gx * step, gy * step) ? 1 : 0;
  var seen = new Uint8Array(gw * gh);
  var out = [];
  var queue = new Int32Array(gw * gh);
  for (var s = 0; s < gw * gh; s++) {
    if (!mask[s] || seen[s]) continue;
    var head = 0, tail = 0, minx = gw, maxx = 0, miny = gh, maxy = 0, count = 0;
    queue[tail++] = s;
    seen[s] = 1;
    while (head < tail) {
      var p = queue[head++], px = p % gw, py = (p - px) / gw;
      count++;
      if (px < minx) minx = px;
      if (px > maxx) maxx = px;
      if (py < miny) miny = py;
      if (py > maxy) maxy = py;
      var nb = [px > 0 ? p - 1 : -1, px < gw - 1 ? p + 1 : -1, py > 0 ? p - gw : -1, py < gh - 1 ? p + gw : -1];
      for (var k = 0; k < 4; k++) {
        var q = nb[k];
        if (q >= 0 && mask[q] && !seen[q]) {
          seen[q] = 1;
          queue[tail++] = q;
        }
      }
    }
    var bw = maxx - minx + 1, bh = maxy - miny + 1;
    if (bw < gw * 0.3 || bh < gw * 0.3 || count < bw * bh * 0.5) continue;
    // 판은 네 변이 곧은 흰 띠다 (모서리 둥근 부분은 빼고 본다)
    var r = Math.ceil(Math.min(bw, bh) * 0.15);
    var edge = function (fx) {
      var n = 0, ok = 0;
      for (var t = r; t <= (fx.len - 1 - r); t++) {
        n++;
        if (fx.at(t)) ok++;
      }
      return n > 0 && ok / n > 0.9;
    };
    var m = 2;
    var straight =
      edge({ len: bh, at: function (t) { return mask[(miny + t) * gw + minx + m]; } }) &&
      edge({ len: bh, at: function (t) { return mask[(miny + t) * gw + maxx - m]; } }) &&
      edge({ len: bw, at: function (t) { return mask[(miny + m) * gw + minx + t]; } }) &&
      edge({ len: bw, at: function (t) { return mask[(maxy - m) * gw + minx + t]; } });
    if (!straight) continue;
    // 원래 해상도에서 가운데 줄을 바깥에서 안으로 훑어 정확한 가장자리를 찾는다
    var cy = Math.round(((miny + maxy) / 2) * step), cx = Math.round(((minx + maxx) / 2) * step);
    var lx = Math.max(0, (minx - 1) * step), rx = Math.min(w - 1, (maxx + 1) * step + step);
    var ty = Math.max(0, (miny - 1) * step), by = Math.min(h - 1, (maxy + 1) * step + step);
    while (lx < rx && !white(lx, cy)) lx++;
    while (rx > lx && !white(rx, cy)) rx--;
    // 위아래는 왼쪽 곧은 띠 쪽 세로줄로 (가운데는 내용이 있을 수 있다)
    var ex = lx + Math.round((rx - lx) * 0.5);
    while (ty < by && !white(ex, ty)) ty++;
    while (by > ty && !white(ex, by)) by--;
    out.push({ x: lx, y: ty, w: rx - lx + 1, h: by - ty + 1 });
  }
  out.sort(function (a, b) { return a.y - b.y || a.x - b.x; });
  return out;
}
`;

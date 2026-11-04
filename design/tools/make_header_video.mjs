// 앱스토어 헤더 동영상 (3840×1646, 30fps, 10초, 끝과 처음이 이어지게)
// node make_header_video.mjs <out.mp4> [poster.png]
// 볼 빵빵 덜덜 → 입 벌려 영수증 뱉기 → 다 나오면 떨림이 멎음 → 영수증을 놓고 활짝 웃으며 위로 날아감 → 영수증만 남음 → 처음으로
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import ffmpeg from 'ffmpeg-static';

import { H, W, frame, render } from './make_header.mjs';

const FPS = 30;
const SECONDS = 10;
const GAG = 0.9; // 볼 빵빵하게 참는 시간
const PRINT = 6.9; // 다 나오는 시각
const CALM = 0.35; // 떨림이 잦아드는 시간
const TEAR = 7.9; // 영수증을 놓는 시각
const RISE = [8.15, 9.2]; // 코코가 위로 떠올라 사라지는 동안
const RISE_PX = 1300;
const ZOOM = 1.45; // 영수증이 나올 때 입으로 당겨 보는 배율
const ZOOM_IN = [GAG - 0.2, GAG + 1.4]; // 이 사이에 당기고
const ZOOM_OUT = [PRINT - 1.9, PRINT - 0.1]; // 이 사이에 원래 크기로

const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);

const zoomAt = (t) => {
  const k = t < ZOOM_OUT[0] ? ease(clamp((t - ZOOM_IN[0]) / (ZOOM_IN[1] - ZOOM_IN[0]))) : 1 - ease(clamp((t - ZOOM_OUT[0]) / (ZOOM_OUT[1] - ZOOM_OUT[0])));
  return 1 + (ZOOM - 1) * k;
};

function at(t) {
  return { ...pose(t), zoom: zoomAt(t) };
}

function pose(t) {
  const shake = t * Math.PI * 2 * 7;
  if (t < GAG) return { feed: 0, mood: 'gag', shake, amp: 1, puff: 0.6 + 0.4 * Math.sin(t * Math.PI * 2 * 3) };
  if (t < PRINT) {
    const u = (t - GAG) / (PRINT - GAG);
    // 영수증 프린터처럼 조금씩 끊기며 나온다
    const feed = clamp(ease(u) + Math.sin(u * Math.PI * 2 * 14) * 0.004);
    return { feed, mood: 'spew', shake, amp: 1 };
  }
  const amp = 1 - clamp((t - PRINT) / CALM);
  // 입에 물고 있는 동안은 벌린 입 그대로, 놓으면 영수증은 살짝 내려앉고 코코는 웃으며 위로 사라진다
  const u = clamp((t - RISE[0]) / (RISE[1] - RISE[0]));
  const dip = Math.sin(clamp((t - TEAR) / (RISE[0] - TEAR)) * Math.PI) * 30; // 뜨기 전에 살짝 웅크림
  return {
    feed: 1,
    mood: t < TEAR ? 'spew' : 'happy',
    shake,
    amp,
    drop: 0.15 * ease(clamp((t - TEAR) / 0.4)),
    lift: u * u * u * RISE_PX - dip,
  };
}

const out = process.argv[2] ?? 'header.mp4';
const poster = process.argv[3];
if (poster) writeFileSync(poster, render(frame({ feed: 1, mood: 'spew', shake: 0.6 })));

const ff = spawn(ffmpeg, [
  '-y',
  '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  // 소리는 없지만 무음 트랙을 붙여 둔다 (앱 미리보기 영상처럼 오디오 트랙을 요구할 때 대비)
  '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
  '-shortest',
  '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'slow',
  '-c:a', 'aac', '-b:a', '256k',
  '-s', `${W}x${H}`, '-r', String(FPS), '-movflags', '+faststart',
  out,
], { stdio: ['pipe', 'inherit', 'inherit'] });

const total = FPS * SECONDS;
for (let i = 0; i < total; i++) {
  const png = render(frame(at(i / FPS)));
  if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % 30 === 0) console.log(`frame ${i}/${total}`);
}
ff.stdin.end();
ff.on('close', (code) => console.log(code === 0 ? `wrote ${out}` : `ffmpeg exited ${code}`));

// 기록(카테고리 + 모양)마다 사진 칸이 어떤 비율인지. 사진 자르기 화면이 이 비율로 틀을 띄운다.
// 칸 크기는 각 양식 파일의 PHOTO_SLOT 에서 가져온다 (양식을 고치면 여기도 따라 바뀐다).
import { PHOTO_SLOT as CONCERT_RETRO } from '../templates/ConcertRetro';
import { PHOTO_SLOT as CONCERT_TICKET } from '../templates/ConcertTicket';
import { PHOTO_SLOT as DAILY } from '../templates/DailyStory';
import { PHOTO_SLOT as EXERCISE_PHOTO } from '../templates/ExercisePhoto';
import { PHOTO_SLOT as EXERCISE_SLIP } from '../templates/ExerciseSlip';
import { PHOTO_SLOT as FOOD_HOUSE } from '../templates/FoodHouse';
import { PHOTO_SLOT as FOOD_ORDER } from '../templates/FoodOrder';
import { PHOTO_SLOT as MUSIC_ALBUM } from '../templates/MusicAlbum';
import { PHOTO_SLOT as MUSIC_LIST } from '../templates/MusicList';
import { PHOTO_SLOT as PHOTO_TICKET } from '../templates/PhotoTicket';
import { PHOTO_SLOT as PLAIN_TICKET } from '../templates/PlainTicket';
import { PHOTO_SLOT as SHOW_HOLO } from '../templates/ShowHolo';
import { PHOTO_SLOT as SHOW_RETRO } from '../templates/ShowRetro';
import { PHOTO_SLOT as SHOW_TICKET } from '../templates/ShowTicket';
import { FOURCUT_LAYOUTS } from '../templates/Fourcut';
import { cocomonArtAspect } from '../templates/FourcutCard';
import { cocochiScreenAspect } from '../templates/FourcutCocochi';
import { houseCellAspect } from '../templates/FourcutHouse';
import { travelSlots } from '../templates/TravelPass';
import { CocochiColor, FourcutLayout, Photo, RecoRecord } from '../types';
import { photoRatio } from './photoCrop';

export interface PhotoSlot {
  /** 칸 폭 */
  w: number;
  /** 칸 높이 범위 (같으면 고정 비율) */
  min: number;
  max: number;
}

type Draft = Pick<RecoRecord, 'kind'> & { design?: string };

/** 사진 한 장 칸이 있는 기록의 칸. 사진이 안 들어가는 모양(팔찌·가로 흰 무지 등)이면 null */
export function slotOf(r: Draft): PhotoSlot | null {
  switch (r.kind) {
    case 'food':
      return r.design === 'house' ? FOOD_HOUSE : FOOD_ORDER;
    case 'show':
      if (r.design === 'band') return null;
      if (r.design === 'kpop') return PHOTO_TICKET;
      if (r.design === 'holo') return SHOW_HOLO;
      if (r.design === 'retro' || r.design === 'ticket') return SHOW_RETRO;
      if (r.design === 'poster') return SHOW_TICKET;
      return PLAIN_TICKET;
    case 'concert':
      if (r.design === 'band' || r.design === 'plain') return null; // 팔찌·가로 흰 무지는 사진 칸이 없다
      if (r.design === 'kpop') return PHOTO_TICKET;
      if (r.design === 'retro') return CONCERT_RETRO;
      return CONCERT_TICKET;
    case 'exercise':
      return r.design === 'card' ? EXERCISE_PHOTO : EXERCISE_SLIP;
    case 'music':
      return r.design === 'list' ? MUSIC_LIST : MUSIC_ALBUM;
    case 'daily':
      return DAILY;
    default:
      return null;
  }
}

/**
 * 이 사진이 이 칸에 들어갈 때의 세로/가로 비율 — 자르기 틀의 모양.
 * 칸 높이가 범위로 열려 있으면 사진 원래 비율에 가장 가까운 칸으로 잡는다 (양식이 그리는 칸과 같다).
 */
export function slotAspect(slot: PhotoSlot, photo: Pick<Photo, 'width' | 'height'>) {
  const natural = (slot.w * photo.height) / Math.max(1, photo.width);
  return Math.min(slot.max, Math.max(slot.min, natural)) / slot.w;
}

/** 일상처럼 칸이 넓게 열려 있으면 자주 쓰는 비율을 골라 쓰게 한다 (세로/가로) */
export const FREE_ASPECTS: { label: string; value: number | null }[] = [
  { label: '원본', value: null },
  { label: '1:1', value: 1 },
  { label: '4:5', value: 5 / 4 },
  { label: '3:4', value: 4 / 3 },
  { label: '9:16', value: 16 / 9 },
  { label: '4:3', value: 3 / 4 },
];

/** 칸이 비율을 넓게 받아 주는지 (일상) — 그러면 비율 고르기 줄을 보여준다 */
export const isFreeSlot = (slot: PhotoSlot) => slot.max / slot.w >= 2;

/** 여러 장 칸 기록 (인생네컷·여행) 의 고르는 중 모습 */
export interface MultiDraft {
  kind: 'fourcut' | 'travel';
  design?: string;
  layout?: FourcutLayout;
  cocochiColor?: CocochiColor;
}

/**
 * 여러 장 중 index 번째 사진이 들어갈 칸의 세로/가로 비율. 안 쓰이는 사진이면 null.
 * - 네컷 그대로: 레이아웃 칸 (index 자리 그대로)
 * - 하우스네컷: 넣은 장수만큼 나뉜 칸 / 코코치·코코몬: 첫 장만 쓴다
 * - 여행: 채운 사진 장수에 따라 배치가 바뀐다 (빈칸은 건너뛰고 차례대로)
 */
export function multiAspect(d: MultiDraft, photos: (Photo | null)[], index: number): number | null {
  const filled = photos.map((p, i) => (p ? i : -1)).filter((i) => i >= 0);
  const rank = filled.indexOf(index);
  if (rank < 0) return null;
  if (d.kind === 'travel') {
    const s = travelSlots(Math.min(4, filled.length))[rank];
    return s ? s.h / s.w : null;
  }
  if (d.design === 'card') return rank === 0 ? cocomonArtAspect() : null;
  if (d.design === 'cocochi') return rank === 0 ? cocochiScreenAspect(d.cocochiColor ?? 'mint') : null;
  if (d.design === 'house') return rank < 4 ? houseCellAspect(filled.length) : null;
  const s = (FOURCUT_LAYOUTS[d.layout ?? 'strip'] ?? FOURCUT_LAYOUTS.strip).slots[index];
  return s ? s.h / s.w : null;
}

/** 사진 비율이 칸과 거의 같으면 자르기를 건너뛴다 (4% 안쪽) */
export const fitsAspect = (photo: Photo, aspect: number) => Math.abs(photoRatio(photo) - aspect) / aspect < 0.04;

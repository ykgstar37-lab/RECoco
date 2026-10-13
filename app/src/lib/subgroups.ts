// 영수증 목록에서 한 카테고리를 한 번 더 나누는 기준: 일상은 소분류, 독서는 읽은 상태.
// 목록 위 알약과 오른쪽 아래 인덱스 탭 색이 여기서 나온다.
import { COLORS } from '../theme';
import { ReadingStatus, RecoRecord, RecordKind } from '../types';
import { tagColorOf } from './dailyTags';

export const STATUSES: ReadingStatus[] = ['완독', '읽는 중', '잠시 멈춤'];
// 상태마다 색: 다 읽음 초록 · 읽는 중 주황 · 멈춤 회색
export const STATUS_COLORS: Record<ReadingStatus, { main: string; soft: string }> = {
  완독: { main: '#2e9e6a', soft: '#e2f4ea' },
  '읽는 중': { main: COLORS.orange, soft: COLORS.orangeSoft },
  '잠시 멈춤': { main: '#7b8190', soft: '#e9ebf0' },
};

/** 나눠 볼 수 있는 카테고리 */
export const hasSubgroups = (kind: RecordKind | null) => kind === 'daily' || kind === 'reading';

/** 이 기록이 속한 묶음 이름 (없으면 '') */
export function subgroupOf(r: RecoRecord) {
  if (r.kind === 'daily') return r.tag.trim();
  if (r.kind === 'reading') return r.status;
  return '';
}

/** 묶음 색. 묶음이 없는 카테고리는 주황 */
export function subgroupColor(kind: RecordKind, group: string) {
  if (kind === 'reading' && group in STATUS_COLORS) return STATUS_COLORS[group as ReadingStatus].main;
  if (kind === 'daily' && group) return tagColorOf(group);
  return COLORS.orange;
}

/** 묶음 알약 차례: 독서는 상태 차례, 일상은 처음 나온 차례 */
export function subgroupsIn(kind: RecordKind | null, records: RecoRecord[]) {
  if (!hasSubgroups(kind)) return [];
  const present = new Set(records.map(subgroupOf).filter(Boolean));
  return kind === 'reading' ? STATUSES.filter((s) => present.has(s)) : [...present];
}

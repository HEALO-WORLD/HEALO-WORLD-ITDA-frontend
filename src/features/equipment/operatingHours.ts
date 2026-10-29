import { WEEKDAYS } from "@/lib/format/date";

import type { DailyOperatingHours } from "./types";

/** 월요일부터 일요일 순서 */
export const WEEK_ORDER: readonly number[] = [1, 2, 3, 4, 5, 6, 0];

const rangeLabel = ({ open, close }: DailyOperatingHours) => `${open}~${close}`;

/**
 * 요일별 운영 시간을 한 줄로 요약한다.
 * 같은 시간이 이어지는 요일은 묶는다. 예: `월~금 08:30~18:00 · 토 08:30~12:00`
 */
export function formatOperatingHoursSummary(hours: DailyOperatingHours[]): string {
  const byWeekday = new Map(hours.map((item) => [item.weekday, item]));
  const groups: { from: number; to: number; label: string }[] = [];

  for (const weekday of WEEK_ORDER) {
    const item = byWeekday.get(weekday);
    if (!item) continue;
    const label = rangeLabel(item);
    const last = groups[groups.length - 1];
    const isNextDay = last && WEEK_ORDER.indexOf(last.to) + 1 === WEEK_ORDER.indexOf(weekday);
    if (last && isNextDay && last.label === label) last.to = weekday;
    else groups.push({ from: weekday, to: weekday, label });
  }

  if (groups.length === 0) return "운영 시간 정보 없음";
  return groups
    .map(({ from, to, label }) =>
      `${WEEKDAYS[from]}${from === to ? "" : `~${WEEKDAYS[to]}`} ${label}`,
    )
    .join(" · ");
}

/** `HH:mm` + 분 → `HH:mm` (슬롯 종료 시각 계산용) */
export function addMinutesToTime(time: string, minutes: number): string {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

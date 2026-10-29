/**
 * 한국 시간(Asia/Seoul) 기준 날짜 유틸.
 *
 * 날짜는 `YYYY-MM-DD` 문자열(DateKey)로 다루고, 날짜 산술은 UTC 자정 기준으로만 계산한다.
 * 브라우저 로컬 시간대를 거치지 않으므로 UTC/로컬 차이로 하루가 밀리는 문제가 생기지 않는다.
 */

export const SEOUL_TIME_ZONE = "Asia/Seoul";

/** `YYYY-MM-DD` */
export type DateKey = string;

export interface SeoulNow {
  dateKey: DateKey;
  /** `YYYY-MM-DDTHH:mm` — 슬롯 `startAt`과 같은 형식이라 문자열 비교가 가능하다 */
  dateTime: string;
}

const pad = (value: number) => String(value).padStart(2, "0");

const seoulFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: SEOUL_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** 현재 시각을 한국 시간 기준으로 반환한다 */
export function getSeoulNow(now: Date = new Date()): SeoulNow {
  const parts = Object.fromEntries(
    seoulFormatter.formatToParts(now).map(({ type, value }) => [type, value]),
  );
  const dateKey = `${parts.year}-${parts.month}-${parts.day}`;
  return { dateKey, dateTime: `${dateKey}T${parts.hour}:${parts.minute}` };
}

export function toDateKey(year: number, month: number, day: number): DateKey {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** month는 1~12 */
export function parseDateKey(key: DateKey): { year: number; month: number; day: number } {
  const [year, month, day] = key.split("-").map(Number);
  return { year, month, day };
}

function toUtcDate(key: DateKey): Date {
  const { year, month, day } = parseDateKey(key);
  return new Date(Date.UTC(year, month - 1, day));
}

function fromUtcDate(date: Date): DateKey {
  return toDateKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function addDays(key: DateKey, days: number): DateKey {
  const date = toUtcDate(key);
  date.setUTCDate(date.getUTCDate() + days);
  return fromUtcDate(date);
}

/** 월 이동. 대상 월의 말일을 넘으면 말일로 맞춘다 (1/31 + 1개월 → 2/28) */
export function addMonths(key: DateKey, months: number): DateKey {
  const { year, month, day } = parseDateKey(key);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const targetYear = target.getUTCFullYear();
  const targetMonth = target.getUTCMonth() + 1;
  return toDateKey(targetYear, targetMonth, Math.min(day, getDaysInMonth(targetYear, targetMonth)));
}

/** 0=일 ~ 6=토 */
export function getWeekday(key: DateKey): number {
  return toUtcDate(key).getUTCDay();
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

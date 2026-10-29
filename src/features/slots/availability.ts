import type { DateKey } from "@/lib/date/seoulDate";

import type { ExamSlot, SlotSearchCriteria } from "./types";

/**
 * 날짜별 예약 가능 여부 계산 (프론트엔드 임시 로직).
 *
 * TODO(api): 서버가 날짜별 가용 정보를 내려주면 이 계산 대신 응답을 같은 형태로 매핑한다.
 */

/**
 * - AVAILABLE: 예약 가능한 미래 슬롯이 1개 이상
 * - FULL: 조건에 맞는 슬롯은 있으나 모두 마감되었거나 이미 지난 시간
 * (맵에 없는 날짜 = 조건에 맞는 슬롯 없음)
 */
export type DateAvailabilityStatus = "AVAILABLE" | "FULL";

export type DateAvailability = Record<DateKey, DateAvailabilityStatus>;

export type AvailabilityFilter = Pick<SlotSearchCriteria, "examType" | "organizationId">;

/** 검사 유형·기관 조건 일치 여부 (날짜 조건 제외) */
export function matchesSlotFilter(slot: ExamSlot, filter: AvailabilityFilter): boolean {
  return (
    (!filter.examType || slot.examType === filter.examType) &&
    (!filter.organizationId || slot.organizationId === filter.organizationId)
  );
}

/** 슬롯 시작 시각이 현재(한국 시간) 이후인지. 두 값 모두 `YYYY-MM-DDTHH:mm` */
export function isUpcomingSlot(slot: ExamSlot, nowDateTime: string): boolean {
  return slot.startAt > nowDateTime;
}

export function isBookableSlot(slot: ExamSlot, nowDateTime: string): boolean {
  return slot.isAvailable && isUpcomingSlot(slot, nowDateTime);
}

export function buildDateAvailability(
  slots: readonly ExamSlot[],
  filter: AvailabilityFilter,
  nowDateTime: string,
): DateAvailability {
  const result: DateAvailability = {};

  for (const slot of slots) {
    if (!matchesSlotFilter(slot, filter)) continue;

    const dateKey = slot.startAt.slice(0, 10);
    if (isBookableSlot(slot, nowDateTime)) result[dateKey] = "AVAILABLE";
    else if (!result[dateKey]) result[dateKey] = "FULL";
  }

  return result;
}

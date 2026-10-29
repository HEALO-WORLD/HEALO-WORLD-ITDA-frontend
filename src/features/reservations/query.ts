import type { ReferralDisplayStatus } from "@/features/referrals/types";
import { addDays, getDaysInMonth, getWeekday, parseDateKey, toDateKey, type DateKey } from "@/lib/date/seoulDate";

import type {
  ReferringOrganizationOption,
  Reservation,
  ReservationEquipmentOption,
  ReservationSearchCriteria,
  ReservationSummaryCounts,
} from "./types";

/** 검색·필터 전체 해제 상태. 첫 진입 시 기간을 제한하지 않아 과거·미래 예약이 모두 보인다 */
export const EMPTY_CRITERIA: ReservationSearchCriteria = {
  keyword: "",
  dateFrom: "",
  dateTo: "",
  examType: "",
  status: "",
  equipmentId: "",
  referringOrganizationId: "",
};

/** 검색 전 입력 검증. 문제가 없으면 null */
export function validateCriteria({ dateFrom, dateTo }: ReservationSearchCriteria): string | null {
  if (dateFrom && dateTo && dateFrom > dateTo) return "시작일이 종료일보다 늦습니다. 검사 기간을 다시 선택해 주세요.";
  return null;
}

/** 빠른 기간 선택 (한국 시간 기준, 주는 월요일 시작) */
export type PeriodPreset = "ALL" | "TODAY" | "THIS_WEEK" | "THIS_MONTH";

export function getPresetRange(preset: PeriodPreset, today: DateKey): { dateFrom: DateKey | ""; dateTo: DateKey | "" } {
  switch (preset) {
    case "ALL":
      return { dateFrom: "", dateTo: "" };
    case "TODAY":
      return { dateFrom: today, dateTo: today };
    case "THIS_WEEK": {
      const monday = addDays(today, -((getWeekday(today) + 6) % 7));
      return { dateFrom: monday, dateTo: addDays(monday, 6) };
    }
    case "THIS_MONTH": {
      const { year, month } = parseDateKey(today);
      return { dateFrom: toDateKey(year, month, 1), dateTo: toDateKey(year, month, getDaysInMonth(year, month)) };
    }
  }
}

/** 상태를 뺀 나머지 조건(검색어·기간·유형·장비·의뢰기관) 일치 여부 */
function matchesExceptStatus(
  reservation: Reservation,
  criteria: ReservationSearchCriteria,
  equipmentNameById: Map<string, string>,
): boolean {
  const keyword = criteria.keyword.trim().toLowerCase();
  const date = reservation.scheduledAt.slice(0, 10);
  // 예약 데이터에는 장비 ID가 없어 같은 기관 장비의 이름으로 비교한다 (기관 안에서 장비명은 유일)
  const equipmentName = criteria.equipmentId ? equipmentNameById.get(criteria.equipmentId) : undefined;

  return (
    (!keyword ||
      [reservation.referralNumber, reservation.referringOrganizationName, reservation.virtualPatientId].some(
        (value) => value.toLowerCase().includes(keyword),
      )) &&
    (!criteria.dateFrom || date >= criteria.dateFrom) &&
    (!criteria.dateTo || date <= criteria.dateTo) &&
    (!criteria.examType || reservation.examType === criteria.examType) &&
    (!criteria.equipmentId || reservation.equipmentName === equipmentName) &&
    (!criteria.referringOrganizationId || reservation.referringOrganizationId === criteria.referringOrganizationId)
  );
}

const toNameMap = (equipments: readonly ReservationEquipmentOption[]) =>
  new Map(equipments.map(({ id, name }) => [id, name]));

/** 모든 검색 조건을 AND로 적용한다 (입력 목록은 이미 현재 검사기관 예약으로 걸러져 있다) */
export function filterReservations(
  reservations: readonly Reservation[],
  criteria: ReservationSearchCriteria,
  equipments: readonly ReservationEquipmentOption[],
) {
  const names = toNameMap(equipments);
  return reservations.filter(
    (reservation) =>
      matchesExceptStatus(reservation, criteria, names) && (!criteria.status || reservation.status === criteria.status),
  );
}

/**
 * 기본 정렬: 곧 진행할 검사가 먼저.
 * 1) 현재 시각 이후 예약 — 검사 일시 빠른 순
 * 2) 이미 지난 예약 — 최근 것부터 (검사 일시 늦은 순)
 * 같은 일시는 예약번호 순. 현재 시각을 모르면(서버 렌더링 시) 검사 일시 빠른 순.
 */
export function sortReservations(reservations: readonly Reservation[], nowDateTime: string | null): Reservation[] {
  return [...reservations].sort((a, b) => {
    if (nowDateTime) {
      const aUpcoming = a.scheduledAt > nowDateTime;
      const bUpcoming = b.scheduledAt > nowDateTime;
      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
      if (!aUpcoming) return b.scheduledAt.localeCompare(a.scheduledAt) || a.referralNumber.localeCompare(b.referralNumber);
    }
    return a.scheduledAt.localeCompare(b.scheduledAt) || a.referralNumber.localeCompare(b.referralNumber);
  });
}

/**
 * 예약 현황 요약.
 * - 오늘 예약: 한국 시간 오늘 검사 예정이고 취소되지 않은 예약 (검색 조건과 무관)
 * - 상태별 건수: 상태 조건을 뺀 나머지 검색 조건(검색어·기간·유형·장비·의뢰기관)을 적용한 예약의 상태별 건수
 *   (상태 조건까지 적용하면 나머지 상태가 0이 되어 현황이 왜곡되므로 제외한다)
 */
export function summarizeReservations(
  reservations: readonly Reservation[],
  criteria: ReservationSearchCriteria,
  equipments: readonly ReservationEquipmentOption[],
  today: DateKey | null,
): ReservationSummaryCounts {
  const names = toNameMap(equipments);
  const byStatus: Record<ReferralDisplayStatus, number> = {
    CONFIRMED: 0,
    PROCESSING: 0,
    RESCHEDULE_REQUIRED: 0,
    CANCELLED: 0,
  };
  for (const reservation of reservations) {
    if (matchesExceptStatus(reservation, criteria, names)) byStatus[reservation.status] += 1;
  }
  const todayCount = today
    ? reservations.filter(({ scheduledAt, status }) => scheduledAt.startsWith(today) && status !== "CANCELLED").length
    : 0;
  return { today: todayCount, byStatus };
}

/** 현재 기관 예약에서 의뢰기관 선택지를 뽑는다 (ID 기준 중복 제거, 이름순) */
export function getReferringOrganizationOptions(reservations: readonly Reservation[]): ReferringOrganizationOption[] {
  const byId = new Map<string, string>();
  for (const { referringOrganizationId, referringOrganizationName } of reservations) {
    byId.set(referringOrganizationId, referringOrganizationName);
  }
  return [...byId].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

/** 기본 필터 외 상세 필터(장비·의뢰기관) 중 적용된 개수 */
export const countAdvancedFilters = ({ equipmentId, referringOrganizationId }: ReservationSearchCriteria) =>
  [equipmentId, referringOrganizationId].filter(Boolean).length;

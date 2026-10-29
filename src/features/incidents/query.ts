import type { Reservation } from "@/features/reservations/types";

import type { IncidentRecord, IncidentSearchCriteria, IncidentSummaryCounts } from "./types";

/** 검색 조건 전체 해제 상태 (과거 이력까지 모두 보인다) */
export const EMPTY_INCIDENT_CRITERIA: IncidentSearchCriteria = {
  status: "",
  equipmentId: "",
  dateFrom: "",
  dateTo: "",
};

/** 검색 전 입력 검증. 문제가 없으면 null */
export function validateIncidentCriteria({ dateFrom, dateTo }: IncidentSearchCriteria): string | null {
  if (dateFrom && dateTo && dateFrom > dateTo) return "시작일이 종료일보다 늦습니다. 장애 발생 기간을 다시 선택해 주세요.";
  return null;
}

export const hasIncidentCriteria = (criteria: IncidentSearchCriteria) =>
  Object.values(criteria).some(Boolean);

/** 모든 조건을 AND로 적용한다. 기간은 장애 발생일 기준 */
export function filterIncidents(incidents: readonly IncidentRecord[], criteria: IncidentSearchCriteria) {
  return incidents.filter(({ status, equipmentId, occurredAt }) => {
    const date = occurredAt.slice(0, 10);
    return (
      (!criteria.status || status === criteria.status) &&
      (!criteria.equipmentId || equipmentId === criteria.equipmentId) &&
      (!criteria.dateFrom || date >= criteria.dateFrom) &&
      (!criteria.dateTo || date <= criteria.dateTo)
    );
  });
}

/** 진행 중 장애 먼저, 같은 상태 안에서는 최근 발생 순 */
export function sortIncidents(incidents: readonly IncidentRecord[]): IncidentRecord[] {
  return [...incidents].sort(
    (a, b) =>
      Number(b.status === "ACTIVE") - Number(a.status === "ACTIVE") ||
      b.occurredAt.localeCompare(a.occurredAt) ||
      a.incidentNumber.localeCompare(b.incidentNumber),
  );
}

/** 장애 현황 요약 (검색 조건과 무관하게 현재 기관 전체 기준) */
export function summarizeIncidents(
  incidents: readonly IncidentRecord[],
  reservations: readonly Reservation[],
): IncidentSummaryCounts {
  return {
    activeEquipmentCount: new Set(incidents.filter(({ status }) => status === "ACTIVE").map(({ equipmentId }) => equipmentId))
      .size,
    resolvedIncidentCount: incidents.filter(({ status }) => status === "RESOLVED").length,
    rescheduleRequiredCount: reservations.filter(({ status }) => status === "RESCHEDULE_REQUIRED").length,
  };
}

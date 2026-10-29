import type { EquipmentIncident } from "@/features/incidents/types";

/**
 * ⚠️ 개발용 Mock 데이터 (실제 서버 데이터 아님)
 *
 * 장비 장애·재조정 화면 확인용 예시 장애 이력이다.
 * - 기관·장비는 슬롯 Mock(mockSlots.ts)의 ID로 연결한다 (가온영상센터 MRI 1호기)
 * - 이미 복구된 과거 장애라 현재 장비 상태·슬롯·예약·재조정 알림에는 영향을 주지 않는다
 *   (장비 상태와 슬롯 생성은 이 파일을 읽지 않는다)
 * - 같은 시간대(2026-10-09 10:00~11:30)의 가온영상센터 예약은 의뢰 Mock에 없으므로 영향 예약도 없다
 * API 연동 시 이 파일을 제거한다.
 */
export const MOCK_INCIDENTS: readonly EquipmentIncident[] = Object.freeze([
  {
    id: "mock-incident-001",
    incidentNumber: "INC-001",
    organizationId: "org-gaon",
    equipmentId: "eq-gaon-mri-1",
    reason: "냉각 시스템 점검 중 장비 오류",
    status: "RESOLVED",
    occurredAt: "2026-10-09T10:00",
    resolvedAt: "2026-10-09T11:30",
    affectedReservationIds: [],
  },
] satisfies EquipmentIncident[]);

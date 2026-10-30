import type { EquipmentIncident } from "@/features/incidents/types";

/**
 * ⚠️ 개발용 Mock 데이터 (실제 서버 데이터 아님)
 *
 * 장비 장애·재조정 화면 확인용 예시 장애 이력이다. 기관·장비·예약은 기존 Mock의 ID로만 연결한다.
 * 장비의 현재 상태(정상/장애)는 이 이력의 진행 중(ACTIVE) 장애로만 판단한다 (features/incidents/mockIncidentStore.ts).
 * - INC-001: 가온영상센터 MRI 1호기의 과거 복구 완료 장애. 현재 상태·슬롯에는 영향이 없다.
 *   같은 시간대(2026-10-09 10:00~11:30)의 가온영상센터 예약은 의뢰 Mock에 없으므로 영향 예약도 없다
 * - INC-002·INC-003: 의뢰기관 재조정 알림(mockNotifications.ts)에 장애 원인으로 기록된 강남 MRI 1호기·누리 CT 1호기.
 *   알림 시각을 발생 일시로, 알림이 가리키는 예약(R-003·R-006)을 영향 예약으로 둔다. 상세 사유는 데이터에 없어 적지 않는다.
 *   진행 중이므로 이 두 장비의 미래 슬롯은 예약 불가로 계산된다 (슬롯 원본 데이터는 바꾸지 않는다)
 * 화면에서 등록·복구한 내용은 이 파일이 아니라 브라우저 저장소에 따로 기록된다. API 연동 시 이 파일을 제거한다.
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
  {
    id: "mock-incident-002",
    incidentNumber: "INC-002",
    organizationId: "org-gangnam",
    equipmentId: "eq-gangnam-mri-1",
    reason: "장비 장애 (상세 사유 미기록)",
    status: "ACTIVE",
    occurredAt: "2026-10-25T09:15",
    resolvedAt: null,
    affectedReservationIds: ["mock-referral-003"],
  },
  {
    id: "mock-incident-003",
    incidentNumber: "INC-003",
    organizationId: "org-nuri",
    equipmentId: "eq-nuri-ct-1",
    reason: "장비 장애 (상세 사유 미기록)",
    status: "ACTIVE",
    occurredAt: "2026-10-29T08:40",
    resolvedAt: null,
    affectedReservationIds: ["mock-referral-006"],
  },
] satisfies EquipmentIncident[]);

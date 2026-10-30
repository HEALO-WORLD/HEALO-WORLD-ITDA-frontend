import type { ExaminingNotification } from "@/features/examining-notifications/types";

/**
 * ⚠️ 개발용 Mock 데이터 (실제 서버 데이터 아님)
 *
 * 검사기관 알림 화면 확인용 예시 데이터다. 의뢰기관 알림(mockNotifications.ts)과 별개이며,
 * 기존 Mock에 실제로 있는 사건만 알림으로 둔다 (없는 사건·진행 중 장애 알림은 만들지 않는다).
 * - 가온영상센터(org-gaon) 3건: 읽지 않음 1 · 읽음 2
 *   · R-004 신규 예약: 의뢰 10/24 10:21 접수 → 10/24 14:22 확정 (의뢰기관 알림의 확정 시각과 같다)
 *   · R-011 예약 취소: 의뢰 10/12 접수, 10/20 10:30 검사 예정이던 예약. 취소 시각은 접수 후·검사 전으로 둔다
 *   · INC-001 장비 복구: 장애 이력의 복구 일시(10/09 11:30)와 같다
 * - 강남영상의학센터(org-gangnam) 1건: 기관 분리 확인용. 의뢰기관 알림에 기록된
 *   강남 MRI 1호기 장애(R-003 재조정 원인)와 같은 사건이며, 가온영상센터 화면에는 나오면 안 된다
 * 읽음 처리는 화면 상태로만 반영되며 이 데이터는 바뀌지 않는다. API 연동 시 이 파일을 제거한다.
 */
export const MOCK_EXAMINING_NOTIFICATIONS: readonly ExaminingNotification[] = Object.freeze([
  {
    id: "mock-ex-notification-003",
    recipientOrganizationId: "org-gaon",
    type: "RESERVATION_RECEIVED",
    title: "새로운 검사 예약이 접수되었습니다",
    message: "서울바른정형외과 · R-004 · MRI · 11/03 13:00",
    occurredAt: "2026-10-24T14:22",
    isRead: false,
    target: { kind: "RESERVATION", referralId: "mock-referral-004" },
  },
  {
    id: "mock-ex-notification-002",
    recipientOrganizationId: "org-gaon",
    type: "RESERVATION_CANCELLED",
    title: "검사 예약이 취소되었습니다",
    message: "R-011 예약이 취소되었습니다. (10/20 10:30 MRI 1호기 예정)",
    occurredAt: "2026-10-17T14:20",
    isRead: true,
    target: { kind: "RESERVATION", referralId: "mock-referral-011" },
  },
  {
    id: "mock-ex-notification-001",
    recipientOrganizationId: "org-gaon",
    type: "EQUIPMENT_RECOVERED",
    title: "장비 복구가 완료되었습니다",
    message: "가온영상센터 MRI 1호기 · INC-001",
    occurredAt: "2026-10-09T11:30",
    isRead: true,
    target: { kind: "INCIDENT", incidentId: "mock-incident-001" },
  },
  {
    id: "mock-ex-notification-901",
    recipientOrganizationId: "org-gangnam",
    type: "EQUIPMENT_FAILURE",
    title: "장비 장애가 발생했습니다",
    message: "강남영상의학센터 MRI 1호기 장애로 예약 재조정이 필요합니다.",
    occurredAt: "2026-10-25T09:15",
    isRead: false,
    target: { kind: "RESERVATION", referralId: "mock-referral-003" },
  },
] satisfies ExaminingNotification[]);

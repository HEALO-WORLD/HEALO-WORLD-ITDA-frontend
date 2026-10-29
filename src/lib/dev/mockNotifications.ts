import type { NotificationItem } from "@/features/notifications/types";

/**
 * ⚠️ 개발용 Mock 데이터 (실제 서버 데이터 아님)
 *
 * 재조정·알림 화면과 헤더 알림 표시 확인용 예시 데이터다.
 * - referralId는 의뢰 Mock(mockReferrals.ts)의 id이며, 기관·유형·상태가 해당 의뢰와 일치한다
 *   R-003·R-006 재조정 필요 / R-007·R-004·R-001 확정 / R-001 결과 등록 / R-008 취소
 * - 재조정 알림의 rescheduleCause.equipmentId는 슬롯 Mock의 장비 ID다 (재조정 검색에서 해당 장비 제외)
 * - 처음에는 읽지 않은 알림 3건, 읽은 알림 4건이다
 * - 읽음 처리는 브라우저 화면 상태로만 반영되며 이 데이터는 바뀌지 않는다 (새로고침하면 초기화)
 * API 연동 시 이 파일을 제거한다.
 */
export const MOCK_NOTIFICATIONS: readonly NotificationItem[] = Object.freeze([
  {
    id: "mock-notification-007",
    referralId: "mock-referral-007",
    type: "RESERVATION_CONFIRMED",
    title: "검사 예약이 확정되었습니다",
    message: "서울메디영상센터에서 R-007 예약이 확정되었습니다.",
    occurredAt: "2026-10-29T09:02",
    isRead: false,
  },
  {
    id: "mock-notification-006",
    referralId: "mock-referral-006",
    type: "RESCHEDULE_REQUIRED",
    title: "장비 고장으로 예약 재조정 필요",
    message: "누리영상센터의 CT 장비 장애로 R-006 예약 재조정이 필요합니다.",
    occurredAt: "2026-10-29T08:40",
    isRead: false,
    rescheduleCause: {
      kind: "EQUIPMENT_FAILURE",
      examType: "CT",
      equipmentId: "eq-nuri-ct-1",
      equipmentName: "CT 1호기",
    },
  },
  {
    id: "mock-notification-005",
    referralId: "mock-referral-001",
    type: "RESULT_REGISTERED",
    title: "검사 결과가 등록되었습니다",
    message: "강남영상의학센터에서 R-001 검사 결과를 등록했습니다.",
    occurredAt: "2026-10-28T16:40",
    isRead: true,
  },
  {
    id: "mock-notification-004",
    referralId: "mock-referral-003",
    type: "RESCHEDULE_REQUIRED",
    title: "장비 고장으로 예약 재조정 필요",
    message: "강남영상의학센터의 MRI 장비 장애로 R-003 예약 재조정이 필요합니다.",
    occurredAt: "2026-10-25T09:15",
    isRead: false,
    rescheduleCause: {
      kind: "EQUIPMENT_FAILURE",
      examType: "MRI",
      equipmentId: "eq-gangnam-mri-1",
      equipmentName: "MRI 1호기",
    },
  },
  {
    id: "mock-notification-003",
    referralId: "mock-referral-004",
    type: "RESERVATION_CONFIRMED",
    title: "검사 예약이 확정되었습니다",
    message: "가온영상센터에서 R-004 예약이 확정되었습니다.",
    occurredAt: "2026-10-24T14:22",
    isRead: true,
  },
  {
    id: "mock-notification-002",
    referralId: "mock-referral-008",
    type: "RESERVATION_CANCELLED",
    title: "검사 예약이 취소되었습니다",
    message: "서울메디영상센터의 R-008 예약이 취소되었습니다.",
    occurredAt: "2026-10-23T11:05",
    isRead: true,
  },
  {
    id: "mock-notification-001",
    referralId: "mock-referral-001",
    type: "RESERVATION_CONFIRMED",
    title: "검사 예약이 확정되었습니다",
    message: "강남영상의학센터에서 R-001 예약이 확정되었습니다.",
    occurredAt: "2026-10-20T14:30",
    isRead: true,
  },
] satisfies NotificationItem[]);

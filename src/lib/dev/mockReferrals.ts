import type { ReferralSummary } from "@/features/referrals/types";

import { MOCK_PARTNER_ORGANIZATIONS } from "./mockSlots";

/**
 * ⚠️ 개발용 Mock 데이터 (실제 서버 데이터 아님)
 *
 * 최근 의뢰·예약 내역 표시 확인용 예시 데이터다. 검사 슬롯 Mock(mockSlots.ts)과는 별개이며,
 * 의뢰 요청 버튼을 눌러도 이 목록에 항목이 추가되지 않는다.
 * - 날짜는 고정 값이다 (날짜가 바뀌어도 내용이 변하지 않음)
 * - 가상 환자 ID는 DEMO-숫자 형식의 테스트 식별자만 사용하며, 실제 환자 정보는 포함하지 않는다
 * - 검사기관명은 슬롯 Mock의 협력 검사기관 목록에서 가져온다
 * - 예약 상태는 화면 표시용 값이다 (확정 3건 · 처리 중 2건 · 재조정 필요 2건 · 취소 1건)
 * - 재조정 필요 건(R-003, R-006)은 재조정 화면 확인을 위해 검사 예정일을 미래 날짜로 둔다
 * - 알림 Mock(mockNotifications.ts)이 이 목록의 id로 관련 의뢰를 연결한다
 * API 연동 시 이 파일을 제거한다.
 */

type MockReferral = Omit<ReferralSummary, "organizationName">;

const MOCK_REFERRALS: MockReferral[] = [
  {
    id: "mock-referral-001",
    referralNumber: "R-001",
    virtualPatientId: "DEMO-1024",
    organizationId: "org-gangnam",
    equipmentName: "MRI 1호기",
    examType: "MRI",
    scheduledAt: "2026-10-27T09:30",
    status: "CONFIRMED",
    purpose: "정밀 영상 검사 의뢰",
    requestedAt: "2026-10-20T14:12",
  },
  {
    id: "mock-referral-002",
    referralNumber: "R-002",
    virtualPatientId: "DEMO-1031",
    organizationId: "org-seoulmedi",
    equipmentName: "CT 1호기",
    examType: "CT",
    scheduledAt: "2026-10-27T11:00",
    status: "PROCESSING",
    purpose: "",
    requestedAt: "2026-10-21T09:40",
  },
  {
    id: "mock-referral-003",
    referralNumber: "R-003",
    virtualPatientId: "DEMO-1045",
    organizationId: "org-gangnam",
    equipmentName: "MRI 1호기",
    examType: "MRI",
    scheduledAt: "2026-11-02T15:00",
    status: "RESCHEDULE_REQUIRED",
    purpose: "추적 검사",
    requestedAt: "2026-10-21T16:05",
  },
  {
    id: "mock-referral-004",
    referralNumber: "R-004",
    virtualPatientId: "DEMO-1052",
    organizationId: "org-gaon",
    equipmentName: "MRI 2호기",
    examType: "MRI",
    scheduledAt: "2026-11-03T13:00",
    status: "CONFIRMED",
    purpose: "수술 전 영상 확인",
    requestedAt: "2026-10-24T10:21",
  },
  {
    id: "mock-referral-005",
    referralNumber: "R-005",
    virtualPatientId: "DEMO-1067",
    organizationId: "org-hanbit",
    equipmentName: "CT 2호기",
    examType: "CT",
    scheduledAt: "2026-11-05T10:30",
    status: "PROCESSING",
    purpose: "",
    requestedAt: "2026-10-27T15:48",
  },
  {
    id: "mock-referral-006",
    referralNumber: "R-006",
    virtualPatientId: "DEMO-1073",
    organizationId: "org-nuri",
    equipmentName: "CT 1호기",
    examType: "CT",
    scheduledAt: "2026-11-07T09:00",
    status: "RESCHEDULE_REQUIRED",
    purpose: "",
    requestedAt: "2026-10-28T11:30",
  },
  {
    id: "mock-referral-007",
    referralNumber: "R-007",
    virtualPatientId: "DEMO-1088",
    organizationId: "org-seoulmedi",
    equipmentName: "MRI 1호기",
    examType: "MRI",
    scheduledAt: "2026-11-12T14:30",
    status: "CONFIRMED",
    purpose: "",
    requestedAt: "2026-10-29T08:55",
  },
  {
    id: "mock-referral-008",
    referralNumber: "R-008",
    virtualPatientId: "DEMO-1095",
    organizationId: "org-seoulmedi",
    equipmentName: "MRI 1호기",
    examType: "MRI",
    scheduledAt: "2026-11-10T10:00",
    status: "CANCELLED",
    purpose: "",
    requestedAt: "2026-10-22T13:20",
  },
];

const organizationNameById = new Map(MOCK_PARTNER_ORGANIZATIONS.map(({ id, name }) => [id, name]));

export const MOCK_REFERRAL_SUMMARIES: readonly ReferralSummary[] = Object.freeze(
  MOCK_REFERRALS.map((referral) =>
    Object.freeze({
      ...referral,
      organizationName: organizationNameById.get(referral.organizationId) ?? referral.organizationId,
    }),
  ),
);


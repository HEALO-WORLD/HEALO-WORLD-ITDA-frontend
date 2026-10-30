import { assertMockMode } from "@/lib/api/config";
import { MOCK_REFERRAL_SUMMARIES } from "@/lib/dev/mockReferrals";

import type { ReferralSummary } from "./types";

/**
 * 의뢰·예약 데이터 접근 함수.
 *
 * TODO(api): 현재는 Mock 데이터를 사용한다. 의뢰 조회·생성 API가 확정되면 함수 시그니처는 유지하고
 * 내부만 Gateway 호출(`/api/...`)로 교체한다. 의뢰 생성 함수는 API 연동 시 추가한다.
 */

/** Mock 데이터 사용 여부. 화면에 '개발용 예시 데이터' 표시를 띄우는 데 쓰며, API 연동 시 제거한다 */
export const IS_MOCK_DATA = true;

export async function getRecentReferrals(): Promise<readonly ReferralSummary[]> {
  assertMockMode("referrals.getRecentReferrals");
  return MOCK_REFERRAL_SUMMARIES;
}

export async function getReferralById(referralId: string): Promise<ReferralSummary | null> {
  assertMockMode("referrals.getReferralById");
  return MOCK_REFERRAL_SUMMARIES.find(({ id }) => id === referralId) ?? null;
}

/** 재조정이 필요한 의뢰·예약 (예약 상태 기준) */
export async function getRescheduleRequiredReferrals(): Promise<ReferralSummary[]> {
  assertMockMode("referrals.getRescheduleRequiredReferrals");
  return MOCK_REFERRAL_SUMMARIES.filter(({ status }) => status === "RESCHEDULE_REQUIRED");
}


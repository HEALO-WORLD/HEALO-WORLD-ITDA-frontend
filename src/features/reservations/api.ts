import { getRecentReferrals, IS_MOCK_DATA as IS_REFERRAL_MOCK } from "@/features/referrals/api";

import type { Reservation } from "./types";

/**
 * 검사기관 예약 데이터 접근 함수.
 *
 * 의뢰기관 화면과 같은 의뢰·예약 데이터(getRecentReferrals)에서 예약을 받은 검사기관 ID로만 거른다.
 * 기관명 문자열이 아니라 ID로 비교하므로 다른 검사기관 예약은 섞이지 않는다.
 * TODO(api): 검사기관 예약 조회 API(서버에서 기관 권한으로 필터링)로 교체한다.
 */

export const IS_MOCK_DATA = IS_REFERRAL_MOCK;

export async function getReceivedReservations(examiningOrganizationId: string): Promise<Reservation[]> {
  const referrals = await getRecentReferrals();
  return referrals.filter(({ organizationId }) => organizationId === examiningOrganizationId);
}

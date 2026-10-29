import { ROUTES } from "@/constants/navigation";

/**
 * 재조정 문맥 (S04 → S02).
 * 재조정 화면의 '새 슬롯 검색'은 대상 의뢰 id를 쿼리로 넘기고, 슬롯 검색 화면은 이 값이 있으면
 * 신규 의뢰가 아니라 재조정 대체 슬롯 선택 모드로 동작한다.
 */
export const RESCHEDULE_QUERY_KEY = "rescheduleReferralId";

export function getRescheduleSearchHref(referralId: string): string {
  return `${ROUTES.referring.slots}?${RESCHEDULE_QUERY_KEY}=${encodeURIComponent(referralId)}`;
}

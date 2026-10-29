import type { ReferralSummary } from "@/features/referrals/types";
import type { ExamType } from "@/features/slots/types";

import type { NotificationItem, RescheduleCause } from "./types";

/**
 * 재조정 대상 의뢰에 연결된 장애 장비 목록 (장비 ID 기준, 중복 제거).
 * 원인이 확인된 재조정 알림이 없으면 빈 배열이다 (장비를 추정하지 않는다).
 */
export function getFailedEquipments(
  referralId: string,
  notifications: readonly NotificationItem[],
): RescheduleCause[] {
  const causes = new Map<string, RescheduleCause>();
  for (const item of notifications) {
    if (item.type !== "RESCHEDULE_REQUIRED" || item.referralId !== referralId) continue;
    if (item.rescheduleCause?.kind === "EQUIPMENT_FAILURE") {
      causes.set(item.rescheduleCause.equipmentId, item.rescheduleCause);
    }
  }
  return [...causes.values()];
}

/**
 * 재조정 대상 의뢰들의 장비 장애 원인 요약.
 * 모든 대상 의뢰에 장비 장애 원인이 담긴 재조정 알림이 있을 때만 장애 유형을 반환한다.
 * 원인을 확인할 수 없는 의뢰가 하나라도 있으면 null (장애로 단정하지 않는다).
 */
export function getEquipmentFailureExamTypes(
  referrals: readonly ReferralSummary[],
  notifications: readonly NotificationItem[],
): ExamType[] | null {
  if (referrals.length === 0) return null;

  const examTypes = new Set<ExamType>();
  for (const referral of referrals) {
    const cause = notifications.find(
      (item) => item.type === "RESCHEDULE_REQUIRED" && item.referralId === referral.id,
    )?.rescheduleCause;
    if (cause?.kind !== "EQUIPMENT_FAILURE") return null;
    examTypes.add(cause.examType);
  }
  return [...examTypes].sort();
}

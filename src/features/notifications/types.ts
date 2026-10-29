import type { ExamType } from "@/features/slots/types";

/**
 * 재조정·알림(S04) 프론트엔드 타입.
 *
 * ⚠️ 알림 API의 응답 필드·알림 타입 enum은 확인되지 않았다. (screen-spec S04-C 확인 필요)
 * 아래 타입은 Mock 데이터와 화면 렌더링을 위한 임시 타입이며, API 연동 시 응답 DTO에서 매핑한다.
 */

/** 화면 표시용 알림 유형 */
export type NotificationType =
  | "RESCHEDULE_REQUIRED"
  | "RESERVATION_CONFIRMED"
  | "RESERVATION_CANCELLED"
  | "RESULT_REGISTERED";

/** 재조정 원인. 확인된 원인이 있을 때만 둔다 (없으면 원인을 단정하지 않는다) */
export interface RescheduleCause {
  kind: "EQUIPMENT_FAILURE";
  examType: ExamType;
  /** 장애 장비 식별자 (ExamSlot.equipmentId와 같은 값) */
  equipmentId: string;
  equipmentName: string;
}

export interface NotificationItem {
  id: string;
  /** 관련 의뢰 id (ReferralSummary.id). 의뢰와 무관한 알림은 null */
  referralId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  /** 발생 일시 (`YYYY-MM-DDTHH:mm`, 한국 시간) */
  occurredAt: string;
  isRead: boolean;
  /** RESCHEDULE_REQUIRED 알림의 원인 */
  rescheduleCause?: RescheduleCause;
}

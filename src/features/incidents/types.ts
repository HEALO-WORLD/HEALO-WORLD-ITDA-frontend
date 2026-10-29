import type { EquipmentStatus } from "@/features/equipment/types";
import type { ReferralDisplayStatus } from "@/features/referrals/types";
import type { ExamType } from "@/features/slots/types";
import type { DateKey } from "@/lib/date/seoulDate";

/**
 * 장비 장애·재조정(S07) 프론트엔드 타입.
 *
 * ⚠️ 장비 장애 API·DTO·상태 enum이 확정되지 않았다.
 * 아래 타입은 Mock 데이터와 화면 렌더링을 위한 임시 타입이며, API 연동 시 응답 DTO에서 매핑한다.
 */

/** 장애 처리 상태. ACTIVE = 장애 진행 중, RESOLVED = 복구 완료 */
export type IncidentStatus = "ACTIVE" | "RESOLVED";

/** 장비 장애 1건 (저장 데이터 형태: 기관·장비·예약은 ID로만 연결한다) */
export interface EquipmentIncident {
  id: string;
  /** 화면 표시용 장애번호 (예: INC-001) */
  incidentNumber: string;
  /** 장애가 발생한 검사기관 ID */
  organizationId: string;
  /** 장애 장비 ID (ExamSlot.equipmentId와 같은 값) */
  equipmentId: string;
  reason: string;
  status: IncidentStatus;
  /** 장애 발생 일시 (`YYYY-MM-DDTHH:mm`, 한국 시간) */
  occurredAt: string;
  /** 복구 일시. 진행 중이면 null */
  resolvedAt: string | null;
  /** 이 장애로 영향을 받았다고 명시적으로 연결된 예약 ID (ReferralSummary.id) */
  affectedReservationIds: string[];
}

/** 영향받은 예약 (화면 표시용) */
export interface AffectedReservation {
  id: string;
  referralNumber: string;
  scheduledAt: string;
  status: ReferralDisplayStatus;
}

/** 화면 표시용 장애: 장비·영향 예약 정보를 ID로 찾아 붙인 형태 */
export interface IncidentRecord extends EquipmentIncident {
  equipment: {
    /** 현재 기관 장비 목록에 없는 ID면 null (장비명을 추정하지 않는다) */
    name: string | null;
    examType: ExamType | null;
    /** 현재 장비 상태 (장비 API 기준. 이 장애의 상태와 별개) */
    currentStatus: EquipmentStatus | null;
  };
  /** 연결된 예약 중 현재 기관 예약에서 찾은 것 */
  affectedReservations: AffectedReservation[];
}

/** 장비 필터 선택지 */
export interface IncidentEquipmentOption {
  id: string;
  name: string;
  examType: ExamType;
}

/** 검색 조건. 빈 문자열은 '전체' */
export interface IncidentSearchCriteria {
  status: IncidentStatus | "";
  equipmentId: string;
  /** 장애 발생일 기준 기간 (양 끝 포함, 한국 시간) */
  dateFrom: DateKey | "";
  dateTo: DateKey | "";
}

/** 장애 현황 요약 */
export interface IncidentSummaryCounts {
  /** 진행 중 장애가 있는 장비 수 (장비 ID 중복 제거) */
  activeEquipmentCount: number;
  resolvedIncidentCount: number;
  /** 현재 기관이 받은 예약 중 재조정 필요 상태인 예약 수 */
  rescheduleRequiredCount: number;
}

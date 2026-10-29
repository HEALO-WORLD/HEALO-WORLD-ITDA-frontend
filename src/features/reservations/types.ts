import type { Equipment } from "@/features/equipment/types";
import type { ReferralDisplayStatus, ReferralSummary } from "@/features/referrals/types";
import type { ExamType } from "@/features/slots/types";
import type { DateKey } from "@/lib/date/seoulDate";

/**
 * 확정 예약 관리(S06) 프론트엔드 타입.
 *
 * 검사기관이 받은 예약은 의뢰기관의 의뢰·예약과 같은 대상이므로 ReferralSummary를 그대로 쓴다.
 * (organizationId = 예약을 받은 검사기관, referringOrganization* = 의뢰기관)
 * TODO(api): 검사기관 예약 조회 API가 확정되면 응답 DTO → 이 타입으로 매핑한다.
 */
export type Reservation = ReferralSummary;

/**
 * 검색 조건. 빈 문자열은 '전체'.
 * TODO(api): 예약 조회 API의 검색 파라미터가 확정되면 이 타입을 쿼리 파라미터로 매핑한다.
 */
export interface ReservationSearchCriteria {
  /** 예약번호·의뢰기관명·가상 환자 ID 부분 일치 (대소문자 무시, 앞뒤 공백 제거) */
  keyword: string;
  /** 검사 기간 시작일 `YYYY-MM-DD` (포함, 한국 시간) */
  dateFrom: DateKey | "";
  /** 검사 기간 종료일 `YYYY-MM-DD` (포함, 한국 시간) */
  dateTo: DateKey | "";
  examType: ExamType | "";
  status: ReferralDisplayStatus | "";
  /** 현재 검사기관 장비 ID */
  equipmentId: string;
  referringOrganizationId: string;
}

/** 장비 필터 선택지 (현재 검사기관 장비) */
export type ReservationEquipmentOption = Pick<Equipment, "id" | "name" | "examType">;

/** 의뢰기관 필터 선택지 (현재 기관 예약에서 추출) */
export interface ReferringOrganizationOption {
  id: string;
  name: string;
}

/** 예약 현황 요약 (집계 기준은 query.ts 참고) */
export interface ReservationSummaryCounts {
  today: number;
  byStatus: Record<ReferralDisplayStatus, number>;
}

import { isUpcomingSlot } from "@/features/slots/availability";
import type { ExamSlot, PartnerOrganization } from "@/features/slots/types";

import type { ReferralFormInput } from "./types";

/**
 * 의뢰 요청 입력 검증 (프론트엔드 1차 검증).
 * 최종 판단(슬롯 선점 충돌, HOLD 만료 등)은 서버가 한다. 서버 규칙 확정 시 형식·길이 기준을 맞춘다.
 */

/** 가상 환자 ID 형식: DEMO-숫자 (테스트 식별자만 허용 · 실제 환자 정보 입력 방지) */
export const VIRTUAL_PATIENT_ID_PATTERN = /^DEMO-\d{1,8}$/;

/** 의뢰 목적 최대 길이 (백엔드 기준 확인 필요) */
export const PURPOSE_MAX_LENGTH = 200;

export type ReferralFieldErrors = Partial<
  Record<"virtualPatientId" | "examType" | "organizationId" | "slot" | "purpose", string>
>;

/** 앞뒤 공백 제거 */
export function normalizeReferralInput(input: ReferralFormInput): ReferralFormInput {
  return {
    ...input,
    virtualPatientId: input.virtualPatientId.trim(),
    purpose: input.purpose.trim(),
  };
}

/**
 * 선택한 슬롯이 아직 예약 가능한지 검증한다 (의뢰 생성·재조정 공통).
 * @param slot 슬롯 ID로 다시 조회한 슬롯 (없으면 null)
 * @returns 오류 문구. 문제가 없으면 undefined
 */
export function validateSelectedSlot(
  slot: ExamSlot | null,
  slotId: string,
  nowDateTime: string,
): string | undefined {
  if (!slot || slot.id !== slotId) return "검사 슬롯을 다시 선택해 주세요.";
  if (!slot.isAvailable) return "예약이 마감된 슬롯입니다. 검사 슬롯을 다시 선택해 주세요.";
  if (!isUpcomingSlot(slot, nowDateTime)) {
    return "검사 시간이 이미 지난 슬롯입니다. 검사 슬롯을 다시 선택해 주세요.";
  }
  return undefined;
}

/**
 * 입력값과 선택한 슬롯이 일치하는지 검증한다.
 * @param slot slotId로 다시 조회한 슬롯 (없으면 null)
 * @param nowDateTime 현재 한국 시각 `YYYY-MM-DDTHH:mm`
 */
export function validateReferralInput(
  input: ReferralFormInput,
  slot: ExamSlot | null,
  organizations: PartnerOrganization[],
  nowDateTime: string,
): ReferralFieldErrors {
  const errors: ReferralFieldErrors = {};

  if (!input.virtualPatientId) {
    errors.virtualPatientId = "가상 환자 ID를 입력해 주세요.";
  } else if (!VIRTUAL_PATIENT_ID_PATTERN.test(input.virtualPatientId)) {
    errors.virtualPatientId = "가상 환자 ID는 DEMO-숫자 형식으로 입력해 주세요. (예: DEMO-1024)";
  }

  const slotError = validateSelectedSlot(slot, input.slotId, nowDateTime);
  if (slotError) errors.slot = slotError;
  if (slot && slot.id === input.slotId) {
    if (input.examType !== slot.examType) {
      errors.examType = "검사 유형이 선택한 슬롯과 일치하지 않습니다.";
    }
    const isKnownOrganization = organizations.some(({ id }) => id === input.organizationId);
    if (!isKnownOrganization || input.organizationId !== slot.organizationId) {
      errors.organizationId = "협력 검사기관이 선택한 슬롯과 일치하지 않습니다.";
    }
  }

  if (input.purpose.length > PURPOSE_MAX_LENGTH) {
    errors.purpose = `의뢰 목적은 ${PURPOSE_MAX_LENGTH}자 이내로 입력해 주세요.`;
  }

  return errors;
}

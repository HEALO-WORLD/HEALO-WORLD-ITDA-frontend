import type { Examination, ExamResultInput, ExamResultStatus, ResultRegistrationStatus } from "./types";

/** 결과 텍스트 최대 길이 (서버 제한 확인 필요) */
export const RESULT_TEXT_MAX_LENGTH = 1000;

export const RESULT_STATUS_LABELS: Record<ExamResultStatus, string> = {
  PRELIMINARY: "예비 판독",
  FINAL: "최종 판독",
  NEEDS_REVIEW: "추가 확인 필요",
};

/** 결과 등록 상태 (예약 상태·검사 진행 상태·결과 유무에서 계산) */
export function getResultRegistrationStatus(examination: Examination): ResultRegistrationStatus {
  if (examination.result) return "REGISTERED";
  if (examination.reservationStatus === "CANCELLED" || examination.progressStatus === "NOT_PERFORMED") {
    return "NOT_APPLICABLE";
  }
  return examination.progressStatus === "COMPLETED" ? "PENDING" : "BEFORE_EXAM";
}

/** 결과를 등록할 수 없는 이유. 등록 가능하면 null */
export function getRegistrationBlockReason(examination: Examination): string | null {
  if (examination.reservationStatus === "CANCELLED") return "취소된 예약은 결과를 등록할 수 없습니다.";
  if (examination.result) return "이미 결과가 등록된 검사입니다.";
  if (examination.progressStatus !== "COMPLETED") return "검사가 완료된 뒤에 결과를 등록할 수 있습니다.";
  return null;
}

export type ResultInputErrors = Partial<Record<keyof ExamResultInput, string>>;

/** 결과 등록 입력 검증 */
export function validateResultInput({ status, text }: ExamResultInput): ResultInputErrors {
  const errors: ResultInputErrors = {};
  if (!status) errors.status = "검사 결과 상태를 선택해 주세요.";
  const trimmed = text.trim();
  if (!trimmed) errors.text = "검사 결과 텍스트를 입력해 주세요.";
  else if (trimmed.length > RESULT_TEXT_MAX_LENGTH) {
    errors.text = `검사 결과 텍스트는 ${RESULT_TEXT_MAX_LENGTH}자 이하로 입력해 주세요.`;
  }
  return errors;
}

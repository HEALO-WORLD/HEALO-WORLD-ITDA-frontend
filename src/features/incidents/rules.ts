import type { EquipmentIncident } from "./types";

/** 장애 사유 최대 길이 (서버 제한 확인 필요) */
export const INCIDENT_REASON_MAX_LENGTH = 200;

/** `YYYY-MM-DDTHH:mm` 형식 */
const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** 장애 등록 입력값 */
export interface IncidentRegisterInput {
  equipmentId: string;
  /** 장애 발생 일시 (`YYYY-MM-DDTHH:mm`, 한국 시간) */
  occurredAt: string;
  reason: string;
}

export type IncidentRegisterErrors = Partial<Record<keyof IncidentRegisterInput, string>>;

interface RegisterContext {
  /** 현재 검사기관 장비 ID */
  organizationEquipmentIds: ReadonlySet<string>;
  /** 진행 중 장애가 있는 장비 ID */
  activeEquipmentIds: ReadonlySet<string>;
  nowDateTime: string;
}

/** 장애 등록 입력 검증 (등록 화면과 Mock 등록 함수가 함께 쓴다) */
export function validateIncidentRegister(
  { equipmentId, occurredAt, reason }: IncidentRegisterInput,
  { organizationEquipmentIds, activeEquipmentIds, nowDateTime }: RegisterContext,
): IncidentRegisterErrors {
  const errors: IncidentRegisterErrors = {};

  if (!equipmentId) errors.equipmentId = "장애 장비를 선택해 주세요.";
  else if (!organizationEquipmentIds.has(equipmentId)) errors.equipmentId = "우리 기관 장비가 아닙니다.";
  else if (activeEquipmentIds.has(equipmentId)) {
    errors.equipmentId = "이미 장애가 진행 중인 장비입니다. 기존 장애를 복구한 뒤 등록해 주세요.";
  }

  if (!DATE_TIME_PATTERN.test(occurredAt)) errors.occurredAt = "장애 발생 날짜와 시각을 입력해 주세요.";
  else if (occurredAt > nowDateTime) errors.occurredAt = "장애 발생 일시는 현재 시각 이후로 지정할 수 없습니다.";

  const trimmed = reason.trim();
  if (!trimmed) errors.reason = "장애 사유를 입력해 주세요.";
  else if (trimmed.length > INCIDENT_REASON_MAX_LENGTH) {
    errors.reason = `장애 사유는 ${INCIDENT_REASON_MAX_LENGTH}자 이하로 입력해 주세요.`;
  }

  return errors;
}

export const hasErrors = (errors: IncidentRegisterErrors) => Object.values(errors).some(Boolean);

/** 복구할 수 없는 이유. 복구 가능하면 null */
export function getResolveBlockReason(incident: EquipmentIncident, nowDateTime: string): string | null {
  if (incident.status !== "ACTIVE") return "이미 복구 완료된 장애입니다.";
  if (nowDateTime < incident.occurredAt) return "복구 일시가 장애 발생 일시보다 빠를 수 없습니다.";
  return null;
}

import { AlertTriangle, Info } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

import DatePicker from "@/components/ui/DatePicker";
import { controlClass, fieldLabelClass, SelectInput } from "@/components/ui/FormControls";
import { getSeoulNow, type DateKey } from "@/lib/date/seoulDate";

import { registerMockIncident } from "../mockIncidentStore";
import {
  hasErrors,
  INCIDENT_REASON_MAX_LENGTH,
  validateIncidentRegister,
  type IncidentRegisterErrors,
} from "../rules";
import type { EquipmentIncident, IncidentEquipmentOption } from "../types";

interface IncidentRegisterFormProps {
  organizationId: string;
  /** 현재 검사기관 장비 */
  equipments: readonly IncidentEquipmentOption[];
  /** 진행 중 장애가 있는 장비 ID (중복 등록 방지) */
  activeEquipmentIds: ReadonlySet<string>;
  onCancel: () => void;
  onRegistered: (incident: EquipmentIncident) => void;
}

type Field = "equipmentId" | "occurredAt" | "reason";

/**
 * 장비 장애 등록 (⚠️ Mock: 이 브라우저에만 저장된다).
 * 입력값이 모두 올바를 때만 [등록]이 활성화되며, 오류는 해당 항목을 건드린 뒤(또는 등록 시도 후) 표시한다.
 */
export default function IncidentRegisterForm({
  organizationId,
  equipments,
  activeEquipmentIds,
  onCancel,
  onRegistered,
}: IncidentRegisterFormProps) {
  // 기본값은 모달을 연 시점의 한국 시각
  const [initialNow] = useState(() => getSeoulNow());
  const [equipmentId, setEquipmentId] = useState("");
  const [date, setDate] = useState<DateKey | "">(initialNow.dateKey);
  const [time, setTime] = useState(initialNow.dateTime.slice(11, 16));
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState<ReadonlySet<Field>>(() => new Set());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const occurredAt = date && time ? `${date}T${time}` : "";
  const input = { equipmentId, occurredAt, reason };
  // 미래 시각 검증은 입력할 때마다 현재 시각으로 다시 한다
  const errors: IncidentRegisterErrors = validateIncidentRegister(input, {
    organizationEquipmentIds: new Set(equipments.map(({ id }) => id)),
    activeEquipmentIds,
    nowDateTime: getSeoulNow().dateTime,
  });
  const isValid = !hasErrors(errors);
  const touch = (field: Field) => setTouched((prev) => new Set(prev).add(field));
  const visibleError = (field: Field) => (touched.has(field) ? errors[field] : undefined);

  const equipmentOptions = [
    { value: "", label: "장비를 선택해 주세요" },
    ...[...equipments]
      .sort((a, b) => a.examType.localeCompare(b.examType) || a.name.localeCompare(b.name, "ko", { numeric: true }))
      .map(({ id, name, examType }) => ({
        value: id,
        label: `${name} (${examType})${activeEquipmentIds.has(id) ? " · 장애 진행 중" : ""}`,
      })),
  ];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(new Set<Field>(["equipmentId", "occurredAt", "reason"]));
    if (submittingRef.current || !isValid) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await registerMockIncident(organizationId, input);
      if (result.ok) {
        onRegistered(result.incident);
        return;
      }
      setSubmitError(result.message);
    } catch {
      setSubmitError("장애를 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
    submittingRef.current = false;
    setIsSubmitting(false);
  };

  const equipmentError = visibleError("equipmentId");
  const occurredAtError = visibleError("occurredAt");
  const reasonError = visibleError("reason");

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
      {submitError && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-[15px] text-red-700">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>{submitError}</p>
        </div>
      )}

      <fieldset disabled={isSubmitting} className="flex flex-col gap-5">
        <div>
          <SelectInput
            id="incident-register-equipment"
            label="장애 장비"
            data-autofocus
            options={equipmentOptions}
            value={equipmentId}
            aria-invalid={equipmentError ? true : undefined}
            aria-describedby={equipmentError ? "incident-register-equipment-error" : undefined}
            onChange={(e) => {
              setEquipmentId(e.target.value);
              touch("equipmentId");
            }}
            onBlur={() => touch("equipmentId")}
          />
          {equipmentError && (
            <p id="incident-register-equipment-error" className="mt-1.5 text-sm text-red-600">
              {equipmentError}
            </p>
          )}
        </div>

        <div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
            <DatePicker
              id="incident-register-date"
              label="장애 발생 날짜"
              value={date}
              onChange={(value) => {
                setDate(value);
                touch("occurredAt");
              }}
              getDisabledReason={(key) => (key > getSeoulNow().dateKey ? "미래 날짜" : null)}
              placeholder="날짜 선택"
              disabledNote="오늘 이후 날짜는 선택할 수 없습니다."
            />
            <div>
              <label htmlFor="incident-register-time" className={fieldLabelClass}>
                발생 시각
              </label>
              <input
                id="incident-register-time"
                type="time"
                step={60}
                value={time}
                aria-invalid={occurredAtError ? true : undefined}
                aria-describedby={occurredAtError ? "incident-register-occurred-error" : undefined}
                onChange={(e) => {
                  setTime(e.target.value);
                  touch("occurredAt");
                }}
                className={`${controlClass} pr-4 ${occurredAtError ? "border-red-500" : ""}`}
              />
            </div>
          </div>
          <p className="mt-1.5 text-sm text-gray-500">한국 시간 기준이며, 현재 시각 이후는 지정할 수 없습니다.</p>
          {occurredAtError && (
            <p id="incident-register-occurred-error" className="mt-1 text-sm text-red-600">
              {occurredAtError}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="incident-register-reason" className={fieldLabelClass}>
            장애 사유 <span className="text-red-600">*</span>
          </label>
          <textarea
            id="incident-register-reason"
            rows={4}
            maxLength={INCIDENT_REASON_MAX_LENGTH}
            value={reason}
            placeholder="예: 냉각 시스템 오류로 장비 사용 중단"
            aria-invalid={reasonError ? true : undefined}
            aria-describedby={`incident-register-reason-count${reasonError ? " incident-register-reason-error" : ""}`}
            onChange={(e) => {
              setReason(e.target.value);
              touch("reason");
            }}
            onBlur={() => touch("reason")}
            className={`w-full resize-y rounded-lg border bg-white px-4 py-3 text-[15px] text-gray-900 outline-none placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
              reasonError ? "border-red-500" : "border-line"
            }`}
          />
          <div className="mt-1.5 flex justify-between gap-3 text-sm">
            <p id="incident-register-reason-error" className="text-red-600">
              {reasonError}
            </p>
            <p id="incident-register-reason-count" className="shrink-0 tabular-nums text-gray-500">
              {reason.trim().length} / {INCIDENT_REASON_MAX_LENGTH}자
            </p>
          </div>
        </div>
      </fieldset>

      <div className="mt-5 flex items-start gap-2 rounded-lg border border-dashed border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          <strong className="mr-1 font-semibold">[API 미연동]</strong>
          개발용 예시 동작입니다. 등록 내용은 이 브라우저에만 저장되며, 서버 저장·예약 재조정·의뢰기관 알림 발송은 되지
          않습니다.
        </p>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-12 rounded-lg border border-line bg-white px-6 text-[15px] font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="h-12 rounded-lg bg-primary px-6 text-[15px] font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          {isSubmitting ? "등록 중" : "장애 등록"}
        </button>
      </div>
      {!isValid && !isSubmitting && (
        <p className="mt-3 text-center text-sm text-gray-500 sm:text-right">
          장애 장비·발생일시·사유를 올바르게 입력하면 등록할 수 있습니다.
        </p>
      )}
    </form>
  );
}

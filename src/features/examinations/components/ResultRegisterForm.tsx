import { AlertTriangle, ChevronDown, Info } from "lucide-react";
import { useId, useRef, useState, type FormEvent } from "react";

import DetailList from "@/features/referrals/components/DetailList";
import { formatDateTimeWithWeekday } from "@/lib/format/date";

import { registerExaminationResult } from "../register";
import {
  getRegistrationBlockReason,
  RESULT_STATUS_LABELS,
  RESULT_TEXT_MAX_LENGTH,
  validateResultInput,
  type ResultInputErrors,
} from "../rules";
import type { ExamResult, ExamResultInput, ExamResultStatus, Examination } from "../types";

interface ResultRegisterFormProps {
  examination: Examination;
  onCancel: () => void;
  /** 등록 성공 시 등록된 결과를 전달한다 (화면 상태 반영은 호출한 쪽에서) */
  onRegistered: (result: ExamResult) => void;
}

const fieldLabelClass = "mb-2 block text-[15px] font-bold text-gray-800";
const controlClass =
  "w-full rounded-lg border bg-white text-[15px] text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

/**
 * 검사 결과 등록 (상태 + 텍스트, 영상 파일 업로드 없음).
 * ⚠️ Mock: 서버에 저장하지 않고 이 화면 상태에만 반영된다.
 */
export default function ResultRegisterForm({ examination, onCancel, onRegistered }: ResultRegisterFormProps) {
  const errorBaseId = useId();
  const [input, setInput] = useState<ExamResultInput>({ status: "", text: "" });
  const [errors, setErrors] = useState<ResultInputErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 상태 반영 전 빠른 연속 클릭까지 막는다
  const submittingRef = useRef(false);

  const blockReason = getRegistrationBlockReason(examination);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current || blockReason) return;

    const nextErrors = validateResultInput(input);
    setErrors(nextErrors);
    setSubmitError(null);
    if (nextErrors.status || nextErrors.text) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const outcome = await registerExaminationResult(examination, input);
      if (outcome.ok) {
        onRegistered(outcome.result);
        return;
      }
      setSubmitError(outcome.message);
    } catch {
      setSubmitError("결과를 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
    submittingRef.current = false;
    setIsSubmitting(false);
  };

  const statusErrorId = `${errorBaseId}-status`;
  const textErrorId = `${errorBaseId}-text`;
  const trimmedLength = input.text.trim().length;

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
      <section aria-label="검사 정보" className="rounded-lg bg-surface-muted px-5 py-4">
        <DetailList
          items={[
            ["의뢰번호", examination.referralNumber],
            ["가상 환자 ID", examination.virtualPatientId],
            ["검사", `${examination.examType} · ${examination.equipmentName}`],
            ["검사 일시", formatDateTimeWithWeekday(examination.scheduledAt)],
          ]}
        />
      </section>

      {(blockReason || submitError) && (
        <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-[15px] text-red-700">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>{blockReason ?? submitError}</p>
        </div>
      )}

      <fieldset disabled={Boolean(blockReason) || isSubmitting} className="mt-5 flex flex-col gap-5">
        <div>
          <label htmlFor="result-status" className={fieldLabelClass}>
            검사 결과 상태 <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <select
              id="result-status"
              data-autofocus
              value={input.status}
              aria-invalid={errors.status ? true : undefined}
              aria-describedby={errors.status ? statusErrorId : undefined}
              onChange={(e) => {
                setInput((prev) => ({ ...prev, status: e.target.value as ExamResultStatus | "" }));
                setErrors((prev) => ({ ...prev, status: undefined }));
              }}
              className={`${controlClass} h-12 cursor-pointer appearance-none pl-4 pr-11 ${
                errors.status ? "border-red-500" : "border-line"
              }`}
            >
              <option value="">선택해 주세요</option>
              {(Object.entries(RESULT_STATUS_LABELS) as [ExamResultStatus, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-gray-500"
              aria-hidden="true"
            />
          </div>
          {errors.status && (
            <p id={statusErrorId} className="mt-1.5 text-sm text-red-600">
              {errors.status}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="result-text" className={fieldLabelClass}>
            검사 결과 텍스트 <span className="text-red-600">*</span>
          </label>
          <textarea
            id="result-text"
            rows={6}
            maxLength={RESULT_TEXT_MAX_LENGTH}
            value={input.text}
            placeholder="검사 결과를 입력해 주세요."
            aria-invalid={errors.text ? true : undefined}
            aria-describedby={`${textErrorId}-count${errors.text ? ` ${textErrorId}` : ""}`}
            onChange={(e) => {
              setInput((prev) => ({ ...prev, text: e.target.value }));
              setErrors((prev) => ({ ...prev, text: undefined }));
            }}
            className={`${controlClass} resize-y px-4 py-3 placeholder:text-gray-400 ${
              errors.text ? "border-red-500" : "border-line"
            }`}
          />
          <div className="mt-1.5 flex justify-between gap-3 text-sm">
            <p id={textErrorId} className="text-red-600">
              {errors.text}
            </p>
            <p id={`${textErrorId}-count`} className="shrink-0 tabular-nums text-gray-500">
              {trimmedLength} / {RESULT_TEXT_MAX_LENGTH}자
            </p>
          </div>
        </div>
      </fieldset>

      <div className="mt-5 flex items-start gap-2 rounded-lg border border-dashed border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          <strong className="mr-1 font-semibold">[API 미연동]</strong>
          개발용 예시 동작입니다. 결과는 이 화면에만 반영되며 서버에 저장되거나 의뢰기관에 전달되지 않습니다.
          새로고침하면 초기 상태로 돌아갑니다.
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
          disabled={isSubmitting || Boolean(blockReason)}
          className="h-12 rounded-lg bg-primary px-6 text-[15px] font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          {isSubmitting ? "등록 중" : "결과 등록"}
        </button>
      </div>
    </form>
  );
}

import { AlertTriangle, Info } from "lucide-react";
import { useState, type FormEvent } from "react";

import { TextInput } from "@/components/ui/FormControls";
import { getSlotById } from "@/features/slots/api";
import type { ExamSlot, PartnerOrganization } from "@/features/slots/types";
import { getSeoulNow } from "@/lib/date/seoulDate";
import { formatDateTimeWithWeekday } from "@/lib/format/date";

import type { ReferralFormInput } from "../types";
import {
  normalizeReferralInput,
  PURPOSE_MAX_LENGTH,
  validateReferralInput,
  type ReferralFieldErrors,
} from "../validation";

import DetailList from "./DetailList";

interface ReferralCreateFormProps {
  /** 슬롯 검색에서 선택한 슬롯. 화면에서는 읽기 전용으로만 표시한다 */
  slot: ExamSlot;
  organizations: PartnerOrganization[];
  onCancel: () => void;
}

const MOCK_NOTICE =
  "입력 정보가 확인되었습니다. 현재는 개발용 Mock 화면으로, 실제 의뢰 및 예약 요청은 처리되지 않습니다.";

/**
 * 새 검사 의뢰 입력 (슬롯 검색의 의뢰 생성 모달 내용).
 * 검사기관·장비·유형·일시는 선택한 슬롯 값으로 고정하며, 바꾸려면 모달을 닫고 다른 슬롯을 선택한다.
 * 제출 시 슬롯 ID로 슬롯을 다시 조회해 예약 가능 여부(마감·지난 시간)와 유형·기관 일치를 검증한다.
 *
 * TODO(api): 의뢰 생성 API 연동 전까지 검증만 하고 요청은 보내지 않는다.
 * 슬롯 상태·예약 내역도 변경하지 않는다.
 */
export default function ReferralCreateForm({ slot, organizations, onCancel }: ReferralCreateFormProps) {
  const [virtualPatientId, setVirtualPatientId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [errors, setErrors] = useState<ReferralFieldErrors>({});
  const [isChecking, setIsChecking] = useState(false);
  const [showMockNotice, setShowMockNotice] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isChecking || errors.slot) return;

    const input: ReferralFormInput = normalizeReferralInput({
      virtualPatientId,
      purpose,
      // 유형·기관은 선택한 슬롯 값으로만 채운다 (화면에서 변경 불가)
      examType: slot.examType,
      organizationId: slot.organizationId,
      slotId: slot.id,
    });
    setVirtualPatientId(input.virtualPatientId);
    setPurpose(input.purpose);

    setIsChecking(true);
    // 표시 중인 값이 아니라 슬롯 데이터에서 다시 조회한 값으로 검증한다
    const latestSlot = await getSlotById(slot.id);
    const nextErrors = validateReferralInput(input, latestSlot, organizations, getSeoulNow().dateTime);
    setIsChecking(false);
    setErrors(nextErrors);

    // 검증을 통과해도 실제 의뢰·예약 요청은 보내지 않고 미연동 안내만 표시한다
    setShowMockNotice(Object.keys(nextErrors).length === 0);
  };

  /** 유형·기관 불일치도 슬롯을 다시 골라야 하므로 슬롯 오류로 함께 안내한다 */
  const slotError = errors.slot ?? errors.examType ?? errors.organizationId;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <section aria-label="선택한 검사 슬롯" className="rounded-lg bg-surface-muted px-4 py-4">
        <DetailList
          items={[
            ["검사기관", slot.organizationName],
            ["검사 장비", slot.equipmentName],
            ["검사 유형", slot.examType],
            ["검사 일시", formatDateTimeWithWeekday(slot.startAt)],
          ]}
        />
      </section>
      <p className="mt-2 text-sm text-gray-500">
        검사 슬롯을 바꾸려면 창을 닫고 검색 결과에서 다른 슬롯을 선택해 주세요.
      </p>

      {slotError && (
        <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-[15px] text-red-700">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>{slotError}</p>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-5">
        <TextInput
          id="referral-patient-id"
          label="가상 환자 ID"
          placeholder="예: DEMO-1024"
          autoComplete="off"
          data-autofocus
          required
          maxLength={20}
          value={virtualPatientId}
          onChange={(e) => {
            setVirtualPatientId(e.target.value);
            setShowMockNotice(false);
          }}
          error={errors.virtualPatientId}
        />
        <TextInput
          id="referral-purpose"
          label="의뢰 목적"
          placeholder="(선택 입력)"
          maxLength={PURPOSE_MAX_LENGTH}
          value={purpose}
          onChange={(e) => {
            setPurpose(e.target.value);
            setShowMockNotice(false);
          }}
          error={errors.purpose}
        />
      </div>

      {showMockNotice && (
        <div
          role="status"
          className="mt-5 flex items-start gap-2 rounded-lg border border-dashed border-amber-400 bg-amber-50 px-4 py-3 text-[15px] text-amber-900"
        >
          <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>
            <strong className="mr-1.5 font-semibold">[API 미연동]</strong>
            {MOCK_NOTICE}
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 rounded-lg border border-line bg-white px-6 text-[15px] font-semibold text-gray-700 hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isChecking || Boolean(slotError)}
          className="h-12 rounded-lg bg-primary px-6 text-[15px] font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          {isChecking ? "확인 중" : "의뢰·예약 요청"}
        </button>
      </div>
      <p className="mt-3 text-center text-sm text-gray-500 sm:text-right">
        슬롯 확보에 성공하면 예약이 자동 확정됩니다.
      </p>
    </form>
  );
}

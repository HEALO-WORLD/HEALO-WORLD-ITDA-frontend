import { AlertTriangle, Info } from "lucide-react";
import { useMemo, useRef, useState, type FormEvent } from "react";

import DatePicker from "@/components/ui/DatePicker";
import { controlClass, fieldLabelClass, SelectInput } from "@/components/ui/FormControls";
import { getSeoulNow, type DateKey } from "@/lib/date/seoulDate";

import {
  generateMockSlots,
  getEquipmentSlotStartAts,
  getSlotRangeEnd,
  type EquipmentChanges,
} from "../mockEquipmentStore";
import { formatOperatingHoursSummary } from "../operatingHours";
import { MAX_SLOT_GENERATION_DAYS, previewSlotGeneration, type SlotGenerationInput } from "../rules";
import type { Equipment } from "../types";

interface SlotGenerationFormProps {
  organizationId: string;
  equipments: readonly Equipment[];
  /** 처음 선택할 장비 (목록에서 고른 장비) */
  initialEquipmentId: string | null;
  /** 현재 장비·슬롯 변경분 (미리보기의 기존 슬롯 계산용) */
  changes: EquipmentChanges;
  /** 진행 중 장애가 있는 장비 ID (장애 이력 기준) */
  failedEquipmentIds: ReadonlySet<string>;
  onCancel: () => void;
  onGenerated: (message: string, equipmentId: string, firstDate: DateKey) => void;
}

/**
 * 슬롯 생성 (⚠️ Mock: 이 브라우저에만 저장된다).
 * 장비 운영 시간(휴게·휴무 제외)과 슬롯 소요 시간으로 나누며, 생성 전에 예상 건수와 제외 건수를 보여 준다.
 * 같은 장비의 기존 슬롯과 시간이 겹치면 만들지 않는다 (원본 슬롯의 예약·HOLD·마감 상태를 덮어쓰지 않는다).
 */
export default function SlotGenerationForm({
  organizationId,
  equipments,
  initialEquipmentId,
  changes,
  failedEquipmentIds,
  onCancel,
  onGenerated,
}: SlotGenerationFormProps) {
  const [now] = useState(() => getSeoulNow());
  const [input, setInput] = useState<SlotGenerationInput>({
    equipmentId: initialEquipmentId ?? "",
    startDate: now.dateKey,
    endDate: now.dateKey,
    useOperatingHours: true,
    customStart: "09:00",
    customEnd: "12:00",
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const rangeEnd = getSlotRangeEnd(now.dateKey);

  const equipment = equipments.find(({ id }) => id === input.equipmentId) ?? null;
  const preview = useMemo(
    () =>
      previewSlotGeneration(input, {
        equipment,
        isEquipmentFailed: equipment ? failedEquipmentIds.has(equipment.id) : false,
        existingStartAts: equipment ? getEquipmentSlotStartAts(changes, equipment.id) : [],
        existingSlotMinutes: equipment?.slotMinutes ?? 30,
        today: now.dateKey,
        nowDateTime: getSeoulNow().dateTime,
        rangeEnd,
      }),
    [input, equipment, failedEquipmentIds, changes, now.dateKey, rangeEnd],
  );
  const canGenerate = preview.errors.length === 0 && !isSubmitting;
  const update = (patch: Partial<SlotGenerationInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const equipmentOptions = [
    { value: "", label: "장비를 선택해 주세요" },
    ...equipments.map(({ id, name, examType, status }) => ({
      value: id,
      label: `${name} (${examType})${status === "FAILURE" ? " · 장애 진행 중" : ""}`,
    })),
  ];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current || preview.errors.length > 0 || !equipment) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // 장애 여부는 장애 이력(호출 시점) 기준으로 다시 확인한다
      const result = await generateMockSlots(organizationId, input, (id) => failedEquipmentIds.has(id));
      if (result.ok) {
        const created = result.value.startAts;
        onGenerated(
          `${equipment.name} 슬롯 ${created.length}개를 생성했습니다.${
            result.value.duplicateCount > 0 ? ` (기존 슬롯과 겹친 ${result.value.duplicateCount}개 제외)` : ""
          }`,
          equipment.id,
          created[0].slice(0, 10),
        );
        return;
      }
      setSubmitError(result.message);
    } catch {
      setSubmitError("슬롯을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
    submittingRef.current = false;
    setIsSubmitting(false);
  };

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
            id="slot-generation-equipment"
            label="대상 장비"
            data-autofocus
            options={equipmentOptions}
            value={input.equipmentId}
            onChange={(e) => update({ equipmentId: e.target.value })}
          />
          {equipment && (
            <p className="mt-1.5 text-sm text-gray-500">
              운영 시간 {formatOperatingHoursSummary(equipment.operatingHours)} · 슬롯 {equipment.slotMinutes}분 단위
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DatePicker
            id="slot-generation-start"
            label="생성 시작일"
            value={input.startDate}
            onChange={(startDate) => update({ startDate })}
            disablePast
            getDisabledReason={(key) => (key > rangeEnd ? "조회 범위 밖" : null)}
            placeholder="시작일 선택"
          />
          <DatePicker
            id="slot-generation-end"
            label="생성 종료일"
            value={input.endDate}
            onChange={(endDate) => update({ endDate })}
            disablePast
            getDisabledReason={(key) => (key > rangeEnd ? "조회 범위 밖" : null)}
            placeholder="종료일 선택"
          />
        </div>
        <p className="-mt-3 text-sm text-gray-500">
          오늘부터 {rangeEnd}까지, 한 번에 최대 {MAX_SLOT_GENERATION_DAYS}일을 생성할 수 있습니다.
        </p>

        <div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-[15px] font-medium text-gray-900">
            <input
              type="checkbox"
              checked={input.useOperatingHours}
              onChange={(e) => update({ useOperatingHours: e.target.checked })}
              className="size-[18px] cursor-pointer accent-primary"
            />
            장비 운영 시간 전체에 생성
          </label>
          {!input.useOperatingHours && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-[360px]">
              <div>
                <label htmlFor="slot-generation-custom-start" className={fieldLabelClass}>
                  시작 시각
                </label>
                <input
                  id="slot-generation-custom-start"
                  type="time"
                  step={300}
                  value={input.customStart}
                  onChange={(e) => update({ customStart: e.target.value })}
                  className={`${controlClass} pr-3`}
                />
              </div>
              <div>
                <label htmlFor="slot-generation-custom-end" className={fieldLabelClass}>
                  종료 시각
                </label>
                <input
                  id="slot-generation-custom-end"
                  type="time"
                  step={300}
                  value={input.customEnd}
                  onChange={(e) => update({ customEnd: e.target.value })}
                  className={`${controlClass} pr-3`}
                />
              </div>
              <p className="col-span-2 text-sm text-gray-500">
                운영 요일의 운영 시간 안에서만, 휴게 시간을 빼고 생성합니다.
              </p>
            </div>
          )}
        </div>
      </fieldset>

      {/* 생성 전 미리보기 */}
      <section aria-labelledby="slot-generation-preview-title" aria-live="polite" className="mt-5 rounded-lg bg-surface-muted px-4 py-4">
        <h3 id="slot-generation-preview-title" className="text-sm font-bold text-gray-700">
          생성 미리보기
        </h3>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-[15px] sm:grid-cols-4">
          <PreviewItem label="대상 장비">{equipment?.name ?? "-"}</PreviewItem>
          <PreviewItem label="적용 기간">
            {input.startDate && input.endDate ? `${input.startDate.slice(5)} ~ ${input.endDate.slice(5)}` : "-"}
          </PreviewItem>
          <PreviewItem label="생성 예정">{`${preview.startAts.length}개`}</PreviewItem>
          <PreviewItem label="겹쳐서 제외">{`${preview.duplicateCount}개`}</PreviewItem>
        </dl>
        {preview.pastCount > 0 && (
          <p className="mt-2 text-sm text-gray-500">오늘 이미 지난 시각 {preview.pastCount}개는 제외합니다.</p>
        )}
        {preview.startAts.length > 0 && (
          <p className="mt-2 break-words text-sm text-gray-600">
            예: {preview.startAts.slice(0, 6).map((startAt) => startAt.slice(5).replace("T", " ")).join(", ")}
            {preview.startAts.length > 6 ? " …" : ""}
          </p>
        )}
        {preview.errors.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1 text-sm text-red-600">
            {preview.errors.map((error) => (
              <li key={error}>· {error}</li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-dashed border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          <strong className="mr-1 font-semibold">[API 미연동]</strong>
          생성한 슬롯은 이 브라우저에만 저장되며, 이 브라우저의 의뢰기관 슬롯 검색에도 표시됩니다.
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
          disabled={!canGenerate}
          className="h-12 rounded-lg bg-primary px-6 text-[15px] font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          {isSubmitting ? "생성 중" : `슬롯 ${preview.startAts.length}개 생성`}
        </button>
      </div>
    </form>
  );
}

function PreviewItem({ label, children }: { label: string; children: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="truncate font-semibold tabular-nums text-gray-900" title={children}>
        {children}
      </dd>
    </div>
  );
}

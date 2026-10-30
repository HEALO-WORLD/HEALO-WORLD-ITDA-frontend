import { PauseCircle, PlayCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import DetailList from "@/features/referrals/components/DetailList";
import type { ExamSlot } from "@/features/slots/types";
import { formatDateTimeWithWeekday } from "@/lib/format/date";

import { getSlotSuspendBlockReason, setMockSlotSuspended, type EquipmentChanges } from "../mockEquipmentStore";
import { addMinutesToTime } from "../operatingHours";

import { getSlotDisplayStatus, SLOT_STATUS_META } from "./DaySlotList";

interface SlotDetailProps {
  organizationId: string;
  slot: ExamSlot;
  slotMinutes: number;
  nowDateTime: string;
  changes: EquipmentChanges;
  onClose: () => void;
  onChanged: (message: string) => void;
}

/**
 * 슬롯 정보 + (생성한 슬롯만) 운영 중단·재개.
 * 원본 슬롯의 '예약 불가'는 예약 완료·HOLD·마감을 구분할 수 없어 운영 중단·재개 대상에서 뺀다.
 */
export default function SlotDetail({ organizationId, slot, slotMinutes, nowDateTime, changes, onClose, onChanged }: SlotDetailProps) {
  const isSuspended = changes.suspendedSlotIds.includes(slot.id);
  const action = isSuspended ? "RESUME" : "SUSPEND";
  const blockReason = getSlotSuspendBlockReason(changes, slot, action, nowDateTime);
  const isCreated = changes.slots.some(({ id }) => id === slot.id);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isConfirming) cancelRef.current?.focus();
  }, [isConfirming]);

  const confirm = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    setError(null);
    try {
      const result = await setMockSlotSuspended(organizationId, slot, action);
      if (result.ok) {
        onChanged(
          action === "SUSPEND"
            ? `${slot.equipmentName} ${formatDateTimeWithWeekday(slot.startAt)} 슬롯 운영을 중단했습니다.`
            : `${slot.equipmentName} ${formatDateTimeWithWeekday(slot.startAt)} 슬롯 운영을 재개했습니다.`,
        );
        return;
      }
      setError(result.message);
    } catch {
      setError("처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
    processingRef.current = false;
    setIsProcessing(false);
  };

  const statusLabel = SLOT_STATUS_META[getSlotDisplayStatus(slot, nowDateTime)].label;

  return (
    <>
      <DetailList
        items={[
          ["장비명", slot.equipmentName],
          ["검사 유형", slot.examType],
          [
            "검사 일시",
            `${formatDateTimeWithWeekday(slot.startAt)} ~ ${addMinutesToTime(slot.startAt.slice(11, 16), slotMinutes)}`,
          ],
          ["상태", statusLabel],
          ["예약 가능 여부", slot.isAvailable ? "예약 가능" : "예약 불가"],
          ["슬롯 출처", isCreated ? "검사기관에서 생성 (개발용 Mock)" : "기존 슬롯"],
        ]}
      />
      <p className="mt-4 text-sm text-gray-500">
        {isCreated
          ? "생성한 슬롯은 운영 중단·재개할 수 있습니다. 장비 장애가 진행 중이면 재개해도 예약할 수 없습니다."
          : "기존 슬롯의 예약 불가는 예약 완료·차단 등 세부 사유를 구분하지 않으며, 운영 중단·재개할 수 없습니다."}
      </p>

      {isCreated && isConfirming && (
        <div role="group" aria-labelledby="slot-suspend-confirm" className="mt-4 rounded-lg border border-primary/30 bg-primary-soft px-4 py-3">
          <p id="slot-suspend-confirm" className="text-[15px] font-semibold text-gray-900">
            {action === "SUSPEND"
              ? "이 슬롯의 운영을 중단하시겠습니까? 의뢰기관 검색에서도 예약할 수 없게 됩니다."
              : "이 슬롯의 운영을 재개하시겠습니까?"}
          </p>
          {error && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="mt-3 flex justify-end gap-2">
            <button
              ref={cancelRef}
              type="button"
              onClick={() => {
                setIsConfirming(false);
                setError(null);
              }}
              disabled={isProcessing}
              className="h-10 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              취소
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={isProcessing}
              className="h-10 rounded-lg bg-primary px-4 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {isProcessing ? "처리 중" : action === "SUSPEND" ? "운영 중단" : "운영 재개"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
        {isCreated && !isConfirming && (
          <>
            {blockReason && <p className="mr-auto text-sm text-gray-500">{blockReason}</p>}
            <button
              type="button"
              onClick={() => setIsConfirming(true)}
              disabled={Boolean(blockReason)}
              className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-line bg-white px-4 text-[15px] font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              {action === "SUSPEND" ? (
                <PauseCircle className="size-4" aria-hidden="true" />
              ) : (
                <PlayCircle className="size-4" aria-hidden="true" />
              )}
              {action === "SUSPEND" ? "운영 중단" : "운영 재개"}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-lg border border-line bg-white px-6 text-[15px] font-semibold text-gray-700 hover:bg-gray-50"
        >
          닫기
        </button>
      </div>
    </>
  );
}

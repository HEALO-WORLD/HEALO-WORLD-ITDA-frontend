import { CalendarX2, Clock } from "lucide-react";
import type { ReactNode } from "react";

import { isUpcomingSlot } from "@/features/slots/availability";
import type { ExamSlot } from "@/features/slots/types";
import type { DateKey } from "@/lib/date/seoulDate";
import { formatDateLong } from "@/lib/format/date";

import { addMinutesToTime } from "../operatingHours";

/**
 * 화면 표시용 슬롯 상태 (isAvailable·시작 시각·장비 장애 차단으로만 판단, 그 외 상태는 만들지 않는다)
 * EQUIPMENT_FAILURE = 원래 예약 가능했지만 장비 장애(진행 중)로 막힌 슬롯
 */
export type SlotDisplayStatus = "AVAILABLE" | "UNAVAILABLE" | "EQUIPMENT_FAILURE" | "PAST";

export function getSlotDisplayStatus(slot: ExamSlot, nowDateTime: string): SlotDisplayStatus {
  if (!isUpcomingSlot(slot, nowDateTime)) return "PAST";
  if (slot.blockedReason === "EQUIPMENT_FAILURE") return "EQUIPMENT_FAILURE";
  return slot.isAvailable ? "AVAILABLE" : "UNAVAILABLE";
}

export const SLOT_STATUS_META: Record<SlotDisplayStatus, { label: string; className: string }> = {
  AVAILABLE: { label: "예약 가능", className: "bg-primary-soft text-primary" },
  UNAVAILABLE: { label: "예약 불가", className: "bg-gray-100 text-gray-600" },
  EQUIPMENT_FAILURE: { label: "장비 장애", className: "bg-red-50 text-red-600" },
  PAST: { label: "지난 시간", className: "bg-white text-gray-400 ring-1 ring-inset ring-line" },
};

/** 목록 위 안내가 필요한 경우 */
export type DayListState =
  | { kind: "LOADING" }
  | { kind: "NO_EQUIPMENT" }
  | { kind: "NO_MATCH" }
  /** 선택한 날짜가 없거나 더는 조회할 수 없는 경우의 안내 */
  | { kind: "MESSAGE"; message: string }
  | { kind: "READY" };

interface DaySlotListProps {
  /** null = 선택한 날짜 없음 */
  date: DateKey | null;
  state: DayListState;
  /** 조회 대상 장비의 그날 슬롯 (시작 시각 → 장비명 순) */
  slots: ExamSlot[];
  /** 조회 대상 표시 (예: MRI 1호기 · MRI, 검색 결과 전체 12대) */
  scopeLabel: string;
  /** 개별 장비 선택 시 장비명, 전체 보기면 null */
  singleEquipmentName: string | null;
  /** 개별 장비 모드에서 같은 날 다른 장비의 슬롯 수 (빈 상태 안내용) */
  otherEquipmentSlotCount: number;
  slotMinutes: Map<string, number>;
  nowDateTime: string;
  onSelectSlot: (slot: ExamSlot) => void;
}

/** 선택 날짜의 슬롯 목록 */
export default function DaySlotList({
  date,
  state,
  slots,
  scopeLabel,
  singleEquipmentName,
  otherEquipmentSlotCount,
  slotMinutes,
  nowDateTime,
  onSelectSlot,
}: DaySlotListProps) {
  const availableCount = slots.filter((slot) => getSlotDisplayStatus(slot, nowDateTime) === "AVAILABLE").length;

  return (
    <section aria-labelledby="day-slot-title" className="flex min-w-0 flex-col rounded-xl border border-line bg-white px-4 pb-4 pt-5 sm:px-5">
      <div className="mb-3">
        <h2 id="day-slot-title" className="text-lg font-bold text-gray-900">
          {date ? formatDateLong(date) : "날짜를 선택해 주세요"}
        </h2>
        <p className="text-sm text-gray-500">
          {scopeLabel}
          {state.kind === "READY" && slots.length > 0 && (
            <> · 슬롯 {slots.length}건 · 예약 가능 {availableCount}건</>
          )}
        </p>
      </div>

      {state.kind !== "READY" ? (
        <EmptyMessage>
          {state.kind === "LOADING" && "슬롯을 불러오고 있습니다."}
          {state.kind === "NO_EQUIPMENT" && "등록된 장비가 없어 표시할 슬롯이 없습니다."}
          {state.kind === "NO_MATCH" && "검색 조건에 맞는 장비가 없어 표시할 슬롯이 없습니다."}
          {state.kind === "MESSAGE" && state.message}
        </EmptyMessage>
      ) : slots.length === 0 ? (
        <EmptyMessage>
          {singleEquipmentName
            ? otherEquipmentSlotCount > 0
              ? `${singleEquipmentName}에는 이 날짜 슬롯이 없습니다. (다른 장비 ${otherEquipmentSlotCount}건)`
              : `${singleEquipmentName}에는 이 날짜 슬롯이 없습니다.`
            : "이 날짜에는 슬롯이 없습니다."}
        </EmptyMessage>
      ) : (
        <ul className="flex max-h-[480px] flex-col gap-1.5 overflow-y-auto">
          {slots.map((slot) => {
            const status = getSlotDisplayStatus(slot, nowDateTime);
            const { label, className } = SLOT_STATUS_META[status];
            const start = slot.startAt.slice(11, 16);
            const end = addMinutesToTime(start, slotMinutes.get(slot.equipmentId) ?? 30);
            return (
              <li key={slot.id}>
                <button
                  type="button"
                  onClick={() => onSelectSlot(slot)}
                  aria-label={`${start}~${end} ${slot.equipmentName} ${slot.examType} ${label}`}
                  className={`flex w-full items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-left hover:border-primary/50 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-primary ${
                    status === "PAST" ? "opacity-70" : ""
                  }`}
                >
                  <span className="flex shrink-0 items-center gap-1.5 text-[15px] font-semibold tabular-nums text-gray-900">
                    <Clock className="size-4 text-gray-400" aria-hidden="true" />
                    {start}
                    <span className="font-normal text-gray-400">~{end}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-sm ${singleEquipmentName ? "text-gray-500" : "font-medium text-gray-800"}`}
                      title={slot.equipmentName}
                    >
                      {slot.equipmentName}
                    </span>
                    <span className="text-xs text-gray-500">{slot.examType}</span>
                  </span>
                  <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
                    {label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function EmptyMessage({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line px-4 py-10 text-center text-sm text-gray-500">
      <CalendarX2 className="size-6 text-gray-300" aria-hidden="true" />
      {children}
    </p>
  );
}

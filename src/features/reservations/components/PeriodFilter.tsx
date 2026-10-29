import { CalendarDays, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import DatePicker from "@/components/ui/DatePicker";
import type { DateKey } from "@/lib/date/seoulDate";

import { getPresetRange, type PeriodPreset } from "../query";

interface PeriodFilterProps {
  dateFrom: DateKey | "";
  dateTo: DateKey | "";
  onChange: (range: { dateFrom: DateKey | ""; dateTo: DateKey | "" }) => void;
  /** 기간을 적용해 검색한다. 조건 오류가 없어 적용되면 true */
  onApply: () => boolean;
  /** 오늘(한국 시간). 모르면 빠른 기간 선택을 비활성화한다 */
  today: DateKey | null;
  /** 기간 조건 오류 (예: 시작일 > 종료일). 있으면 [적용]을 막는다 */
  error: string | null;
}

const PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "TODAY", label: "오늘" },
  { value: "THIS_WEEK", label: "이번 주" },
  { value: "THIS_MONTH", label: "이번 달" },
];

const POPUP_WIDTH = 360;

/** 올해 날짜는 MM/DD, 다른 해는 YYYY/MM/DD */
const formatShortDate = (key: DateKey, today: DateKey | null) =>
  today && key.slice(0, 4) === today.slice(0, 4) ? key.slice(5).replace("-", "/") : key.replaceAll("-", "/");

/** 검사 기간 요약 문구 (예: 전체 기간, 10/01 ~ 10/31, 10/01 ~) */
export function formatPeriodLabel(dateFrom: DateKey | "", dateTo: DateKey | "", today: DateKey | null): string {
  if (!dateFrom && !dateTo) return "전체 기간";
  const from = dateFrom ? formatShortDate(dateFrom, today) : "";
  const to = dateTo ? formatShortDate(dateTo, today) : "";
  return `${from} ~ ${to}`.trim();
}

/**
 * 검사 기간 버튼 + 기간 선택 팝업 (빠른 기간 / 시작일 / 종료일).
 * 과거 예약 이력도 조회하므로 지난 날짜도 고를 수 있다. [적용]을 누르면 현재 조건 전체로 검색한다.
 */
export default function PeriodFilter({ dateFrom, dateTo, onChange, onApply, today, error }: PeriodFilterProps) {
  const dialogId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);

  const hasPeriod = Boolean(dateFrom || dateTo);
  const activePreset = today
    ? PRESETS.find(({ value }) => {
        const range = getPresetRange(value, today);
        return range.dateFrom === dateFrom && range.dateTo === dateTo;
      })?.value
    : undefined;

  const open = () => {
    // 오른쪽 공간이 팝업 너비(360px + 여백)보다 좁으면 버튼 오른쪽 끝에 맞춰 연다
    const rect = triggerRef.current?.getBoundingClientRect();
    setAlignRight(Boolean(rect && rect.left + POPUP_WIDTH + 16 > document.documentElement.clientWidth));
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const apply = () => {
    if (onApply()) close();
  };

  // 열리면 팝업 안 첫 버튼으로 포커스를 옮긴다
  useEffect(() => {
    if (isOpen) dialogRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
  }, [isOpen]);

  // 바깥 클릭 시 닫기 (안쪽 달력 팝업도 이 컨테이너 안에 있다)
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? dialogId : undefined}
        aria-label={`검사 기간: ${formatPeriodLabel(dateFrom, dateTo, today)}`}
        onClick={() => (isOpen ? close() : open())}
        className={`inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-lg border bg-white pl-3 pr-2.5 text-sm font-medium tabular-nums transition-colors hover:bg-gray-50 ${
          hasPeriod ? "border-primary text-primary" : "border-line text-gray-700"
        }`}
      >
        <CalendarDays className="size-4" aria-hidden="true" />
        {formatPeriodLabel(dateFrom, dateTo, today)}
        <ChevronDown className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          ref={dialogRef}
          id={dialogId}
          role="dialog"
          aria-label="검사 기간 선택"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              close();
            }
          }}
          className={`absolute top-full z-30 mt-2 flex w-[360px] max-w-[calc(100vw-32px)] flex-col gap-4 rounded-xl border border-line bg-white p-4 shadow-lg ${
            alignRight ? "right-0" : "left-0"
          }`}
        >
          <div role="group" aria-label="빠른 기간 선택" className="grid grid-cols-4 gap-1.5">
            {PRESETS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                disabled={!today}
                aria-pressed={activePreset === value}
                onClick={() => today && onChange(getPresetRange(value, today))}
                className={`h-9 rounded-md border text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  activePreset === value
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-line bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <DatePicker
            id="reservation-date-from"
            label="시작일"
            value={dateFrom}
            onChange={(value) => onChange({ dateFrom: value, dateTo })}
            placeholder="시작일 선택"
          />
          <DatePicker
            id="reservation-date-to"
            label="종료일"
            value={dateTo}
            onChange={(value) => onChange({ dateFrom, dateTo: value })}
            placeholder="종료일 선택"
          />

          {error && (
            <p role="alert" className="-mt-1 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className="h-10 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={Boolean(error)}
              className="h-10 rounded-lg bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

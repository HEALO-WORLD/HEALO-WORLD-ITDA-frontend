import { ChevronDown, RotateCcw, Search } from "lucide-react";
import type { FormEvent, SelectHTMLAttributes } from "react";

import PeriodFilter from "@/features/reservations/components/PeriodFilter";
import type { DateKey } from "@/lib/date/seoulDate";

import { validateIncidentCriteria } from "../query";
import type { IncidentEquipmentOption, IncidentSearchCriteria, IncidentStatus } from "../types";

import { INCIDENT_STATUS_LABELS } from "./IncidentStatusBadge";

interface IncidentFilterProps {
  draft: IncidentSearchCriteria;
  onDraftChange: (draft: IncidentSearchCriteria) => void;
  /** 현재 draft로 검색한다. 조건 오류가 없어 적용되면 true */
  onSearch: () => boolean;
  /** 적용된 조건이 있을 때만 전달한다 (초기화 버튼 표시) */
  onReset?: () => void;
  today: DateKey | null;
  equipments: readonly IncidentEquipmentOption[];
  /** 검색 조건 오류 (예: 시작일 > 종료일) */
  error: string | null;
}

const STATUS_OPTIONS: { value: IncidentStatus | ""; label: string }[] = [
  { value: "", label: "전체 상태" },
  { value: "ACTIVE", label: "진행 중" },
  { value: "RESOLVED", label: INCIDENT_STATUS_LABELS.RESOLVED },
];

/** 툴바 컨트롤 공통 높이(40px)·테두리 (확정 예약 관리 검색 툴바와 같은 모양) */
const TOOLBAR_CONTROL =
  "h-10 rounded-lg border border-line bg-white text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

/**
 * 장애 목록 상단 검색 툴바: 장애 상태 · 장비 · 장애 발생 기간 · 검색 (· 초기화).
 * 조건 변경은 draft에만 반영하고 검색 버튼(또는 기간 [적용])을 눌러야 적용된다.
 */
export default function IncidentFilter({
  draft,
  onDraftChange,
  onSearch,
  onReset,
  today,
  equipments,
  error,
}: IncidentFilterProps) {
  const update = (patch: Partial<IncidentSearchCriteria>) => onDraftChange({ ...draft, ...patch });

  // 장비가 많아도 찾기 쉽도록 유형 → 이름(숫자 자연 정렬) 순
  const equipmentOptions = [
    { value: "", label: "전체 장비" },
    ...[...equipments]
      .sort((a, b) => a.examType.localeCompare(b.examType) || a.name.localeCompare(b.name, "ko", { numeric: true }))
      .map(({ id, name, examType }) => ({ value: id, label: `${name} (${examType})` })),
  ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch();
  };

  return (
    <form onSubmit={handleSubmit} aria-label="장애 검색 조건" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <ToolbarSelect
          id="incident-status"
          label="장애 상태"
          options={STATUS_OPTIONS}
          value={draft.status}
          onChange={(e) => update({ status: e.target.value as IncidentStatus | "" })}
        />
        <ToolbarSelect
          id="incident-equipment"
          label="장비"
          options={equipmentOptions}
          value={draft.equipmentId}
          onChange={(e) => update({ equipmentId: e.target.value })}
          className="max-w-[260px]"
        />
        <PeriodFilter
          label="장애 발생 기간"
          idPrefix="incident"
          dateFrom={draft.dateFrom}
          dateTo={draft.dateTo}
          onChange={update}
          onApply={onSearch}
          today={today}
          error={validateIncidentCriteria(draft)}
        />
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
        >
          <Search className="size-4" aria-hidden="true" />
          검색
        </button>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            초기화
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}

type ToolbarSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
  id: string;
  /** 스크린리더용 라벨 (첫 선택지 '전체 …'가 화면 라벨 역할을 한다) */
  label: string;
  options: { value: string; label: string }[];
};

function ToolbarSelect({ id, label, options, className = "", ...props }: ToolbarSelectProps) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {/* 장비명이 길면 선택창 안에서 말줄임된다 */}
      <select
        id={id}
        className={`${TOOLBAR_CONTROL} w-full cursor-pointer appearance-none truncate pl-3 pr-9`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
    </div>
  );
}

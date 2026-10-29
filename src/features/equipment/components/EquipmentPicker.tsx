import { Check, Clock, Layers, Plus, Search, Sparkles, X } from "lucide-react";
import type { ReactNode } from "react";

import type { ExamType } from "@/features/slots/types";

import { formatOperatingHoursSummary } from "../operatingHours";
import type { Equipment } from "../types";

import EquipmentStatusBadge from "./EquipmentStatusBadge";

export type ExamTypeFilter = "ALL" | ExamType;
/** "ALL" = 현재 목록(검색·필터 결과)의 전체 장비 */
export type EquipmentSelection = "ALL" | string;

interface EquipmentPickerProps {
  /** 기관의 전체 장비 수 (등록 장비 없음과 검색 결과 없음 구분용) */
  totalCount: number;
  /** 검색·필터 결과 */
  visibleEquipments: Equipment[];
  query: string;
  onQueryChange: (query: string) => void;
  typeFilter: ExamTypeFilter;
  onTypeFilterChange: (filter: ExamTypeFilter) => void;
  selection: EquipmentSelection;
  onSelect: (selection: EquipmentSelection) => void;
  /** 선택 장비가 검색 결과에서 빠져 전체 보기로 바뀐 경우 안내 */
  selectionNotice: string | null;
  onShowSchedule: (equipment: Equipment) => void;
}

const TYPE_FILTERS: { value: ExamTypeFilter; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "CT", label: "CT" },
  { value: "MRI", label: "MRI" },
];

const NOT_READY_REASON = "장비 등록·슬롯 생성은 API 연동 후 제공됩니다.";

/**
 * 장비 검색·선택 패널.
 * 장비가 많아도 검색·필터는 항상 위에 두고, 목록만 영역 안에서 스크롤한다.
 */
export default function EquipmentPicker({
  totalCount,
  visibleEquipments,
  query,
  onQueryChange,
  typeFilter,
  onTypeFilterChange,
  selection,
  onSelect,
  selectionNotice,
  onShowSchedule,
}: EquipmentPickerProps) {
  const isFiltered = query.trim() !== "" || typeFilter !== "ALL";

  return (
    <section aria-labelledby="equipment-picker-title" className="flex min-w-0 flex-col rounded-xl border border-line bg-white">
      <div className="border-b border-line px-4 pb-4 pt-5">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 id="equipment-picker-title" className="text-lg font-bold text-gray-900">
            장비
          </h2>
          <span className="text-sm text-gray-500">
            {isFiltered ? `${visibleEquipments.length} / ${totalCount}대` : `${totalCount}대`}
          </span>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="장비명 검색"
            aria-label="장비명 검색"
            className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-9 text-[15px] text-gray-900 outline-none placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label="검색어 지우기"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div role="group" aria-label="검사 유형 필터" className="mt-2.5 grid grid-cols-3 gap-1 rounded-lg bg-surface-muted p-1">
          {TYPE_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={typeFilter === value}
              onClick={() => onTypeFilterChange(value)}
              className={`h-8 rounded-md text-sm font-semibold transition-colors ${
                typeFilter === value ? "bg-white text-primary shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {selectionNotice && (
          <p role="status" className="mt-2.5 text-xs text-amber-700">
            {selectionNotice}
          </p>
        )}
      </div>

      {totalCount === 0 ? (
        <p role="status" className="px-4 py-10 text-center text-[15px] text-gray-500">
          등록된 장비가 없습니다.
        </p>
      ) : (
        <ul aria-label="장비 목록" className="max-h-[320px] overflow-y-auto p-2 xl:max-h-[540px]">
          <li>
            <SelectableItem isSelected={selection === "ALL"} onSelect={() => onSelect("ALL")}>
              <span className="flex items-center gap-2 font-semibold text-gray-900">
                <Layers className="size-4 shrink-0 text-gray-500" aria-hidden="true" />
                {isFiltered ? "검색 결과 전체" : "전체 장비"}
              </span>
              <span className="mt-0.5 block text-sm text-gray-500">
                {visibleEquipments.length}대의 슬롯을 함께 봅니다
              </span>
            </SelectableItem>
          </li>

          {visibleEquipments.length === 0 ? (
            <li role="status" className="px-3 py-8 text-center text-sm text-gray-500">
              검색 조건에 맞는 장비가 없습니다.
              <button
                type="button"
                onClick={() => {
                  onQueryChange("");
                  onTypeFilterChange("ALL");
                }}
                className="mt-2 block w-full text-sm font-medium text-primary hover:underline"
              >
                검색 조건 초기화
              </button>
            </li>
          ) : (
            visibleEquipments.map((equipment) => (
              <li key={equipment.id} className="relative">
                <SelectableItem isSelected={selection === equipment.id} onSelect={() => onSelect(equipment.id)}>
                  <span className="flex items-center gap-2 pr-24">
                    <span className="truncate font-semibold text-gray-900" title={equipment.name}>
                      {equipment.name}
                    </span>
                    <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-600">
                      {equipment.examType}
                    </span>
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-gray-500">
                    <EquipmentStatusBadge status={equipment.status} />
                    <span className="truncate">{formatOperatingHoursSummary(equipment.operatingHours)}</span>
                  </span>
                </SelectableItem>
                <button
                  type="button"
                  onClick={() => onShowSchedule(equipment)}
                  aria-label={`${equipment.name} 운영 시간 보기`}
                  className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                >
                  <Clock className="size-3.5" aria-hidden="true" />
                  운영시간
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      {/* TODO(api): 장비 등록·슬롯 자동 생성 API 확정 후 연결한다 */}
      <div className="mt-auto border-t border-line px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled
            aria-describedby="equipment-actions-note"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-line px-2.5 text-sm font-medium text-gray-400 disabled:cursor-not-allowed"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            장비 등록
          </button>
          <button
            type="button"
            disabled
            aria-describedby="equipment-actions-note"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-line px-2.5 text-sm font-medium text-gray-400 disabled:cursor-not-allowed"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            슬롯 자동 생성
          </button>
        </div>
        <p id="equipment-actions-note" className="mt-1.5 text-xs text-gray-400">
          {NOT_READY_REASON}
        </p>
      </div>
    </section>
  );
}

function SelectableItem({
  isSelected,
  onSelect,
  children,
}: {
  isSelected: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      className={`relative block w-full rounded-lg border px-3 py-2.5 text-left text-[15px] transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
        isSelected ? "border-primary bg-primary-soft" : "border-transparent hover:bg-gray-50"
      }`}
    >
      {children}
      {isSelected && (
        <Check className="absolute bottom-2.5 right-3 size-4 text-primary" aria-hidden="true" />
      )}
    </button>
  );
}

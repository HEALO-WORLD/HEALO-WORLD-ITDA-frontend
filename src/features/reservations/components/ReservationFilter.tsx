import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { useState, type FormEvent, type SelectHTMLAttributes } from "react";

import type { SelectOption } from "@/components/ui/FormControls";
import { REFERRAL_STATUS_LABELS } from "@/features/referrals/components/ReferralStatusBadge";
import type { ReferralDisplayStatus } from "@/features/referrals/types";
import type { ExamType } from "@/features/slots/types";
import type { DateKey } from "@/lib/date/seoulDate";

import { countAdvancedFilters, validateCriteria } from "../query";
import type { ReferringOrganizationOption, ReservationEquipmentOption, ReservationSearchCriteria } from "../types";

import PeriodFilter from "./PeriodFilter";

interface ReservationFilterProps {
  draft: ReservationSearchCriteria;
  onDraftChange: (draft: ReservationSearchCriteria) => void;
  /** 현재 draft로 검색한다. 조건 오류가 없어 적용되면 true */
  onSearch: () => boolean;
  /** 오늘(한국 시간). 모르면 빠른 기간 선택을 비활성화한다 */
  today: DateKey | null;
  equipments: readonly ReservationEquipmentOption[];
  referringOrganizations: readonly ReferringOrganizationOption[];
  /** 검색 조건 오류 (예: 시작일 > 종료일) */
  error: string | null;
}

/** 선택지 첫 항목('전체')에 필터 이름을 넣어 라벨 없이도 무엇을 고르는지 보이게 한다 */
const EXAM_TYPE_OPTIONS: SelectOption[] = [
  { value: "", label: "전체 유형" },
  { value: "CT", label: "CT" },
  { value: "MRI", label: "MRI" },
];

/** 상태 선택지는 실제 상태 타입(확정·처리 중·재조정 필요·취소)에서 만든다 */
const STATUS_OPTIONS: SelectOption[] = [
  { value: "", label: "전체 상태" },
  ...(Object.entries(REFERRAL_STATUS_LABELS) as [ReferralDisplayStatus, string][]).map(([value, label]) => ({
    value,
    label,
  })),
];

/** 툴바 컨트롤 공통 높이(40px)·테두리 */
const TOOLBAR_CONTROL =
  "h-10 rounded-lg border border-line bg-white text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

/**
 * 예약 목록 상단 검색 툴바. 조건 변경은 draft에만 반영하고 검색 버튼(또는 Enter, 기간 [적용])을 눌러야 적용된다.
 * 1줄: 통합 검색 · 검사 기간 · 검사 유형 · 예약 상태 · 상세 필터 · 검색 / (펼침) 검사 장비 · 의뢰기관
 */
export default function ReservationFilter({
  draft,
  onDraftChange,
  onSearch,
  today,
  equipments,
  referringOrganizations,
  error,
}: ReservationFilterProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const advancedCount = countAdvancedFilters(draft);
  const update = (patch: Partial<ReservationSearchCriteria>) => onDraftChange({ ...draft, ...patch });

  // 장비가 많아도 고르기 쉽도록 유형 → 이름(숫자 자연 정렬) 순으로 정렬한다
  const equipmentOptions: SelectOption[] = [
    { value: "", label: "전체 장비" },
    ...[...equipments]
      .sort((a, b) => a.examType.localeCompare(b.examType) || a.name.localeCompare(b.name, "ko", { numeric: true }))
      .map(({ id, name, examType }) => ({ value: id, label: `${name} (${examType})` })),
  ];
  const referrerOptions: SelectOption[] = [
    { value: "", label: "전체 의뢰기관" },
    ...referringOrganizations.map(({ id, name }) => ({ value: id, label: name })),
  ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch();
  };

  return (
    <form onSubmit={handleSubmit} aria-label="예약 검색 조건" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* 통합 검색 (Enter로 검색) */}
        <div className="relative w-full sm:w-auto sm:min-w-[220px] sm:max-w-[360px] sm:flex-1 sm:basis-[220px]">
          <label htmlFor="reservation-keyword" className="sr-only">
            통합 검색
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            id="reservation-keyword"
            type="search"
            value={draft.keyword}
            onChange={(e) => update({ keyword: e.target.value })}
            placeholder="예약번호·의뢰기관·환자 ID"
            className={`${TOOLBAR_CONTROL} w-full pl-9 placeholder:text-gray-400 [&::-webkit-search-cancel-button]:hidden ${
              draft.keyword ? "pr-9" : "pr-3"
            }`}
          />
          {draft.keyword && (
            <button
              type="button"
              onClick={() => update({ keyword: "" })}
              aria-label="검색어 지우기"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <PeriodFilter
          dateFrom={draft.dateFrom}
          dateTo={draft.dateTo}
          onChange={update}
          onApply={onSearch}
          today={today}
          error={validateCriteria(draft)}
        />

        <ToolbarSelect
          id="reservation-exam-type"
          label="검사 유형"
          options={EXAM_TYPE_OPTIONS}
          value={draft.examType}
          onChange={(e) => update({ examType: e.target.value as ExamType | "" })}
        />
        <ToolbarSelect
          id="reservation-status"
          label="예약 상태"
          options={STATUS_OPTIONS}
          value={draft.status}
          onChange={(e) => update({ status: e.target.value as ReferralDisplayStatus | "" })}
        />

        {/* 좁은 화면에서 줄이 바뀌면 상세 필터·검색 버튼은 함께 넘어간다 */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsDetailOpen((open) => !open)}
            aria-expanded={isDetailOpen}
            aria-controls="reservation-detail-filters"
            className={`inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-lg border bg-white px-3 text-sm font-medium transition-colors hover:bg-gray-50 ${
              advancedCount > 0 || isDetailOpen ? "border-primary text-primary" : "border-line text-gray-700"
            }`}
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            상세 필터
            {advancedCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-xs font-semibold text-white" aria-label={`${advancedCount}개 적용 중`}>
                {advancedCount}
              </span>
            )}
          </button>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
          >
            <Search className="size-4" aria-hidden="true" />
            검색
          </button>
        </div>
      </div>

      {isDetailOpen && (
        <div
          id="reservation-detail-filters"
          className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg bg-gray-50 px-3 py-2"
        >
          <ToolbarSelect
            id="reservation-equipment"
            label="검사 장비"
            showLabel
            options={equipmentOptions}
            value={draft.equipmentId}
            onChange={(e) => update({ equipmentId: e.target.value })}
          />
          <ToolbarSelect
            id="reservation-referrer"
            label="의뢰기관"
            showLabel
            options={referrerOptions}
            value={draft.referringOrganizationId}
            onChange={(e) => update({ referringOrganizationId: e.target.value })}
          />
        </div>
      )}

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
  label: string;
  /** 라벨을 select 왼쪽에 보인다 (기본: 스크린리더용으로만 유지) */
  showLabel?: boolean;
  options: SelectOption[];
};

function ToolbarSelect({ id, label, showLabel = false, options, ...props }: ToolbarSelectProps) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <label htmlFor={id} className={showLabel ? "whitespace-nowrap text-sm font-medium text-gray-600" : "sr-only"}>
        {label}
      </label>
      <div className="relative min-w-0">
        <select id={id} className={`${TOOLBAR_CONTROL} max-w-full cursor-pointer appearance-none pl-3 pr-9`} {...props}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
      </div>
    </div>
  );
}

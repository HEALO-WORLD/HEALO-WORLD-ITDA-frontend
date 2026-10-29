import { ChevronDown, RotateCcw, Search, X } from "lucide-react";
import type { FormEvent, SelectHTMLAttributes } from "react";

import PeriodFilter from "@/features/reservations/components/PeriodFilter";
import type { ExamType } from "@/features/slots/types";
import type { DateKey } from "@/lib/date/seoulDate";

import { validateExaminationCriteria } from "../query";
import type { ExamProgressStatus, ExaminationSearchCriteria } from "../types";

import { PROGRESS_STATUS_LABELS, RESULT_REGISTRATION_LABELS } from "./ExaminationBadges";

interface ExaminationFilterProps {
  draft: ExaminationSearchCriteria;
  onDraftChange: (draft: ExaminationSearchCriteria) => void;
  /** 현재 draft로 검색한다. 조건 오류가 없어 적용되면 true */
  onSearch: () => boolean;
  /** 조건이 있을 때만 전달한다 (초기화 버튼 표시) */
  onReset?: () => void;
  today: DateKey | null;
  /** 검색 조건 오류 (예: 시작일 > 종료일) */
  error: string | null;
}

/** 선택지 첫 항목('전체 …')에 필터 이름을 넣어 라벨 없이도 무엇을 고르는지 보이게 한다 */
const EXAM_TYPE_OPTIONS = [
  { value: "", label: "전체 유형" },
  { value: "CT", label: "CT" },
  { value: "MRI", label: "MRI" },
];

const PROGRESS_OPTIONS = [
  { value: "", label: "전체 진행 상태" },
  ...(Object.entries(PROGRESS_STATUS_LABELS) as [ExamProgressStatus, string][]).map(([value, label]) => ({
    value,
    label,
  })),
];

const RESULT_OPTIONS = [
  { value: "", label: "전체 결과 상태" },
  { value: "REGISTERED", label: `결과 ${RESULT_REGISTRATION_LABELS.REGISTERED}` },
  { value: "PENDING", label: `결과 ${RESULT_REGISTRATION_LABELS.PENDING}` },
];

/** 툴바 컨트롤 공통 높이(40px)·테두리 (확정 예약 관리 검색 툴바와 같은 모양) */
const TOOLBAR_CONTROL =
  "h-10 rounded-lg border border-line bg-white text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

/**
 * 검사 목록 상단 검색 툴바: 통합 검색 · 검사 기간 · 검사 유형 · 진행 상태 · 결과 상태 · 검색 (· 초기화).
 * 조건 변경은 draft에만 반영하고 검색 버튼(또는 Enter, 기간 [적용])을 눌러야 적용된다.
 */
export default function ExaminationFilter({
  draft,
  onDraftChange,
  onSearch,
  onReset,
  today,
  error,
}: ExaminationFilterProps) {
  const update = (patch: Partial<ExaminationSearchCriteria>) => onDraftChange({ ...draft, ...patch });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch();
  };

  return (
    <form onSubmit={handleSubmit} aria-label="검사 검색 조건" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* 통합 검색 (Enter로 검색) */}
        <div className="relative w-full sm:w-auto sm:min-w-[220px] sm:max-w-[320px] sm:flex-1 sm:basis-[220px]">
          <label htmlFor="examination-keyword" className="sr-only">
            의뢰번호 또는 가상 환자 ID 검색
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            id="examination-keyword"
            type="search"
            value={draft.keyword}
            onChange={(e) => update({ keyword: e.target.value })}
            placeholder="의뢰번호·가상 환자 ID"
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
          idPrefix="examination"
          dateFrom={draft.dateFrom}
          dateTo={draft.dateTo}
          onChange={update}
          onApply={onSearch}
          today={today}
          error={validateExaminationCriteria(draft)}
        />

        <ToolbarSelect
          id="examination-exam-type"
          label="검사 유형"
          options={EXAM_TYPE_OPTIONS}
          value={draft.examType}
          onChange={(e) => update({ examType: e.target.value as ExamType | "" })}
        />
        <ToolbarSelect
          id="examination-progress"
          label="검사 진행 상태"
          options={PROGRESS_OPTIONS}
          value={draft.progressStatus}
          onChange={(e) => update({ progressStatus: e.target.value as ExamProgressStatus | "" })}
        />
        <ToolbarSelect
          id="examination-result"
          label="결과 등록 여부"
          options={RESULT_OPTIONS}
          value={draft.resultRegistration}
          onChange={(e) =>
            update({ resultRegistration: e.target.value as ExaminationSearchCriteria["resultRegistration"] })
          }
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
  /** 스크린리더용 라벨 */
  label: string;
  options: { value: string; label: string }[];
};

function ToolbarSelect({ id, label, options, ...props }: ToolbarSelectProps) {
  return (
    <div className="relative min-w-0">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select id={id} className={`${TOOLBAR_CONTROL} max-w-full cursor-pointer appearance-none pl-3 pr-9`} {...props}>
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

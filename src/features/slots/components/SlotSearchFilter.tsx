import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import DatePicker from "@/components/ui/DatePicker";
import { SelectInput, type SelectOption } from "@/components/ui/FormControls";
import type { DateKey } from "@/lib/date/seoulDate";

import { getDateAvailability } from "../api";
import type { AvailabilityFilter, DateAvailability } from "../availability";
import type { ExamType, PartnerOrganization, SlotSearchCriteria } from "../types";

interface SlotSearchFilterProps {
  organizations: PartnerOrganization[];
  isSearching: boolean;
  onSearch: (criteria: SlotSearchCriteria) => void;
}

const EXAM_TYPE_OPTIONS: SelectOption[] = [
  { value: "", label: "전체" },
  { value: "CT", label: "CT" },
  { value: "MRI", label: "MRI" },
];

const INITIAL_CRITERIA: SlotSearchCriteria = { examType: "", date: "", organizationId: "" };

const DISABLED_REASON = {
  FULL: "예약 마감",
  NONE: "검사 슬롯 없음",
} as const;

/**
 * 검색 조건 입력. 조건 변경은 내부 상태에만 반영하고, 검색 버튼을 눌러야 상위로 전달한다.
 * 달력의 날짜 선택 가능 여부는 검색 결과와 별개로, 검사 유형·기관이 바뀔 때마다 다시 계산한다.
 */
export default function SlotSearchFilter({ organizations, isSearching, onSearch }: SlotSearchFilterProps) {
  const [criteria, setCriteria] = useState<SlotSearchCriteria>(INITIAL_CRITERIA);
  /** null = 아직 불러오지 않음 */
  const [availability, setAvailability] = useState<DateAvailability | null>(null);
  const [dateNotice, setDateNotice] = useState<string | null>(null);
  const latestRequestRef = useRef(0);

  /**
   * 날짜별 예약 가능 여부를 다시 불러온다.
   * 선택돼 있던 날짜가 새 조건에서 선택 불가가 되면 날짜를 초기화하고 안내한다.
   */
  const refreshAvailability = useCallback(
    async (filter: AvailabilityFilter, selectedDate: DateKey | "") => {
      const requestId = ++latestRequestRef.current;
      const next = await getDateAvailability(filter);
      if (requestId !== latestRequestRef.current) return; // 더 최근 요청이 있으면 무시

      setAvailability(next);
      if (selectedDate && next[selectedDate] !== "AVAILABLE") {
        setCriteria((prev) => (prev.date === selectedDate ? { ...prev, date: "" } : prev));
        setDateNotice(
          `선택한 날짜(${selectedDate})에 예약 가능한 슬롯이 없어 날짜 선택을 초기화했습니다.`,
        );
      }
    },
    [],
  );

  // 최초 진입 시 기본 조건(전체)으로 한 번 불러온다
  useEffect(() => {
    const requestId = ++latestRequestRef.current;
    getDateAvailability(INITIAL_CRITERIA).then((next) => {
      if (requestId === latestRequestRef.current) setAvailability(next);
    });
  }, []);

  const updateFilter = (patch: Partial<AvailabilityFilter>) => {
    const next = { ...criteria, ...patch };
    setCriteria(next);
    setDateNotice(null);
    void refreshAvailability(next, next.date);
  };

  const getDisabledReason = (dateKey: DateKey): string | null => {
    // 불러오기 전에는 모든 날짜를 선택 불가로 둔다
    if (!availability) return "예약 가능 날짜 확인 중";
    const status = availability[dateKey];
    if (status === "AVAILABLE") return null;
    return status === "FULL" ? DISABLED_REASON.FULL : DISABLED_REASON.NONE;
  };

  const organizationOptions: SelectOption[] = [
    { value: "", label: "전체" },
    ...organizations.map(({ id, name }) => ({ value: id, label: name })),
  ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(criteria);
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="검사 슬롯 검색 조건"
      className="grid grid-cols-1 items-end gap-6 rounded-xl border border-line bg-white px-8 py-7 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_236px]"
    >
      <SelectInput
        id="slot-exam-type"
        label="검사 유형"
        options={EXAM_TYPE_OPTIONS}
        value={criteria.examType}
        onChange={(e) => updateFilter({ examType: e.target.value as ExamType | "" })}
      />
      <DatePicker
        id="slot-date"
        label="검사 날짜"
        value={criteria.date}
        onChange={(date) => {
          setCriteria((prev) => ({ ...prev, date }));
          setDateNotice(null);
        }}
        getDisabledReason={getDisabledReason}
        disablePast
        placeholder="전체 기간"
        disabledNote=""
      />
      <SelectInput
        id="slot-organization"
        label="협력 검사기관"
        options={organizationOptions}
        value={criteria.organizationId}
        onChange={(e) => updateFilter({ organizationId: e.target.value })}
      />
      <button
        type="submit"
        disabled={isSearching}
        className="flex h-12 items-center justify-center gap-2 rounded-lg bg-primary text-base font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Search className="size-5" aria-hidden="true" />
        {isSearching ? "검색 중" : "검색"}
      </button>

      {dateNotice && (
        <p role="status" className="col-span-full -mt-2 text-sm text-amber-700">
          {dateNotice}
        </p>
      )}
    </form>
  );
}

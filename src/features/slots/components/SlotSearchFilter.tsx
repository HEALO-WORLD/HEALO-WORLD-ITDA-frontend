import { RotateCcw, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import DatePicker from "@/components/ui/DatePicker";
import { useSlotDataKey } from "@/features/equipment/useLiveEquipments";
import { fieldLabelClass, SelectInput, type SelectOption } from "@/components/ui/FormControls";
import type { DateKey } from "@/lib/date/seoulDate";

import { getDateAvailability } from "../api";
import type { AvailabilityFilter, DateAvailability } from "../availability";
import type { ExamType, PartnerOrganization, SlotSearchCriteria, TimeOfDay } from "../types";

interface SlotSearchFilterProps {
  organizations: PartnerOrganization[];
  isSearching: boolean;
  onSearch: (criteria: SlotSearchCriteria) => void;
  /** 조건을 처음 상태로 되돌렸을 때 (이전 검색 결과 정리용) */
  onReset?: () => void;
  /** 처음 표시할 검색 조건 (재조정 모드에서 기존 예약의 검사 유형). 초기화도 이 조건으로 돌아간다 */
  initialCriteria?: SlotSearchCriteria;
  /** 검사 유형 변경 불가 (재조정 모드) */
  isExamTypeLocked?: boolean;
  /** 달력 가용 날짜 계산에서 제외할 장비 ID (재조정 모드의 장애 장비) */
  excludedEquipmentIds?: readonly string[];
}

const EXAM_TYPE_OPTIONS: SelectOption[] = [
  { value: "", label: "전체" },
  { value: "CT", label: "CT" },
  { value: "MRI", label: "MRI" },
];

const TIME_OF_DAY_OPTIONS: { value: TimeOfDay | ""; label: string }[] = [
  { value: "", label: "전체" },
  { value: "AM", label: "오전" },
  { value: "PM", label: "오후" },
];

const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = { AM: "오전", PM: "오후" };

export const INITIAL_SLOT_CRITERIA: SlotSearchCriteria = {
  examType: "",
  date: "",
  organizationId: "",
  timeOfDay: "",
  availableOnly: false,
};

const DISABLED_REASON = {
  FULL: "예약 마감",
  NONE: "검사 슬롯 없음",
} as const;

/**
 * 검색 조건 입력. 조건 변경은 내부 상태에만 반영하고, 검색 버튼을 눌러야 상위로 전달한다.
 * 달력의 날짜 선택 가능 여부는 검색 결과와 같은 판정(검사 유형·기관·시간대)으로, 조건이 바뀔 때마다 다시 계산한다.
 */
export default function SlotSearchFilter({
  organizations,
  isSearching,
  onSearch,
  onReset,
  initialCriteria = INITIAL_SLOT_CRITERIA,
  isExamTypeLocked = false,
  excludedEquipmentIds,
}: SlotSearchFilterProps) {
  // 최초 조건·제외 장비는 마운트 시점 값으로 고정한다
  const [startCriteria] = useState(initialCriteria);
  const [queryOptions] = useState(() => ({ excludedEquipmentIds }));
  const [criteria, setCriteria] = useState<SlotSearchCriteria>(startCriteria);
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
      const next = await getDateAvailability(filter, queryOptions);
      if (requestId !== latestRequestRef.current) return; // 더 최근 요청이 있으면 무시

      setAvailability(next);
      if (selectedDate && next[selectedDate] !== "AVAILABLE") {
        setCriteria((prev) => (prev.date === selectedDate ? { ...prev, date: "" } : prev));
        const timeText = filter.timeOfDay ? `${TIME_OF_DAY_LABELS[filter.timeOfDay]} ` : "";
        setDateNotice(
          `선택한 날짜(${selectedDate})에 바뀐 조건으로 예약 가능한 ${timeText}슬롯이 없어 날짜 선택을 초기화했습니다.`,
        );
      }
    },
    [queryOptions],
  );

  // 최초 진입 시 최초 조건으로 한 번 불러온다
  useEffect(() => {
    const requestId = ++latestRequestRef.current;
    getDateAvailability(startCriteria, queryOptions).then((next) => {
      if (requestId === latestRequestRef.current) setAvailability(next);
    });
  }, [startCriteria, queryOptions]);

  // 장애 장비나 슬롯 데이터가 바뀌면(장애 등록·복구, 슬롯 생성·운영 중단) 현재 조건으로 달력 가용 날짜를 다시 계산한다.
  // 선택한 날짜가 더는 예약 불가면 refreshAvailability가 날짜를 비우고 안내한다
  const slotDataKey = useSlotDataKey();
  const latestCriteriaRef = useRef(criteria);
  useEffect(() => {
    latestCriteriaRef.current = criteria;
  });
  const refreshedKeyRef = useRef(slotDataKey);
  useEffect(() => {
    if (refreshedKeyRef.current === slotDataKey) return;
    refreshedKeyRef.current = slotDataKey;
    const current = latestCriteriaRef.current;
    void refreshAvailability(current, current.date);
  }, [slotDataKey, refreshAvailability]);

  /** 달력에 영향을 주는 조건(유형·기관·시간대) 변경 */
  const updateFilter = (patch: Partial<AvailabilityFilter>) => {
    const next = { ...criteria, ...patch };
    setCriteria(next);
    setDateNotice(null);
    void refreshAvailability(next, next.date);
  };

  const handleReset = () => {
    setCriteria(startCriteria);
    setDateNotice(null);
    void refreshAvailability(startCriteria, "");
    onReset?.();
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

  const handleSearch = () => {
    if (isSearching) return;
    onSearch(criteria);
  };

  return (
    <div
      role="search"
      aria-label="검사 슬롯 검색 조건"
      className="flex flex-col gap-5 rounded-xl border border-line bg-white px-6 py-6 sm:px-8"
    >
      <div className="grid grid-cols-1 items-end gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(220px,0.9fr)]">
        <SelectInput
          id="slot-exam-type"
          label="검사 유형"
          options={EXAM_TYPE_OPTIONS}
          value={criteria.examType}
          disabled={isExamTypeLocked}
          onChange={(e) => updateFilter({ examType: e.target.value as ExamType | "" })}
        />
        <SelectInput
          id="slot-organization"
          label="협력 검사기관"
          options={organizationOptions}
          value={criteria.organizationId}
          onChange={(e) => updateFilter({ organizationId: e.target.value })}
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
          disabledNote={
            criteria.timeOfDay
              ? `${TIME_OF_DAY_LABELS[criteria.timeOfDay]}에 예약 가능한 슬롯이 있는 날짜만 선택할 수 있습니다.`
              : ""
          }
        />

        {/* 시간대: 검사 시작 시각 기준 (오전 12:00 이전 / 오후 12:00부터) */}
        <fieldset className="min-w-0">
          <legend className={fieldLabelClass}>시간대</legend>
          <div className="grid h-12 grid-cols-3 gap-1 rounded-lg border border-line bg-gray-50 p-1">
            {TIME_OF_DAY_OPTIONS.map(({ value, label }) => {
              const checked = criteria.timeOfDay === value;
              return (
                <label
                  key={value || "ALL"}
                  className={`flex cursor-pointer items-center justify-center rounded-md text-[15px] font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${checked ? "bg-white font-semibold text-primary shadow-sm ring-1 ring-primary/40" : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  <input
                    type="radio"
                    name="slot-time-of-day"
                    value={value}
                    checked={checked}
                    onChange={() => updateFilter({ timeOfDay: value })}
                    className="sr-only"
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      {dateNotice && (
        <p role="status" className="-mt-2 text-sm text-amber-700">
          {dateNotice}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-[15px] text-gray-800">
          <input
            type="checkbox"
            checked={criteria.availableOnly}
            onChange={(e) => setCriteria((prev) => ({ ...prev, availableOnly: e.target.checked }))}
            className="size-[18px] cursor-pointer rounded border-line accent-primary"
          />
          예약 가능한 슬롯만 보기
          <span className="text-sm text-gray-500">(예약 불가 슬롯 제외)</span>
        </label>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-line bg-white px-4 text-[15px] font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            초기화
          </button>
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            className="inline-flex h-11 min-w-[148px] items-center justify-center gap-2 rounded-lg bg-primary px-6 text-base font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Search className="size-5" aria-hidden="true" />
            {isSearching ? "검색 중" : "슬롯 검색"}
          </button>
        </div>
      </div>
    </div>
  );
}

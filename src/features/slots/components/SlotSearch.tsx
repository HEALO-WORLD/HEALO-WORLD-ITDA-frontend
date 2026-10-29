"use client";

import { Info } from "lucide-react";
import { useState, type ReactNode } from "react";

import { IS_MOCK_DATA, searchSlots } from "../api";
import type { ExamSlot, PartnerOrganization, SlotSearchCriteria } from "../types";

import SlotSearchFilter from "./SlotSearchFilter";
import SlotSearchTable from "./SlotSearchTable";

interface SlotSearchProps {
  organizations: PartnerOrganization[];
}

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; slots: ExamSlot[] }
  | { status: "error" };

/**
 * 검사 슬롯 검색(S02)의 클라이언트 경계.
 * 검색 조건 → 검색 실행 → 결과/상태 표시, 예약 요청 클릭 처리를 담당한다.
 */
export default function SlotSearch({ organizations }: SlotSearchProps) {
  const [search, setSearch] = useState<SearchState>({ status: "idle" });
  /** 예약 요청을 누른 슬롯 식별자. 추후 의뢰·예약 관리 화면으로 전달할 값 */
  const [requestedSlotId, setRequestedSlotId] = useState<string | null>(null);

  const handleSearch = async (criteria: SlotSearchCriteria) => {
    setRequestedSlotId(null);
    setSearch({ status: "loading" });
    try {
      const slots = await searchSlots(criteria);
      setSearch({ status: "success", slots });
    } catch {
      setSearch({ status: "error" });
    }
  };

  // TODO(reservation): 예약 요청 연동 시 requestedSlotId(slotId)를 의뢰·예약 관리 화면으로 전달한다.
  const handleRequestReservation = (slotId: string) => {
    setRequestedSlotId(slotId);
  };

  return (
    <div className="flex flex-col gap-8">
      <SlotSearchFilter
        organizations={organizations}
        isSearching={search.status === "loading"}
        onSearch={handleSearch}
      />

      <section
        aria-labelledby="slot-result-title"
        className="rounded-xl border border-line bg-white px-5 pb-6 pt-7 sm:px-8"
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h2 id="slot-result-title" className="text-2xl font-bold text-gray-900">
              검색 결과
            </h2>
            {IS_MOCK_DATA && (
              <span className="rounded border border-dashed border-amber-400 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                개발용 예시 데이터
              </span>
            )}
          </div>
          {search.status === "success" && (
            <p className="text-[15px] text-gray-600" aria-live="polite">
              총 {search.slots.length}건의 검색 결과가 있습니다.
            </p>
          )}
        </div>

        {requestedSlotId && (
          <div
            role="status"
            className="mb-4 flex items-center gap-2 rounded-lg bg-primary-soft px-4 py-3 text-[15px] text-primary"
          >
            <Info className="size-5 shrink-0" aria-hidden="true" />
            예약 요청 기능은 추후 의뢰·예약 관리 화면과 연동될 예정입니다.
          </div>
        )}

        {search.status === "idle" && (
          <ResultMessage>검색 조건을 선택한 후 검색 버튼을 눌러 주세요.</ResultMessage>
        )}
        {search.status === "loading" && (
          <ResultMessage>검사 슬롯을 검색하고 있습니다.</ResultMessage>
        )}
        {search.status === "error" && (
          <ResultMessage tone="error">
            검사 슬롯을 불러오지 못했습니다. 잠시 후 다시 검색해 주세요.
          </ResultMessage>
        )}
        {search.status === "success" &&
          (search.slots.length > 0 ? (
            <SlotSearchTable
              slots={search.slots}
              onRequestReservation={handleRequestReservation}
            />
          ) : (
            <ResultMessage>선택한 조건에 해당하는 검사 슬롯이 없습니다.</ResultMessage>
          ))}
      </section>
    </div>
  );
}

function ResultMessage({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "error";
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg border border-dashed border-line px-6 py-16 text-center text-[15px] ${
        tone === "error" ? "text-red-600" : "text-gray-500"
      }`}
    >
      {children}
    </p>
  );
}

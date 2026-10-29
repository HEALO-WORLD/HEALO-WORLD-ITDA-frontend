"use client";

import { useState, type ReactNode } from "react";

import Modal from "@/components/ui/Modal";
import ReferralCreateForm from "@/features/referrals/components/ReferralCreateForm";

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
  /** 예약 요청을 누른 슬롯. 의뢰 생성 모달에 읽기 전용으로 표시한다 */
  const [requestedSlot, setRequestedSlot] = useState<ExamSlot | null>(null);

  const handleSearch = async (criteria: SlotSearchCriteria) => {
    setSearch({ status: "loading" });
    try {
      const slots = await searchSlots(criteria);
      setSearch({ status: "success", slots });
    } catch {
      setSearch({ status: "error" });
    }
  };

  /** 검색 결과에서 슬롯을 찾아 의뢰 생성 모달을 연다 (예약 가능 여부는 제출 시 다시 검증) */
  const handleRequestReservation = (slotId: string) => {
    if (search.status !== "success") return;
    setRequestedSlot(search.slots.find((slot) => slot.id === slotId) ?? null);
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

      <Modal
        open={requestedSlot !== null}
        title="새 검사 의뢰"
        description="선택한 검사 슬롯으로 의뢰 정보를 입력합니다."
        closeOnBackdrop={false}
        onClose={() => setRequestedSlot(null)}
      >
        {requestedSlot && (
          <ReferralCreateForm
            slot={requestedSlot}
            organizations={organizations}
            onCancel={() => setRequestedSlot(null)}
          />
        )}
      </Modal>
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

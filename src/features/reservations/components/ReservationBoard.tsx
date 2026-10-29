"use client";

import { useMemo, useRef, useState } from "react";

import Modal from "@/components/ui/Modal";
import ReferralStatusBadge from "@/features/referrals/components/ReferralStatusBadge";
import { useSeoulNow } from "@/lib/date/useSeoulNow";

import {
  EMPTY_CRITERIA,
  filterReservations,
  getReferringOrganizationOptions,
  sortReservations,
  summarizeReservations,
  validateCriteria,
} from "../query";
import type { Reservation, ReservationEquipmentOption, ReservationSearchCriteria } from "../types";

import AppliedFilterChips from "./AppliedFilterChips";
import ReservationDetail from "./ReservationDetail";
import ReservationFilter from "./ReservationFilter";
import ReservationSummary from "./ReservationSummary";
import ReservationTable from "./ReservationTable";

interface ReservationBoardProps {
  /** 현재 검사기관이 받은 예약 전체 (기관 필터링이 가장 먼저 적용된 상태) */
  reservations: Reservation[];
  /** 현재 검사기관 장비 (장비 필터 선택지) */
  equipments: ReservationEquipmentOption[];
}

const PAGE_SIZE = 10;

/**
 * 확정 예약 관리의 클라이언트 경계: 요약 → 예약 목록(검색 툴바·적용 조건 배지·테이블) → 상세 모달.
 * 상세에 표시하는 예약은 항상 현재 검색 결과 안에서 찾으므로, 결과에서 빠지면 상세도 닫힌다.
 * 과거 예약 이력도 조회하는 화면이므로 지난 날짜·주말도 검색할 수 있다 (장비·슬롯 운영 달력과 다른 의도된 동작).
 */
export default function ReservationBoard({ reservations, equipments }: ReservationBoardProps) {
  const now = useSeoulNow();
  const [draft, setDraft] = useState<ReservationSearchCriteria>(EMPTY_CRITERIA);
  const [applied, setApplied] = useState<ReservationSearchCriteria>(EMPTY_CRITERIA);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [criteriaError, setCriteriaError] = useState<string | null>(null);
  const tableRef = useRef<HTMLElement>(null);

  const nowDateTime = now?.dateTime ?? null;
  const referringOrganizations = useMemo(() => getReferringOrganizationOptions(reservations), [reservations]);
  // 필터링 → 정렬 → 페이지 나누기 순서
  const results = useMemo(
    () => sortReservations(filterReservations(reservations, applied, equipments), nowDateTime),
    [reservations, applied, equipments, nowDateTime],
  );
  const counts = useMemo(
    () => (now ? summarizeReservations(reservations, applied, equipments, now.dateKey) : null),
    [reservations, applied, equipments, now],
  );

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selected = results.find(({ id }) => id === selectedId) ?? null;

  /** 검증을 통과한 조건만 적용한다. 잘못된 조건이면 이전 결과를 유지하고 오류를 안내한다 (적용되면 true) */
  const applySearch = (criteria: ReservationSearchCriteria): boolean => {
    const error = validateCriteria(criteria);
    setCriteriaError(error);
    if (error) return false;
    setApplied(criteria);
    setPage(1);
    // 새 결과에서 빠진 예약은 선택 해제한다
    if (selectedId && !filterReservations(reservations, criteria, equipments).some(({ id }) => id === selectedId)) {
      setSelectedId(null);
    }
    return true;
  };

  /** 적용된 조건 하나만 해제하고 바로 다시 검색한다 (입력 중인 조건에서도 함께 지운다) */
  const removeCondition = (patch: Partial<ReservationSearchCriteria>) => {
    setDraft((current) => ({ ...current, ...patch }));
    applySearch({ ...applied, ...patch });
  };

  const resetSearch = () => {
    setDraft(EMPTY_CRITERIA);
    applySearch(EMPTY_CRITERIA);
  };

  const closeDetail = () => {
    const number = selected?.referralNumber;
    setSelectedId(null);
    // 닫은 뒤 해당 행의 상세 버튼으로 포커스를 돌려준다
    if (number) {
      requestAnimationFrame(() =>
        tableRef.current?.querySelector<HTMLButtonElement>(`[aria-label="${number} 상세 보기"]`)?.focus(),
      );
    }
  };

  const emptyMessage =
    reservations.length === 0 ? "우리 기관에 접수된 예약이 없습니다." : "검색 조건에 맞는 예약이 없습니다.";

  return (
    <div className="flex flex-col gap-5">
      <ReservationSummary counts={counts} />

      <section
        ref={tableRef}
        aria-labelledby="reservation-list-title"
        className="min-w-0 rounded-xl border border-line bg-white px-4 pb-4 pt-5 sm:px-6"
      >
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="reservation-list-title" className="text-lg font-bold text-gray-900">
            예약 목록
            <span className="ml-2 text-base font-semibold tabular-nums text-primary">{results.length}건</span>
          </h2>
          <p className="text-xs text-gray-500">정렬: 다가오는 검사 먼저(가까운 순) → 지난 검사(최근 순)</p>
        </div>

        {/* 검색 툴바 → 적용된 조건 배지(조건이 있을 때만) → 테이블 */}
        <div className="mb-4 flex flex-col gap-3">
          <ReservationFilter
            draft={draft}
            onDraftChange={setDraft}
            onSearch={() => applySearch(draft)}
            today={now?.dateKey ?? null}
            equipments={equipments}
            referringOrganizations={referringOrganizations}
            error={criteriaError}
          />
          <AppliedFilterChips
            applied={applied}
            today={now?.dateKey ?? null}
            equipments={equipments}
            referringOrganizations={referringOrganizations}
            onRemove={removeCondition}
            onReset={resetSearch}
          />
        </div>

        <ReservationTable
          rows={rows}
          totalCount={results.length}
          page={currentPage}
          pageCount={pageCount}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          selectedId={selected?.id ?? null}
          onSelect={(reservation) => setSelectedId(reservation.id)}
          emptyMessage={emptyMessage}
          onResetFilters={reservations.length > 0 ? resetSearch : undefined}
        />
      </section>

      <Modal
        open={selected !== null}
        size="lg"
        title={selected ? `예약 ${selected.referralNumber}` : "예약 상세"}
        titleAddon={selected ? <ReferralStatusBadge status={selected.status} /> : undefined}
        onClose={closeDetail}
      >
        {selected && <ReservationDetail reservation={selected} />}
      </Modal>
    </div>
  );
}


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

import type {
  Reservation,
  ReservationEquipmentOption,
  ReservationSearchCriteria,
} from "../types";

import AppliedFilterChips from "./AppliedFilterChips";
import ReservationDetail from "./ReservationDetail";
import ReservationFilter from "./ReservationFilter";
import ReservationSummary from "./ReservationSummary";
import ReservationTable from "./ReservationTable";

interface ReservationBoardProps {
  /** 현재 검사기관이 받은 예약 전체 */
  reservations: Reservation[];

  /** 현재 검사기관 장비 목록 */
  equipments: ReservationEquipmentOption[];
}

/**
 * 검사기관 확정 예약 관리
 *
 * - 예약 현황 요약
 * - 검색 및 필터링
 * - 정렬
 * - 적용된 검색 조건 표시
 * - 예약 목록
 * - 예약 상세 모달
 *
 * 현재 Mock 데이터는 클라이언트에서 필터링한다.
 * 실제 API 연동 시 검색·정렬·페이징은 서버에서 처리한다.
 *
 * 과거 예약 이력도 조회할 수 있도록
 * 지난 날짜와 주말 검색을 허용한다.
 */
export default function ReservationBoard({
  reservations,
  equipments,
}: ReservationBoardProps) {
  const now = useSeoulNow();

  // 입력 중인 검색 조건
  const [draft, setDraft] =
    useState<ReservationSearchCriteria>(EMPTY_CRITERIA);

  // 실제 적용된 검색 조건
  const [applied, setApplied] =
    useState<ReservationSearchCriteria>(EMPTY_CRITERIA);

  // 상세 모달에서 선택한 예약 ID
  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  // 검색 조건 검증 오류
  const [criteriaError, setCriteriaError] =
    useState<string | null>(null);

  const tableRef = useRef<HTMLElement>(null);

  const nowDateTime = now?.dateTime ?? null;

  /**
   * 의뢰기관 선택지
   *
   * 현재 예약 데이터에서 의뢰기관 목록을 추출한다.
   */
  const referringOrganizations = useMemo(
    () => getReferringOrganizationOptions(reservations),
    [reservations]
  );

  /**
   * 검색 결과
   *
   * 1. 검색 조건으로 필터링
   * 2. 기존 정렬 규칙 적용
   *
   * 프론트 페이지네이션은 적용하지 않는다.
   */
  const results = useMemo(
    () =>
      sortReservations(
        filterReservations(reservations, applied, equipments),
        nowDateTime
      ),
    [reservations, applied, equipments, nowDateTime]
  );

  /**
   * 예약 현황 요약
   *
   * 기존 집계 규칙은 유지한다.
   */
  const counts = useMemo(
    () =>
      now
        ? summarizeReservations(
            reservations,
            applied,
            equipments,
            now.dateKey
          )
        : null,
    [reservations, applied, equipments, now]
  );

  /**
   * 현재 검색 결과에서 선택한 예약 조회
   *
   * 검색 결과에서 제외된 예약은
   * 상세 모달에도 표시하지 않는다.
   */
  const selected =
    results.find(({ id }) => id === selectedId) ?? null;

  /**
   * 검색 조건 적용
   *
   * 검증에 실패하면 기존 결과를 유지한다.
   */
  const applySearch = (
    criteria: ReservationSearchCriteria
  ): boolean => {
    const error = validateCriteria(criteria);

    setCriteriaError(error);

    if (error) {
      return false;
    }

    setApplied(criteria);

    // 새로운 검색 결과에서 선택한 예약이 사라지면 선택 해제
    if (
      selectedId &&
      !filterReservations(
        reservations,
        criteria,
        equipments
      ).some(({ id }) => id === selectedId)
    ) {
      setSelectedId(null);
    }

    return true;
  };

  /**
   * 적용된 검색 조건 하나만 제거
   */
  const removeCondition = (
    patch: Partial<ReservationSearchCriteria>
  ) => {
    setDraft((current) => ({
      ...current,
      ...patch,
    }));

    applySearch({
      ...applied,
      ...patch,
    });
  };

  /**
   * 전체 검색 조건 초기화
   */
  const resetSearch = () => {
    setDraft({ ...EMPTY_CRITERIA });
    applySearch({ ...EMPTY_CRITERIA });
  };

  /**
   * 예약 상세 모달 닫기
   *
   * 닫은 후 기존 상세 버튼으로 포커스를 복원한다.
   */
  const closeDetail = () => {
    const number = selected?.referralNumber;

    setSelectedId(null);

    if (number) {
      requestAnimationFrame(() => {
        tableRef.current
          ?.querySelector<HTMLButtonElement>(
            `[aria-label="${number} 상세 보기"]`
          )
          ?.focus();
      });
    }
  };

  /**
   * 빈 목록 안내
   */
  const emptyMessage =
    reservations.length === 0
      ? "우리 기관에 접수된 예약이 없습니다."
      : "검색 조건에 맞는 예약이 없습니다.";

  return (
    <div className="flex flex-col gap-5">
      {/* 예약 현황 요약 */}
      <ReservationSummary counts={counts} />

      {/* 예약 목록 */}
      <section
        ref={tableRef}
        aria-labelledby="reservation-list-title"
        className="min-w-0 rounded-xl border border-line bg-white px-4 pb-4 pt-5 sm:px-6"
      >
        {/* 목록 제목과 결과 건수 */}
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2
            id="reservation-list-title"
            className="text-lg font-bold text-gray-900"
          >
            예약 목록

            <span className="ml-2 text-base font-semibold tabular-nums text-primary">
              {results.length}건
            </span>
          </h2>

          <p className="text-xs text-gray-500">
            정렬: 다가오는 검사 먼저(가까운 순)
            {" → "}
            지난 검사(최근 순)
          </p>
        </div>

        {/* 검색 필터 및 적용 조건 */}
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

        {/* 예약 목록: 모든 검색 결과 표시 */}
        <ReservationTable
          rows={results}
          selectedId={selected?.id ?? null}
          onSelect={(reservation) =>
            setSelectedId(reservation.id)
          }
          emptyMessage={emptyMessage}
          onResetFilters={
            reservations.length > 0
              ? resetSearch
              : undefined
          }
        />
      </section>

      {/* 예약 상세 모달 */}
      <Modal
        open={selected !== null}
        size="lg"
        title={
          selected
            ? `예약 ${selected.referralNumber}`
            : "예약 상세"
        }
        titleAddon={
          selected
            ? <ReferralStatusBadge status={selected.status} />
            : undefined
        }
        onClose={closeDetail}
      >
        {selected && (
          <ReservationDetail reservation={selected} />
        )}
      </Modal>
    </div>
  );
}

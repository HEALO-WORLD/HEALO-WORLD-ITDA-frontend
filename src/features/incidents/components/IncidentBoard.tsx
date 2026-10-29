"use client";

import { Plus } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import Modal from "@/components/ui/Modal";
import { useSeoulNow } from "@/lib/date/useSeoulNow";

import {
  EMPTY_INCIDENT_CRITERIA,
  filterIncidents,
  hasIncidentCriteria,
  sortIncidents,
  validateIncidentCriteria,
} from "../query";
import type { IncidentEquipmentOption, IncidentRecord, IncidentSearchCriteria, IncidentSummaryCounts } from "../types";

import IncidentDetail from "./IncidentDetail";
import IncidentFilter from "./IncidentFilter";
import IncidentStatusBadge from "./IncidentStatusBadge";
import IncidentSummary from "./IncidentSummary";
import IncidentTable from "./IncidentTable";

interface IncidentBoardProps {
  /** 현재 검사기관의 장애 이력 전체 (기관 필터링이 먼저 적용된 상태) */
  incidents: IncidentRecord[];
  /** 현재 검사기관 장비 (장비 필터 선택지) */
  equipments: IncidentEquipmentOption[];
  summary: IncidentSummaryCounts;
}

/**
 * 장비 장애·재조정의 클라이언트 경계: 요약 → 장애 목록(검색 툴바·테이블) → 상세 모달.
 * 조회 전용이며, 장애 등록·수정·복구·재조정 처리는 API 연동 후 제공한다.
 * 과거 장애 이력을 조회하는 화면이므로 지난 날짜도 검색할 수 있다.
 */
export default function IncidentBoard({ incidents, equipments, summary }: IncidentBoardProps) {
  const now = useSeoulNow();
  const [draft, setDraft] = useState<IncidentSearchCriteria>(EMPTY_INCIDENT_CRITERIA);
  const [applied, setApplied] = useState<IncidentSearchCriteria>(EMPTY_INCIDENT_CRITERIA);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [criteriaError, setCriteriaError] = useState<string | null>(null);
  const listRef = useRef<HTMLElement>(null);

  const results = useMemo(() => sortIncidents(filterIncidents(incidents, applied)), [incidents, applied]);
  const selected = results.find(({ id }) => id === selectedId) ?? null;

  /** 검증을 통과한 조건만 적용한다. 잘못된 조건이면 이전 결과를 유지하고 오류를 안내한다 (적용되면 true) */
  const applySearch = (criteria: IncidentSearchCriteria): boolean => {
    const error = validateIncidentCriteria(criteria);
    setCriteriaError(error);
    if (error) return false;
    setApplied(criteria);
    return true;
  };

  const resetSearch = () => {
    setDraft(EMPTY_INCIDENT_CRITERIA);
    applySearch(EMPTY_INCIDENT_CRITERIA);
  };

  const closeDetail = () => {
    const number = selected?.incidentNumber;
    setSelectedId(null);
    // 닫은 뒤 해당 행의 상세 버튼으로 포커스를 돌려준다
    if (number) {
      requestAnimationFrame(() =>
        listRef.current?.querySelector<HTMLButtonElement>(`[aria-label="${number} 상세 보기"]`)?.focus(),
      );
    }
  };

  const emptyMessage =
    incidents.length === 0 ? "우리 기관에 등록된 장비 장애 이력이 없습니다." : "검색 조건에 맞는 장애 이력이 없습니다.";

  return (
    <div className="flex flex-col gap-5">
      <IncidentSummary counts={summary} />

      <section
        ref={listRef}
        aria-labelledby="incident-list-title"
        className="min-w-0 rounded-xl border border-line bg-white px-4 pb-5 pt-5 sm:px-6"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 id="incident-list-title" className="text-lg font-bold text-gray-900">
            장비 장애 목록
            <span className="ml-2 text-base font-semibold tabular-nums text-primary">{results.length}건</span>
          </h2>
          <div className="flex items-center gap-2">
            <p id="incident-create-note" className="text-xs text-gray-500">
              API 연동 후 사용할 수 있습니다.
            </p>
            <button
              type="button"
              disabled
              aria-describedby="incident-create-note"
              className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-md border border-line bg-gray-50 px-3 text-sm font-medium text-gray-400"
            >
              <Plus className="size-4" aria-hidden="true" />
              장비 장애 등록
            </button>
          </div>
        </div>

        <div className="mb-4">
          <IncidentFilter
            draft={draft}
            onDraftChange={setDraft}
            onSearch={() => applySearch(draft)}
            onReset={hasIncidentCriteria(applied) || hasIncidentCriteria(draft) ? resetSearch : undefined}
            today={now?.dateKey ?? null}
            equipments={equipments}
            error={criteriaError}
          />
        </div>

        <IncidentTable
          rows={results}
          selectedId={selected?.id ?? null}
          onSelect={(incident) => setSelectedId(incident.id)}
          emptyMessage={emptyMessage}
          onResetFilters={incidents.length > 0 ? resetSearch : undefined}
        />
        <p className="mt-3 text-xs text-gray-500">정렬: 진행 중 장애 먼저 → 장애 발생일시 최근 순</p>
      </section>

      <Modal
        open={selected !== null}
        size="lg"
        title={selected ? `장애 ${selected.incidentNumber}` : "장애 상세"}
        titleAddon={selected ? <IncidentStatusBadge status={selected.status} /> : undefined}
        onClose={closeDetail}
      >
        {selected && <IncidentDetail incident={selected} />}
      </Modal>
    </div>
  );
}

"use client";

import { CheckCircle2, Plus, RotateCcw, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import Modal from "@/components/ui/Modal";
import { useSeoulNow } from "@/lib/date/useSeoulNow";

import { resetMockIncidentChanges, resolveMockIncident } from "../mockIncidentStore";
import {
  EMPTY_INCIDENT_CRITERIA,
  filterIncidents,
  hasIncidentCriteria,
  sortIncidents,
  summarizeIncidents,
  validateIncidentCriteria,
} from "../query";
import type { EquipmentIncident, IncidentEquipmentOption, IncidentRecord, IncidentSearchCriteria } from "../types";
import { useEffectiveIncidents, useFailedEquipmentIds, useIncidentChangeCount } from "../useMockIncidents";

import IncidentDetail from "./IncidentDetail";
import IncidentFilter from "./IncidentFilter";
import IncidentRegisterForm from "./IncidentRegisterForm";
import IncidentStatusBadge from "./IncidentStatusBadge";
import IncidentSummary from "./IncidentSummary";
import IncidentTable from "./IncidentTable";

interface IncidentBoardProps {
  organizationId: string;
  /** 서버에서 원본 Mock 기준으로 만든 장애 목록 (장비·영향 예약 정보 포함) */
  baseIncidents: IncidentRecord[];
  /** 현재 검사기관 장비 (장비 필터·등록 선택지) */
  equipments: IncidentEquipmentOption[];
  /** 우리 기관이 받은 예약 중 재조정 필요 상태 (예약 데이터 기준, 장애 등록·복구와 무관) */
  rescheduleRequiredCount: number;
}

/**
 * 장비 장애·재조정의 클라이언트 경계: 요약 → 장애 목록(검색 툴바·테이블) → 상세·등록 모달.
 * 장애 이력은 원본 Mock + 이 브라우저의 등록·복구 변경분(개발용 Mock 저장소)으로 계산하며,
 * 장비 운영·슬롯 검색 화면도 같은 저장소를 본다.
 * 과거 장애 이력을 조회하는 화면이므로 지난 날짜도 검색할 수 있다.
 */
export default function IncidentBoard({
  organizationId,
  baseIncidents,
  equipments,
  rescheduleRequiredCount,
}: IncidentBoardProps) {
  const now = useSeoulNow();
  const effectiveIncidents = useEffectiveIncidents();
  const { ids: failedEquipmentIds } = useFailedEquipmentIds();
  const changeCount = useIncidentChangeCount();
  const [draft, setDraft] = useState<IncidentSearchCriteria>(EMPTY_INCIDENT_CRITERIA);
  const [applied, setApplied] = useState<IncidentSearchCriteria>(EMPTY_INCIDENT_CRITERIA);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [criteriaError, setCriteriaError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const listRef = useRef<HTMLElement>(null);
  const listTitleRef = useRef<HTMLHeadingElement>(null);

  /** 현재 기관 장애를 화면용으로 만든다. 원본 장애는 서버 정보를 쓰고, 상태·복구일시·현재 장비 상태만 갱신한다 */
  const incidents = useMemo<IncidentRecord[]>(() => {
    const baseById = new Map(baseIncidents.map((record) => [record.id, record]));
    const equipmentById = new Map(equipments.map((equipment) => [equipment.id, equipment]));
    return effectiveIncidents
      .filter((incident) => incident.organizationId === organizationId)
      .map((incident) => {
        const base = baseById.get(incident.id);
        const equipment = equipmentById.get(incident.equipmentId);
        return {
          ...incident,
          equipment: {
            name: base?.equipment.name ?? equipment?.name ?? null,
            examType: base?.equipment.examType ?? equipment?.examType ?? null,
            currentStatus: equipment ? (failedEquipmentIds.has(incident.equipmentId) ? "FAILURE" : "NORMAL") : null,
          },
          affectedReservations: base?.affectedReservations ?? [],
        };
      });
  }, [effectiveIncidents, baseIncidents, equipments, organizationId, failedEquipmentIds]);

  const summary = useMemo(() => summarizeIncidents(incidents, rescheduleRequiredCount), [incidents, rescheduleRequiredCount]);
  const results = useMemo(() => sortIncidents(filterIncidents(incidents, applied)), [incidents, applied]);
  // 상세는 목록 필터와 관계없이 연 장애를 계속 보여 준다 (복구 후 상태 확인)
  const selected = incidents.find(({ id }) => id === selectedId) ?? null;
  const activeEquipmentIds = useMemo(
    () => new Set(incidents.filter(({ status }) => status === "ACTIVE").map(({ equipmentId }) => equipmentId)),
    [incidents],
  );

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

  /** 상세 모달을 닫은 뒤 포커스를 돌려줄 장애 */
  const focusReturnRef = useRef<string | null>(null);

  const closeDetail = () => {
    focusReturnRef.current = selected?.incidentNumber ?? null;
    setSelectedId(null);
  };

  // 모달이 닫힌 뒤(목록 갱신 후) 그 행의 [상세]로, 필터 때문에 행이 빠졌으면 목록 제목으로 포커스를 옮긴다
  useEffect(() => {
    if (selectedId !== null || !focusReturnRef.current) return;
    const number = focusReturnRef.current;
    focusReturnRef.current = null;
    const button = listRef.current?.querySelector<HTMLButtonElement>(`[aria-label="${number} 상세 보기"]`);
    (button ?? listTitleRef.current)?.focus();
  }, [selectedId, results]);

  const handleRegistered = (incident: EquipmentIncident) => {
    setIsRegisterOpen(false);
    const name = equipments.find(({ id }) => id === incident.equipmentId)?.name ?? "장비";
    setSuccessMessage(`${incident.incidentNumber} ${name} 장애를 등록했습니다. 장비 상태가 장애로 바뀌었습니다.`);
  };

  const handleResolve = async (incidentId: string) => {
    const result = await resolveMockIncident(organizationId, incidentId);
    if (result.ok) setSuccessMessage(`${result.incident.incidentNumber} 장애를 복구 완료 처리했습니다.`);
    return result;
  };

  const handleResetChanges = () => {
    if (!window.confirm("이 브라우저에 저장된 장애 등록·복구 내역을 지우고 원본 예시 데이터로 되돌릴까요?")) return;
    resetMockIncidentChanges();
    setSuccessMessage(null);
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
          {/* 남은 행이 없을 때 포커스를 받을 수 있게 tabIndex -1 (Tab 순서에는 넣지 않는다) */}
          <h2
            id="incident-list-title"
            ref={listTitleRef}
            tabIndex={-1}
            className="rounded text-lg font-bold text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            장비 장애 목록
            <span className="ml-2 text-base font-semibold tabular-nums text-primary">{results.length}건</span>
          </h2>
          <button
            type="button"
            onClick={() => setIsRegisterOpen(true)}
            disabled={equipments.length === 0}
            aria-haspopup="dialog"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            <Plus className="size-4" aria-hidden="true" />
            장비 장애 등록
          </button>
        </div>

        <div className="mb-4 flex flex-col gap-3">
          <IncidentFilter
            draft={draft}
            onDraftChange={setDraft}
            onSearch={() => applySearch(draft)}
            onReset={hasIncidentCriteria(applied) || hasIncidentCriteria(draft) ? resetSearch : undefined}
            today={now?.dateKey ?? null}
            equipments={equipments}
            error={criteriaError}
          />

          {successMessage && (
            <div
              role="status"
              className="flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[15px] text-emerald-800"
            >
              <p className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <span>
                  {successMessage}
                  <span className="ml-1 text-sm text-emerald-700">
                    (개발용 예시: 이 브라우저에만 반영되며 서버 저장·예약 재조정·의뢰기관 알림 발송은 되지 않습니다.)
                  </span>
                </span>
              </p>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                aria-label="안내 닫기"
                className="rounded p-1 text-emerald-700 hover:bg-emerald-100"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <IncidentTable
          rows={results}
          selectedId={selected?.id ?? null}
          onSelect={(incident) => setSelectedId(incident.id)}
          emptyMessage={emptyMessage}
          onResetFilters={incidents.length > 0 ? resetSearch : undefined}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-gray-500">정렬: 진행 중 장애 먼저 → 장애 발생일시 최근 순</p>
          {changeCount > 0 && (
            <button
              type="button"
              onClick={handleResetChanges}
              className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-gray-500 underline-offset-2 hover:text-gray-700 hover:underline"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              개발용: 이 브라우저의 등록·복구 내역 {changeCount}건 초기화
            </button>
          )}
        </div>
      </section>

      <Modal
        open={selected !== null}
        size="lg"
        title={selected ? `장애 ${selected.incidentNumber}` : "장애 상세"}
        titleAddon={selected ? <IncidentStatusBadge status={selected.status} /> : undefined}
        onClose={closeDetail}
      >
        {selected && <IncidentDetail incident={selected} onResolve={handleResolve} />}
      </Modal>

      <Modal
        open={isRegisterOpen}
        title="장비 장애 등록"
        description="장애가 발생한 장비와 발생일시, 사유를 입력합니다."
        closeOnBackdrop={false}
        onClose={() => setIsRegisterOpen(false)}
      >
        {isRegisterOpen && (
          <IncidentRegisterForm
            organizationId={organizationId}
            equipments={equipments}
            activeEquipmentIds={activeEquipmentIds}
            onCancel={() => setIsRegisterOpen(false)}
            onRegistered={handleRegistered}
          />
        )}
      </Modal>
    </div>
  );
}

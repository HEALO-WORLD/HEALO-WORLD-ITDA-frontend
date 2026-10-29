import type { IncidentSummaryCounts } from "../types";

/**
 * 장애 현황 요약 바 (집계 기준은 query.ts의 summarizeIncidents, 검색 조건과 무관).
 * - 장애 진행 중 장비: 진행 중 장애가 있는 장비 수
 * - 복구 완료 이력: 복구 완료된 장애 건수
 * - 재조정 필요 예약: 우리 기관이 받은 예약 중 재조정 필요 상태
 */
export default function IncidentSummary({ counts }: { counts: IncidentSummaryCounts }) {
  return (
    <section aria-label="장애 현황 요약" className="rounded-xl border border-line bg-white px-6 py-4">
      <ul className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <SummaryItem
          label="장애 진행 중 장비"
          value={`${counts.activeEquipmentCount}대`}
          valueClass={counts.activeEquipmentCount > 0 ? "text-red-600" : "text-gray-900"}
        />
        <li aria-hidden="true" className="hidden h-6 w-px bg-line sm:block" />
        <SummaryItem label="복구 완료 이력" value={`${counts.resolvedIncidentCount}건`} valueClass="text-emerald-700" />
        <li aria-hidden="true" className="hidden h-6 w-px bg-line sm:block" />
        <SummaryItem
          label="재조정 필요 예약"
          value={`${counts.rescheduleRequiredCount}건`}
          valueClass={counts.rescheduleRequiredCount > 0 ? "text-red-600" : "text-gray-900"}
        />
      </ul>
    </section>
  );
}

function SummaryItem({ label, value, valueClass }: { label: string; value: string; valueClass: string }) {
  return (
    <li className="flex items-baseline gap-2">
      <span className="text-[15px] text-gray-600">{label}</span>
      <span className={`text-xl font-bold tabular-nums ${valueClass}`}>{value}</span>
    </li>
  );
}

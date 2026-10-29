import { REFERRAL_STATUS_LABELS } from "@/features/referrals/components/ReferralStatusBadge";
import type { ReferralDisplayStatus } from "@/features/referrals/types";

import type { ReservationSummaryCounts } from "../types";

interface ReservationSummaryProps {
  /** null = 현재 시각을 아직 모름 (오늘 예약 수 계산 전) */
  counts: ReservationSummaryCounts | null;
}

const STATUS_ORDER: ReferralDisplayStatus[] = ["CONFIRMED", "PROCESSING", "RESCHEDULE_REQUIRED", "CANCELLED"];
const STATUS_TEXT_CLASS: Record<ReferralDisplayStatus, string> = {
  CONFIRMED: "text-emerald-700",
  PROCESSING: "text-primary",
  RESCHEDULE_REQUIRED: "text-red-600",
  CANCELLED: "text-gray-500",
};

/**
 * 예약 현황 요약 (집계 기준은 query.ts의 summarizeReservations)
 * - 오늘 예약: 오늘 검사 예정 · 취소 제외 (검색 조건과 무관)
 * - 상태별: 상태를 뺀 나머지 검색 조건(검색어·기간·유형·장비·의뢰기관) 기준
 */
export default function ReservationSummary({ counts }: ReservationSummaryProps) {
  return (
    <section aria-label="예약 현황 요약" className="rounded-xl border border-line bg-white px-6 py-4">
      <ul className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <SummaryItem label="오늘 예약" value={counts?.today} valueClass="text-gray-900" />
        <li aria-hidden="true" className="hidden h-6 w-px bg-line sm:block" />
        {STATUS_ORDER.map((status) => (
          <SummaryItem
            key={status}
            label={REFERRAL_STATUS_LABELS[status]}
            value={counts?.byStatus[status]}
            valueClass={STATUS_TEXT_CLASS[status]}
          />
        ))}
      </ul>
      <p className="mt-2 text-xs text-gray-500">
        오늘 예약은 오늘 검사 예정인 예약(취소 제외), 상태별 건수는 예약 상태를 제외한 검색 조건을 적용한 결과입니다.
      </p>
    </section>
  );
}

function SummaryItem({ label, value, valueClass }: { label: string; value: number | undefined; valueClass: string }) {
  return (
    <li className="flex items-baseline gap-2">
      <span className="text-[15px] text-gray-600">{label}</span>
      <span className={`text-xl font-bold ${valueClass}`}>{value === undefined ? "-" : `${value}건`}</span>
    </li>
  );
}

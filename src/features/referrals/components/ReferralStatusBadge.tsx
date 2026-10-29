import type { ReferralDisplayStatus } from "../types";

interface ReferralStatusBadgeProps {
  status: ReferralDisplayStatus;
}

/**
 * 예약 상태 배지 (확정=녹색, 처리 중=파란색, 재조정 필요=빨간색 · screen-spec 2.4)
 * 화면 표시용 상태 기준이다. 서버 상태 enum 확정 시 서버 값 → ReferralDisplayStatus 매핑을 추가한다.
 */
const STATUS_META: Record<ReferralDisplayStatus, { label: string; className: string }> = {
  CONFIRMED: { label: "확정", className: "bg-emerald-50 text-emerald-700" },
  PROCESSING: { label: "처리 중", className: "bg-primary-soft text-primary" },
  RESCHEDULE_REQUIRED: { label: "재조정 필요", className: "bg-red-50 text-red-600" },
};

export default function ReferralStatusBadge({ status }: ReferralStatusBadgeProps) {
  const { label, className } = STATUS_META[status];

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-4 py-1.5 text-[15px] font-medium ${className}`}
    >
      {label}
    </span>
  );
}

interface SlotStatusBadgeProps {
  isAvailable: boolean;
}

/**
 * 슬롯 예약 상태 배지 (가용=녹색, 마감=회색 · screen-spec 2.4)
 * 서버 상태 enum 확정 시 이 매핑만 교체한다.
 */
const STATUS_META = {
  available: { label: "예약 가능", className: "bg-emerald-50 text-emerald-700" },
  closed: { label: "예약 마감", className: "bg-gray-100 text-gray-500" },
} as const;

export default function SlotStatusBadge({ isAvailable }: SlotStatusBadgeProps) {
  const { label, className } = STATUS_META[isAvailable ? "available" : "closed"];

  return (
    <span className={`inline-flex rounded-md px-4 py-1.5 text-[15px] font-medium ${className}`}>
      {label}
    </span>
  );
}

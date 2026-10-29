import type { EquipmentStatus } from "../types";

/** 장비 상태 표시 (정상=초록 점, 장애=빨간 점 · 와이어프레임 S05) */
const STATUS_META: Record<EquipmentStatus, { label: string; dotClass: string; textClass: string }> = {
  NORMAL: { label: "정상", dotClass: "bg-emerald-500", textClass: "text-emerald-700" },
  FAILURE: { label: "장애", dotClass: "bg-red-500", textClass: "text-red-600" },
};

export default function EquipmentStatusBadge({ status }: { status: EquipmentStatus }) {
  const { label, dotClass, textClass } = STATUS_META[status];

  return (
    <span className={`inline-flex items-center gap-2 text-[15px] font-medium ${textClass}`}>
      <span className={`size-2 rounded-full ${dotClass}`} aria-hidden="true" />
      {label}
    </span>
  );
}

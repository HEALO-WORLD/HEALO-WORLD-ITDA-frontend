import { RotateCcw, X } from "lucide-react";

import { REFERRAL_STATUS_LABELS } from "@/features/referrals/components/ReferralStatusBadge";
import type { DateKey } from "@/lib/date/seoulDate";

import type { ReferringOrganizationOption, ReservationEquipmentOption, ReservationSearchCriteria } from "../types";

import { formatPeriodLabel } from "./PeriodFilter";

interface AppliedFilterChipsProps {
  /** 실제 검색에 적용된 조건 (입력 중인 draft가 아님) */
  applied: ReservationSearchCriteria;
  today: DateKey | null;
  equipments: readonly ReservationEquipmentOption[];
  referringOrganizations: readonly ReferringOrganizationOption[];
  /** 해당 조건만 해제하고 다시 검색한다 */
  onRemove: (patch: Partial<ReservationSearchCriteria>) => void;
  onReset: () => void;
}

interface Chip {
  key: string;
  label: string;
  patch: Partial<ReservationSearchCriteria>;
}

/** 적용된 검색 조건 배지. 조건이 없으면 아무것도 그리지 않는다 */
export default function AppliedFilterChips({
  applied,
  today,
  equipments,
  referringOrganizations,
  onRemove,
  onReset,
}: AppliedFilterChipsProps) {
  const keyword = applied.keyword.trim();
  const equipment = equipments.find(({ id }) => id === applied.equipmentId);
  const referrer = referringOrganizations.find(({ id }) => id === applied.referringOrganizationId);

  const candidates: (Chip | false | "")[] = [
    keyword && { key: "keyword", label: `검색어: ${keyword}`, patch: { keyword: "" } },
    (applied.dateFrom || applied.dateTo) && {
      key: "period",
      label: formatPeriodLabel(applied.dateFrom, applied.dateTo, today),
      patch: { dateFrom: "", dateTo: "" },
    },
    applied.examType && { key: "examType", label: applied.examType, patch: { examType: "" } },
    applied.status && { key: "status", label: REFERRAL_STATUS_LABELS[applied.status], patch: { status: "" } },
    applied.equipmentId && {
      key: "equipment",
      label: equipment?.name ?? "선택한 장비",
      patch: { equipmentId: "" },
    },
    applied.referringOrganizationId && {
      key: "referrer",
      label: referrer?.name ?? "선택한 의뢰기관",
      patch: { referringOrganizationId: "" },
    },
  ];
  const chips = candidates.filter((chip): chip is Chip => Boolean(chip));

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="적용된 검색 조건" role="group">
      {chips.map(({ key, label, patch }) => (
        <span
          key={key}
          className="inline-flex h-7 max-w-full items-center gap-0.5 rounded-full border border-primary/30 bg-primary-soft pl-3 pr-1 text-sm font-medium text-primary"
        >
          <span className="truncate tabular-nums">{label}</span>
          <button
            type="button"
            onClick={() => onRemove(patch)}
            aria-label={`${label} 조건 해제`}
            className="rounded-full p-0.5 hover:bg-primary/15"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onReset}
        className="ml-1 inline-flex h-7 items-center gap-1 rounded-md px-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
      >
        <RotateCcw className="size-3.5" aria-hidden="true" />
        초기화
      </button>
    </div>
  );
}

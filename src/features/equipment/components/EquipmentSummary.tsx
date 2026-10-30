"use client";

import { CalendarCheck, Magnet, ScanLine, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import type { Equipment } from "../types";
import { useLiveEquipments } from "../useLiveEquipments";

import TodayAvailableSlotCount from "./TodayAvailableSlotCount";

interface EquipmentSummaryProps {
  organizationId: string;
}

/**
 * 장비 운영 요약 (MRI 장비 수 · CT 장비 수 · 오늘 예약 가능 슬롯). 좁은 화면에서는 줄바꿈된다.
 * 장비 수는 원본 + 화면에서 등록한 장비(개발용 Mock) 기준이다
 */
export default function EquipmentSummary({ organizationId }: EquipmentSummaryProps) {
  const equipments = useLiveEquipments(organizationId);
  const countByType = (type: Equipment["examType"]) =>
    equipments.filter(({ examType }) => examType === type).length;

  return (
    <ul
      aria-label="장비 운영 요약"
      className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border border-line bg-white px-6 py-4"
    >
      <SummaryItem icon={Magnet} label="MRI 장비">
        {countByType("MRI")}대
      </SummaryItem>
      <SummaryItem icon={ScanLine} label="CT 장비">
        {countByType("CT")}대
      </SummaryItem>
      <SummaryItem icon={CalendarCheck} label="오늘 예약 가능 슬롯">
        <TodayAvailableSlotCount organizationId={organizationId} />
      </SummaryItem>
    </ul>
  );
}

function SummaryItem({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft">
        <Icon className="size-[18px] text-primary" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="text-[15px] text-gray-600">{label}</span>
      <span className="text-xl font-bold text-gray-900">{children}</span>
    </li>
  );
}

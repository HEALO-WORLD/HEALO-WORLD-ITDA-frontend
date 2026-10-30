"use client";

import { useEffect, useState } from "react";

import { useFailedEquipmentIds } from "@/features/incidents/useMockIncidents";
import { isBookableSlot } from "@/features/slots/availability";
import { useSeoulNow } from "@/lib/date/useSeoulNow";

import { getOrganizationSlots } from "../api";

/**
 * 오늘 가용 슬롯 수: 오늘(한국 시간) 슬롯 중 예약 가능하고 시작 시각이 지나지 않은 슬롯.
 * 현재 시각에 따라 달라지므로 클라이언트에서 계산한다. 장애 장비가 바뀌면 다시 센다.
 */
export default function TodayAvailableSlotCount({ organizationId }: { organizationId: string }) {
  const now = useSeoulNow();
  const nowDateTime = now?.dateTime ?? null;
  const { key: failedEquipmentKey } = useFailedEquipmentIds();
  const [result, setResult] = useState<{ at: string; count: number } | null>(null);

  useEffect(() => {
    if (!nowDateTime) return;
    const today = nowDateTime.slice(0, 10);
    let isCurrent = true;
    getOrganizationSlots(organizationId, today, today).then((slots) => {
      if (isCurrent) {
        setResult({ at: nowDateTime, count: slots.filter((slot) => isBookableSlot(slot, nowDateTime)).length });
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [organizationId, nowDateTime, failedEquipmentKey]);

  if (!result) return <span className="text-gray-300">-</span>;
  return <span title={`${result.at.replace("T", " ")} 기준`}>{result.count}개</span>;
}

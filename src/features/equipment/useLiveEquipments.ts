"use client";

import { useMemo } from "react";

import { useFailedEquipmentIds } from "@/features/incidents/useMockIncidents";

import type { Equipment } from "./types";

/**
 * 서버에서 받은 장비 목록에 현재 장애 상태를 반영한다 (Client Component 전용).
 * 서버는 원본 Mock 장애만 알 수 있어, 화면에서 등록·복구한 장애는 여기서 반영한다.
 * TODO(api): 장비 상태를 서버 응답으로 받으면 이 훅을 제거한다.
 */
export function useLiveEquipments(equipments: Equipment[]): Equipment[] {
  const { ids } = useFailedEquipmentIds();
  return useMemo(
    () => equipments.map((equipment) => ({ ...equipment, status: ids.has(equipment.id) ? "FAILURE" : "NORMAL" })),
    [equipments, ids],
  );
}

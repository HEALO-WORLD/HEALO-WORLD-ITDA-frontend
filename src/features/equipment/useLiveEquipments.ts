"use client";

import { useMemo, useSyncExternalStore } from "react";

import { useFailedEquipmentIds } from "@/features/incidents/useMockIncidents";

import { equipmentChangeStore, getEffectiveEquipmentsFrom, type EquipmentChanges } from "./mockEquipmentStore";
import type { Equipment } from "./types";

/**
 * 개발용 Mock 장비·슬롯 저장소의 React 훅 (Client Component 전용).
 * 서버 스냅샷은 원본 Mock(변경분 없음)이라 hydration 결과가 서버 렌더링과 같고, 직후 브라우저 변경분을 반영한다.
 * TODO(api): 장비·슬롯을 서버 응답으로 받으면 이 훅들을 제거한다.
 */

const getServerChanges = () => equipmentChangeStore.empty;
const getServerVersion = () => 0;

export function useEquipmentChanges(): EquipmentChanges {
  return useSyncExternalStore(equipmentChangeStore.subscribe, equipmentChangeStore.read, getServerChanges);
}

/**
 * 슬롯 데이터가 바뀐 때를 알 수 있는 키 (장애 장비 + 장비·슬롯 변경).
 * 슬롯을 불러와 캐시하는 화면이 effect 의존성·캐시 키로 쓴다.
 */
export function useSlotDataKey(): string {
  const { key: failedEquipmentKey } = useFailedEquipmentIds();
  const version = useSyncExternalStore(equipmentChangeStore.subscribe, equipmentChangeStore.getVersion, getServerVersion);
  return `${failedEquipmentKey}|${version}`;
}

/**
 * 현재 기관 장비 (원본 + 등록 장비, 수정·운영 시간 반영) + 장애 이력 기준 상태.
 * 장비 상태는 진행 중 장애가 있으면 FAILURE이며, 이 훅은 장애 상태를 따로 관리하지 않는다.
 */
export function useLiveEquipments(organizationId: string): (Equipment & { isCreated: boolean })[] {
  const changes = useEquipmentChanges();
  const { ids } = useFailedEquipmentIds();
  return useMemo(
    () =>
      getEffectiveEquipmentsFrom(changes, organizationId).map((equipment) => ({
        ...equipment,
        status: ids.has(equipment.id) ? "FAILURE" : "NORMAL",
      })),
    [changes, organizationId, ids],
  );
}

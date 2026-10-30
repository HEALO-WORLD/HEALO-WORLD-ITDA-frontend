"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  EMPTY_CHANGES,
  mergeIncidents,
  readChanges,
  subscribe,
  toActiveEquipmentIds,
  type IncidentChanges,
} from "./mockIncidentStore";
import type { EquipmentIncident } from "./types";

/**
 * 개발용 Mock 장애 저장소의 React 훅 (Client Component 전용).
 * 서버 스냅샷은 원본 Mock(변경분 없음)이라 hydration 결과가 서버 렌더링과 같고, 직후 브라우저 변경분을 반영한다.
 */

const getServerSnapshot = () => EMPTY_CHANGES;

function useIncidentChanges(): IncidentChanges {
  return useSyncExternalStore(subscribe, readChanges, getServerSnapshot);
}

export function useEffectiveIncidents(): EquipmentIncident[] {
  const changes = useIncidentChanges();
  return useMemo(() => mergeIncidents(changes), [changes]);
}

/** 진행 중 장애 장비 ID와, 바뀐 때를 알 수 있는 문자열 키 (effect 의존성용) */
export function useFailedEquipmentIds(): { ids: ReadonlySet<string>; key: string } {
  const incidents = useEffectiveIncidents();
  return useMemo(() => {
    const ids = toActiveEquipmentIds(incidents);
    return { ids, key: [...ids].sort().join(",") };
  }, [incidents]);
}

/** 이 브라우저에 저장된 변경 건수 (개발용 초기화 버튼 표시용) */
export function useIncidentChangeCount(): number {
  const changes = useIncidentChanges();
  return changes.created.length + Object.keys(changes.resolved).length;
}


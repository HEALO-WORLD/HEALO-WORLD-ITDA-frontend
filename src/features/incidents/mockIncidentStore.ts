import { getSeoulNow } from "@/lib/date/seoulDate";
import { MOCK_INCIDENTS } from "@/lib/dev/mockIncidents";
import { getMockEquipmentsByOrganization } from "@/lib/dev/mockSlots";

import { getResolveBlockReason, hasErrors, validateIncidentRegister, type IncidentRegisterInput } from "./rules";
import type { EquipmentIncident } from "./types";

/**
 * ⚠️ 개발용 Mock 장애 상태 저장소 (실제 서버 저장 아님)
 *
 * 장애 이력은 "원본 Mock(mockIncidents.ts) + 이 브라우저에서 등록·복구한 변경분"으로 계산한다.
 * 장비의 현재 상태(장애 여부)와 슬롯 예약 차단은 모두 여기서 계산한 진행 중 장애로 판단하므로,
 * 장애 관리·장비 운영·의뢰기관 슬롯 검색 화면이 같은 결과를 본다.
 *
 * - 변경분은 브라우저 저장소(localStorage)에 저장해 새로고침·화면 이동 후에도 유지한다.
 *   장비 ID·장애 일시·사유만 저장하며 환자 정보는 저장하지 않는다.
 * - 서버(Server Component)는 브라우저 저장소를 읽을 수 없어 원본 Mock만 본다.
 *   화면 컴포넌트는 useMockIncidents.ts의 훅으로 hydration 동안 원본 기준으로 그리고, 직후 변경분을 반영한다.
 * - 다른 탭에서 바꾼 내용도 storage 이벤트로 반영된다.
 *
 * TODO(api): 장비 장애 등록·복구·조회 API 연동 시 이 파일을 제거하고, 장비 상태·슬롯 예약 가능 여부는 서버 응답을 쓴다.
 */

const STORAGE_KEY = "itda.dev.incidentChanges.v1";

/** 브라우저에서 바꾼 내용 */
export interface IncidentChanges {
  /** 이 브라우저에서 등록한 장애 */
  created: EquipmentIncident[];
  /** 원본 Mock 장애 중 이 브라우저에서 복구한 것: 장애 ID → 복구 일시 */
  resolved: Record<string, string>;
}

export const EMPTY_CHANGES: IncidentChanges = Object.freeze({ created: [], resolved: {} }) as IncidentChanges;

let cachedChanges: IncidentChanges | null = null;
const listeners = new Set<() => void>();

const isDateTime = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);

/** 저장된 값이 깨져 있으면 해당 항목만 버린다 */
function parseChanges(raw: string | null): IncidentChanges {
  if (!raw) return EMPTY_CHANGES;
  try {
    const parsed = JSON.parse(raw) as Partial<IncidentChanges>;
    const created = Array.isArray(parsed.created)
      ? parsed.created.filter(
          (item): item is EquipmentIncident =>
            typeof item?.id === "string" &&
            typeof item.incidentNumber === "string" &&
            typeof item.organizationId === "string" &&
            typeof item.equipmentId === "string" &&
            typeof item.reason === "string" &&
            (item.status === "ACTIVE" || item.status === "RESOLVED") &&
            isDateTime(item.occurredAt) &&
            (item.resolvedAt === null || isDateTime(item.resolvedAt)),
        )
      : [];
    const resolved: Record<string, string> = {};
    if (parsed.resolved && typeof parsed.resolved === "object") {
      for (const [id, at] of Object.entries(parsed.resolved)) if (isDateTime(at)) resolved[id] = at;
    }
    return { created: created.map((item) => ({ ...item, affectedReservationIds: [] })), resolved };
  } catch {
    return EMPTY_CHANGES;
  }
}

export function readChanges(): IncidentChanges {
  if (typeof window === "undefined") return EMPTY_CHANGES;
  if (!cachedChanges) {
    try {
      cachedChanges = parseChanges(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      cachedChanges = EMPTY_CHANGES;
    }
  }
  return cachedChanges;
}

function writeChanges(next: IncidentChanges) {
  cachedChanges = next;
  try {
    if (next.created.length === 0 && Object.keys(next.resolved).length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // 저장소를 쓸 수 없으면(사생활 보호 모드 등) 이 탭에서만 유지된다
  }
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    cachedChanges = null;
    listener();
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

/** 원본 Mock + 변경분을 합친 장애 이력 (전체 기관) */
export function mergeIncidents(changes: IncidentChanges): EquipmentIncident[] {
  const base = MOCK_INCIDENTS.map((incident) => {
    const resolvedAt = changes.resolved[incident.id];
    return resolvedAt && incident.status === "ACTIVE"
      ? { ...incident, status: "RESOLVED" as const, resolvedAt }
      : incident;
  });
  return [...base, ...changes.created];
}

export const toActiveEquipmentIds = (incidents: readonly EquipmentIncident[]) =>
  new Set(incidents.filter(({ status }) => status === "ACTIVE").map(({ equipmentId }) => equipmentId));

/* ───────────── 읽기 (일반 함수: API 함수에서 사용. 서버에서는 원본 Mock만 본다) ───────────── */

export function getEffectiveIncidents(): EquipmentIncident[] {
  return mergeIncidents(readChanges());
}

/** 진행 중 장애가 있는 장비 ID (장비 상태·슬롯 예약 차단 판단 기준) */
export function getFailedEquipmentIds(): Set<string> {
  return toActiveEquipmentIds(getEffectiveIncidents());
}

/* ───────────── 쓰기 (Mock 등록·복구) ───────────── */

/** Mock 처리 지연(ms). 처리 중 상태·중복 클릭 방지를 확인하기 위한 값 */
const MOCK_DELAY_MS = 400;
const wait = () => new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

export type IncidentMutationResult =
  | { ok: true; incident: EquipmentIncident }
  | { ok: false; message: string };

/** 원본·등록분과 겹치지 않는 다음 장애번호 */
function nextIncidentNumber(incidents: readonly EquipmentIncident[]): number {
  const numbers = incidents.map(({ incidentNumber }) => Number(incidentNumber.replace(/^INC-/, "")) || 0);
  return Math.max(0, ...numbers) + 1;
}

/**
 * 장비 장애 등록 (Mock).
 * 입력 검증을 다시 한 뒤 진행 중(ACTIVE) 장애를 추가한다. 예약 상태 변경·알림 발송은 하지 않는다.
 */
export async function registerMockIncident(
  organizationId: string,
  input: IncidentRegisterInput,
): Promise<IncidentMutationResult> {
  await wait();
  const incidents = getEffectiveIncidents();
  const errors = validateIncidentRegister(input, {
    organizationEquipmentIds: new Set(getMockEquipmentsByOrganization(organizationId).map(({ id }) => id)),
    activeEquipmentIds: toActiveEquipmentIds(incidents),
    nowDateTime: getSeoulNow().dateTime,
  });
  if (hasErrors(errors)) {
    return { ok: false, message: errors.equipmentId ?? errors.occurredAt ?? errors.reason ?? "입력값을 확인해 주세요." };
  }

  const number = nextIncidentNumber(incidents);
  const incident: EquipmentIncident = {
    id: `local-incident-${number}`,
    incidentNumber: `INC-${String(number).padStart(3, "0")}`,
    organizationId,
    equipmentId: input.equipmentId,
    reason: input.reason.trim(),
    status: "ACTIVE",
    occurredAt: input.occurredAt,
    resolvedAt: null,
    // 영향 예약은 명시적으로 연결된 데이터가 없으므로 비워 둔다 (장비명·유형으로 추정하지 않는다)
    affectedReservationIds: [],
  };
  const changes = readChanges();
  writeChanges({ ...changes, created: [...changes.created, incident] });
  return { ok: true, incident };
}

/** 장비 장애 복구 (Mock). 진행 중 장애만 복구하며 복구 일시는 현재 한국 시각이다 */
export async function resolveMockIncident(
  organizationId: string,
  incidentId: string,
): Promise<IncidentMutationResult> {
  await wait();
  const incident = getEffectiveIncidents().find(
    (item) => item.id === incidentId && item.organizationId === organizationId,
  );
  if (!incident) return { ok: false, message: "장애 이력을 찾을 수 없습니다." };
  const nowDateTime = getSeoulNow().dateTime;
  const blockReason = getResolveBlockReason(incident, nowDateTime);
  if (blockReason) return { ok: false, message: blockReason };

  const changes = readChanges();
  const isCreated = changes.created.some(({ id }) => id === incidentId);
  writeChanges(
    isCreated
      ? {
          ...changes,
          created: changes.created.map((item) =>
            item.id === incidentId ? { ...item, status: "RESOLVED", resolvedAt: nowDateTime } : item,
          ),
        }
      : { ...changes, resolved: { ...changes.resolved, [incidentId]: nowDateTime } },
  );
  return { ok: true, incident: { ...incident, status: "RESOLVED", resolvedAt: nowDateTime } };
}

/** 개발용: 이 브라우저에 저장된 등록·복구 내역을 지우고 원본 Mock 상태로 되돌린다 */
export function resetMockIncidentChanges() {
  writeChanges(EMPTY_CHANGES);
}

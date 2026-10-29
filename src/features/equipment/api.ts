import { getNotifications } from "@/features/notifications/api";
import type { ExamSlot } from "@/features/slots/types";
import { addDays, getSeoulNow, type DateKey } from "@/lib/date/seoulDate";
import { getMockOrganizationId } from "@/lib/dev/mockSession";
import {
  getMockEquipmentsByOrganization,
  getMockOperatingHours,
  getMockSlots,
  MOCK_RANGE_DAYS,
  MOCK_SLOT_MINUTES,
} from "@/lib/dev/mockSlots";

import type { Equipment } from "./types";

/**
 * 장비·슬롯 운영 데이터 접근 함수 (검사기관).
 *
 * TODO(api): 장비 조회·장비 상태·기관 슬롯 조회 API가 확정되면 함수 시그니처는 유지하고
 * 내부만 Gateway 호출로 교체한다. 기관 ID는 인증 연동 후 서버 세션에서 가져온다.
 */

/** Mock 데이터 사용 여부. 화면에 '개발용 예시 데이터' 표시를 띄우는 데 쓰며, API 연동 시 제거한다 */
export const IS_MOCK_DATA = true;

/** 현재 로그인한 검사기관 ID (개발용 매핑) */
export async function getCurrentExaminingOrganizationId(): Promise<string | null> {
  return getMockOrganizationId("EXAMINING");
}

/**
 * 기관 장비 목록.
 * 장비 상태: Mock에는 장비 상태 데이터가 없어, 재조정 알림에 장애 원인으로 기록된 장비만 FAILURE로 표시한다.
 */
export async function getEquipments(organizationId: string): Promise<Equipment[]> {
  const notifications = await getNotifications();
  const failedEquipmentIds = new Set(
    notifications.flatMap(({ rescheduleCause }) =>
      rescheduleCause?.kind === "EQUIPMENT_FAILURE" ? [rescheduleCause.equipmentId] : [],
    ),
  );
  const operatingHours = getMockOperatingHours(organizationId);

  return getMockEquipmentsByOrganization(organizationId).map((equipment) => ({
    ...equipment,
    status: failedEquipmentIds.has(equipment.id) ? "FAILURE" : "NORMAL",
    operatingHours,
    slotMinutes: MOCK_SLOT_MINUTES,
  }));
}

/** 슬롯 데이터 조회 가능 범위 (Mock: 오늘부터 MOCK_RANGE_DAYS일) */
export function getSlotDataRange(today: DateKey = getSeoulNow().dateKey): { start: DateKey; end: DateKey } {
  return { start: today, end: addDays(today, MOCK_RANGE_DAYS - 1) };
}

/**
 * 기관 슬롯 조회 (기간 `from`~`to`, 양 끝 포함).
 * 의뢰기관 슬롯 검색과 같은 Mock 생성기·캐시를 쓰므로 같은 장비·일시의 상태가 항상 같다.
 */
export async function getOrganizationSlots(
  organizationId: string,
  from: DateKey,
  to: DateKey,
): Promise<ExamSlot[]> {
  return getMockSlots(getSeoulNow().dateKey)
    .filter((slot) => {
      const dateKey = slot.startAt.slice(0, 10);
      return slot.organizationId === organizationId && dateKey >= from && dateKey <= to;
    })
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
}

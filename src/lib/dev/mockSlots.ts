import type { ExamSlot, ExamType, PartnerOrganization } from "@/features/slots/types";
import { addDays, getSeoulNow, getWeekday, parseDateKey, type DateKey } from "@/lib/date/seoulDate";

/**
 * ⚠️ 개발용 Mock 데이터 (실제 서버 데이터 아님)
 *
 * 슬롯 검색 API 연동 전 검색·달력 동작 확인용 예시 데이터다.
 * 기관명·장비명은 가상 값이며, 환자 정보는 포함하지 않는다. API 연동 시 이 파일을 제거한다.
 *
 * ■ 생성 기간
 *   기준 날짜(오늘, 한국 시간)부터 120일(D ~ D+119). 범위 밖 날짜에는 슬롯이 없으므로 달력에서 선택할 수 없다.
 *
 * ■ 검사기관 5곳 · 검사 유형 CT / MRI
 *   기관별 장비와 운영 요일은 MOCK_ORGANIZATIONS 참고.
 *   - 가온영상센터는 MRI만, 한빛영상의학과는 CT만 보유한다 (가온 + CT → 항상 결과 없음)
 *   - 주말 운영: 강남(토 오전), 누리(토 종일 · 일 오전). 나머지는 평일만 운영
 *
 * ■ 검사 시간
 *   오전 08:30~11:30, 오후 13:00~17:30 시작 (30분 단위, 오전 12:00·오후 18:00 이전 종료)
 *
 * ■ 날짜 유형별 생성 규칙 (고정 시나리오가 없는 날짜, 날짜마다 결정적 난수로 결정)
 *   | 유형      | 평일 | 주말 | 내용                                                   |
 *   | 예약 가능 | 52%  | 25%  | 슬롯 2·3·4·5·6·8개(주말 1~3개), 각 슬롯 35% 확률로 마감 |
 *   | 예약 마감 | 21%  | 15%  | 슬롯 1~5개(주말 1~2개), 전부 마감                      |
 *   | 슬롯 없음 | 27%  | 60%  | 슬롯 0개                                               |
 *   같은 날짜 안에서 기관·장비·시간 조합은 중복되지 않는다 (슬롯 id = 날짜 + 장비 + 시간).
 *
 * ■ 고정 시나리오 (실제 날짜 기준 13일 주기)
 *   1970-01-01부터 센 일수 % 13 이 0~4인 날짜에 아래 시나리오를 둔다. 기준 날짜와 무관하므로
 *   오늘이 바뀌어도 같은 날짜에는 같은 시나리오가 유지된다. 주기가 7의 배수가 아니라 요일이 매번 달라진다.
 *   - 0 : CT·MRI 모두 가능, 여러 기관 동시 가능(강남·서울메디·가온), 일부 마감
 *   - 1 : 슬롯은 있지만 모든 기관·유형 예약 마감
 *   - 2 : 슬롯 없음
 *   - 3 : CT만 가능(한빛영상의학과만 가능), MRI는 마감
 *   - 4 : MRI만 가능(가온영상센터만 가능), CT는 마감
 *   시나리오 슬롯이 하나라도 기관 운영 시간 밖이면(주말 등) 그 날짜는 일반 규칙으로 생성한다.
 *   → 120일 범위에 시나리오마다 여러 번 포함된다. 오늘·내일·다음 달 등 상대 날짜의 상태는 주기와 규칙에 따라 정해진다.
 *   - 오늘: 08:30~17:30 슬롯이 있으면 시각이 지날수록 선택 가능 여부가 바뀐다 (17:30 이후에는 항상 선택 불가)
 *
 * ■ 예약 가능 날짜 판단 (features/slots/availability.ts)
 *   검사 유형·기관 조건에 맞고 `isAvailable`이며 시작 시각이 현재 한국 시각 이후인 슬롯이 1개 이상이면 선택 가능.
 *   지난 날짜는 달력에서 별도로 막는다.
 *
 * ■ 재생성 조건
 *   - 날짜별 슬롯은 해당 실제 날짜와 MOCK_SEED에만 의존한다. 기준 날짜는 생성 범위(120일)만 정한다.
 *     → 새로고침해도, 기준 날짜가 바뀌어도 같은 날짜의 슬롯(id·기관·장비·시간·예약 상태)은 그대로다.
 *   - getMockSlots는 기준 날짜별로 결과를 캐시하므로, 한국 시간으로 날짜가 바뀔 때만 새로 생성한다.
 *     필터 변경·달력 열기/닫기로는 재생성되지 않으며, 반환 배열과 슬롯은 동결되어 수정할 수 없다.
 *   - 특정 날짜 기준으로 재현하려면 `createMockSlots("2026-12-28")`처럼 기준 날짜를 직접 넘긴다.
 *     (예약 가능 판단의 '현재 시각'은 실제 시각을 사용한다)
 */

/** 값을 바꾸면 일반 날짜의 생성 결과 전체가 바뀐다 */
const MOCK_SEED = "itda-slots-v1";

/** 기준 날짜 포함 생성 일수 */
export const MOCK_RANGE_DAYS = 120;

/** 운영 시간. 요일(0=일 ~ 6=토)에 값이 없으면 휴무 */
type OperatingHours = "FULL" | "AM";

interface MockOrganization extends PartnerOrganization {
  schedule: Partial<Record<number, OperatingHours>>;
}

interface MockEquipment {
  id: string;
  organizationId: string;
  name: string;
  examType: ExamType;
}

const WEEKDAYS_FULL: Partial<Record<number, OperatingHours>> = {
  1: "FULL",
  2: "FULL",
  3: "FULL",
  4: "FULL",
  5: "FULL",
};

const MOCK_ORGANIZATIONS: MockOrganization[] = [
  { id: "org-gangnam", name: "강남영상의학센터", schedule: { ...WEEKDAYS_FULL, 6: "AM" } },
  { id: "org-seoulmedi", name: "서울메디영상센터", schedule: WEEKDAYS_FULL },
  { id: "org-gaon", name: "가온영상센터", schedule: WEEKDAYS_FULL },
  { id: "org-hanbit", name: "한빛영상의학과", schedule: { ...WEEKDAYS_FULL, 3: "AM" } },
  { id: "org-nuri", name: "누리영상센터", schedule: { 0: "AM", 2: "FULL", 3: "FULL", 4: "FULL", 5: "FULL", 6: "FULL" } },
];

const MOCK_EQUIPMENTS: MockEquipment[] = [
  { id: "eq-gangnam-ct-1", organizationId: "org-gangnam", name: "CT 1호기", examType: "CT" },
  { id: "eq-gangnam-ct-2", organizationId: "org-gangnam", name: "CT 2호기", examType: "CT" },
  { id: "eq-gangnam-mri-1", organizationId: "org-gangnam", name: "MRI 1호기", examType: "MRI" },
  { id: "eq-seoulmedi-ct-1", organizationId: "org-seoulmedi", name: "CT 1호기", examType: "CT" },
  { id: "eq-seoulmedi-mri-1", organizationId: "org-seoulmedi", name: "MRI 1호기", examType: "MRI" },
  { id: "eq-gaon-mri-1", organizationId: "org-gaon", name: "MRI 1호기", examType: "MRI" },
  { id: "eq-gaon-mri-2", organizationId: "org-gaon", name: "MRI 2호기", examType: "MRI" },
  { id: "eq-hanbit-ct-1", organizationId: "org-hanbit", name: "CT 1호기", examType: "CT" },
  { id: "eq-hanbit-ct-2", organizationId: "org-hanbit", name: "CT 2호기", examType: "CT" },
  { id: "eq-nuri-ct-1", organizationId: "org-nuri", name: "CT 1호기", examType: "CT" },
  { id: "eq-nuri-mri-1", organizationId: "org-nuri", name: "MRI 1호기", examType: "MRI" },
];

export const MOCK_PARTNER_ORGANIZATIONS: PartnerOrganization[] = MOCK_ORGANIZATIONS.map(
  ({ id, name }) => ({ id, name }),
);

const AM_TIMES = ["08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
const PM_TIMES = ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];

/** [장비 id, 시작 시각, 예약 가능 여부] */
type ScenarioSlot = [equipmentId: string, time: string, isAvailable: boolean];

/** 고정 시나리오 주기(일). 7의 배수가 아니어야 시나리오가 여러 요일에 놓인다 */
const SCENARIO_CYCLE_DAYS = 13;

/** 주기 내 위치(실제 날짜 기준) → 고정 슬롯 (빈 배열 = 슬롯 없음). 모두 평일 운영 시간 안의 슬롯이다 */
const FIXED_SCENARIOS: Record<number, ScenarioSlot[]> = {
  0: [
    ["eq-gangnam-mri-1", "09:30", true],
    ["eq-seoulmedi-ct-1", "11:00", true],
    ["eq-gangnam-mri-1", "13:30", false],
    ["eq-gaon-mri-2", "15:00", true],
    ["eq-seoulmedi-ct-1", "16:00", false],
  ],
  1: [
    ["eq-gangnam-ct-2", "09:00", false],
    ["eq-seoulmedi-ct-1", "10:00", false],
    ["eq-gaon-mri-2", "14:00", false],
    ["eq-seoulmedi-mri-1", "16:30", false],
  ],
  2: [],
  3: [
    ["eq-hanbit-ct-1", "09:00", true],
    ["eq-hanbit-ct-2", "10:30", true],
    ["eq-gangnam-mri-1", "14:00", false],
  ],
  4: [
    ["eq-gaon-mri-1", "09:30", true],
    ["eq-gangnam-ct-1", "11:00", false],
    ["eq-gaon-mri-2", "13:00", true],
    ["eq-seoulmedi-ct-1", "15:30", false],
  ],
};

/** 1970-01-01부터의 일수 (UTC 기준 계산이라 시간대 영향 없음) */
function toEpochDay(dateKey: DateKey): number {
  const { year, month, day } = parseDateKey(dateKey);
  return Math.round(Date.UTC(year, month - 1, day) / 86_400_000);
}

/** FNV-1a 32bit 문자열 해시 */
function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** 시드 고정 난수 생성기 (mulberry32). 0 이상 1 미만 */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(items: T[], random: () => number): T => items[Math.floor(random() * items.length)];

const findEquipment = (equipmentId: string) => MOCK_EQUIPMENTS.find(({ id }) => id === equipmentId)!;

/** 해당 날짜에 장비 소속 기관이 운영하는 시작 시각 목록 (휴무면 빈 배열) */
function getOperatingTimes(equipment: MockEquipment, dateKey: DateKey): string[] {
  const hours = MOCK_ORGANIZATIONS.find(({ id }) => id === equipment.organizationId)!.schedule[
    getWeekday(dateKey)
  ];
  if (!hours) return [];
  return hours === "AM" ? AM_TIMES : [...AM_TIMES, ...PM_TIMES];
}

function toSlot(dateKey: DateKey, equipment: MockEquipment, time: string, isAvailable: boolean): ExamSlot {
  const organization = MOCK_ORGANIZATIONS.find(({ id }) => id === equipment.organizationId)!;
  return Object.freeze({
    id: `slot-${dateKey}-${equipment.id}-${time.replace(":", "")}`,
    organizationId: organization.id,
    organizationName: organization.name,
    equipmentId: equipment.id,
    equipmentName: equipment.name,
    examType: equipment.examType,
    startAt: `${dateKey}T${time}`,
    isAvailable,
  });
}

/** 실제 날짜에 해당하는 고정 시나리오. 없거나 운영 시간 밖 슬롯이 있으면 null */
function getScenarioSlots(dateKey: DateKey): ExamSlot[] | null {
  const scenario = FIXED_SCENARIOS[toEpochDay(dateKey) % SCENARIO_CYCLE_DAYS];
  if (!scenario) return null;

  const isOperating = scenario.every(([equipmentId, time]) =>
    getOperatingTimes(findEquipment(equipmentId), dateKey).includes(time),
  );
  if (!isOperating) return null;

  return scenario.map(([equipmentId, time, isAvailable]) =>
    toSlot(dateKey, findEquipment(equipmentId), time, isAvailable),
  );
}

/** 해당 날짜에 운영하는 장비·시간 조합 전체 */
function getOpenCandidates(dateKey: DateKey): [MockEquipment, string][] {
  return MOCK_EQUIPMENTS.flatMap((equipment) =>
    getOperatingTimes(equipment, dateKey).map((time): [MockEquipment, string] => [equipment, time]),
  );
}

function createGeneratedSlots(dateKey: DateKey): ExamSlot[] {
  const random = createRandom(hashString(`${MOCK_SEED}:${dateKey}`));
  const weekday = getWeekday(dateKey);
  const isWeekend = weekday === 0 || weekday === 6;

  const roll = random();
  const [availableRate, fullRate] = isWeekend ? [0.25, 0.4] : [0.52, 0.73];
  if (roll >= fullRate) return []; // 슬롯 없음
  const isFullDay = roll >= availableRate;

  const counts = isFullDay
    ? isWeekend ? [1, 2] : [1, 2, 3, 4, 5]
    : isWeekend ? [1, 2, 3] : [2, 3, 4, 5, 6, 8];
  const candidates = getOpenCandidates(dateKey);

  // Fisher–Yates 셔플 후 앞에서부터 사용 → 장비·시간 중복 없음
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const chosen = candidates
    .slice(0, pick(counts, random))
    .sort((a, b) => a[1].localeCompare(b[1]) || a[0].id.localeCompare(b[0].id));
  if (chosen.length === 0) return [];

  const statuses = chosen.map(() => !isFullDay && random() >= 0.35);
  // 예약 가능 날짜는 최소 1개 슬롯을 예약 가능으로 보장
  if (!isFullDay && !statuses.includes(true)) statuses[Math.floor(random() * statuses.length)] = true;

  return chosen.map(([equipment, time], index) => toSlot(dateKey, equipment, time, statuses[index]));
}

/**
 * 기준 날짜부터 MOCK_RANGE_DAYS일 동안의 슬롯을 생성한다.
 * 날짜별 슬롯은 실제 날짜로만 결정되므로, 기준 날짜는 생성 범위에만 영향을 준다.
 */
export function createMockSlots(baseDate: DateKey): readonly ExamSlot[] {
  const slots: ExamSlot[] = [];
  for (let offset = 0; offset < MOCK_RANGE_DAYS; offset++) {
    const dateKey = addDays(baseDate, offset);
    slots.push(...(getScenarioSlots(dateKey) ?? createGeneratedSlots(dateKey)));
  }
  return Object.freeze(slots);
}

let cache: { baseDate: DateKey; slots: readonly ExamSlot[] } | null = null;

/** 기준 날짜(기본값: 오늘, 한국 시간)의 Mock 슬롯. 기준 날짜가 바뀔 때만 다시 생성한다 */
export function getMockSlots(baseDate: DateKey = getSeoulNow().dateKey): readonly ExamSlot[] {
  if (cache?.baseDate !== baseDate) cache = { baseDate, slots: createMockSlots(baseDate) };
  return cache.slots;
}

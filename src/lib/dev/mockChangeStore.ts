/**
 * ⚠️ 개발용 Mock 변경분 저장소 생성기 (실제 서버 저장 아님)
 *
 * 원본 Mock은 그대로 두고, 화면에서 바꾼 내용만 브라우저 저장소(localStorage)에 따로 둔다.
 * - 서버에서는 항상 빈 변경분을 돌려준다 (Server Component는 브라우저 저장소를 읽지 않는다)
 * - 같은 탭의 구독자에게 바로 알리고, 다른 탭의 변경은 storage 이벤트로 반영한다
 * - 저장된 값이 깨져 있으면 parse가 걸러낸 값(또는 빈 값)으로 시작한다
 * 장비·슬롯 변경 저장소(features/equipment/mockEquipmentStore.ts)가 사용한다.
 * API 연동 시 이 파일과 사용하는 저장소를 제거한다.
 */
export interface MockChangeStore<T> {
  /** 현재 변경분 (서버에서는 empty). 바뀌기 전까지 같은 객체를 돌려준다 */
  read: () => T;
  write: (next: T) => void;
  subscribe: (listener: () => void) => () => void;
  /** 변경분이 바뀔 때마다 1씩 늘어나는 값 (캐시 무효화용, 서버·첫 렌더링에서는 0) */
  getVersion: () => number;
  empty: T;
}

export function createMockChangeStore<T>({
  key,
  empty,
  parse,
  isEmpty,
}: {
  /** localStorage 키 */
  key: string;
  empty: T;
  /** 저장된 JSON 값을 검증해 변경분으로 만든다 */
  parse: (raw: unknown) => T;
  /** 비어 있으면 저장소에서 키를 지운다 */
  isEmpty: (value: T) => boolean;
}): MockChangeStore<T> {
  let cached: T | null = null;
  let version = 0;
  const listeners = new Set<() => void>();

  const read = (): T => {
    if (typeof window === "undefined") return empty;
    if (cached === null) {
      try {
        const raw = window.localStorage.getItem(key);
        cached = raw ? parse(JSON.parse(raw)) : empty;
      } catch {
        cached = empty;
      }
    }
    return cached;
  };

  const notify = () => {
    version += 1;
    listeners.forEach((listener) => listener());
  };

  const write = (next: T) => {
    cached = next;
    try {
      if (isEmpty(next)) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // 저장소를 쓸 수 없으면(사생활 보호 모드 등) 이 탭에서만 유지된다
    }
    notify();
  };

  // 다른 탭의 변경: 구독자가 있는 동안 storage 이벤트 하나로 캐시를 비우고 모두에게 알린다
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== key && event.key !== null) return;
    cached = null;
    notify();
  };

  const subscribe = (listener: () => void) => {
    if (listeners.size === 0) window.addEventListener("storage", handleStorage);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) window.removeEventListener("storage", handleStorage);
    };
  };

  return { read, write, subscribe, getVersion: () => version, empty };
}

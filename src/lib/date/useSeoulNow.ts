import { useSyncExternalStore } from "react";

import { getSeoulNow, type SeoulNow } from "./seoulDate";

/** 분 단위로 갱신 확인 (표시 정밀도가 분이라 충분하다) */
const REFRESH_MS = 30_000;

const subscribe = (onChange: () => void) => {
  const timer = setInterval(onChange, REFRESH_MS);
  return () => clearInterval(timer);
};

/** `YYYY-MM-DDTHH:mm` 문자열은 값이 같으면 같은 스냅샷으로 취급된다 */
const getSnapshot = () => getSeoulNow().dateTime;
const getServerSnapshot = () => null;

/**
 * 현재 한국 시각 (클라이언트 전용).
 * 서버 렌더링·프리렌더 시점에는 null이므로, 시각에 따라 달라지는 내용은 null일 때 자리만 표시한다.
 * 빌드 시점 시각과 브라우저 시각이 달라 생기는 hydration 불일치를 막는다.
 */
export function useSeoulNow(): SeoulNow | null {
  const dateTime = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return dateTime ? { dateKey: dateTime.slice(0, 10), dateTime } : null;
}

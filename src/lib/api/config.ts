import { ApiError } from "./errors";

/**
 * API 설정 (서버·브라우저 공통).
 *
 * ⚠️ 이 파일은 브라우저 번들에도 들어간다. 토큰·테스트 헤더·내부 비밀값을 두지 않는다.
 * 인증 정보 주입이 필요해지면 `import "server-only"`를 건 별도 서버 전용 모듈에서 client.ts의 `headers`로 넘긴다.
 *
 * 환경변수 (NEXT_PUBLIC_* 값은 빌드할 때 번들에 들어가므로 바꾸면 다시 빌드·배포해야 한다)
 * - NEXT_PUBLIC_API_MODE: "mock"(기본) | "api"
 * - NEXT_PUBLIC_API_BASE_URL: 브라우저가 호출할 Gateway 주소 (공개 값. 예: https://gateway.example.com 또는 /api 경유 경로)
 * - API_BASE_URL: 서버에서만 쓰는 Gateway 주소 (선택. 컨테이너 내부 주소 등). 없으면 NEXT_PUBLIC_API_BASE_URL을 쓴다
 */

export type ApiMode = "mock" | "api";

/** 요청 제한 시간 기본값(ms) */
export const DEFAULT_API_TIMEOUT_MS = 10_000;

/**
 * 현재 데이터 모드. 값이 없으면 Mock이고, 알 수 없는 값이면 Mock으로 바꾸지 않고 설정 오류를 낸다
 * (오타로 실제 연동이 꺼진 것을 모르고 지나가지 않도록).
 */
export function getApiMode(): ApiMode {
  // NEXT_PUBLIC_ 값은 이렇게 직접 참조해야 빌드 시 브라우저 번들에 들어간다
  const raw = process.env.NEXT_PUBLIC_API_MODE?.trim();
  if (!raw || raw === "mock") return "mock";
  if (raw === "api") return "api";
  throw new ApiError("CONFIG", `NEXT_PUBLIC_API_MODE 값이 올바르지 않습니다: "${raw}" ("mock" 또는 "api")`);
}

/**
 * Mock 구현만 있는 기능을 API 모드에서 호출했을 때의 오류. Mock 모드면 null.
 * Mock 데이터로 대신 응답하지 않는다 (연동 실패를 숨기지 않기 위해).
 * 결과 객체({ ok: false, message })를 돌려주는 변경 함수에서 쓴다.
 */
export function getMockOnlyError(feature: string): ApiError | null {
  try {
    if (getApiMode() === "mock") return null;
  } catch (error) {
    return error instanceof ApiError ? error : new ApiError("CONFIG", "API 설정을 확인해 주세요.", { cause: error });
  }
  return new ApiError("NOT_IMPLEMENTED", `아직 실제 API로 연결하지 않은 기능입니다. (${feature})`);
}

/** 조회 함수용: API 모드(또는 설정 오류)면 ApiError를 던진다 */
export function assertMockMode(feature: string): void {
  const error = getMockOnlyError(feature);
  if (error) throw error;
}

/**
 * 요청 기준 주소 (끝의 `/` 제거).
 * 서버: API_BASE_URL → NEXT_PUBLIC_API_BASE_URL 순 (서버 fetch는 절대 주소만 가능)
 * 브라우저: NEXT_PUBLIC_API_BASE_URL (절대 주소 또는 같은 출처 경로 `/...`)
 */
export function getApiBaseUrl(): string {
  const isServer = typeof window === "undefined";
  const raw = (isServer ? process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL : process.env.NEXT_PUBLIC_API_BASE_URL)?.trim();
  if (!raw) {
    throw new ApiError(
      "CONFIG",
      isServer ? "API 주소가 설정되지 않았습니다. (API_BASE_URL 또는 NEXT_PUBLIC_API_BASE_URL)" : "API 주소가 설정되지 않았습니다. (NEXT_PUBLIC_API_BASE_URL)",
    );
  }
  const isAbsolute = /^https?:\/\//i.test(raw);
  if (!isAbsolute && !(raw.startsWith("/") && !isServer)) {
    throw new ApiError(
      "CONFIG",
      isServer
        ? `서버 API 주소는 http(s)로 시작하는 절대 주소여야 합니다: "${raw}"`
        : `API 주소는 http(s) 절대 주소 또는 /로 시작하는 경로여야 합니다: "${raw}"`,
    );
  }
  return raw.replace(/\/+$/, "");
}

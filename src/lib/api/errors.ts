/**
 * API 오류 정규화.
 *
 * HTTP 오류·네트워크 오류·타임아웃·응답 해석 실패·설정 오류·미구현을 모두 ApiError 하나로 다룬다.
 * 화면은 `message`(사용자 안내 문구)를 그대로 보여 주고, 분기는 `kind`·`status`로 한다.
 * 서버 오류 응답 본문의 형식은 백엔드 계약이 확정되지 않았으므로 해석하지 않고 `body`에 원본 그대로 둔다.
 */

export type ApiErrorKind =
  /** 서버가 2xx가 아닌 상태 코드로 응답 */
  | "HTTP"
  /** 서버에 연결하지 못함 (DNS·CORS·오프라인 등) */
  | "NETWORK"
  /** 제한 시간 안에 응답이 끝나지 않음 */
  | "TIMEOUT"
  /** 호출한 쪽이 요청을 취소함 (화면 이동 등). 보통 사용자에게 알리지 않는다 */
  | "ABORTED"
  /** 응답이 JSON이 아니거나 해석할 수 없음 */
  | "PARSE"
  /** API 모드·주소 등 환경 설정이 잘못됨 */
  | "CONFIG"
  /** API 모드인데 아직 실제 API로 연결하지 않은 기능 */
  | "NOT_IMPLEMENTED";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** HTTP 상태 코드. HTTP 오류가 아니면 null */
  readonly status: number | null;
  /** 서버 오류 응답 본문 (JSON이면 해석한 값, 아니면 문자열). 형식 미확정이라 그대로 보관한다 */
  readonly body: unknown;
  /** 원인 오류 (네트워크 오류 등). 디버깅용 */
  readonly cause: unknown;

  constructor(
    kind: ApiErrorKind,
    message: string,
    { status = null, body = null, cause }: { status?: number | null; body?: unknown; cause?: unknown } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.body = body;
    this.cause = cause;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

/** HTTP 상태 코드별 사용자 안내 문구 (서버 메시지 필드는 계약 확정 후 반영한다) */
export function getHttpErrorMessage(status: number): string {
  if (status === 400 || status === 422) return "요청 내용을 확인해 주세요.";
  if (status === 401) return "로그인이 필요합니다. 다시 로그인해 주세요.";
  if (status === 403) return "이 작업을 할 권한이 없습니다.";
  if (status === 404) return "요청한 정보를 찾을 수 없습니다.";
  if (status === 409) return "다른 요청과 충돌했습니다. 최신 정보를 확인한 뒤 다시 시도해 주세요.";
  if (status === 429) return "요청이 많아 잠시 처리할 수 없습니다. 잠시 후 다시 시도해 주세요.";
  if (status >= 500) return "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

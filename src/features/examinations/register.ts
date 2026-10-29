import { getSeoulNow } from "@/lib/date/seoulDate";

import { getRegistrationBlockReason, validateResultInput } from "./rules";
import type { ExamResult, ExamResultInput, Examination } from "./types";

/**
 * 검사 결과 등록 (클라이언트에서 호출). 조회 함수(api.ts)와 분리해 Mock 데이터를 브라우저 번들에 넣지 않는다.
 * TODO(api): 결과 등록 API(엔드포인트 미확정) 호출로 교체한다. 함수 시그니처는 유지한다.
 */

/** Mock 결과 등록 지연(ms). 등록 중 상태·중복 클릭 방지를 확인하기 위한 값 */
const MOCK_DELAY_MS = 500;

export type RegisterResultOutcome = { ok: true; result: ExamResult } | { ok: false; message: string };

/**
 * 검사 결과 등록 (⚠️ Mock: 서버에 저장하지 않는다).
 * 등록 가능 여부와 입력값을 검증한 뒤 등록될 결과를 돌려준다. 호출한 화면이 자기 상태에만 반영하며,
 * 새로고침하면 초기 Mock으로 돌아간다. 의뢰기관에 전달되지 않는다.
 * TODO(api): 결과 등록 API 호출로 교체한다. 서버에서도 같은 조건(검사 완료·취소 아님·중복 아님)을 검증해야 한다.
 */
export async function registerExaminationResult(
  examination: Examination,
  input: ExamResultInput,
): Promise<RegisterResultOutcome> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  const blockReason = getRegistrationBlockReason(examination);
  if (blockReason) return { ok: false, message: blockReason };
  const errors = validateResultInput(input);
  if (errors.status || errors.text || !input.status) {
    return { ok: false, message: errors.status ?? errors.text ?? "입력값을 확인해 주세요." };
  }

  return {
    ok: true,
    result: { status: input.status, text: input.text.trim(), registeredAt: getSeoulNow().dateTime },
  };
}

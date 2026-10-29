import { getResultRegistrationStatus } from "./rules";
import type { Examination, ExaminationSearchCriteria, ExaminationSummaryCounts } from "./types";

/** 검색 조건 전체 해제 상태 (과거·미래 검사가 모두 보인다) */
export const EMPTY_EXAMINATION_CRITERIA: ExaminationSearchCriteria = {
  keyword: "",
  examType: "",
  progressStatus: "",
  resultRegistration: "",
  dateFrom: "",
  dateTo: "",
};

/** 검색 전 입력 검증. 문제가 없으면 null */
export function validateExaminationCriteria({ dateFrom, dateTo }: ExaminationSearchCriteria): string | null {
  if (dateFrom && dateTo && dateFrom > dateTo) return "시작일이 종료일보다 늦습니다. 검사 기간을 다시 선택해 주세요.";
  return null;
}

export const hasExaminationCriteria = (criteria: ExaminationSearchCriteria) =>
  Object.values(criteria).some(Boolean);

/** 모든 조건을 AND로 적용한다. 기간은 검사 예정일 기준 */
export function filterExaminations(examinations: readonly Examination[], criteria: ExaminationSearchCriteria) {
  const keyword = criteria.keyword.trim().toLowerCase();
  return examinations.filter((examination) => {
    const date = examination.scheduledAt.slice(0, 10);
    return (
      (!keyword ||
        [examination.referralNumber, examination.virtualPatientId].some((value) =>
          value.toLowerCase().includes(keyword),
        )) &&
      (!criteria.examType || examination.examType === criteria.examType) &&
      (!criteria.progressStatus || examination.progressStatus === criteria.progressStatus) &&
      (!criteria.resultRegistration || getResultRegistrationStatus(examination) === criteria.resultRegistration) &&
      (!criteria.dateFrom || date >= criteria.dateFrom) &&
      (!criteria.dateTo || date <= criteria.dateTo)
    );
  });
}

/** 결과 미등록 건 먼저, 그다음 검사 예정 일시 최근 순 */
export function sortExaminations(examinations: readonly Examination[]): Examination[] {
  return [...examinations].sort(
    (a, b) =>
      Number(getResultRegistrationStatus(b) === "PENDING") - Number(getResultRegistrationStatus(a) === "PENDING") ||
      b.scheduledAt.localeCompare(a.scheduledAt) ||
      a.referralNumber.localeCompare(b.referralNumber),
  );
}

/** 검사 현황 요약 (검색 조건과 무관하게 현재 기관 전체 기준) */
export function summarizeExaminations(examinations: readonly Examination[]): ExaminationSummaryCounts {
  const count = (predicate: (examination: Examination) => boolean) => examinations.filter(predicate).length;
  return {
    waiting: count(({ progressStatus }) => progressStatus === "WAITING"),
    inProgress: count(({ progressStatus }) => progressStatus === "IN_PROGRESS"),
    completed: count(({ progressStatus }) => progressStatus === "COMPLETED"),
    resultPending: count((examination) => getResultRegistrationStatus(examination) === "PENDING"),
  };
}

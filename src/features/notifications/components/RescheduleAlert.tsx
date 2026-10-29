import { AlertCircle } from "lucide-react";

import type { ExamType } from "@/features/slots/types";

interface RescheduleAlertProps {
  /** 재조정 필요 건수. 0이면 표시하지 않는다 */
  count: number;
  /** 확인된 장비 장애 검사 유형. null이면 원인을 표시하지 않는다 */
  failureExamTypes: ExamType[] | null;
  isMockData: boolean;
}

/** 재조정 필요 안내 배너 */
export default function RescheduleAlert({ count, failureExamTypes, isMockData }: RescheduleAlertProps) {
  if (count === 0) return null;

  const title = failureExamTypes
    ? `${failureExamTypes.join("·")} 장비 장애로 예약 재조정이 필요합니다.`
    : `예약 재조정이 필요한 건이 ${count}건 있습니다.`;

  return (
    <div role="alert" className="flex items-start gap-4 rounded-xl border border-red-200 bg-red-50 px-6 py-5">
      <AlertCircle className="mt-0.5 size-8 shrink-0 text-red-600" aria-hidden="true" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-lg font-bold text-red-700">{title}</p>
          {isMockData && (
            <span className="rounded border border-dashed border-amber-400 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
              개발용 예시 시나리오
            </span>
          )}
        </div>
        <p className="mt-1 text-[15px] text-gray-700">
          기존 예약은 자동으로 삭제되지 않으며, 새로운 검사 시간을 선택할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

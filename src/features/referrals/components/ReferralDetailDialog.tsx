import Modal from "@/components/ui/Modal";
import { formatDateTimeWithWeekday } from "@/lib/format/date";

import type { ReferralSummary } from "../types";

import DetailList from "./DetailList";
import ReferralStatusBadge from "./ReferralStatusBadge";

interface ReferralDetailDialogProps {
  /** null이면 닫힘 */
  referral: ReferralSummary | null;
  onClose: () => void;
}

/**
 * 의뢰 상세 모달 (조회 전용).
 * 상태 변경·취소·재조정 기능은 두지 않는다.
 * TODO(api): 상세 API가 생기면 목록 항목 대신 상세 응답으로 표시한다.
 */
export default function ReferralDetailDialog({ referral, onClose }: ReferralDetailDialogProps) {
  return (
    <Modal open={referral !== null} title="의뢰 상세" description={referral?.referralNumber} onClose={onClose}>
      {referral && (
        <>
          <DetailList
            items={[
              ["예약 상태", <ReferralStatusBadge key="status" status={referral.status} />],
              ["가상 환자 ID", referral.virtualPatientId],
              ["검사기관", referral.organizationName],
              ["검사 장비", referral.equipmentName],
              ["검사 유형", referral.examType],
              ["검사 일시", formatDateTimeWithWeekday(referral.scheduledAt)],
              ["의뢰 목적", referral.purpose || <span key="purpose" className="text-gray-400">입력 없음</span>],
              ["의뢰 요청 일시", formatDateTimeWithWeekday(referral.requestedAt)],
            ]}
          />
          <div className="mt-7 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-lg border border-line bg-white px-6 text-[15px] font-semibold text-gray-700 hover:bg-gray-50"
            >
              닫기
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

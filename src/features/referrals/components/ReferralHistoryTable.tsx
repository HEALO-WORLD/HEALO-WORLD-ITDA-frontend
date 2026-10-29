"use client";

import { useState } from "react";

import { formatDateTimeWithWeekday } from "@/lib/format/date";

import type { ReferralSummary } from "../types";

import ReferralDetailDialog from "./ReferralDetailDialog";
import ReferralStatusBadge from "./ReferralStatusBadge";

interface ReferralHistoryTableProps {
  referrals: readonly ReferralSummary[];
}

const thClass = "whitespace-nowrap px-6 py-5 text-left text-[15px] font-semibold text-gray-700";
const tdClass = "px-6 py-5 text-[15px] text-gray-900";

/** 최근 의뢰·예약 내역 표와 상세 모달 */
export default function ReferralHistoryTable({ referrals }: ReferralHistoryTableProps) {
  const [selected, setSelected] = useState<ReferralSummary | null>(null);

  if (referrals.length === 0) {
    return (
      <p
        role="status"
        className="rounded-lg border border-dashed border-line px-6 py-16 text-center text-[15px] text-gray-500"
      >
        최근 의뢰·예약 내역이 없습니다.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[820px] border-collapse">
          <thead className="bg-gray-100/80">
            <tr>
              <th scope="col" className={thClass}>의뢰 번호</th>
              <th scope="col" className={thClass}>검사기관</th>
              <th scope="col" className={thClass}>검사 유형</th>
              <th scope="col" className={thClass}>검사 일시</th>
              <th scope="col" className={`${thClass} text-center`}>예약 상태</th>
              <th scope="col" className={`${thClass} text-center`}>관리</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((referral) => (
              <tr key={referral.id} className="border-t border-line">
                <td className={`${tdClass} whitespace-nowrap`}>{referral.referralNumber}</td>
                <td className={`${tdClass} whitespace-nowrap`}>{referral.organizationName}</td>
                <td className={tdClass}>{referral.examType}</td>
                <td className={`${tdClass} whitespace-nowrap`}>
                  {formatDateTimeWithWeekday(referral.scheduledAt)}
                </td>
                <td className={`${tdClass} text-center`}>
                  <ReferralStatusBadge status={referral.status} />
                </td>
                <td className={`${tdClass} text-center`}>
                  <button
                    type="button"
                    onClick={() => setSelected(referral)}
                    aria-label={`${referral.referralNumber} 상세`}
                    className="h-10 w-[92px] rounded-lg border border-primary bg-white text-[15px] font-semibold text-primary transition-colors hover:bg-primary-soft"
                  >
                    상세
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ReferralDetailDialog referral={selected} onClose={() => setSelected(null)} />
    </>
  );
}

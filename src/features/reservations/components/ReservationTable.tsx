import { ChevronLeft, ChevronRight } from "lucide-react";

import ReferralStatusBadge from "@/features/referrals/components/ReferralStatusBadge";
import { formatDateTime } from "@/lib/format/date";

import type { Reservation } from "../types";

interface ReservationTableProps {
  /** 현재 페이지 행 */
  rows: Reservation[];
  totalCount: number;
  page: number;
  pageCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** 상세 모달을 열고 있는 예약 (행 강조용) */
  selectedId: string | null;
  onSelect: (reservation: Reservation) => void;
  /** 결과가 없을 때 문구 (기관 예약 없음 / 검색 결과 없음 구분) */
  emptyMessage: string;
  /** 검색 결과가 없을 때 조건 초기화 */
  onResetFilters?: () => void;
}

const thClass = "whitespace-nowrap px-4 py-3.5 text-left text-sm font-semibold text-gray-700";
const tdClass = "px-4 py-3.5 text-[15px] text-gray-900";

/** 예약 목록 (상세 버튼으로 상세 모달 열기, 페이지 단위 탐색) */
export default function ReservationTable({
  rows,
  totalCount,
  page,
  pageCount,
  pageSize,
  onPageChange,
  selectedId,
  onSelect,
  emptyMessage,
  onResetFilters,
}: ReservationTableProps) {
  if (totalCount === 0) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line px-6 py-14 text-center text-[15px] text-gray-500">
        {emptyMessage}
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="h-9 rounded-md border border-line bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            검색 조건 초기화
          </button>
        )}
      </div>
    );
  }

  const from = (page - 1) * pageSize + 1;
  const to = from + rows.length - 1;

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-line">
        {/* 고정 열 너비: 일시·상태·버튼은 잘리지 않게, 기관명·장비명은 남는 폭에서 말줄임 */}
        <table className="w-full min-w-[820px] table-fixed border-collapse">
          <colgroup>
            <col className="w-[104px]" />
            <col />
            <col className="w-[96px]" />
            <col className="w-[18%]" />
            <col className="w-[168px]" />
            <col className="w-[132px]" />
            <col className="w-[96px]" />
          </colgroup>
          <thead className="bg-gray-100/80">
            <tr>
              <th scope="col" className={thClass}>예약번호</th>
              <th scope="col" className={thClass}>의뢰기관</th>
              <th scope="col" className={thClass}>검사 유형</th>
              <th scope="col" className={thClass}>검사 장비</th>
              <th scope="col" className={thClass}>검사 일시</th>
              <th scope="col" className={`${thClass} text-center`}>예약 상태</th>
              <th scope="col" className={`${thClass} text-center`}>상세</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((reservation) => {
              const isSelected = reservation.id === selectedId;
              return (
                <tr
                  key={reservation.id}
                  className={`border-t border-line transition-colors ${isSelected ? "bg-primary-soft" : "hover:bg-gray-50"}`}
                >
                  <td className={`${tdClass} whitespace-nowrap font-semibold`}>{reservation.referralNumber}</td>
                  <td className={`${tdClass} truncate`} title={reservation.referringOrganizationName}>
                    {reservation.referringOrganizationName}
                  </td>
                  <td className={tdClass}>{reservation.examType}</td>
                  <td className={`${tdClass} truncate`} title={reservation.equipmentName}>
                    {reservation.equipmentName}
                  </td>
                  <td className={`${tdClass} whitespace-nowrap tabular-nums`}>{formatDateTime(reservation.scheduledAt)}</td>
                  <td className={`${tdClass} text-center`}>
                    <ReferralStatusBadge status={reservation.status} />
                  </td>
                  <td className={`${tdClass} text-center`}>
                    <button
                      type="button"
                      onClick={() => onSelect(reservation)}
                      aria-label={`${reservation.referralNumber} 상세 보기`}
                      aria-haspopup="dialog"
                      className="h-9 rounded-md border border-primary bg-white px-3.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
                    >
                      상세
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
        <p aria-live="polite">
          총 {totalCount}건 중 {from}–{to}
        </p>
        {pageCount > 1 && (
          <nav aria-label="예약 목록 페이지" className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              aria-label="이전 페이지"
              className="rounded-md p-1.5 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <span className="min-w-[64px] text-center tabular-nums">
              {page} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page === pageCount}
              aria-label="다음 페이지"
              className="rounded-md p-1.5 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </nav>
        )}
      </div>
    </>
  );
}

"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import Modal from "@/components/ui/Modal";
import { ROUTES } from "@/constants/navigation";
import ReferralCreateForm from "@/features/referrals/components/ReferralCreateForm";
import RescheduleSlotConfirm from "@/features/referrals/components/RescheduleSlotConfirm";
import type { ReferralSummary } from "@/features/referrals/types";
import type { RescheduleCause } from "@/features/notifications/types";
import { formatDateTimeWithWeekday } from "@/lib/format/date";

import { IS_MOCK_DATA, searchSlots } from "../api";
import type { ExamSlot, PartnerOrganization, SlotSearchCriteria } from "../types";

import SlotSearchFilter from "./SlotSearchFilter";
import SlotSearchTable from "./SlotSearchTable";

interface SlotSearchProps {
  organizations: PartnerOrganization[];
  /**
   * 재조정 대상 예약. 있으면 신규 의뢰 대신 대체 슬롯 선택 모드로 동작한다.
   * 쿼리에 대상이 있었지만 찾지 못했거나 재조정 대상이 아니면 "INVALID"
   */
  rescheduleTarget?: ReferralSummary | "INVALID" | null;
  /** 재조정 대상 예약의 장애 장비. 재조정 모드에서만 검색·달력에서 제외한다 */
  failedEquipments?: RescheduleCause[];
}

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; slots: ExamSlot[] }
  | { status: "error" };

/**
 * 검사 슬롯 검색(S02)의 클라이언트 경계.
 * 검색 조건 → 검색 실행 → 결과/상태 표시, 예약 요청 클릭 처리를 담당한다.
 */
export default function SlotSearch({
  organizations,
  rescheduleTarget = null,
  failedEquipments = [],
}: SlotSearchProps) {
  const rescheduleReferral =
    rescheduleTarget && rescheduleTarget !== "INVALID" ? rescheduleTarget : null;
  // 일반 검색에는 제외 조건을 적용하지 않는다
  const excludedEquipments = rescheduleReferral ? failedEquipments : [];
  const excludedEquipmentIds = excludedEquipments.map(({ equipmentId }) => equipmentId);
  const [search, setSearch] = useState<SearchState>({ status: "idle" });
  /** 예약 요청을 누른 슬롯. 의뢰 생성 모달에 읽기 전용으로 표시한다 */
  const [requestedSlot, setRequestedSlot] = useState<ExamSlot | null>(null);

  const handleSearch = async (criteria: SlotSearchCriteria) => {
    setSearch({ status: "loading" });
    try {
      const slots = await searchSlots(criteria, { excludedEquipmentIds });
      setSearch({ status: "success", slots });
    } catch {
      setSearch({ status: "error" });
    }
  };

  /** 검색 결과에서 슬롯을 찾아 의뢰 생성 모달을 연다 (예약 가능 여부는 제출 시 다시 검증) */
  const handleRequestReservation = (slotId: string) => {
    if (search.status !== "success") return;
    setRequestedSlot(search.slots.find((slot) => slot.id === slotId) ?? null);
  };

  return (
    <div className="flex flex-col gap-8">
      {rescheduleReferral && (
        <RescheduleBanner referral={rescheduleReferral} excludedEquipments={excludedEquipments} />
      )}
      {rescheduleTarget === "INVALID" && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl bg-red-50 px-6 py-4 text-[15px] text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            재조정 대상 예약을 찾을 수 없습니다. 일반 검사 슬롯 검색으로 표시합니다.
          </p>
          <Link
            href={ROUTES.referring.notifications}
            className="shrink-0 font-semibold underline underline-offset-4"
          >
            재조정·알림으로 이동
          </Link>
        </div>
      )}

      <SlotSearchFilter
        organizations={organizations}
        isSearching={search.status === "loading"}
        onSearch={handleSearch}
        initialCriteria={
          rescheduleReferral
            ? { examType: rescheduleReferral.examType, date: "", organizationId: "" }
            : undefined
        }
        isExamTypeLocked={rescheduleReferral !== null}
        excludedEquipmentIds={excludedEquipmentIds}
      />

      <section
        aria-labelledby="slot-result-title"
        className="rounded-xl border border-line bg-white px-5 pb-6 pt-7 sm:px-8"
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h2 id="slot-result-title" className="text-2xl font-bold text-gray-900">
              검색 결과
            </h2>
            {IS_MOCK_DATA && (
              <span className="rounded border border-dashed border-amber-400 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                개발용 예시 데이터
              </span>
            )}
          </div>
          {search.status === "success" && (
            <p className="text-[15px] text-gray-600" aria-live="polite">
              총 {search.slots.length}건의 검색 결과가 있습니다.
            </p>
          )}
        </div>

        {search.status === "idle" && (
          <ResultMessage>검색 조건을 선택한 후 검색 버튼을 눌러 주세요.</ResultMessage>
        )}
        {search.status === "loading" && (
          <ResultMessage>검사 슬롯을 검색하고 있습니다.</ResultMessage>
        )}
        {search.status === "error" && (
          <ResultMessage tone="error">
            검사 슬롯을 불러오지 못했습니다. 잠시 후 다시 검색해 주세요.
          </ResultMessage>
        )}
        {search.status === "success" &&
          (search.slots.length > 0 ? (
            <SlotSearchTable
              slots={search.slots}
              onRequestReservation={handleRequestReservation}
              actionLabel={rescheduleReferral ? "대체 슬롯 선택" : undefined}
            />
          ) : (
            <ResultMessage>
              {excludedEquipments.length > 0
                ? "장애 장비를 제외하면 선택한 조건에 해당하는 대체 슬롯이 없습니다. 날짜나 검사기관을 바꿔 다시 검색해 주세요."
                : "선택한 조건에 해당하는 검사 슬롯이 없습니다."}
            </ResultMessage>
          ))}
      </section>

      {rescheduleReferral ? (
        <Modal
          open={requestedSlot !== null}
          title="예약 변경 확인"
          description={`${rescheduleReferral.referralNumber} 예약을 변경할 새 슬롯을 확인합니다.`}
          onClose={() => setRequestedSlot(null)}
        >
          {requestedSlot && (
            <RescheduleSlotConfirm
              referral={rescheduleReferral}
              slot={requestedSlot}
              excludedEquipmentIds={excludedEquipmentIds}
              onCancel={() => setRequestedSlot(null)}
            />
          )}
        </Modal>
      ) : (
        <Modal
          open={requestedSlot !== null}
          title="새 검사 의뢰"
          description="선택한 검사 슬롯으로 의뢰 정보를 입력합니다."
          closeOnBackdrop={false}
          onClose={() => setRequestedSlot(null)}
        >
          {requestedSlot && (
            <ReferralCreateForm
              slot={requestedSlot}
              organizations={organizations}
              onCancel={() => setRequestedSlot(null)}
            />
          )}
        </Modal>
      )}
    </div>
  );
}

/** 재조정 모드 안내: 신규 의뢰가 아니라 기존 예약 변경용 슬롯 선택임을 표시한다 */
function RescheduleBanner({
  referral,
  excludedEquipments,
}: {
  referral: ReferralSummary;
  excludedEquipments: RescheduleCause[];
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary-soft px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <RefreshCw className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <p className="text-[17px] font-bold text-gray-900">
            기존 예약을 변경할 새로운 검사 슬롯을 선택해 주세요.
          </p>
          <p className="mt-1 text-[15px] text-gray-700">
            재조정 대상 {referral.referralNumber} · {referral.organizationName} · {referral.examType} ·
            기존 예약 {formatDateTimeWithWeekday(referral.scheduledAt)}
          </p>
          <p className="mt-0.5 text-sm text-gray-500">
            검사 유형은 기존 예약과 같게 고정됩니다. 기존 예약은 자동으로 삭제되지 않습니다.
          </p>
          {excludedEquipments.length > 0 && (
            <p className="mt-0.5 text-sm text-gray-500">
              장애 장비({referral.organizationName}{" "}
              {excludedEquipments.map(({ equipmentName }) => equipmentName).join(", ")})의 슬롯은 대체
              후보에서 제외됩니다.
            </p>
          )}
        </div>
      </div>
      <Link
        href={ROUTES.referring.notifications}
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-line bg-white px-4 text-[15px] font-semibold text-gray-700 hover:bg-gray-50"
      >
        재조정 화면으로 돌아가기
      </Link>
    </div>
  );
}

function ResultMessage({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "error";
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg border border-dashed border-line px-6 py-16 text-center text-[15px] ${
        tone === "error" ? "text-red-600" : "text-gray-500"
      }`}
    >
      {children}
    </p>
  );
}

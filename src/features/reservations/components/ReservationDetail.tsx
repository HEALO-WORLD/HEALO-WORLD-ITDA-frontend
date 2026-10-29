import { CalendarClock, ScanLine } from "lucide-react";
import type { ReactNode } from "react";

import ReferralStatusBadge from "@/features/referrals/components/ReferralStatusBadge";
import { formatDateTimeWithWeekday } from "@/lib/format/date";

import type { Reservation } from "../types";

/**
 * 예약 상세 (조회 전용 모달 본문). 예약번호·상태 배지는 모달 제목 영역에 있다.
 * Mock에 있는 항목만 표시하고, 값이 없는 항목은 숨긴다.
 * 환자 실명·성별·연령·진단명·확정 일시 등 데이터에 없는 정보는 만들지 않는다.
 * 상태 변경·취소·재조정 처리는 이 화면에서 하지 않는다.
 */
export default function ReservationDetail({ reservation }: { reservation: Reservation }) {
  // 자동 확정 정책: 확정 상태일 때만 확정 방식을 표시한다 (확정 일시는 데이터가 없어 표시하지 않음)
  const confirmationMethod = reservation.status === "CONFIRMED" ? "자동 확정 (슬롯 확보 시)" : null;

  return (
    <div className="flex flex-col gap-6">
      <Section title="검사 정보">
        {/* 가장 먼저 확인할 검사 일시·장비를 강조한다 */}
        <dl className="grid grid-cols-1 gap-4 rounded-lg bg-surface-muted px-4 py-4 sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="flex items-center gap-1.5 text-sm text-gray-500">
              <CalendarClock className="size-4 shrink-0 text-primary" aria-hidden="true" />
              검사 예정 일시
            </dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-gray-900">
              {formatDateTimeWithWeekday(reservation.scheduledAt)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="flex items-center gap-1.5 text-sm text-gray-500">
              <ScanLine className="size-4 shrink-0 text-primary" aria-hidden="true" />
              검사 장비
            </dt>
            <dd className="mt-1 break-words text-lg font-bold text-gray-900">{reservation.equipmentName}</dd>
          </div>
        </dl>
        <FieldGrid>
          <Field label="검사 유형">{reservation.examType}</Field>
          <Field label="예약 상태">
            <ReferralStatusBadge status={reservation.status} />
          </Field>
        </FieldGrid>
      </Section>

      <Section title="의뢰 정보">
        <FieldGrid>
          <Field label="의뢰기관">{reservation.referringOrganizationName}</Field>
          <Field label="가상 환자 ID">{reservation.virtualPatientId}</Field>
          {reservation.purpose && (
            <Field label="의뢰 목적" wide>
              {reservation.purpose}
            </Field>
          )}
          <Field label="의뢰 요청 일시">{formatDateTimeWithWeekday(reservation.requestedAt)}</Field>
        </FieldGrid>
      </Section>

      {confirmationMethod && (
        <Section title="예약 처리 정보">
          <FieldGrid>
            <Field label="예약 확정 방식">{confirmationMethod}</Field>
          </FieldGrid>
        </Section>
      )}

      {reservation.status === "RESCHEDULE_REQUIRED" && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          재조정이 필요한 예약입니다. 재조정 처리는 장비 장애·재조정 화면에서 진행될 예정입니다.
        </p>
      )}
      <p className="text-xs text-gray-500">조회 전용입니다. 예약 상태 변경·취소는 이 화면에서 처리하지 않습니다.</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="border-b border-line pb-2 text-sm font-bold text-gray-500">{title}</h3>
      {children}
    </section>
  );
}

function FieldGrid({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>;
}

function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={`min-w-0 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="mt-1 break-words text-[15px] font-medium text-gray-900">{children}</dd>
    </div>
  );
}

import type { ReactNode } from "react";

import EquipmentStatusBadge from "@/features/equipment/components/EquipmentStatusBadge";
import ReferralStatusBadge from "@/features/referrals/components/ReferralStatusBadge";
import { formatDateTimeWithWeekday } from "@/lib/format/date";

import type { IncidentRecord } from "../types";

import IncidentStatusBadge from "./IncidentStatusBadge";

/** API 연동 전이라 비활성화한 처리 기능 (위치만 준비) */
const PENDING_ACTIONS = ["장애 정보 수정", "장애 복구 처리", "예약 재조정 상태 변경", "재조정 알림 발송"] as const;

/**
 * 장애 상세 (조회 전용 모달 본문).
 * 영향받은 예약은 장애에 명시적으로 연결된 예약만 표시한다 (장비명·검사 유형이 같다고 추정하지 않는다).
 * 현재 장비 상태는 장비 API 기준 값이며, 이 장애의 처리 상태와 별개다.
 */
export default function IncidentDetail({ incident }: { incident: IncidentRecord }) {
  const { equipment, affectedReservations } = incident;
  const pendingNoteId = `${incident.id}-pending-note`;

  return (
    <div className="flex flex-col gap-6">
      <Section title="장비 정보">
        <FieldGrid>
          <Field label="장비명">{equipment.name ?? "확인 불가 (현재 장비 목록에 없음)"}</Field>
          <Field label="검사 유형">{equipment.examType ?? "-"}</Field>
          <Field label="현재 장비 상태">
            {equipment.currentStatus ? <EquipmentStatusBadge status={equipment.currentStatus} /> : "-"}
          </Field>
        </FieldGrid>
      </Section>

      <Section title="장애 정보">
        <FieldGrid>
          <Field label="장애번호">{incident.incidentNumber}</Field>
          <Field label="처리 상태">
            <IncidentStatusBadge status={incident.status} />
          </Field>
          <Field label="장애 사유" wide>
            {incident.reason}
          </Field>
          <Field label="장애 발생일시">{formatDateTimeWithWeekday(incident.occurredAt)}</Field>
          <Field label="복구일시">
            {incident.resolvedAt ? formatDateTimeWithWeekday(incident.resolvedAt) : "복구 전"}
          </Field>
        </FieldGrid>
      </Section>

      <Section title={`영향받은 예약 ${affectedReservations.length}건`}>
        {affectedReservations.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-gray-500">
            이 장애에 연결된 예약이 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {affectedReservations.map((reservation) => (
              <li key={reservation.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-gray-900">{reservation.referralNumber}</p>
                  <p className="text-sm tabular-nums text-gray-600">
                    검사 예정 {formatDateTimeWithWeekday(reservation.scheduledAt)}
                  </p>
                </div>
                <ReferralStatusBadge status={reservation.status} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="처리">
        <div className="flex flex-wrap gap-2">
          {PENDING_ACTIONS.map((label) => (
            <button
              key={label}
              type="button"
              disabled
              aria-describedby={pendingNoteId}
              className="h-9 cursor-not-allowed rounded-md border border-line bg-gray-50 px-3 text-sm font-medium text-gray-400"
            >
              {label}
            </button>
          ))}
        </div>
        <p id={pendingNoteId} className="text-xs text-gray-500">
          API 연동 후 사용할 수 있습니다. 지금은 장애 이력 조회만 가능합니다.
        </p>
      </Section>
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

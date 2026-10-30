import { CheckCircle2, Wrench } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import EquipmentStatusBadge from "@/features/equipment/components/EquipmentStatusBadge";
import ReferralStatusBadge from "@/features/referrals/components/ReferralStatusBadge";
import { formatDateTimeWithWeekday } from "@/lib/format/date";

import type { IncidentMutationResult } from "../mockIncidentStore";
import type { IncidentRecord } from "../types";

import IncidentStatusBadge from "./IncidentStatusBadge";

/** API 연동 전이라 비활성화한 처리 기능 (위치만 준비) */
const PENDING_ACTIONS = ["장애 정보 수정", "예약 재조정 상태 변경", "재조정 알림 발송"] as const;

interface IncidentDetailProps {
  incident: IncidentRecord;
  /** 장애 복구 처리 (⚠️ Mock). 진행 중 장애에서만 쓴다 */
  onResolve: (incidentId: string) => Promise<IncidentMutationResult>;
}

/**
 * 장애 상세 모달 본문.
 * 영향받은 예약은 장애에 명시적으로 연결된 예약만 표시한다 (장비명·검사 유형이 같다고 추정하지 않는다).
 * 현재 장비 상태는 진행 중 장애 기준 값이며, 이 장애의 처리 상태와 별개다 (같은 장비에 다른 진행 중 장애가 있으면 장애 유지).
 * 진행 중 장애에만 [장애 복구 처리]가 있고, 확인 단계를 거쳐 복구한다.
 */
export default function IncidentDetail({ incident, onResolve }: IncidentDetailProps) {
  const { equipment, affectedReservations } = incident;
  const pendingNoteId = `${incident.id}-pending-note`;
  const [isConfirming, setIsConfirming] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolvedNotice, setResolvedNotice] = useState<string | null>(null);
  const resolvingRef = useRef(false);
  const confirmCancelRef = useRef<HTMLButtonElement>(null);
  const resolveButtonRef = useRef<HTMLButtonElement>(null);
  const noticeRef = useRef<HTMLParagraphElement>(null);
  /** 확인 단계를 취소했을 때 [장애 복구 처리]로 포커스를 돌려줄지 */
  const returnFocusRef = useRef(false);

  // 확인 단계가 열리면 안전한 [취소]에, 취소하면 [장애 복구 처리]에, 복구가 끝나면 결과 안내에 포커스를 둔다
  useEffect(() => {
    if (isConfirming) {
      confirmCancelRef.current?.focus();
    } else if (returnFocusRef.current) {
      returnFocusRef.current = false;
      resolveButtonRef.current?.focus();
    }
  }, [isConfirming]);
  useEffect(() => {
    if (resolvedNotice) noticeRef.current?.focus();
  }, [resolvedNotice]);

  const cancelConfirm = () => {
    returnFocusRef.current = true;
    setIsConfirming(false);
    setResolveError(null);
  };

  const confirmResolve = async () => {
    if (resolvingRef.current) return;
    resolvingRef.current = true;
    setIsResolving(true);
    setResolveError(null);
    try {
      const result = await onResolve(incident.id);
      if (result.ok) {
        setIsConfirming(false);
        setResolvedNotice(`${incident.incidentNumber} 장애를 복구 완료 처리했습니다.`);
      } else {
        setResolveError(result.message);
      }
    } catch {
      setResolveError("복구 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
    resolvingRef.current = false;
    setIsResolving(false);
  };

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
        {resolvedNotice && (
          <p
            ref={noticeRef}
            tabIndex={-1}
            role="status"
            className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              {resolvedNotice}
              {equipment.currentStatus === "FAILURE"
                ? " 같은 장비에 진행 중인 다른 장애가 있어 장비는 장애 상태로 유지됩니다."
                : " 장비 상태가 정상으로 바뀌었습니다."}
              <span className="block text-xs text-emerald-700">
                개발용 예시: 이 브라우저에만 반영되며 서버 저장·예약 재조정·알림 발송은 되지 않습니다.
              </span>
            </span>
          </p>
        )}

        {incident.status === "ACTIVE" && !isConfirming && (
          <div>
            <button
              ref={resolveButtonRef}
              type="button"
              onClick={() => setIsConfirming(true)}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
            >
              <Wrench className="size-4" aria-hidden="true" />
              장애 복구 처리
            </button>
          </div>
        )}

        {incident.status === "ACTIVE" && isConfirming && (
          <div
            role="group"
            aria-labelledby={`${incident.id}-confirm-title`}
            className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary-soft px-4 py-4"
          >
            <p id={`${incident.id}-confirm-title`} className="text-[15px] font-semibold text-gray-900">
              해당 장비의 장애를 복구 완료 처리하시겠습니까?
            </p>
            <p className="text-sm text-gray-600">
              {equipment.name ?? "이 장비"}의 장애가 복구 완료(복구일시: 현재 시각)로 바뀝니다. 같은 장비에 진행 중인 다른
              장애가 없으면 장비 상태가 정상으로 돌아가고, 장애 때문에 막혔던 슬롯은 원래 예약 상태로 돌아갑니다.
            </p>
            {resolveError && (
              <p role="alert" className="text-sm text-red-600">
                {resolveError}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <button
                ref={confirmCancelRef}
                type="button"
                onClick={cancelConfirm}
                disabled={isResolving}
                className="h-10 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmResolve}
                disabled={isResolving}
                className="h-10 rounded-lg bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResolving ? "처리 중" : "복구 완료 처리"}
              </button>
            </div>
          </div>
        )}

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
          장애 정보 수정·예약 재조정 상태 변경·재조정 알림 발송은 API 연동 후 사용할 수 있습니다.
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

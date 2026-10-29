import { Info } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { getNotifications, IS_MOCK_DATA } from "@/features/notifications/api";
import NotificationList from "@/features/notifications/components/NotificationList";
import RescheduleAlert from "@/features/notifications/components/RescheduleAlert";
import RescheduleTable from "@/features/notifications/components/RescheduleTable";
import { getEquipmentFailureExamTypes } from "@/features/notifications/reschedule";
import { getRescheduleRequiredReferrals } from "@/features/referrals/api";

/**
 * 재조정·알림 (S04).
 * 재조정 필요 여부는 의뢰·예약 상태로, 읽음 여부는 알림 상태로 따로 관리한다.
 * 알림을 읽어도 재조정 필요 목록은 바뀌지 않는다.
 */
export default async function NotificationsPage() {
  const [rescheduleReferrals, notifications] = await Promise.all([
    getRescheduleRequiredReferrals(),
    getNotifications(),
  ]);
  const failureExamTypes = getEquipmentFailureExamTypes(rescheduleReferrals, notifications);

  return (
    <>
      <PageHeader title="재조정·알림" />
      <div className="flex flex-col gap-6">
        <RescheduleAlert
          count={rescheduleReferrals.length}
          failureExamTypes={failureExamTypes}
          isMockData={IS_MOCK_DATA}
        />

        <div className="grid grid-cols-1 items-start gap-6 2xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
          <RescheduleTable referrals={rescheduleReferrals} isEquipmentFailure={failureExamTypes !== null} />
          <NotificationList />
        </div>

        <p className="flex items-center gap-3 rounded-xl bg-primary-soft px-6 py-4 text-[15px] text-gray-700">
          <Info className="size-6 shrink-0 text-primary" aria-hidden="true" />
          <span>
            새 슬롯을 선택하면 예약 변경을 요청할 수 있습니다.
            {IS_MOCK_DATA && (
              <span className="text-gray-500"> (현재는 개발용 화면으로 실제 변경 요청은 처리되지 않습니다.)</span>
            )}
          </span>
        </p>
      </div>
    </>
  );
}

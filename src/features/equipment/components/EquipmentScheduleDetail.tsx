import { WEEKDAYS } from "@/lib/format/date";

import { WEEK_ORDER } from "../operatingHours";
import type { Equipment } from "../types";

import EquipmentStatusBadge from "./EquipmentStatusBadge";

/** 장비 요일별 운영 시간 (조회 전용 모달 내용, 수정 기능 없음) */
export default function EquipmentScheduleDetail({
  equipment,
  onClose,
}: {
  equipment: Equipment;
  onClose: () => void;
}) {
  const byWeekday = new Map(equipment.operatingHours.map((item) => [item.weekday, item]));

  return (
    <>
      <div className="mb-4 flex items-center gap-2 text-[15px]">
        <span className="font-medium text-gray-500">장비 상태</span>
        <EquipmentStatusBadge status={equipment.status} />
      </div>
      <table className="w-full border-collapse overflow-hidden rounded-lg border border-line text-[15px]">
        <thead className="bg-gray-100/80">
          <tr>
            <th scope="col" className="px-4 py-2.5 text-left font-semibold text-gray-700">요일</th>
            <th scope="col" className="px-4 py-2.5 text-left font-semibold text-gray-700">운영 시간</th>
            <th scope="col" className="px-4 py-2.5 text-left font-semibold text-gray-700">휴게 시간</th>
          </tr>
        </thead>
        <tbody>
          {WEEK_ORDER.map((weekday) => {
            const hours = byWeekday.get(weekday);
            return (
              <tr key={weekday} className="border-t border-line">
                <th scope="row" className="px-4 py-2.5 text-left font-medium text-gray-900">
                  {WEEKDAYS[weekday]}
                </th>
                <td className={`px-4 py-2.5 ${hours ? "text-gray-900" : "text-gray-400"}`}>
                  {hours ? `${hours.open} ~ ${hours.close}` : "휴무"}
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  {hours?.breakTime ? `${hours.breakTime.start} ~ ${hours.breakTime.end}` : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-sm text-gray-500">
        조회 전용입니다. 운영 시간 변경은 장비 API 연동 후 제공될 예정입니다.
      </p>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-lg border border-line bg-white px-6 text-[15px] font-semibold text-gray-700 hover:bg-gray-50"
        >
          닫기
        </button>
      </div>
    </>
  );
}

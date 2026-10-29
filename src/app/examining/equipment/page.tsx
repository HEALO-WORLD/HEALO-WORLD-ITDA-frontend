import PageHeader from "@/components/layout/PageHeader";
import {
  getCurrentExaminingOrganizationId,
  getEquipments,
  IS_MOCK_DATA,
} from "@/features/equipment/api";
import EquipmentSlotWorkspace from "@/features/equipment/components/EquipmentSlotWorkspace";
import EquipmentSummary from "@/features/equipment/components/EquipmentSummary";

/**
 * 장비·슬롯 운영 (S05) — 조회 중심.
 * 장비 선택 → 날짜 확인 → 그날 슬롯 조회. 장비 정보는 서버에서, 현재 시각에 따라 달라지는
 * 슬롯 현황은 클라이언트에서 계산한다.
 */
export default async function EquipmentPage() {
  const organizationId = await getCurrentExaminingOrganizationId();
  const equipments = organizationId ? await getEquipments(organizationId) : [];

  return (
    <>
      <PageHeader
        title="장비·슬롯 운영"
        description="장비를 고르고 날짜를 선택해 검사 슬롯을 확인합니다."
      />
      {IS_MOCK_DATA && (
        <p className="-mt-3 mb-4 inline-block rounded border border-dashed border-amber-400 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
          개발용 예시 데이터
        </p>
      )}

      {organizationId ? (
        <div className="flex flex-col gap-5">
          <EquipmentSummary organizationId={organizationId} equipments={equipments} />
          <EquipmentSlotWorkspace organizationId={organizationId} equipments={equipments} />
        </div>
      ) : (
        <p role="status" className="rounded-xl border border-dashed border-line bg-white px-6 py-16 text-center text-[15px] text-gray-500">
          검사기관 정보를 확인할 수 없습니다.
        </p>
      )}
    </>
  );
}

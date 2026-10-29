import PageHeader from "@/components/layout/PageHeader";
import { getPartnerOrganizations } from "@/features/slots/api";
import SlotSearch from "@/features/slots/components/SlotSearch";

export default async function SlotSearchPage() {
  const organizations = await getPartnerOrganizations();

  return (
    <>
      <PageHeader
        title="검사 슬롯 검색"
        description="협력 검사기관의 CT·MRI 검사 가능한 시간을 조회합니다."
      />
      <SlotSearch organizations={organizations} />
    </>
  );
}

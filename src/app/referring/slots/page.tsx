import PageHeader from "@/components/layout/PageHeader";
import PagePlaceholder from "@/components/ui/PagePlaceholder";

export default function SlotSearchPage() {
  return (
    <>
      <PageHeader title="검사 슬롯 검색" description="협력 검사기관의 CT·MRI 검사 가능 시간을 조회합니다." />
      <PagePlaceholder wireframe="slot search.png" />
    </>
  );
}

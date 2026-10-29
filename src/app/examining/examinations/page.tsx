import PageHeader from "@/components/layout/PageHeader";
import { getCurrentExaminingOrganizationId } from "@/features/equipment/api";
import { getExaminations, IS_MOCK_DATA } from "@/features/examinations/api";
import ExaminationBoard from "@/features/examinations/components/ExaminationBoard";

/**
 * 검사 진행·결과 (S08).
 * 현재 검사기관(개발용 세션 매핑)의 검사를 서버에서 기관 ID로 골라 넘기고,
 * 검색·상세·결과 등록(Mock)은 클라이언트에서 처리한다.
 */
export default async function ExaminationsPage() {
  const organizationId = await getCurrentExaminingOrganizationId();
  const examinations = organizationId ? await getExaminations(organizationId) : [];

  return (
    <>
      <PageHeader title="검사 진행·결과" description="우리 기관에 배정된 검사의 진행 상태를 확인하고 결과를 등록합니다." />
      {IS_MOCK_DATA && (
        <p className="-mt-3 mb-4 inline-block rounded border border-dashed border-amber-400 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
          개발용 예시 데이터
        </p>
      )}
      {organizationId ? (
        <ExaminationBoard examinations={examinations} />
      ) : (
        <p role="status" className="rounded-xl border border-dashed border-line bg-white px-6 py-16 text-center text-[15px] text-gray-500">
          검사기관 정보를 확인할 수 없습니다.
        </p>
      )}
    </>
  );
}

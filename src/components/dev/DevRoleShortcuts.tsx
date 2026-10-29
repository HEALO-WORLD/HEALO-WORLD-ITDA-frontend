import Link from "next/link";

import { HOME_ROUTE_BY_ROLE } from "@/constants/navigation";

/**
 * ⚠️ 개발 전용 화면 이동 바로가기 (실제 인증 아님)
 *
 * 로그인 API 연동 전, 역할별 화면을 확인하기 위한 링크다.
 * `next dev`(NODE_ENV=development)에서만 렌더링되며 프로덕션 빌드에는 표시되지 않는다.
 * 인증 연동 후 제거한다.
 */
export default function DevRoleShortcuts() {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <aside className="mt-6 w-full max-w-[652px] rounded-lg border border-dashed border-amber-400 bg-amber-50 px-5 py-4 text-sm text-amber-900">
      <p className="font-bold">개발 전용 · 인증 없이 화면 이동</p>
      <p className="mt-1 text-amber-800">
        실제 로그인이 아닙니다. 예시 기관 정보로 레이아웃만 확인합니다.
      </p>
      <div className="mt-3 flex gap-2">
        <Link
          href={HOME_ROUTE_BY_ROLE.REFERRING}
          className="rounded-md border border-amber-400 bg-white px-3 py-1.5 font-medium hover:bg-amber-100"
        >
          의뢰기관 화면
        </Link>
        <Link
          href={HOME_ROUTE_BY_ROLE.EXAMINING}
          className="rounded-md border border-amber-400 bg-white px-3 py-1.5 font-medium hover:bg-amber-100"
        >
          검사기관 화면
        </Link>
      </div>
    </aside>
  );
}

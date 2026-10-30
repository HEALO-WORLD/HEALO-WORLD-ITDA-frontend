import { ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * ⚠️ 데모 체험 바로가기 (실제 인증 아님)
 *
 * 로그인 API 연동 전, 팀원이 역할별 Mock 화면을 확인하기 위한 링크다. 인증·세션을 만들지 않고 화면만 이동한다.
 * - 개발 환경(`next dev`, NODE_ENV=development): 항상 표시
 * - 배포 환경: NEXT_PUBLIC_ENABLE_DEMO_SHORTCUTS=true일 때만 표시
 *   (NEXT_PUBLIC_ 값은 빌드 시점에 들어가므로 값을 바꾸면 다시 배포해야 반영된다)
 * 인증 연동 후 제거한다.
 */
const IS_DEMO_SHORTCUTS_ENABLED =
  process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ENABLE_DEMO_SHORTCUTS === "true";

const DEMO_LINKS = [
  { href: "/examining/equipment", label: "검사기관 데모 체험하기" },
  { href: "/referring/slots", label: "의뢰기관 데모 체험하기" },
] as const;

export default function DevRoleShortcuts() {
  if (!IS_DEMO_SHORTCUTS_ENABLED) return null;

  return (
    <aside
      aria-labelledby="demo-shortcuts-title"
      className="mt-6 w-full max-w-[652px] rounded-lg border border-dashed border-amber-400 bg-amber-50 px-5 py-4 text-sm text-amber-900"
    >
      <p id="demo-shortcuts-title" className="font-bold">
        데모 체험 · 로그인 없이 화면 이동
      </p>
      <p className="mt-1 text-amber-800">
        API 연동 전 개발용 Mock 화면입니다. 실제 로그인이 아니며, 예시 기관 정보와 예시 데이터로 화면만 확인합니다.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {DEMO_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md border border-amber-400 bg-white px-3 font-semibold hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
          >
            {label}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </aside>
  );
}

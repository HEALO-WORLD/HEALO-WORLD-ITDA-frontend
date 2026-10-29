import AppShell from "@/components/layout/AppShell";
import { getMockSession } from "@/lib/dev/mockSession";

export default function ReferringLayout({ children }: LayoutProps<"/referring">) {
  // TODO(auth): 인증 연동 시 서버 세션으로 교체하고, 의뢰기관 권한이 없으면 접근을 차단한다.
  const user = getMockSession("REFERRING");

  return <AppShell user={user}>{children}</AppShell>;
}

import AppShell from "@/components/layout/AppShell";
import { getMockSession } from "@/lib/dev/mockSession";

export default function ExaminingLayout({ children }: LayoutProps<"/examining">) {
  // TODO(auth): 인증 연동 시 서버 세션으로 교체하고, 검사기관 권한이 없으면 접근을 차단한다.
  const user = getMockSession("EXAMINING");

  return <AppShell user={user}>{children}</AppShell>;
}

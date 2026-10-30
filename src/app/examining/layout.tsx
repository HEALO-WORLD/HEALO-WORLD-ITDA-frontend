import AppShell from "@/components/layout/AppShell";
import { getCurrentExaminingOrganizationId } from "@/features/equipment/api";
import { getExaminingNotifications } from "@/features/examining-notifications/api";
import ExaminingNotificationReadProvider from "@/features/examining-notifications/components/ExaminingNotificationReadProvider";
import { getMockSession } from "@/lib/dev/mockSession";

export default async function ExaminingLayout({ children }: LayoutProps<"/examining">) {
  // TODO(auth): 인증 연동 시 서버 세션으로 교체하고, 검사기관 권한이 없으면 접근을 차단한다.
  const user = getMockSession("EXAMINING");
  // 헤더 알림 표시와 알림 화면이 같은 알림 목록·읽음 상태를 공유한다 (현재 검사기관 알림만)
  const organizationId = await getCurrentExaminingOrganizationId();
  const notifications = organizationId ? await getExaminingNotifications(organizationId) : [];

  return (
    <ExaminingNotificationReadProvider initialNotifications={notifications}>
      <AppShell user={user}>{children}</AppShell>
    </ExaminingNotificationReadProvider>
  );
}

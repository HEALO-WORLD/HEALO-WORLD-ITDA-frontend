import AppShell from "@/components/layout/AppShell";
import { getNotifications } from "@/features/notifications/api";
import NotificationReadProvider from "@/features/notifications/components/NotificationReadProvider";
import { getMockSession } from "@/lib/dev/mockSession";

export default async function ReferringLayout({ children }: LayoutProps<"/referring">) {
  // TODO(auth): 인증 연동 시 서버 세션으로 교체하고, 의뢰기관 권한이 없으면 접근을 차단한다.
  const user = getMockSession("REFERRING");
  // 헤더 알림 표시와 재조정·알림 화면이 같은 알림 목록·읽음 상태를 공유한다
  const notifications = await getNotifications();

  return (
    <NotificationReadProvider initialNotifications={notifications}>
      <AppShell user={user}>{children}</AppShell>
    </NotificationReadProvider>
  );
}

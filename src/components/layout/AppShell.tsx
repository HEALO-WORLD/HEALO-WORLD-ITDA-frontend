import type { ReactNode } from "react";

import { NOTIFICATION_ROUTE_BY_ROLE } from "@/constants/navigation";
import type { SessionUser } from "@/types/auth";

import AppHeader from "./AppHeader";
import RoleSidebar from "./RoleSidebar";

interface AppShellProps {
  user: SessionUser;
  children: ReactNode;
}

/** 로그인 이후 화면의 공통 틀: 헤더 + 역할별 사이드바 + 본문 */
export default function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        subtitle={user.organizationName}
        user={user}
        notificationHref={NOTIFICATION_ROUTE_BY_ROLE[user.role]}
      />
      <div className="flex flex-1">
        <RoleSidebar role={user.role} />
        <main className="min-w-0 flex-1 px-10 py-8">{children}</main>
      </div>
    </div>
  );
}

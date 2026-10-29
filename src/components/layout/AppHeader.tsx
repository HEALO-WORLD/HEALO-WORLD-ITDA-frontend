import Link from "next/link";

import { BellIcon, BuildingIcon, ChevronDownIcon } from "@/components/icons";
import type { SessionUser } from "@/types/auth";

import Logo from "./Logo";

interface AppHeaderProps {
  /** 로고 옆 문구. 로그인 후에는 기관명, 로그인 화면에서는 서비스 소개 문구 */
  subtitle: string;
  /** 로그인 사용자. 없으면 우측 계정 영역을 표시하지 않는다 */
  user?: SessionUser;
  /** 알림 아이콘 이동 경로. null이면 알림 아이콘을 표시하지 않는다 */
  notificationHref?: string | null;
}

export default function AppHeader({ subtitle, user, notificationHref = null }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-[72px] shrink-0 items-center justify-between border-b border-line bg-white px-8">
      <div className="flex items-center gap-5">
        <Logo />
        <span className="h-6 w-px bg-line" aria-hidden="true" />
        <span className="text-[15px] font-medium text-gray-600">{subtitle}</span>
      </div>

      {user && (
        <div className="flex items-center gap-5">
          {/* 계정 메뉴: 드롭다운 항목(로그아웃 등)은 인증 연동 시 확정 (screen-spec S01 확인 필요) */}
          <div className="flex items-center gap-2 text-[15px] font-medium text-gray-800">
            <BuildingIcon className="size-5 text-gray-500" />
            <span>{user.roleLabel}</span>
            <ChevronDownIcon className="size-4 text-gray-500" />
          </div>

          {notificationHref && (
            <>
              <span className="h-6 w-px bg-line" aria-hidden="true" />
              <Link
                href={notificationHref}
                className="relative rounded-md p-1 text-gray-700 hover:bg-gray-100"
                aria-label={user.hasUnreadNotifications ? "알림 (읽지 않은 알림 있음)" : "알림"}
              >
                <BellIcon className="size-6" />
                {user.hasUnreadNotifications && (
                  <span className="absolute right-1 top-0.5 size-2 rounded-full bg-primary ring-2 ring-white" />
                )}
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

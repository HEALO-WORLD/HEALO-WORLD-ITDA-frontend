"use client";

import { Bell } from "lucide-react";
import Link from "next/link";

import { useNotificationRead } from "./NotificationReadProvider";

interface NotificationBellLinkProps {
  href: string;
  /** 알림 상태를 공유하지 않는 화면(검사기관 등)에서 쓰는 값 */
  fallbackHasUnread: boolean;
}

/** 헤더 알림 아이콘. 읽지 않은 알림이 있으면 점을 표시한다 */
export default function NotificationBellLink({ href, fallbackHasUnread }: NotificationBellLinkProps) {
  const context = useNotificationRead();
  const hasUnread = context ? context.unreadCount > 0 : fallbackHasUnread;

  return (
    <Link
      href={href}
      className="relative rounded-md p-1 text-gray-700 hover:bg-gray-100"
      aria-label={hasUnread ? "알림 (읽지 않은 알림 있음)" : "알림"}
    >
      <Bell className="size-6" strokeWidth={1.8} aria-hidden="true" />
      {hasUnread && (
        <span className="absolute right-1 top-0.5 size-2 rounded-full bg-primary ring-2 ring-white" />
      )}
    </Link>
  );
}

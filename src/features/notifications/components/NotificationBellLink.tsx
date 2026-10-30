"use client";

import { Bell } from "lucide-react";
import Link from "next/link";

import { useExaminingNotificationRead } from "@/features/examining-notifications/components/ExaminingNotificationReadProvider";

import { useNotificationRead } from "./NotificationReadProvider";

interface NotificationBellLinkProps {
  href: string;
  /** 알림 읽음 상태 Provider가 없는 화면에서 쓰는 값 */
  fallbackHasUnread: boolean;
}

/** 헤더 알림 아이콘. 읽지 않은 알림이 있으면 점을 표시한다 */
export default function NotificationBellLink({ href, fallbackHasUnread }: NotificationBellLinkProps) {
  // 의뢰기관·검사기관은 각자의 레이아웃에 자기 Provider만 두므로 둘 중 하나만 값이 있다
  const referringContext = useNotificationRead();
  const examiningContext = useExaminingNotificationRead();
  const context = referringContext ?? examiningContext;
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

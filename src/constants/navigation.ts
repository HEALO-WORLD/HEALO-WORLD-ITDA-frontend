import {
  BellIcon,
  CalendarIcon,
  DocumentIcon,
  HomeIcon,
  SearchIcon,
  WrenchIcon,
} from "@/components/icons";
import type { OrganizationRole } from "@/types/auth";
import type { NavItem } from "@/types/navigation";

/** 화면 라우트 (screen-spec 0.2). 백엔드 API 경로가 아니다. */
export const ROUTES = {
  login: "/login",
  referring: {
    slots: "/referring/slots",
    referrals: "/referring/referrals",
    notifications: "/referring/notifications",
  },
  examining: {
    equipment: "/examining/equipment",
    reservations: "/examining/reservations",
    incidents: "/examining/incidents",
    examinations: "/examining/examinations",
  },
} as const;

/** 의뢰기관 사이드바 (screen-spec 2.2) */
const REFERRING_NAV: NavItem[] = [
  { label: "대시보드", icon: HomeIcon },
  { label: "검사 슬롯 검색", icon: SearchIcon, href: ROUTES.referring.slots },
  { label: "의뢰·예약 관리", icon: CalendarIcon, href: ROUTES.referring.referrals },
  { label: "재조정·알림", icon: BellIcon, href: ROUTES.referring.notifications },
];

/** 검사기관 사이드바 (screen-spec 2.3) */
const EXAMINING_NAV: NavItem[] = [
  { label: "장비·슬롯 운영", icon: CalendarIcon, href: ROUTES.examining.equipment },
  { label: "확정 예약 관리", icon: CalendarIcon, href: ROUTES.examining.reservations },
  { label: "장비 장애·재조정", icon: WrenchIcon, href: ROUTES.examining.incidents },
  { label: "검사 진행·결과", icon: DocumentIcon, href: ROUTES.examining.examinations },
  { label: "알림", icon: BellIcon },
];

export const NAV_ITEMS_BY_ROLE: Record<OrganizationRole, NavItem[]> = {
  REFERRING: REFERRING_NAV,
  EXAMINING: EXAMINING_NAV,
};

/** 역할별 초기 진입 화면 */
export const HOME_ROUTE_BY_ROLE: Record<OrganizationRole, string> = {
  REFERRING: ROUTES.referring.slots,
  EXAMINING: ROUTES.examining.equipment,
};

/** 헤더 알림 아이콘이 이동할 화면. 검사기관 알림 화면은 범위 협의 중이므로 없음 */
export const NOTIFICATION_ROUTE_BY_ROLE: Record<OrganizationRole, string | null> = {
  REFERRING: ROUTES.referring.notifications,
  EXAMINING: null,
};

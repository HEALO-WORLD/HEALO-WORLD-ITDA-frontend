import type { OrganizationRole, SessionUser } from "@/types/auth";

/**
 * ⚠️ 개발용 임시 세션 (실제 인증 아님)
 *
 * 로그인 API가 연동되기 전까지 레이아웃 확인을 위해 헤더에 표시할 예시 사용자 정보다.
 * 값은 와이어프레임의 예시 데이터이며, 이 모듈은 어떠한 접근 제어도 하지 않는다.
 * 인증 연동 시 서버가 내려준 사용자·기관 정보로 교체하고 이 파일은 제거한다.
 */
const MOCK_SESSIONS: Record<OrganizationRole, SessionUser> = {
  REFERRING: {
    role: "REFERRING",
    organizationName: "서울바른정형외과",
    roleLabel: "의뢰기관 담당자",
    hasUnreadNotifications: true,
  },
  EXAMINING: {
    role: "EXAMINING",
    organizationName: "가온영상센터",
    roleLabel: "검사기관 관리자",
    hasUnreadNotifications: false,
  },
};

export function getMockSession(role: OrganizationRole): SessionUser {
  return MOCK_SESSIONS[role];
}

/**
 * ⚠️ 개발용 기관 ID 매핑 (실제 인증 아님)
 *
 * SessionUser에는 기관 ID가 없어서, 검사기관 화면이 Mock 슬롯 데이터(mockSlots.ts)의 기관과
 * 연결될 수 있도록 역할별 기관 ID를 따로 둔다. 값은 위 세션의 organizationName과 같은 기관이다.
 * 인증 연동 시 서버 세션의 기관 ID로 교체하고 이 매핑은 제거한다.
 */
const MOCK_ORGANIZATION_ID_BY_ROLE: Partial<Record<OrganizationRole, string>> = {
  EXAMINING: "org-gaon", // 가온영상센터
};

export function getMockOrganizationId(role: OrganizationRole): string | null {
  return MOCK_ORGANIZATION_ID_BY_ROLE[role] ?? null;
}

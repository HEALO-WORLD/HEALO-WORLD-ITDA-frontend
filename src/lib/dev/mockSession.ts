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

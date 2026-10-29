import type { ComponentType, SVGProps } from "react";

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export interface NavItem {
  label: string;
  icon: IconComponent;
  /**
   * 이동 경로. 상세 와이어프레임이 없어 범위 협의 중인 메뉴는 href를 두지 않고
   * 비활성 상태로 표시한다. (screen-spec 0.2)
   */
  href?: string;
}

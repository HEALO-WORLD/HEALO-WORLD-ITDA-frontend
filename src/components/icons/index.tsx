import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/**
 * 1단계에서 만든 라인 아이콘 모음 (24x24, stroke 기반). 헤더·사이드바에서 사용 중이다.
 * 새로 추가하는 아이콘은 이 파일에 늘리지 말고 `lucide-react`에서 필요한 컴포넌트 안에서 직접 import한다.
 */
function BaseIcon({ children, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </BaseIcon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </BaseIcon>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </BaseIcon>
  );
}

export function WrenchIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M14.7 6.3a4 4 0 0 0 5 5L21 12.6l-.1.1a6 6 0 0 1-7.4 1.4L6 21.6a2 2 0 0 1-2.8-2.8l7.5-7.5a6 6 0 0 1 1.4-7.4l.1-.1 1.3 1.3a4 4 0 0 0 1.2 1.2Z" />
    </BaseIcon>
  );
}

export function DocumentIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </BaseIcon>
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 21h18M5 21V9l7-5 7 5v12" />
      <path d="M9 21v-6h6v6M9 11h.01M15 11h.01" />
    </BaseIcon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m6 9 6 6 6-6" />
    </BaseIcon>
  );
}

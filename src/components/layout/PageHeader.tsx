import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** 제목 오른쪽 주요 버튼 */
  actions?: ReactNode;
}

/** 본문 상단 화면 제목/설명 */
export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[32px] font-bold tracking-tight text-gray-900">{title}</h1>
        {description && <p className="mt-2 text-base text-gray-600">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

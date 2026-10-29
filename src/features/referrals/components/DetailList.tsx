import type { ReactNode } from "react";

interface DetailListProps {
  /** [항목명, 값] 목록 */
  items: [label: string, value: ReactNode][];
}

/** 읽기 전용 항목 목록 (의뢰 상세 · 선택한 슬롯 정보) */
export default function DetailList({ items }: DetailListProps) {
  return (
    <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-3.5 text-[15px]">
      {items.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="py-0.5 font-medium text-gray-500">{label}</dt>
          <dd className="py-0.5 text-gray-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
}

/** 본문 상단 화면 제목/설명 */
export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-[32px] font-bold tracking-tight text-gray-900">{title}</h1>
      {description && <p className="mt-2 text-base text-gray-600">{description}</p>}
    </div>
  );
}

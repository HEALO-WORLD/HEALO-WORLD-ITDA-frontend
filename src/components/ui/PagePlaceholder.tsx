interface PagePlaceholderProps {
  /** 이 화면이 참고할 와이어프레임 파일명 */
  wireframe: string;
}

/** 메뉴 이동 확인용 임시 본문. 화면별 UI 구현 시 교체한다. */
export default function PagePlaceholder({ wireframe }: PagePlaceholderProps) {
  return (
    <section className="rounded-xl border border-dashed border-line bg-white px-6 py-16 text-center text-sm text-gray-500">
      화면 구현 예정 · 참고 와이어프레임: <code className="text-gray-700">{wireframe}</code>
    </section>
  );
}

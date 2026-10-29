import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  /** 제목 아래 보조 문구 */
  description?: ReactNode;
  onClose: () => void;
  /** 바깥(배경) 클릭으로 닫기. 입력 중인 폼은 false 권장 */
  closeOnBackdrop?: boolean;
  children: ReactNode;
}

/**
 * 공통 모달. 네이티브 <dialog>의 showModal()을 사용한다.
 * - 열려 있는 동안 배경은 비활성(inert)이라 포커스가 모달 안에 머문다
 * - Esc로 닫히고, 닫히면 연 요소로 포커스가 돌아간다
 * - 처음 포커스는 data-autofocus가 있는 요소, 없으면 첫 포커스 가능 요소
 *   (React의 autoFocus는 모달이 열리기 전에 실행되어 동작하지 않으므로 data-autofocus를 쓴다)
 * 내용은 열려 있을 때만 렌더링하므로 다시 열면 내부 상태가 초기화된다.
 */
export default function Modal({
  open,
  title,
  description,
  onClose,
  closeOnBackdrop = true,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onClick={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
      className="m-auto max-h-[calc(100%-32px)] w-[min(560px,calc(100%-32px))] rounded-xl bg-white p-0 shadow-xl backdrop:bg-gray-900/40"
    >
      {open && (
        <div className="px-6 py-6 sm:px-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="text-xl font-bold text-gray-900">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 text-sm text-gray-500">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

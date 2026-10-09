import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog ref={ref} className="modal" onCancel={onClose}>
      <header>
        <h2>{title}</h2>
        <button className="icon-button" aria-label="Đóng" onClick={onClose}>
          <X />
        </button>
      </header>
      <div className="modal-content">{children}</div>
    </dialog>
  );
}

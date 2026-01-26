"use client";

import { useEffect } from "react";

export default function BottomSheet({
  open,
  title,
  onClose,
  closeOnEsc = false,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  closeOnEsc?: boolean;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!closeOnEsc) return;
      if (e.key === "Escape") onClose();
    }
    if (open && closeOnEsc) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, closeOnEsc]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Overlay sem clique para fechar (requisito: não fechar ao clicar fora) */}
      <div className="absolute inset-0 bg-black/60" aria-hidden />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[520px] px-4 pb-4">
        <div className="rounded-3xl border border-white/10 bg-[var(--surface)] shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-base font-semibold">{title}</div>
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
            >
              Fechar
            </button>
          </div>
          <div className="px-4 pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { TrashIcon } from "@heroicons/react/24/outline";

interface Props {
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = "Eliminar",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-[0_24px_60px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-red-50 ring-1 ring-red-200">
            <TrashIcon className="h-7 w-7 text-red-500" />
          </div>
        </div>

        {/* Text */}
        <div className="mb-6 text-center">
          <p className="text-base font-bold text-jungle-950" style={{ fontFamily: "var(--font-syne)" }}>
            {title}
          </p>
          {description && (
            <p className="mt-1.5 text-sm text-jungle-500">{description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={onConfirm}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-600 active:scale-95"
          >
            <TrashIcon className="h-4 w-4" />
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="btn-secondary flex-1 py-2.5"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

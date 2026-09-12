"use client";

import { useId } from "react";
import Dialog from "@/components/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
}

/** Accessible confirmation dialog built on the shared focus-trapped shell. */
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  tone = "primary",
  onConfirm,
  onClose,
  busy = false,
}: ConfirmDialogProps) {
  const titleId = useId();
  const bodyId = useId();

  return (
    <Dialog
      open={open}
      labelledBy={titleId}
      describedBy={bodyId}
      onClose={onClose}
      busy={busy}
    >
      <h2 id={titleId} className="font-display text-2xl font-black text-cocoa">
        {title}
      </h2>
      <p id={bodyId} className="mt-2 text-cocoa-soft">
        {body}
      </p>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="rounded-xl border-cocoa-sm bg-cream px-5 py-2.5 font-display font-bold text-cocoa transition-colors hover:bg-cream-deep disabled:opacity-60 sm:rounded-full"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`btn-game-piece rounded-xl border-cocoa-sm px-5 py-2.5 font-display font-bold text-cream transition-all disabled:opacity-60 sm:rounded-full ${
            tone === "danger"
              ? "bg-tangerine-deep hover:-translate-y-px hover:shadow-press-tangerine"
              : "bg-teal shadow-press-teal hover:-translate-y-px hover:bg-teal-deep"
          }`}
        >
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
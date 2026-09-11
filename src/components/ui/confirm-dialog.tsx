"use client";

import { useEffect, useId, useRef } from "react";

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

/** Accessible confirmation dialog: aria-modal, labelled/described, focus trap,
 * Escape to cancel, focus restored to the trigger on close. */
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
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;

    const dialog = ref.current;
    if (!dialog) return;

    const focusables = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled"));

    const first = () => focusables()[0];
    const last = () => focusables()[focusables().length - 1];

    first()?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) {
        e.preventDefault();
        return;
      }
      const index = list.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && (index === 0 || index === -1)) {
        e.preventDefault();
        last()?.focus();
      } else if (!e.shiftKey && index === list.length - 1) {
        e.preventDefault();
        first()?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-cocoa/50"
        onClick={busy ? undefined : onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="border-cocoa relative max-w-md rounded-2xl bg-card p-6"
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
            className="rounded-full border-cocoa-sm bg-card px-5 py-2.5 font-display font-bold text-cocoa disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`btn-game-piece rounded-full px-5 py-2.5 font-display font-bold text-cream disabled:opacity-60 ${
              tone === "danger" ? "bg-tangerine-deep" : "bg-teal shadow-press-teal"
            }`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
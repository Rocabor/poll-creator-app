"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface DialogProps {
  open: boolean;
  labelledBy: string;
  onClose: () => void;
  describedBy?: string;
  busy?: boolean;
  panelClassName?: string;
  children: ReactNode;
}

/** Accessible modal shell: aria-modal, Escape to cancel, focus trapped to the
 * dialog, focus restored to the trigger on close. Content (heading, body,
 * controls) belongs to the caller; `labelledBy` must point at its heading. */
export default function Dialog({
  open,
  labelledBy,
  describedBy,
  onClose,
  busy = false,
  panelClassName = "",
  children,
}: DialogProps) {
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
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
        className="absolute inset-0 animate-tb-fade bg-cocoa/50"
        onClick={busy ? undefined : onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        {...(describedBy ? { "aria-describedby": describedBy } : {})}
        className={`border-cocoa relative animate-tb-pop rounded-2xl bg-card p-6 shadow-xl ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
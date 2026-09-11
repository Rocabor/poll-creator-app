"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { suggestOption } from "@/app/actions/suggestions";
import { announce } from "@/lib/announce";

interface SuggestModalProps {
  open: boolean;
  slug: string;
  voter: { name: string; seed: string; tint: string };
  token: string;
  onClose: () => void;
}

/** Modal para proponer una opción como votante. Campo único + preview del
 * votante, mismo patrón de foco que ConfirmDialog. */
export default function SuggestModal({
  open,
  slug,
  voter,
  token,
  onClose,
}: SuggestModalProps) {
  const titleId = useId();
  const inputId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    if (!dialog) return;

    const trigger = dialog.querySelector<HTMLElement>("button, input, [href]");
    trigger?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  async function submit() {
    const trimmed = label.trim();
    if (trimmed.length < 2) {
      setError("Type the option first.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await suggestOption({
      slug,
      label: trimmed,
      name: voter.name,
      seed: voter.seed,
      tint: voter.tint,
      token,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Couldn't send that.");
      return;
    }
    announce("Option suggested — the creator will review it.");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
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
        className="border-cocoa relative w-full max-w-sm rounded-[22px] bg-card p-5 shadow-xl"
      >
        <div className="mb-1 flex items-start justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 pt-0.5 font-display text-xs font-bold tracking-wider text-tangerine-deep uppercase">
            <Sparkles size={14} strokeWidth={2.5} aria-hidden="true" />
            Suggest an option
          </span>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="rounded-full p-1.5 text-cocoa-soft transition-colors hover:bg-cream-deep hover:text-cocoa"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <h2 id={titleId} className="font-display text-xl font-extrabold text-cocoa">
          Got another idea?
        </h2>
        <p className="mt-1 text-xs text-cocoa-soft sm:text-sm">
          The creator has the final say — your pick joins the ballot if they
          approve it. Marked “Suggested by {voter.name.split(" ")[0]}”.
        </p>

        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-tangerine/10 px-3 py-2 text-sm font-bold text-tangerine-deep">
            {error}
          </p>
        )}

        <label htmlFor={inputId} className="mt-4 block text-sm font-bold text-cocoa">
          Your option
        </label>
        <input
          id={inputId}
          type="text"
          value={label}
          maxLength={60}
          disabled={busy}
          onChange={(e) => {
            setLabel(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="e.g. Tacos de birria"
          className="mt-1 w-full rounded-xl border-2 border-cocoa bg-cream px-3 py-2.5 text-sm font-bold text-cocoa focus:outline-none focus:ring-2 focus:ring-teal"
        />

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full border-cocoa-sm bg-cream px-4 py-2 text-xs font-bold text-cocoa transition-colors hover:bg-cream-deep disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="btn-game-piece shadow-press-teal rounded-full border-cocoa-sm bg-teal px-4 py-2 text-xs font-bold text-cream transition-colors hover:bg-teal-deep disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send suggestion"}
          </button>
        </div>
      </div>
    </div>
  );
}
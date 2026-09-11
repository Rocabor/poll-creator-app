"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { announce } from "@/lib/announce";

/** icon: botón icono-genérico. pill: botón con texto, estilo prototipo. */
export default function CopyLink({
  url,
  label,
  variant = "icon",
}: {
  url: string;
  label: string;
  variant?: "icon" | "pill";
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      announce("Share link copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      announce("Could not copy the link");
    }
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={copy}
        aria-label={`${label} — ${copied ? "copied" : "copy link"}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-cocoa-sm bg-cream px-3 py-1.5 text-xs font-bold text-cocoa transition-colors hover:bg-cream-deep"
      >
        {copied ? (
          <>
            <Check size={13} strokeWidth={2.8} aria-hidden="true" className="text-teal" />
            <span className="text-teal">Link copied</span>
          </>
        ) : (
          <>
            <Copy size={13} strokeWidth={2.2} aria-hidden="true" />
            <span>Copy link</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? "Copied" : "Copy link"}
      className="rounded-full p-2 text-cocoa-soft transition-colors hover:bg-cream-deep hover:text-cocoa"
      aria-label={`${label} — ${copied ? "copied" : "copy link"}`}
    >
      {copied ? (
        <Check aria-hidden="true" size={16} strokeWidth={2.8} className="text-teal" />
      ) : (
        <Copy aria-hidden="true" size={16} strokeWidth={2.2} />
      )}
    </button>
  );
}
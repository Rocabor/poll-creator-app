"use client";

import { useState } from "react";
import { announce } from "@/lib/announce";

export default function CopyLink({ url, label }: { url: string; label: string }) {
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

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-full border-cocoa-sm bg-cream px-4 py-2 text-sm font-bold text-cocoa transition-colors hover:bg-cream-deep"
      aria-label={`${label} — ${copied ? "copied" : "copy link"}`}
    >
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
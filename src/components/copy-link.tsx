"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
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
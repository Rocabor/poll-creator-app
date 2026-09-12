"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Share2, Sparkles, X } from "lucide-react";
import { announce } from "@/lib/announce";
import type { PollView } from "@/lib/types";
import Avatar from "@/components/avatar";

function leaderOf(poll: PollView) {
  const leader = [...poll.options]
    .sort((a, b) => b.votesCount - a.votesCount)
    .filter((o) => o.votesCount > 0)[0];
  return leader ?? null;
}

export default function ShareCardButton({
  poll,
  url,
  label,
}: {
  poll: PollView;
  url: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border-cocoa-sm bg-cream px-3 py-1.5 text-xs font-bold text-cocoa transition-colors hover:bg-cream-deep"
      >
        <Share2 size={13} strokeWidth={2.4} aria-hidden="true" />
        <span>{label}</span>
      </button>
    );
  }

  const leader = leaderOf(poll);
  const status = poll.status === "settled" ? "Settled" : "Voting Open";
  const backers = leader?.backers ?? [];
  const backersNames =
    backers.length > 0 ? backers.map((b) => b.name).slice(0, 2).join(", ") : "";

  const chatSummary =
    poll.status === "settled"
      ? poll.isTied
        ? `🏆 ${poll.title}\nIt ends in a tie!\nDecided on Tiebreak: ${url}`
        : `🏆 ${poll.title}\nWinner: ${leader?.label ?? "—"} with ${leader?.votesCount ?? 0} of ${poll.totalVotes} votes!\nBacked by: ${backersNames || "the crew"}\nDecided on Tiebreak: ${url}`
      : `🗳️ ${poll.title}\nVote now (no account needed!): ${url}`;

  async function copyChatSummary() {
    try {
      await navigator.clipboard.writeText(chatSummary);
      setCopiedText(true);
      announce("Chat summary copied to clipboard");
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      announce("Could not copy the summary");
    }
  }

  async function copyVotingLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      announce("Share link copied to clipboard");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      announce("Could not copy the link");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-card-title"
    >
      <div className="relative w-full max-w-md rounded-lg border-cocoa bg-card p-5 shadow-2xl sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-tangerine">
            <Share2 size={18} strokeWidth={2.5} aria-hidden="true" />
            <span className="font-display text-xs font-bold tracking-wider uppercase">
              Share to Group Chat
            </span>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close share dialog"
            className="rounded-full p-1 text-cocoa transition-colors hover:bg-cream-deep"
          >
            <X size={18} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        <h2
          id="share-card-title"
          className="mb-1 font-display text-xl font-extrabold text-cocoa"
        >
          {poll.status === "settled" ? "Share the Verdict" : "Invite the Crew"}
        </h2>
        <p className="mb-4 text-xs text-cocoa-soft">
          Drop this into WhatsApp, Discord, or iMessage.
        </p>

        {/* Visual Share Card Preview */}
        <div className="relative mb-4 overflow-hidden rounded-lg border-cocoa bg-cream p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2 border-b-2 border-cocoa/10 pb-2">
            <span className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-cocoa bg-tangerine">
                <span
                  aria-hidden="true"
                  className="text-[10px] font-black text-cream-bright"
                >
                  ✓
                </span>
              </span>
              <span className="font-display text-xs font-black text-cocoa">
                TIEBREAK
              </span>
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                poll.status === "settled"
                  ? "bg-cream-deep text-cocoa-soft"
                  : "bg-teal-soft text-teal-deep"
              }`}
            >
              {status}
            </span>
          </div>

          <h3 className="mb-2 font-display text-base font-extrabold leading-snug text-cocoa">
            {poll.title}
          </h3>

          <div className="mb-2 rounded-xl border border-cocoa-sm bg-card p-3">
            <div className="mb-0.5 flex items-center gap-1.5 text-xs font-bold text-tangerine">
              <Sparkles size={12} strokeWidth={2.5} aria-hidden="true" />
              <span className="uppercase">
                {poll.status === "settled" ? "Decision" : "Leading option"}
              </span>
            </div>
            {leader ? (
              <>
                <div className="mb-1 font-display text-lg font-black leading-tight text-cocoa">
                  {leader.label}
                </div>
                <div className="text-xs font-bold text-cocoa-soft">
                  {leader.votesCount} of {poll.totalVotes} votes (
                  {leader.percentage}%)
                </div>
              </>
            ) : (
              <div className="font-display text-sm font-bold leading-tight text-cocoa-soft">
                {poll.isTied
                  ? "It ends in a tie"
                  : "No votes yet — first vote wins the table"}
              </div>
            )}
          </div>

          {backers.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-cocoa-soft">
                Crew:
              </span>
              <div className="flex items-center -space-x-1.5">
                {backers.slice(0, 4).map((b) => (
                  <Avatar
                    key={b.seed + b.tint}
                    name={b.name}
                    seed={b.seed}
                    tint={b.tint}
                    size={20}
                    className="border-cream bg-cream"
                  />
                ))}
              </div>
              <span className="truncate text-[11px] font-semibold text-cocoa-soft">
                {backersNames}
                {backers.length > 2 ? ` +${backers.length - 2}` : ""}
              </span>
            </div>
          )}

          <div className="mt-3 truncate border-t-2 border-cocoa/10 pt-2 text-[11px] font-semibold text-cocoa-soft">
            🔗 {url}
          </div>
        </div>

        {/* Distinct copy payloads */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={copyChatSummary}
            className="btn-game-piece flex w-full items-center justify-center gap-2 rounded-full border-cocoa-sm bg-tangerine-deep px-4 py-2.5 text-sm font-bold text-cream transition-colors hover:bg-tangerine"
          >
            {copiedText ? (
              <>
                <Check size={16} strokeWidth={2.8} aria-hidden="true" />
                <span>Result copied to clipboard!</span>
              </>
            ) : (
              <>
                <Copy size={16} strokeWidth={2.5} aria-hidden="true" />
                <span>Copy chat summary</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={copyVotingLink}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-cocoa-sm bg-cream px-4 py-2 text-xs font-bold text-cocoa transition-colors hover:bg-cream-deep sm:text-sm"
          >
            {copiedLink ? (
              <>
                <Check size={14} strokeWidth={2.8} aria-hidden="true" className="text-teal" />
                <span className="text-teal">Link copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} strokeWidth={2} aria-hidden="true" />
                <span>Copy voting link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
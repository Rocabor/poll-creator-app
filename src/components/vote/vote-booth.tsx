"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Check, Shuffle, Sparkles, Vote } from "lucide-react";
import { castVote } from "@/app/actions/votes";
import { announce } from "@/lib/announce";
import { usePoll } from "@/lib/use-poll";
import Avatar from "@/components/avatar";
import Dialog from "@/components/ui/dialog";
import ResultsBoard from "@/components/vote/results-board";
import Moderation from "@/components/vote/moderation";
import SuggestModal from "@/components/vote/suggest-modal";
import type { PollView } from "@/lib/types";

const AVATAR_TINTS: { id: string; hex: string; name: string }[] = [
  { id: "f8c9b9", hex: "#F8C9B9", name: "Peach" },
  { id: "cbe2d8", hex: "#CBE2D8", name: "Teal" },
  { id: "f6e0a4", hex: "#F6E0A4", name: "Butter" },
  { id: "e3d2f2", hex: "#E3D2F2", name: "Lilac" },
];

const FACE_PRESETS = ["lina", "noor", "rio", "izu", "milo", "kena"];

function randomToken(): string {
  const rand = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(rand);
  } else {
    for (let i = 0; i < rand.length; i++) rand[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(rand, (b) => b.toString(16).padStart(2, "0")).join("");
}

function local(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

export default function VoteBooth({
  poll,
}: {
  poll: PollView;
}) {
  const tokenKey = `tb_token_${poll.slug}`;
  const [token] = useState<string>(() => local(tokenKey) || randomToken());
  const [name, setName] = useState(() => local("tb_voter_name") ?? "");
  const [tint, setTint] = useState(() => local("tb_voter_tint") ?? "cbe2d8");
  const [face, setFace] = useState<string | null>(() => local("tb_voter_face"));
  const [selections, setSelections] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [casting, setCasting] = useState(false);
  const [justVoted, setJustVoted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);

  const { data } = usePoll(poll.slug, token);
  const live = data?.poll ?? poll;

  const locked = justVoted || (data?.poll.myVotes.length ?? 0) > 0;
  const myVotes = justVoted ? selections : (data?.poll.myVotes ?? []);

  const maxReached = live.maxChoices > 1 && selections.length >= live.maxChoices;

  const votingOpen = live.status === "open";

  const voterSeed = useMemo(() => face ?? (name.trim() || "voter"), [face, name]);

  function toggleOption(optionId: string) {
    setError(null);
    if (live.type === "single") {
      setSelections(selections[0] === optionId ? [] : [optionId]);
      return;
    }
    if (selections.includes(optionId)) {
      setSelections(selections.filter((id) => id !== optionId));
      return;
    }
    if (maxReached) {
      announce(`You can pick up to ${live.maxChoices} options.`);
      return;
    }
    setSelections([...selections, optionId]);
  }

  async function submit() {
    if (!name.trim()) {
      setError("Add your name so the group knows who voted.");
      announce("Add your name before voting.");
      return;
    }
    if (selections.length === 0) {
      setError("Pick at least one option.");
      announce("Pick at least one option before casting.");
      return;
    }

    setCasting(true);
    setError(null);

    const result = await castVote({
      slug: poll.slug,
      optionIds: selections,
      name: name.trim(),
      seed: name.trim(),
      tint,
      token,
    });

    setCasting(false);
    setConfirmOpen(false);

    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      announce(result.error ?? "Vote not recorded.");
      return;
    }

    localStorage.setItem(tokenKey, token);
    localStorage.setItem("tb_voter_name", name.trim());
    localStorage.setItem("tb_voter_seed", name.trim());
    localStorage.setItem("tb_voter_tint", tint);
    setJustVoted(true);
    announce("Your vote is in. Votes are final — no take-backs.");
  }

  const selectedOptions = live.options.filter((o) => selections.includes(o.id));
  const firstPick = selectedOptions[0];
  const ctaLabel =
    live.type === "multi" && selectedOptions.length > 1
      ? `Cast my ${selectedOptions.length} votes`
      : firstPick
        ? `Cast my vote for ${firstPick.label}`
        : "Cast my vote";

  const canCast = name.trim().length > 0 && selections.length > 0;

  return (
    <div className="mt-8">
      {votingOpen && (
        <section aria-labelledby="vote-heading" className="mb-6">
          <h2 id="vote-heading" className="font-display text-2xl font-black text-cocoa">
            {locked ? "You already voted" : "Cast your vote"}
          </h2>
          <p className="mt-1 mb-4 text-sm text-cocoa-soft">
            {locked
              ? "Tiebreak keeps the race honest with no takebacks. Check in on how your pick is doing."
              : "No account needed — pick a face, vote, and pass the phone."}
          </p>

          {!locked ? (
            <>
              <section
                aria-label="Voter identity"
                className="shadow-2xs border-cocoa animate-tb-rise rounded-lg bg-card p-4"
              >
                <span className="mb-2 block font-display text-xs font-bold tracking-wider text-cocoa-soft uppercase">
                  1. Choose your game face
                </span>

                <div className="mb-3 flex items-center gap-3">
                  <Avatar name={voterSeed} seed={voterSeed} tint={tint} size={48} />
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="voter-name"
                      className="mb-1 block text-xs font-bold text-cocoa"
                    >
                      Your name
                    </label>
                    <input
                      id="voter-name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      maxLength={40}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Lena"
                      className="w-full rounded-xl border-2 border-cocoa bg-cream px-3 py-1.5 text-sm font-bold text-cocoa outline-none placeholder:font-semibold placeholder:text-cocoa-soft/60 focus:ring-2 focus:ring-teal"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-cocoa/10 pt-3">
                  <span className="text-xs font-semibold text-cocoa-soft">Background:</span>
                  <div className="flex items-center gap-2">
                    {AVATAR_TINTS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        aria-label={`Select ${t.name} background`}
                        aria-pressed={tint === t.id}
                        onClick={() => {
                          setTint(t.id);
                          try {
                            window.localStorage.setItem("tb_voter_tint", t.id);
                          } catch {}
                        }}
                        className={`h-6 w-6 rounded-full border border-cocoa-sm transition-transform ${
                          tint === t.id ? "scale-125 ring-2 ring-teal" : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: t.hex }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-cocoa/10 pt-3">
                  <span className="text-xs font-semibold text-cocoa-soft">Face:</span>
                  <div className="-mx-1 flex max-w-[15rem] items-center gap-1.5 overflow-x-auto px-1 py-0.5">
                    {FACE_PRESETS.map((seed) => (
                      <button
                        key={seed}
                        type="button"
                        aria-label={`Select face ${seed}`}
                        aria-pressed={face === seed}
                        onClick={() => {
                          const next = face === seed ? null : seed;
                          setFace(next);
                          try {
                            if (next) window.localStorage.setItem("tb_voter_face", next);
                            else window.localStorage.removeItem("tb_voter_face");
                          } catch {}
                        }}
                        className={`shrink-0 rounded-xl transition-transform ${
                          face === seed
                            ? "scale-105 ring-2 ring-teal"
                            : "hover:scale-105"
                        }`}
                      >
                        <Avatar name={seed} seed={seed} tint={tint} size={34} />
                      </button>
                    ))}
                    <button
                      type="button"
                      aria-label="Randomize face"
                      onClick={() => {
                        const random =
                          FACE_PRESETS[Math.floor(Math.random() * FACE_PRESETS.length)];
                        setFace(random);
                        try {
                          window.localStorage.setItem("tb_voter_face", random);
                        } catch {}
                      }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cocoa-sm bg-cream-deep text-cocoa transition-colors hover:bg-cream"
                    >
                      <Shuffle size={14} strokeWidth={2.4} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </section>

              <fieldset className="mt-5 mb-3 sm:mt-6">
                <legend className="mb-2 block font-display text-xs font-bold tracking-wider text-cocoa-soft uppercase">
                  2. Cast your vote{" "}
                  {live.type === "multi" ? `(pick up to ${live.maxChoices})` : ""}
                </legend>

                <div className="flex flex-col gap-2.5">
                  {live.options.map((option) => {
                    const selected = selections.includes(option.id);
                    return (
                      <div key={option.id}>
                        <input
                          id={`opt-${option.id}`}
                          type={live.type === "single" ? "radio" : "checkbox"}
                          name="option"
                          value={option.id}
                          checked={selected}
                          disabled={!selected && live.type === "multi" && maxReached}
                          onChange={() => toggleOption(option.id)}
                          className="peer sr-only"
                        />
                        <label
                          htmlFor={`opt-${option.id}`}
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-[18px] border-cocoa p-3.5 transition-all select-none peer-focus-visible:outline peer-focus-visible:outline-teal peer-focus-visible:outline-offset-2 ${
                            selected
                              ? "bg-cream-deep shadow-sm ring-2 ring-teal"
                              : "bg-card hover:bg-cream"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cocoa-sm transition-colors ${
                                selected ? "bg-teal text-cream-bright" : "bg-cream-deep"
                              }`}
                            >
                              {selected && <Check size={14} strokeWidth={3.5} aria-hidden="true" />}
                            </span>
                            <span className="flex min-w-0 flex-col">
                              <span className="font-display text-base font-extrabold leading-snug text-cocoa">
                                {option.label}
                              </span>
                              {option.suggestedBy && (
                                <span className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-cocoa-soft">
                                  <Avatar
                                    name={option.suggestedBy.name}
                                    seed={option.suggestedBy.seed}
                                    tint={option.suggestedBy.tint}
                                    size={14}
                                  />
                                  Suggested by {option.suggestedBy.name}
                                </span>
                              )}
                            </span>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </fieldset>

              {error && (
                <p
                  id="vote-error"
                  role="alert"
                  className="mb-4 flex items-center gap-2 rounded-xl border-2 border-cocoa bg-cream-deep px-3 py-2.5 text-xs font-bold text-cocoa"
                >
                  <AlertCircle size={16} strokeWidth={2.5} className="shrink-0 text-tangerine" />
                  {error}
                </p>
              )}

              <button
                type="button"
                disabled={!canCast || casting}
                onClick={() => setConfirmOpen(true)}
                className="btn-game-piece flex h-12 w-full items-center justify-center gap-2 animate-tb-glow-soft rounded-xl border-cocoa-sm bg-tangerine-deep px-4 font-display text-sm font-bold text-cream shadow-sm transition-all hover:-translate-y-px hover:shadow-press-tangerine active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-full sm:text-base"
              >
                <Vote size={16} strokeWidth={2.5} aria-hidden="true" />
                <span className="truncate">{ctaLabel}</span>
              </button>

              {live.suggestionsEnabled && (
                <div className="mb-4 text-center">
                  <button
                    type="button"
                    onClick={() => setSuggestOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg p-2 text-xs font-bold text-cocoa-soft transition-colors hover:bg-cream-deep hover:text-cocoa"
                  >
                    <Sparkles size={14} strokeWidth={2.4} className="text-tangerine" />
                    Don&apos;t see what you want? Suggest an option
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="shadow-2xs border-cocoa rounded-2xl bg-card p-4">
              <span className="mb-1.5 block text-xs font-bold tracking-wide text-cocoa-soft uppercase">
                You backed:
              </span>
              <div className="flex flex-col gap-1.5">
                {live.options
                  .filter((o) => myVotes.includes(o.id))
                  .map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center gap-2 rounded-xl border border-cocoa/10 bg-cream p-2 font-display text-base font-black text-cocoa"
                    >
                      <Check size={16} strokeWidth={3} className="shrink-0 text-teal-deep" />
                      <span>{o.label}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </section>
      )}

      <ResultsBoard poll={live} showBackers={live.status === "settled"} />

      {votingOpen && live.isMine && <Moderation poll={live} />}

      {confirmOpen && votingOpen && !locked && (
        <Dialog
          open
          labelledBy="vote-confirm-title"
          busy={casting}
          onClose={() => setConfirmOpen(false)}
          panelClassName="w-full max-w-sm rounded-lg p-5"
        >
          <span className="mb-1 block font-display text-xs font-bold tracking-wider text-tangerine-deep uppercase">
            Confirm your vote
          </span>
            <h3 id="vote-confirm-title" className="font-display text-xl font-extrabold text-cocoa">
              Lock it in?
            </h3>
            <p className="mt-1 text-xs text-cocoa-soft sm:text-sm">
              Votes are final the moment they land — no takebacks, no edits.
            </p>

            <div className="mt-4 flex items-center gap-3 rounded-xl border border-cocoa/10 bg-cream p-3">
              <Avatar name={voterSeed} seed={voterSeed} tint={tint} size={38} />
              <div className="min-w-0 flex-1">
                <span className="block truncate font-display font-bold text-sm text-cocoa">
                  {name.trim()}
                </span>
                <span className="block text-xs text-cocoa-soft">
                  Voting on {live.title}
                </span>
              </div>
            </div>

            <div className="mt-2 flex flex-col gap-1.5">
              {selectedOptions.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center gap-2 rounded-xl bg-cream-deep p-2 font-display text-sm font-extrabold text-cocoa"
                >
                  <Check size={16} strokeWidth={3} className="shrink-0 text-teal-deep" />
                  <span>{o.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={casting}
                onClick={() => setConfirmOpen(false)}
                className="rounded-full border-cocoa-sm bg-cream px-4 py-2 text-xs font-bold text-cocoa transition-colors hover:bg-cream-deep disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={casting}
                onClick={submit}
                className="btn-game-piece rounded-full border-cocoa-sm bg-tangerine-deep px-4 py-2 text-xs font-bold text-cream transition-all hover:-translate-y-px hover:shadow-press-tangerine disabled:opacity-60"
              >
                {casting ? "Casting…" : "Cast my vote"}
              </button>
            </div>
        </Dialog>
      )}

      {!live.isMine && votingOpen && live.suggestionsEnabled && (
        <SuggestModal
          open={suggestOpen}
          slug={poll.slug}
          voter={{ name: name.trim() || "a friend", seed: name.trim() || "voter", tint }}
          token={token}
          onClose={() => setSuggestOpen(false)}
        />
      )}
    </div>
  );
}
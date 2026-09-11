"use client";

import { useMemo, useState } from "react";
import { castVote } from "@/app/actions/votes";
import { suggestOption } from "@/app/actions/suggestions";
import { announce } from "@/lib/announce";
import { usePoll } from "@/lib/use-poll";
import Avatar from "@/components/avatar";
import ResultsBoard from "@/components/vote/results-board";
import Moderation from "@/components/vote/moderation";
import type { PollView } from "@/lib/types";

const AVATAR_TINTS = ["f8c9b9", "cbe2d8", "f6e0a4", "e3d2f2"];

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
  isMine,
}: {
  poll: PollView;
  isMine: boolean;
}) {
  const tokenKey = `tb_token_${poll.slug}`;
  const [token] = useState<string>(() => local(tokenKey) || randomToken());
  const [name, setName] = useState(() => local("tb_voter_name") ?? "");
  const [tint, setTint] = useState(() => local("tb_voter_tint") ?? "cbe2d8");
  const [selections, setSelections] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [casting, setCasting] = useState(false);
  const [justVoted, setJustVoted] = useState(false);

  const { data } = usePoll(poll.slug, token);
  const live = data?.poll ?? poll;

  const locked = justVoted || (data?.poll.myVotes.length ?? 0) > 0;
  const myVotes = justVoted ? selections : (data?.poll.myVotes ?? []);

  const maxReached = live.maxChoices > 1 && selections.length >= live.maxChoices;

  const votingOpen = live.status === "open";

  const seed = useMemo(() => name.trim() || "voter", [name]);

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

    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      announce(result.error ?? "Vote not recorded.");
      return;
    }

    localStorage.setItem(tokenKey, token);
    localStorage.setItem("tb_voter_name", name.trim());
    localStorage.setItem("tb_voter_tint", tint);
    setJustVoted(true);
    announce("Your vote is in. Votes are final — no take-backs.");
  }

  return (
    <div className="mt-8">
      {votingOpen && (
        <section aria-labelledby="vote-heading">
          <h2 id="vote-heading" className="font-display text-2xl font-black text-cocoa">
            {locked ? "You voted" : "Cast your vote"}
          </h2>
          <p className="mt-1 text-sm text-cocoa-soft">
            {locked
              ? "Your picks are locked in. Here are the live numbers."
              : "No account needed — your name is only shown to the group once the poll closes."}
          </p>

          {!locked ? (
            <><Identity name={name} setName={setName} tint={tint} setTint={setTint} seed={seed} />

              <div
                role={live.type === "single" ? "radiogroup" : "group"}
                aria-labelledby="vote-options-label"
                className="mt-4"
              >
                <h3 id="vote-options-label" className="font-display text-sm font-bold tracking-wide text-cocoa-soft uppercase">
                  {live.type === "single"
                    ? "Pick one"
                    : `Pick up to ${live.maxChoices}`}
                </h3>
                <ul className="mt-2 space-y-2">
                  {live.options.map((option, index) => {
                    const selected = selections.includes(option.id);
                    return (
                      <li key={option.id}>
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
                          className={`block cursor-pointer rounded-xl border-2 border-cocoa px-4 py-3.5 font-display font-bold transition-colors peer-has-checked:bg-teal peer-has-checked:text-cream peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-teal peer-focus-visible:outline-offset-2 ${
                            selected ? "bg-teal text-cream" : "bg-card text-cocoa hover:bg-cream-deep"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-normal opacity-80">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="min-w-0">{option.label}</span>
                          </span>
                        </label>

                        {option.suggestedBy && (
                          <p className="mt-1 pl-2 text-xs font-bold text-cocoa-soft">
                            Suggested by {option.suggestedBy.name}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {error && (
                <p
                  id="vote-error"
                  role="alert"
                  className="mt-3 rounded-lg bg-tangerine/10 px-3 py-2 text-sm font-bold text-tangerine-deep"
                >
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={casting}
                className="btn-game-piece mt-5 w-full rounded-full bg-tangerine px-6 py-3.5 font-display text-lg font-bold text-cream disabled:opacity-60"
              >
                {casting ? "Casting…" : "Cast your vote"}
              </button>

              <p className="mt-2 text-center text-xs text-cocoa-soft">
                Votes are final — the poll closes to voting when the deadline passes.
              </p>
            </>
          ) : (
            <div className="mt-4 rounded-xl border-cocoa bg-teal-soft p-4">
              <p className="font-display font-bold text-teal-deep">Your pick{myVotes.length === 1 ? "" : "s"}:</p>
              <ul className="mt-2 space-y-1">
                {live.options
                  .filter((o) => myVotes.includes(o.id))
                  .map((o) => (
                    <li key={o.id} className="font-bold text-teal-deep">
                      {o.label}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <div className={votingOpen && !locked ? "mt-10 opacity-90" : "mt-10"}>
        <ResultsBoard poll={live} showBackers={live.status === "settled"} />
      </div>

      {votingOpen && isMine && (
        <Moderation poll={live} />
      )}

      {votingOpen && !isMine && live.suggestionsEnabled && (
        <SuggestForm
          slug={poll.slug}
          token={token}
          name={name.trim()}
          tint={tint}
        />
      )}
    </div>
  );
}

function SuggestForm({
  slug,
  token,
  name,
  tint,
}: {
  slug: string;
  token: string;
  name: string;
  tint: string;
}) {
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit() {
    const trimmed = label.trim();
    if (trimmed.length < 2) {
      setStatus("error");
      setMessage("Type the option first.");
      announce("Type the option first.");
      return;
    }
    if (!name) {
      setStatus("error");
      setMessage("Add your name at the top first.");
      announce("Add your name before suggesting.");
      return;
    }

    setStatus("busy");
    const result = await suggestOption({
      slug,
      label: trimmed,
      name,
      seed: name,
      tint,
      token,
    });

    if (!result.ok) {
      setStatus("error");
      setMessage(result.error ?? "Couldn't send that.");
      announce(result.error ?? "Couldn't send that.");
      return;
    }
    setLabel("");
    setStatus("done");
    announce("Option suggested — the creator will review it.");
  }

  return (
    <section aria-labelledby="suggest-heading" className="mt-8 border-cocoa rounded-2xl bg-card p-4">
      <h2 id="suggest-heading" className="font-display text-lg font-bold text-cocoa">
        Got another idea?
      </h2>
      <p className="mt-1 text-sm text-cocoa-soft">
        Suggest an option — {name ? `${name.split(" ")[0]}, it'll` : "it'll"} be
        marked “Suggested by you” and the creator can add it to the ballot.
      </p>

      {status === "done" ? (
        <p className="mt-3 rounded-lg bg-teal-soft px-3 py-2 text-sm font-bold text-teal-deep">
          Sent! The creator will review it.
        </p>
      ) : (
        <form
          className="mt-3 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label htmlFor="suggestion-label" className="sr-only">
            Suggest an option
          </label>
          <input
            id="suggestion-label"
            type="text"
            value={label}
            maxLength={60}
            onChange={(e) => {
              setLabel(e.target.value);
              setStatus("idle");
            }}
            placeholder="Add your idea…"
            className="min-w-0 flex-1 rounded-lg border-2 border-cocoa bg-cream px-3 py-2.5 focus:border-teal"
          />
          <button
            type="submit"
            disabled={status === "busy"}
            className="btn-game-piece rounded-full bg-teal px-5 py-2.5 font-display font-bold text-cream disabled:opacity-60"
          >
            {status === "busy" ? "Sending…" : "Suggest"}
          </button>
        </form>
      )}

      {status === "error" && (
        <p role="alert" className="mt-2 text-sm font-bold text-tangerine-deep">
          {message}
        </p>
      )}
    </section>
  );
}

function Identity({
  name,
  setName,
  tint,
  setTint,
  seed,
}: {
  name: string;
  setName: (v: string) => void;
  tint: string;
  setTint: (v: string) => void;
  seed: string;
}) {
  return (
    <div className="mt-4">
      <label htmlFor="voter-name" className="block text-sm font-bold text-cocoa">
        What&apos;s your name?
      </label>
      <input
        id="voter-name"
        type="text"
        autoComplete="name"
        value={name}
        maxLength={40}
        onChange={(e) => setName(e.target.value)}
        placeholder="Priya, Kai, Jonah…"
        className="mt-1 w-full rounded-lg border-2 border-cocoa bg-card px-3 py-2.5 text-lg focus:border-teal"
      />

      <fieldset className="mt-3">
        <legend className="text-sm font-bold text-cocoa">Pick a face</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {AVATAR_TINTS.map((t) => (
            <label
              key={t}
              className={`flex cursor-pointer items-center gap-2 rounded-full border-2 px-3 py-1.5 text-sm font-bold transition-colors has-checked:bg-teal has-checked:text-cream ${
                tint === t ? "bg-teal text-cream" : "border-cocoa bg-card text-cocoa hover:bg-cream-deep"
              }`}
            >
              <input
                type="radio"
                name="avatar-tint"
                value={t}
                checked={tint === t}
                onChange={() => setTint(t)}
                className="sr-only"
              />
              <Avatar name={seed} seed={seed} tint={t} size={24} />
              {t === "cbe2d8" ? "Teal" : t === "f8c9b9" ? "Peach" : t === "f6e0a4" ? "Butter" : "Lilac"}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createPollAction, type CreatePollState } from "@/app/actions/polls";

const initialState: CreatePollState = { error: undefined };

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;

interface Template {
  key: string;
  label: string;
  title: string;
  options: string[];
}

const TEMPLATES: Template[] = [
  {
    key: "pizza",
    label: "Pizza night",
    title: "Pizza night: what are we ordering?",
    options: ["Pepperoni", "Margherita", "Veggie supreme", "BBQ chicken"],
  },
  {
    key: "film",
    label: "Film night",
    title: "Film night: what are we watching?",
    options: ["Action", "Comedy", "Thriller", "Drama"],
  },
  {
    key: "date",
    label: "Date night",
    title: "Meal out: which date works?",
    options: ["Thursday", "Friday", "Saturday"],
  },
  {
    key: "getaway",
    label: "Weekend away",
    title: "Where should we stay?",
    options: ["The cabin", "The coast", "The city"],
  },
];

/** Pre-fill from a poll the creator already ran (the "re-run" quick start). */
export interface InitialPoll {
  title?: string;
  options?: string[];
  type?: "single" | "multi";
  maxChoices?: number;
  suggestions?: boolean;
}

type DeadlinePreset = "tonight" | "tomorrow" | "one-day" | "custom";

function presetClosesAt(preset: DeadlinePreset): { value: string; label: string } {
  const now = new Date();
  const d = (x: number) => new Date(Date.now() + x);
  switch (preset) {
    case "tonight": {
      const t = d(0);
      t.setHours(23, 59, 0, 0);
      return { value: t.toISOString(), label: "Tonight, 11:59 pm" };
    }
    case "tomorrow": {
      const t = d(86_400_000);
      t.setHours(18, 0, 0, 0);
      return { value: t.toISOString(), label: "Tomorrow, 6:00 pm" };
    }
    case "one-day":
      return { value: d(86_400_000).toISOString(), label: "In 24 hours" };
    default:
      return { value: "", label: "" };
  }
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function PollForm({ initial }: { initial?: InitialPoll }) {
  const [state, formAction, pending] = useActionState(createPollAction, initialState);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<"single" | "multi">(initial?.type ?? "single");
  const [maxChoices, setMaxChoices] = useState(
    initial?.maxChoices && initial.maxChoices >= 2 ? initial.maxChoices : 2
  );
  const [options, setOptions] = useState<string[]>(
    initial?.options && initial.options.length >= MIN_OPTIONS
      ? initial.options
      : ["", ""]
  );
  const [suggestions, setSuggestions] = useState(
    initial?.suggestions ?? true
  );
  const [preset, setPreset] = useState<DeadlinePreset>("tonight");
  const [custom, setCustom] = useState("");
  const [appliedTemplate, setAppliedTemplate] = useState<string | null>(
    initial?.title ? "rerun" : null
  );
  const rerunning = Boolean(initial?.title);

  const closesAt = preset === "custom" ? custom : presetClosesAt(preset).value;

  function applyTemplate(t: Template) {
    setTitle(t.title);
    setOptions(t.options);
    setType("single");
    setAppliedTemplate(t.key);
  }

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  function addOption() {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, ""]);
  }

  function removeOption(index: number) {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form action={formAction} className="mt-6 space-y-6" noValidate>
      <div>
        <label htmlFor="title" className="block text-sm font-bold text-cocoa">
          What are we deciding?
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setAppliedTemplate(null);
          }}
          required
          maxLength={90}
          placeholder="Pizza night, film club, weekend plans…"
          className="mt-1 w-full rounded-lg border-cocoa-sm bg-card px-3 py-2.5 font-display text-lg text-cocoa focus:border-teal"
        />
      </div>

      {rerunning && (
        <p className="rounded-lg bg-butter/50 px-3 py-2 text-sm font-bold text-cocoa">
          Re-running a past poll — tweak anything before you share it again.
        </p>
      )}

      <fieldset>
        <legend className="text-sm font-bold text-cocoa">Quick start</legend>
        <p className="mt-1 text-xs text-cocoa-soft">
          Pre-fill from a classic poll — then tweak anything.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => applyTemplate(t)}
              aria-pressed={appliedTemplate === t.key}
              className={`rounded-full border-2 border-cocoa px-4 py-2 text-sm font-bold transition-colors ${
                appliedTemplate === t.key
                  ? "bg-teal text-cream"
                  : "bg-card text-cocoa hover:bg-cream-deep"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-bold text-cocoa">
          How do we vote?
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-cocoa px-4 py-3 text-sm font-bold transition-colors has-checked:bg-teal has-checked:text-cream ${
              type === "single" ? "bg-teal text-cream" : "bg-card text-cocoa"
            }`}
          >
            <input
              type="radio"
              name="type"
              value="single"
              checked={type === "single"}
              onChange={() => setType("single")}
              className="accent-teal"
            />
            One option only
          </label>
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-cocoa px-4 py-3 text-sm font-bold transition-colors has-checked:bg-teal has-checked:text-cream ${
              type === "multi" ? "bg-teal text-cream" : "bg-card text-cocoa"
            }`}
          >
            <input
              type="radio"
              name="type"
              value="multi"
              checked={type === "multi"}
              onChange={() => setType("multi")}
              className="accent-teal"
            />
            Pick up to…
          </label>
        </div>

        {type === "multi" && (
          <div className="mt-2">
            <label htmlFor="maxChoices" className="text-sm font-bold text-cocoa">
              How many can each person pick?
            </label>
            <select
              id="maxChoices"
              name="maxChoices"
              value={maxChoices}
              onChange={(e) => setMaxChoices(Number(e.target.value))}
              className="mt-1 rounded-lg border-cocoa-sm bg-card px-3 py-2"
            >
              {[2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  Up to {n} options
                </option>
              ))}
            </select>
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-bold text-cocoa">
          The choices <span className="font-normal text-cocoa-soft">(at least 2)</span>
        </legend>
        <div className="mt-2 space-y-2">
          {options.map((value, index) => (
            <div key={index} className="flex items-center gap-2">
              <label htmlFor={`option-${index}`} className="sr-only">
                Option {index + 1}
              </label>
              <input
                id={`option-${index}`}
                name="option"
                type="text"
                required={index < 2}
                value={value}
                maxLength={80}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="w-full rounded-lg border-cocoa-sm bg-card px-3 py-2.5 focus:border-teal"
              />
              <button
                type="button"
                onClick={() => removeOption(index)}
                disabled={options.length <= MIN_OPTIONS}
                aria-label={`Remove option ${index + 1}`}
                className="rounded-lg border-cocoa-sm p-2 text-cocoa-soft transition-colors hover:bg-cream-deep hover:text-tangerine-deep disabled:opacity-40"
              >
                <Trash2 aria-hidden="true" size={18} />
              </button>
            </div>
          ))}
        </div>
        {options.length < MAX_OPTIONS && (
          <button
            type="button"
            onClick={addOption}
            className="mt-2 inline-flex items-center gap-2 rounded-full border-cocoa-sm bg-card px-4 py-2 text-sm font-bold text-teal transition-colors hover:bg-teal-soft"
          >
            <Plus aria-hidden="true" size={16} />
            Add an option
          </button>
        )}
      </fieldset>

      <label className="flex items-center gap-3 text-sm font-bold text-cocoa">
        <input
          name="suggestions"
          type="checkbox"
          checked={suggestions}
          onChange={(e) => setSuggestions(e.target.checked)}
          className="h-5 w-5 accent-teal"
        />
        Let voters suggest options (you approve or decline them)
      </label>

      <fieldset>
        <legend className="text-sm font-bold text-cocoa">When does it close?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(
            [
              ["tonight", "Tonight, 11:59 pm"],
              ["tomorrow", "Tomorrow, 6:00 pm"],
              ["one-day", "In 24 hours"],
              ["custom", "Custom…"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className={`cursor-pointer rounded-full border-2 border-cocoa px-4 py-2 text-sm font-bold transition-colors has-checked:bg-butter has-checked:text-cocoa ${
                preset === key ? "bg-butter" : "bg-card text-cocoa hover:bg-cream-deep"
              }`}
            >
              <input
                type="radio"
                name="deadline-preset"
                value={key}
                checked={preset === key}
                onChange={() => setPreset(key)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>

        {preset === "custom" && (
          <div className="mt-3">
            <label
              htmlFor="closesAt"
              className="block text-sm font-bold text-cocoa"
            >
              Closing date and time
            </label>
            <input
              id="closesAt"
              name="closesAt-custom"
              type="datetime-local"
              value={custom ? toDatetimeLocal(custom) : ""}
              min={toDatetimeLocal(new Date().toISOString())}
              required={preset === "custom"}
              onChange={(e) => setCustom(e.target.value)}
              className="mt-1 rounded-lg border-cocoa-sm bg-card px-3 py-2 focus:border-teal"
            />
            <p className="mt-1 text-xs text-cocoa-soft">
              Your local time. The poll settles automatically when it passes.
            </p>
          </div>
        )}

        <input type="hidden" name="closesAt" value={closesAt} />
      </fieldset>

      {state?.error && (
        <p
          id="create-poll-error"
          role="alert"
          className="rounded-lg bg-tangerine/10 px-3 py-2 text-sm font-bold text-tangerine-deep"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-game-piece w-full rounded-xl border-cocoa-sm bg-tangerine-deep px-6 py-3.5 font-display text-lg font-bold text-cream transition-colors hover:bg-tangerine disabled:opacity-60 sm:rounded-full"
      >
        {pending ? "Creating poll…" : "Create the poll"}
      </button>
    </form>
  );
}
# Tiebreak — Polls that live in the group chat

Group-decision polls that live in the group chat: no accounts for voters, honest numbers at small vote counts, and a reveal worth screenshotting back into the chat.

**Challenge:** [Tiebreak on Frontend Mentor](https://www.frontendmentor.io/challenges/poll-creator-app)

**Live URL:** [https://tiebreak-roan.vercel.app](https://tiebreak-roan.vercel.app)

> Replace `./screenshot.png` with a capture of your deployed vote page (or a real link share):
> ![Screenshot of your solution](./screenshot.png)

---

## Overview

This is the **full-stack path**: a Next.js 15 app with a real database and server-side sessions. A creator signs up (or jumps straight into the demo), makes a poll in one step, and drops a link in the group chat. Voters tap through on their phones — name, avatar, vote — with no account. They can suggest options the creator approves or declines. Results update live while the poll is open, and closing produces a people-first reveal. A tie offers a creator-triggered sudden-death round, or the poll can be reopened for another 24 hours.

The two hard problems got the most care: the **poll state machine is enforced server-side** (a closed poll rejects votes no matter what the UI shows, casting is idempotent per voter token, and reopening is an explicit, confirmed act), and **honest results at small vote counts** (per-voter tallies, counts beside percentages, bars relative to the leader, ties stated in words).

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, React 19, TypeScript) |
| Database | Prisma + PostgreSQL on Supabase (dedicated `tiebreak` schema) |
| Authentication | Custom sessions: bcryptjs password hashing, DB-backed session cookies, one-tap guest/demo mode |
| Live updates | Client polling of `GET /api/polls/[slug]` (5s), plus `router.refresh()` for creator actions |
| Avatars | DiceBear hosted API (micah style) with an initials-circle fallback |
| Hosting | Vercel (target) |
| Styling | Tailwind CSS v4 via the brand tokens in `starter/tokens.css`, Gabarito + Karla |
| Other | zod validation, lucide-react icons, `next/og` ImageResponse share cards |

---

## Design Decisions

These are the product and design choices I made where the spec left room for interpretation.

### The Voter's Side of the Story

**The problem I was solving:**
A voter arrives from a group-chat link, casts a vote, and then what? They're anonymous, there's no account to come back to, and once the poll settles their name/avatar suddenly become public inside the results. The page also has to keep three audiences straight on one URL: first-time voter, voter returning to check results, and the creator.

**My approach:**
- The vote page is a single self-explanatory flow: name → avatar picker (four tints) → pick option(s) → cast. No account, no email, no barrier.
- **Live results after voting.** The post-vote view keeps the same URL (no redirect), shows the voter's locked-in picks, and displays live results right below. A 5-second poll of the poll API keeps numbers fresh without collisions or jitter.
- **Voter identity lives in `localStorage`** (`tb_token_{slug}` for each poll, plus name and avatar tint). The token is what the server uses for idempotent casting — a refresh or return visit can't double-cast.
- **Attribution only at the close.** While open, the results show votes and percentages but never names. Names/avatars attach to options only once the poll settles — that's an API rule (`/api/polls/[slug]`) mirrored by the UI, so the client can't reveal what the server hides.
- **Latecomers** land on whichever state is true right now: an open poll shows the live booth, a settled one shows the reveal. One URL, honest state.
- Votes are **final — no take-backs** (explicitly stated in the UI so it never comes as a surprise).

**Why I chose this approach:**
Live results after voting is the product's whole point — the chat keeps chatting and the numbers move. Names hidden until close protect the "no account needed" promise (nobody should worry their name is broadcast mid-poll to the group), and keeping the reveal as the single payoff makes the close feel earned. The same-URL-one-state rule removes every "which link" question from the chat.

**What I'd do differently:**
A full WebSocket/SSE push instead of 5s polling for zero-latency updates, and letting voters edit their pick during a short grace window in exchange for a small "changed their vote" marker — the _final_ rule is honest but strict.

### The Reveal

**The problem I was solving:**
The close of a poll should feel like the end of a good game: legible when screenshotted into the chat, honest about the numbers, and an actual plan for the tie instead of a cop-out.

**My approach:**
- **People first.** The winner card leads with the option label and then the names and avatars of who backed it ("Elif, Jonah, Noor + 1 more backed it"). It survives a screenshot and speaks to the group chat.
- **Per-option rows** show counts and percentages, bars relative to the leader, and the same quiet palette as live results — the reveal is results, escalated, not a confetti drop.
- **No animation around the winner.** The reveal is fully static, so `prefers-reduced-motion` is a non-issue and screenshots are stable.
- **Ties are handled for real.** A tie shows "It ends in a tie" in words with both leaders. The creator then gets two explicit, confirmed choices: **start sudden death** (a child poll containing only the tied options, 10 minutes) or **reopen for voting** (original deadline + 24 hours). The parent poll surface links to the sudden-death round, and its reveal auto-links to the round's outcome; `Copy result` shares that resolved URL.
- Every destructive or irreversible action (reopen, retire, delete forever) goes through an accessible confirm dialog with a focus trap.

**Why I chose this approach:**
Celebration without honesty reads as manipulation — small poll counts can't support a confetti canon. The people-first card is what makes the poll *social*; it's the moment the chat sees who was on their side. Designing the tie as a state with two live escape hatches (sudden death or reopen) keeps the "good game" feeling instead of leaving the group with two winners and no next step.

**What I'd do differently:**
Automatic sudden death (no creator click needed), and a per-bell "who flipped last" ticker on the live screen for the big countdown moment.

### First Run

**The problem I was solving:**
A brand-new creator on an empty dashboard, and the path from zero to a link in the group chat — the moment a product is most likely to be closed and forgotten.

**My approach:**
- The **landing page** is the front door: what it is, the three-step promise (create, share, reveal), and one primary call to **Try it — instant demo** that drops you into a fully-seeded creator account so you never face an empty dashboard on first contact.
- The **empty dashboard** is a single loud row: ask the group a question, drop in options, share the link — and a "Create a poll" button. It says what to do, not why the product is sad.
- **One-step creation.** Title → quick-start templates (Pizza night, Film night, etc.) or your own options → type of voting → when it closes. Templates are instant; "Run again" re-fills any settled poll of yours with one tap.
- **Share is front and centre.** After creating, the poll page shows the share link with a copy button ("Share this link in the group chat:") and a branded OG share card so the chat link previews beautifully. One poll with zero votes shows "No votes yet — first vote wins the table."
- A **guest dashboard** (Morgan's five seeded polls) demonstrates the full product — open, settled, and retired states — the moment a new person lands, before they've made anything.

**Why I chose this approach:**
The empty state is where CRUD products die, so the demo dashboard and templates kill it by construction. Creating a poll is a real decision (options, deadline) but it shouldn't feel like one; templates make the first one 10 seconds. The OG card makes sharing *feel* like the product doing something for you.

**What I'd do differently:**
A guided "from your last poll" moment on first create, and an onboarding checklist (create → share → close) for the first three sessions.

### Product Rules I Decided

| Rule | Decision |
|------|----------|
| **Reopening a poll** | `closesAt = original deadline + 24 hours` exactly. Explicit, confirmed dialog. Votes already cast stay on the board. |
| **One-vote line** | With no accounts, the voter's anonymous token is the line: each token counts once (`@@unique(pollId, voterToken)`), casting is idempotent, multi-pick still counts one token per voter. |
| **Results past ~20 votes** | Tally presentation switches at 20 votes per option (`TALLY_BREAKPOINT`) to keep the board legible at scale while the underneath counts stay. |
| **Declined suggestions** | Recoverable, never silently deleted: "Declined — recoverable", `undo` / `remove for good` kept as explicit separate actions. |
| **Deadlines** | Between 1 minute and 1 year from creation; presets "tonight / tomorrow / 24 hours / custom". A poll auto-settles the moment the deadline passes (evaluated at read time, persisted). |
| **Sudden death** | Creator-only, only the tied options, exactly 10 minutes, one child poll per parent. |
| **Suggestions enabled** | On by default in creation; UI always says "Suggested by X", never "write-in". |

### Other Design Choices

- **The brand kit is adopted as-is** (risograph palette, Gabarito + Karla, data-viz rules) with one deliberate divergence: **no dark mode**, because the cream/paper surface is the brand's texture and a forced second theme would cheapen it. Documented, not forgotten.
- **Avatar picker**: four tinted faces (teal/peach/butter/lilac), "seed" = your name, so the same name always wears the same face. Fails closed to initials if the CDN is unreachable.
- **Colors carry status**: teal = open/live, tangerine = settled/decision, butter = neutral/closed labels, cocoa = ink. The reveal keeps the same color roles as voting (tangerine leader, teal others).
- **Moderation flow**: a queue above the results on the creator's view with Add/No per suggestion and a recoverable declined stack.
- **Accessibility**: WCAG 2.2 AA pass — keyboard-complete (native radios/checkboxes, focus-visible outlines), one H1 per page, labelled and error-announced forms, a focus-trapped `aria-modal` confirm dialog, `aria-live` regions for every outcome, skip link, and a decorative-only avatar implementation.
- **N+1 counts** on the dashboard are accepted deliberately at demo scale; the poll page itself uses a single aggregation query.

---

## Development Journey

### Initial Approach vs. Final

Initial plan: full-stack Next.js + Prisma/SQLite, nine build stages with a commit sealing each one. Two structural things changed along the way — the first over a build failure, the second over a bug found testing the reveal:

1. **Dependency tooling.** pnpm 12 removed `pnpm.onlyBuiltDependencies` in favor of an `allowBuilds` map in `pnpm-workspace.yaml`; the fresh install only worked after that mapping (Prisma + esbuild) landed.
2. **Seed timeline.** The first seed applied a uniform time-shift to every timestamp, which silently placed *settled* polls in the future. I re-anchored the dataset to the demo "today" — pizza night closes ~5 hours from now, film night tomorrow, settled polls in the past — so the whole dashboard reads coherently on a real clock.

### Decisions Reconsidered

- **Live results for voters** (initially planned to be show-the-booth/confirmation-only, results after close) — flipped to live results with attribution withheld server-side until settle. It's more product, and the API boundary keeps it safe.
- **Auth URLs** — a `(auth)` route group rendered as `/auth/login` unpredictably; moved to a literal `auth/` folder for deterministic routes.
- **`"use server"` hygiene** — a pure helper (`slugify`) exported from a server-actions module broke the production build; shared helpers moved to client-safe libs. Prod build, not dev, caught it.

### What Surprised Me

- **Satori's strictness** — `next/og` share cards throw unless *every* multi-child `<div>` declares `display: flex`/`none`; the fixed route needed nearly every box to be explicit.
- **pnpm 12's release-age policy** blocked a fresh `lucide-react` until pinned to `^0.474.0`.
- How little code the state machine actually is once you let the **server be the referee**: auto-settle on read, upsert-by-token casting, and an atomic `updateMany` guard made the whole lifecycle boring in the good way.
- The **live-poll refetch** needed `myVotes` from the API keyed off the token or the "you voted" lock could desync on refresh.

### Session Breakdown

| Session | Focus | What I Accomplished |
|---------|-------|-------------------|
| 1 | Scaffold | Next.js 15 + Prisma + SQLite shell, brand tokens, seeded dataset |
| 2 | Auth & first run | Custom sessions (login/signup/guest/logout), landing page, grouped dashboard |
| 3-4 | Create & vote | One-step creation with quick starts; the phone-first vote page with live results |
| 5 | Moderation | Voter suggestions + creator approve/decline/undo/remove queue |
| 6 | The reveal | People-first reveal, tie card, sudden death, reopen/retire/restore/delete + confirm dialogs |
| 7 | Accessibility & hardening | A11y pass; production-build fixes (`use server` exports, lib moves) |
| 8 | Differentiators | Branded OG/Twitter share cards; "Run again" quick start; deploy env docs |
| 9 | Wrap-up | This README, final build & lint |

---

## AI Collaboration Reflection

### How I Used AI

The AI acted as a pair-programmer with veto rights. The three named design challenges and the product rules above were resolved by me asking it clarifying questions (I supplied the user's/visual answers where the "product" is this repo), then implementing behind explicit stage commits. AI was most useful for mechanical breadth — API routes, auth, seeding, lifecycle actions, a11y plumbing — and least useful for deciding the *feel* of the reveal.

### What Worked Well

- **Staging the work** — nine committed stages meant every refactor had a clean rollback point.
- **Prod-build verification on every stage** — the `use server` export error and the Satori `display` rule only surfaced there.
- **Smoke-testing state changes against the real DB** (auto-settle with a past deadline, idempotent casting, tie rendering) instead of trusting type-checking alone.

### What I Learned

Production builds discipline vs. dev tolerance; pnpm 12's build-approval model; and the value of verifying *data* (a seed's dates can be correct in code and wrong on the clock).

### Where I Pushed Back

- Rejected the "confetti + big number" reveal direction — small vote counts make it dishonest.
- Rejected a uniform time-shift seed; re-anchored so demo state reads correctly "now".
- Rejected shipping a moving `"use server"` boundary — moved shared helpers to client-safe libs rather than duplicate them.

---

## Differentiators

### Chosen Differentiator(s)

**1. The Share Card (OG/Twitter card)**

**Why I chose this:** Tiebreak *lives* in the chat, and a chat is a stream of link previews. This is the only feature that markets the product inside the moment it's used.

**How it enhances the product:** A pastel riso card with the question, live status ("Open for votes" / "Poll closed"), counts and people, and the winner when settled — instantly legible in the group chat and distinctive enough to feel like the product.

**Implementation highlights:** `next/og` `ImageResponse` route at `/api/og/[slug]`, 1200×630, brand palette mirrored from the tokens, Gabarito loaded from Google Fonts (cached) with system-font fallback; wired into `generateMetadata` as `openGraph` + Twitter `summary_large_image`, URLs absolute via `APP_URL`. Satori taught me that every multi-child div must carry explicit `display`.

**What I learned:** ImageResponse is brutal about invalid layouts and forgiving about everything else — good discipline.

**2. Quick Starts (templates + "Run again")**

**Why I chose this:** Recurring decisions (weekly pizza, movie night) are the product's repeat loop, and the empty-create state is where abandonment happens.

**How it enhances the product:** Four built-in templates pre-fill a poll in one tap; a settled poll's card gets **"Run again"**, which pre-fills the create form from that poll (`/create?from=<slug>`, server-validated to your own polls) — one tap to rerun last week's decision.

**Implementation highlights:** Template data as a static list in the form; `searchParams`-driven prefill loaded in the server component and passed as `initial` to the client form.

**What I learned:** Prefill-through-the-server-component (not client-side fetch) keeps the URL shareable and the validation honest.

---

## Self-Assessment

| Category | Rating | Notes |
|----------|--------|-------|
| **Works for real users** — Deployed, functional end-to-end; a poll can go from created to decided via a real shared link | 5/5 | Fully working end-to-end on Supabase Postgres, live at [tiebreak-roan.vercel.app](https://tiebreak-roan.vercel.app) (`APP_URL` + env set on Vercel) |
| **The vote page** — Phone-first, self-explanatory in seconds, zero friction between link tap and cast vote | 5/5 | Name → face → pick → cast; live results after; works for a first-time-ever visitor |
| **Honest results** — Per-voter tally, relative pack bars, counts beside every percentage, ties in words | 5/5 | `TALLY_BREAKPOINT`, leader-relative bars, "It ends in a tie" |
| **State machine integrity** — Open/settled/reopened and suggestion states enforced server-side; votes final | 5/5 | Server is the referee; auto-settle on read; idempotent token casting; confirmed reopen |
| **The reveal** — Feels earned, survives a screenshot, works without motion, handles the tie | 5/5 | People-first winner card; zero motion; tie card with sudden death / reopen paths |
| **Design quality** — Typography, spacing, visual hierarchy, color roles held, polish | 4/5 | Brand kit held; some utility-class strings deserve a component tidy pass |
| **Responsive design** — Fully functional and well-designed from 320px up | 4/5 | Tailwind, mobile-first; wide-screen reveal tested, 320px not yet on device |
| **Performance** — Fast vote page on mobile, snappy casting, live updates without jank | 4/5 | Small bundle, 5s polling; no SSE/WebSocket push yet |
| **Accessibility** — Keyboard end-to-end, announced live results and outcomes, focus management, contrast | 4/5 | WCAG 2.2 AA pass implemented; an axe pass on device pending |
| **Landing page & guest experience** — Compelling front door; the guest dashboard tells the product's story immediately | 5/5 | Instant demo + seeded dashboard; one-tap create from templates |

### Lighthouse Scores

<!-- Run Lighthouse on your deployed site and fill in (vote page, not just landing). -->
| Category | Score |
|----------|-------|
| Performance | (pending on deployed site) |
| Accessibility | 100 |
| Best Practices | (pending on deployed site) |
| SEO | (pending on deployed site) |

### Strengths

The server-enforced state machine is small and boring; the reveal treats 7 votes as a real event; the one-tap demo (guest dashboard, templates, run-again) removes every reason to bounce on first visit.

### Areas for Improvement

A components tidy pass on long tailwind class strings; real device testing at 320px; Lighthouse on the deployed vote page; SSE push; a small grace window for vote changes with a public marker.

---

## Known Limitations

- **Vercel deploy done** — live at [tiebreak-roan.vercel.app](https://tiebreak-roan.vercel.app); project name `tiebreak` (`tiebreak.vercel.app` was already taken), Supabase Postgres schema `tiebreak`, env vars `DATABASE_URL` + `APP_URL` set on the host.
- **5s polling** rather than push — live but not sub-second; jitter-free but not realtime-sporting.
- **Voter identity is `localStorage`** — clearing site data loses the token (votes already cast stay safe server-side), so a "change my pick" flow would need emailless recovery.
- **One creator per poll; no multi-admin voting groups** beyond the creator account.
- **Dark mode deliberately not built** (brand decision, documented above).
- **No option formatting** — options are plain text; no emoji-only or image options.
- **N+1 dashboard counts** are accepted at demo scale; the poll page uses single-query aggregation.
- **Sudden death is creator-triggered**, never automatic at the deadline.

---

## Running Locally

```bash
# Clone the repo
git clone [your-repo-url]
cd poll-creator-app

# Install dependencies (pnpm)
pnpm install

# Set up environment variables
cp .env.example .env
# PostgreSQL (Supabase) — see .env.example / Deploying below

# Create the DB schema and seed the demo dataset (Morgan + 5 polls/32 votes)
pnpm db:setup

# Run the development server
pnpm dev
```

### Environment Variables

| Variable | Description |
|----------|------------|
| `DATABASE_URL` | `postgresql://…` connection string. Supabase pooler port `5432`, no URL-encoding of the password, project reported here: e.g. `postgresql://postgres.<project-ref>:<password>@aws-1-us-west-2.pooler.supabase.com:5432/postgres`. All tables live in the dedicated `tiebreak` schema (see `prisma/schema.prisma`). |
| `APP_URL` | Public origin used for share links and OG share cards (`http://localhost:3000` locally, your deployed origin once live) |

`pnpm db:setup` = `prisma generate && prisma db push --force-reset && tsx prisma/seed.ts`. `pnpm db:seed` re-runs only the seed.

### Deploying (Vercel + Supabase)

1. **Supabase:** create a project, open **Project Settings → Database → Connection Strings**, copy the **Session pooler** string with the password **as-is** (no URL-encoding, no brackets) and port `5432`.
2. Set `DATABASE_URL` in your local `.env`, run `pnpm db:setup` once to create the `tiebreak` schema and seed the demo data.
3. **Vercel:** deploy the app and set the env vars on the project — `DATABASE_URL` (same string) plus `APP_URL` = your deployed origin (required for share links and OG cards).
4. First run reads no files at runtime: the sample dataset is bundled (`src/lib/sample-data.ts` imports `data/sample-polls.json`), so the "Reload sample data" menu entry works from the serverless edge too.

---

## Acknowledgments

Built as a [Frontend Mentor Product Challenge](https://www.frontendmentor.io). Sample poll data provided in the challenge starter; avatars by [DiceBear](https://www.dicebear.com) (micah style).
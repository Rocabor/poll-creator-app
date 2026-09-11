import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Brand tokens (see guidance/brand-kit.md) mirrored for the rasterized card.
const CREAM = "#faf2e3";
const COCOA = "#3b2c1e";
const COCOA_FADE = "rgba(59, 44, 30, 0.55)";
const TANGERINE = "#ef6c3c";
const TEAL = "#1f7a70";

interface FontAsset {
  name: "gabarito-bold" | "gabarito-medium" | "sans-serif";
  ext: "woff2" | "ttf" | "none";
  data?: ArrayBuffer;
}

async function gabarito(weight: string): Promise<FontAsset | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Gabarito:wght@${weight}&display=swap`,
      {
        headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        next: { revalidate: 86400 },
      }
    ).then((r) => r.text());
    const matches = css.match(/https:\/\/[^)]+\.(woff2|ttf)/g);
    if (!matches || matches.length === 0) return null;
    const url = matches[matches.length - 1];
    const ext = url.endsWith(".ttf") ? "ttf" : "woff2";
    const data = await fetch(url, { next: { revalidate: 86400 } }).then((r) =>
      r.arrayBuffer()
    );
    return {
      name: weight === "700" ? "gabarito-bold" : "gabarito-medium",
      ext,
      data,
    };
  } catch {
    return null;
  }
}

function wrap(text: string, max = 46): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const poll = await prisma.poll.findUnique({
    where: { slug },
    include: {
      options: {
        include: { votes: { select: { voterToken: true } } },
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  const [bold, medium] = await Promise.all([gabarito("700"), gabarito("500")]);
  const fonts = [bold, medium]
    .filter((f): f is FontAsset => Boolean(f?.data))
    .map((f) => ({
      name: f.name as "gabarito-bold" | "gabarito-medium",
      data: f.data as ArrayBuffer,
      weight: (f.name === "gabarito-bold" ? 700 : 500) as 700 | 500,
      style: "normal" as const,
    }));
  const bodyFont = fonts.some((f) => f.weight === 700)
    ? "gabarito-bold"
    : "sans-serif";
  const subFont = fonts.some((f) => f.weight === 500)
    ? "gabarito-medium"
    : "sans-serif";

  if (!poll) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: CREAM,
            color: COCOA,
            fontSize: 72,
            fontFamily: bodyFont,
          }}
        >
          tiebreak
        </div>
      ),
      { width: 1200, height: 630, fonts }
    );
  }

  const status = poll.status; // open | settled
  const tallies = poll.options.map((o) => ({
    label: o.label,
    votesCount: o.votes.length,
  }));
  const totalVotes = tallies.reduce((n, o) => n + o.votesCount, 0);
  const uniqueVoters = new Set(
    poll.options.flatMap((o) => o.votes.map((v) => v.voterToken))
  ).size;

  const best = Math.max(...tallies.map((o) => o.votesCount));
  const leaders = tallies.filter((o) => o.votesCount === best && best > 0);
  const winner =
    status === "settled"
      ? leaders.length === 1
        ? `“${leaders[0].label}” won`
        : `${leaders.length}-way tie`
      : null;
  const bars =
    status === "settled"
      ? leaders.slice(0, 3)
      : tallies.filter((o) => o.votesCount === best && best > 0).slice(0, 3);

  const [statusText, statusColor] =
    status === "open"
      ? ["Open for votes", TEAL]
      : ["Poll closed", TANGERINE];

  const lines = wrap(poll.title);
  const leadingIsTied = bars.length > 1;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: CREAM,
          color: COCOA,
          fontFamily: bodyFont,
          padding: "72px 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -170,
            right: -170,
            width: 440,
            height: 440,
            borderRadius: 9999,
            backgroundColor: "rgba(239, 108, 60, 0.35)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -130,
            left: -130,
            width: 340,
            height: 340,
            borderRadius: 9999,
            backgroundColor: "rgba(246, 224, 164, 0.9)",
          }}
        />

<div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                flexDirection: "row",
                gap: 8,
                fontSize: 40,
                fontWeight: 700,
              }}
            >
              <span>tiebreak</span>
              <span
                style={{
                  display: "flex",
                  width: 14,
                  height: 14,
                  borderRadius: 9999,
                  backgroundColor: TANGERINE,
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                flexDirection: "row",
                gap: 12,
                borderRadius: 9999,
                border: `3px solid ${statusColor}`,
                color: statusColor,
                fontWeight: 500,
                fontSize: 26,
                padding: "10px 22px",
                fontFamily: subFont,
              }}
            >
              <span
                style={{
                  display: "flex",
                  width: 18,
                  height: 18,
                  borderRadius: 9999,
                  backgroundColor: statusColor,
                }}
              />
              <span>{statusText}</span>
            </div>
          </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 30,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 66,
              lineHeight: 1.12,
              fontWeight: 700,
            }}
          >
            {lines.map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              flexDirection: "row",
              gap: 22,
              fontWeight: 500,
              fontSize: 28,
              color: COCOA_FADE,
              fontFamily: subFont,
            }}
          >
            {winner ? (
              <span style={{ color: TANGERINE, fontWeight: 700, fontSize: 32 }}>
                {winner}
              </span>
            ) : null}
            <span>
              {totalVotes} vote{totalVotes === 1 ? "" : "s"}
            </span>
            <span style={{ opacity: 0.6 }}>
              · {uniqueVoters} person{uniqueVoters === 1 ? "" : "s"}
            </span>
          </div>

          {bars.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "82%" }}>
              {bars.map((b) => {
                const pctL = Math.max(8, Math.round((Math.max(1, b.votesCount) / Math.max(1, best)) * 100));
                return (
                  <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 18 }}>
                    <div
                      style={{
                        display: "flex",
                        width: Math.max(180, pctL * 3.4),
                        height: 26,
                        borderRadius: 9999,
                        backgroundColor: "rgba(59, 44, 30, 0.14)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          width: "100%",
                          height: "100%",
                          borderRadius: 9999,
                          backgroundColor: status === "settled" && !leadingIsTied ? TANGERINE : TEAL,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 500,
                        color: COCOA,
                        maxWidth: 420,
                        fontFamily: subFont,
                      }}
                    >
                      {b.label}
                    </span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: COCOA_FADE }}>
                      {b.votesCount}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            position: "relative",
            fontWeight: 500,
            fontSize: 24,
            color: COCOA_FADE,
            fontFamily: subFont,
          }}
        >
          <span>Group votes that live in the chat.</span>
          <span
            style={{
              padding: "12px 26px",
              borderRadius: 9999,
              backgroundColor: TEAL,
              color: CREAM,
              fontWeight: 700,
            }}
          >
            Vote — no account needed
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts }
  );
}
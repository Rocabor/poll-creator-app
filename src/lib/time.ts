const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function relativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = date.getTime() - now.getTime();
  const abs = Math.abs(diffMs);
  const minutes = Math.round(diffMs / 60_000);

  if (abs < 60_000) return "just now";

  if (abs < 3_600_000) return rtf.format(minutes, "minute");
  if (abs < 86_400_000) return rtf.format(Math.round(minutes / 60), "hour");
  if (abs < 7 * 86_400_000) return rtf.format(Math.round(diffMs / 86_400_000), "day");

  return date.toLocaleDateString("en", { month: "short", day: "numeric" });
}

/** "5 min", "3 h 10", "2 d" — compact close-time for chips. */
export function closesInCompact(closesAt: Date, now: Date = new Date()): string {
  const diffMs = closesAt.getTime() - now.getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60_000));

  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const rest = minutes % 60;
    return rest > 0 ? `${hours} h ${rest}` : `${hours} h`;
  }
  return `${Math.floor(hours / 24)} d`;
}
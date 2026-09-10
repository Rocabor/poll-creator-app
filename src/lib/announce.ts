/**
 * Announce a short message to assistive tech via the single polite live region
 * that lives in the root layout. Same-text-on-update is suppressed so repeated
 * announcements always re-trigger.
 */
export function announce(message: string): void {
  if (typeof document === "undefined") return;
  const region = document.getElementById("live-region");
  if (!region) return;

  const node = document.createElement("span");
  node.dataset.announcement = "true";
  node.textContent = message;
  region.append(node);

  // The hidden live region gets cleared by the announce-root component.
  window.setTimeout(() => node.remove(), 3000);
}
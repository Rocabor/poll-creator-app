import type { AvatarData } from "@/lib/types";

/** DiceBear "micah" avatar URL with one of the four brand profile tints. */
export function avatarUrl(seed: string, tint: string): string {
  return `https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(
    seed
  )}&backgroundColor=${encodeURIComponent(tint)}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const AVATAR_TINTS = [
  "f8c9b9",
  "cbe2d8",
  "f6e0a4",
  "e3d2f2",
] as const;

export function pickTint(seed: string): (typeof AVATAR_TINTS)[number] {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return AVATAR_TINTS[Math.abs(hash) % AVATAR_TINTS.length];
}

export function fromAvatarData(data: AvatarData): AvatarData {
  return { seed: data.seed, tint: data.tint };
}
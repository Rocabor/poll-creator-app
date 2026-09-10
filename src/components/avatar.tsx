"use client";

import { useState } from "react";
import { avatarUrl, initials } from "@/lib/avatars";

interface AvatarProps {
  name: string;
  seed: string;
  tint: string;
  size?: number;
  className?: string;
}

/** DiceBear micah avatar with an initials-circle fallback (resilience: never
 * breaks if the avatar CDN is unreachable). Decorative → alt="" by intent;
 * pass a labelled context in surrounding text. */
export default function Avatar({
  name,
  seed,
  tint,
  size = 32,
  className = "",
}: AvatarProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !seed) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex shrink-0 select-none items-center justify-center rounded-full border-2 border-cocoa font-display font-bold text-cocoa ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: `#${tint}`,
          fontSize: size * 0.4,
        }}
      >
        {initials(name) || "?"}
      </span>
    );
  }

  return (
    <img
      src={avatarUrl(seed, tint)}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`inline-block shrink-0 rounded-full border-2 border-cocoa ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
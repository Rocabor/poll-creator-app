"use client";

import { useEffect, useState } from "react";
import { fetchPoll } from "@/lib/poll-api";
import EndVotingButton from "@/components/vote/end-voting-button";
import ShareCardButton from "@/components/share-card";
import type { PollView } from "@/lib/types";

/**
 * Creator-only header actions (end early + share card). The poll page is
 * cached (ISR) as the anonymous visitor view, so membership is re-checked on
 * the client: one lightweight session-bearing poll fetch reveals these if the
 * viewer is the poll's creator. Hidden from everyone who isn't.
 */
export default function CreatorActions({
  poll,
  url,
}: {
  poll: PollView;
  url: string;
}) {
  const [isMine, setIsMine] = useState(false);

  useEffect(() => {
    let active = true;
    let attempts = 0;
    const tick = async () => {
      const res = await fetchPoll(poll.slug, null);
      if (!active) return;
      if (res?.poll.isMine) {
        setIsMine(true);
        return;
      }
      // A session read may race the nav's cookie; retry a few times before
      // settling on the anonymous view (hidden by default for non-creators).
      if (attempts++ < 4) setTimeout(tick, 800);
    };
    tick();
    return () => {
      active = false;
    };
  }, [poll.slug]);

  if (!isMine) return null;

  return (
    <div className="flex items-center gap-2">
      {poll.status === "open" && <EndVotingButton slug={poll.slug} />}
      <ShareCardButton poll={poll} url={url} label="Share card" />
    </div>
  );
}
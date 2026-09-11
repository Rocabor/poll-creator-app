"use client";

import { useEffect, useRef, useState } from "react";
import { fetchPoll, type PollApiResponse } from "@/lib/poll-api";

/** Polls the poll API for live results. If a voter token is held, myVotes on
 * the response tells this device what's already locked in by that token. */
export function usePoll(slug: string, token: string | null, intervalMs = 7000) {
  const [data, setData] = useState<PollApiResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const result = await fetchPoll(slug, token);
      if (!active) return;
      if (result) {
        setData(result);
        setFailed(false);
      } else {
        setFailed(true);
      }
    };

    load();
    timer.current = setInterval(load, intervalMs);

    return () => {
      active = false;
      if (timer.current) clearInterval(timer.current);
    };
  }, [slug, token, intervalMs]);

  return { data, failed };
}
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { VideoStatus } from "@/lib/db/types";

export type VideoStatusPayload = {
  id: string;
  status: VideoStatus;
  errorCode: string | null;
  errorMessage: string | null;
  submittedAt: string | null;
  createdAt: string;
  completedAt: string | null;
  archived: boolean;
};

const ACTIVE: ReadonlySet<VideoStatus> = new Set(["draft", "queued", "processing"]);

/**
 * Polls GET /api/videos/:id while a generation is active: every 5 s for the
 * first minute, then every 10 s. The server throttles Kling calls itself.
 * When the status becomes final, the page's server data is refreshed.
 */
export function useVideoStatus(initial: VideoStatusPayload, needsRefresh = false): VideoStatusPayload {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const started = useRef(0);
  const shouldPoll = ACTIVE.has(initial.status) || needsRefresh;

  useEffect(() => {
    if (!shouldPoll) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    started.current = Date.now();
    const tick = async () => {
      try {
        const res = await fetch(`/api/videos/${initial.id}`, { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as VideoStatusPayload;
          setState(data);
          if (!ACTIVE.has(data.status) && (data.archived || data.status === "failed")) {
            router.refresh();
            return;
          }
          // Succeeded but not yet archived: stop waiting after 5 minutes (the cron keeps retrying).
          if (!ACTIVE.has(data.status) && Date.now() - started.current > 5 * 60_000) return;
        }
      } catch {
        // transient network error: keep polling
      }
      if (stopped) return;
      const delay = Date.now() - started.current > 60_000 ? 10_000 : 5_000;
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, 2_000);
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [initial.id, shouldPoll, router]);

  return state;
}

export function useElapsed(fromIso: string, active: boolean): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  const total = Math.max(0, Math.floor((now - new Date(fromIso).getTime()) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

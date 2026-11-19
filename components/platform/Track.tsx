"use client";

import Link from "next/link";
import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

/** Zabeleži ogled (npr. strani izdelka) ob prikazu. */
export function TrackView({ event, id }: { event: AnalyticsEvent; id: string | number }) {
  useEffect(() => {
    track(event, { id: String(id) });
  }, [event, id]);
  return null;
}

/** Povezava, ki ob kliku zabeleži dogodek. */
export function TrackedLink({
  event,
  data,
  ...props
}: ComponentProps<typeof Link> & { event: AnalyticsEvent; data?: Record<string, string | number> }) {
  return <Link {...props} onClick={() => track(event, data)} />;
}

/** Zabeleži poljuben dogodek ob prikazu. */
export function TrackEvent({ event, data }: { event: AnalyticsEvent; data?: Record<string, string | number> }) {
  const key = JSON.stringify(data ?? {});
  useEffect(() => {
    track(event, JSON.parse(key) as Record<string, string | number>);
  }, [event, key]);
  return null;
}

/** Zabeleži klik na katero koli povezavo znotraj območja (npr. izdelki v vodiču). */
export function TrackClicks({
  event,
  data,
  children,
  className,
}: {
  event: AnalyticsEvent;
  data?: Record<string, string | number>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      onClickCapture={(e) => {
        const link = (e.target as HTMLElement).closest("a");
        if (link) track(event, { ...data, cilj: link.getAttribute("href") ?? "" });
      }}
    >
      {children}
    </div>
  );
}

/** Zabeleži, ko bralec pride do konca vodiča (enkrat na ogled strani). */
export function ReadComplete({ id }: { id: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        track("vodic_prebran", { vodic: id });
        observer.disconnect();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [id]);
  return <div ref={ref} aria-hidden="true" />;
}

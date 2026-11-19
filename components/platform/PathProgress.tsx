"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { track } from "@/lib/analytics";

export type PathStep = {
  key: string;
  href: string;
  title: string;
  kind: "Vodič" | "Video";
  meta: string;
  note?: string | null;
};

/**
 * Koraki učne poti z označevanjem opravljenih korakov.
 * Napredek je shranjen samo v tem brskalniku (localStorage), brez računa.
 */
const PREFIX = "gc-pot-";
const EVENT = "gc:pot";
const EMPTY: string[] = [];
const cache = new Map<string, { raw: string | null; done: string[] }>();

function read(pathId: number): string[] {
  const key = PREFIX + pathId;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return EMPTY;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.done;
  let done: string[] = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) done = parsed.filter((x): x is string => typeof x === "string").slice(0, 200);
  } catch {
    done = EMPTY;
  }
  cache.set(key, { raw, done });
  return done;
}

function write(pathId: number, done: string[]) {
  try {
    window.localStorage.setItem(PREFIX + pathId, JSON.stringify(done));
  } catch {
    // Brez shrambe napredek ni zapomnjen; stran deluje naprej.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function PathProgress({ pathId, steps }: { pathId: number; steps: PathStep[] }) {
  const done = useSyncExternalStore(
    subscribe,
    () => read(pathId),
    () => EMPTY,
  );
  const completed = steps.filter((s) => done.includes(s.key)).length;
  const percent = steps.length ? Math.round((completed / steps.length) * 100) : 0;

  function toggle(step: PathStep, index: number) {
    const isDone = done.includes(step.key);
    const next = isDone ? done.filter((k) => k !== step.key) : [...done, step.key];
    write(pathId, next);
    if (!isDone) track("korak_poti_opravljen", { pot: pathId, korak: index + 1 });
  }

  return (
    <div>
      <div className="rounded-2xl border border-sand-200 bg-paper-raised p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="font-semibold">Tvoj napredek</span>
          <span role="status" className="tabular-nums text-ink-muted">
            {completed} od {steps.length} korakov
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-sand-100" aria-hidden="true">
          <div className="h-full rounded-full bg-olive transition-[width]" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-xs text-ink-muted">Napredek se shrani samo v tem brskalniku.</p>
      </div>

      <ol className="mt-6 space-y-3">
        {steps.map((step, index) => {
          const isDone = done.includes(step.key);
          const id = `korak-${index + 1}`;
          return (
            <li
              key={step.key}
              className={`flex gap-4 rounded-2xl border p-4 sm:p-5 ${isDone ? "border-[#c9d4ad] bg-success-bg" : "border-sand-200 bg-paper-raised"}`}
            >
              <span
                aria-hidden="true"
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold tabular-nums ${isDone ? "bg-success text-paper" : "bg-sand-100 text-ink"}`}
              >
                {isDone ? "✓" : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-olive">
                  Korak {index + 1} · {step.kind}
                </p>
                <h2 id={id} className="mt-1 text-lg font-semibold leading-snug">
                  <Link href={step.href} className="hover:underline">
                    {step.title}
                  </Link>
                </h2>
                {step.meta ? <p className="mt-1 text-sm text-ink-muted">{step.meta}</p> : null}
                {step.note ? <p className="mt-2 text-[0.9375rem] leading-relaxed">{step.note}</p> : null}
                <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 text-[0.9375rem] font-medium">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-[var(--color-olive)]"
                    checked={isDone}
                    onChange={() => toggle(step, index)}
                    aria-describedby={id}
                  />
                  Opravljeno
                </label>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

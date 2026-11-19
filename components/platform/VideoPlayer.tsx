"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

type Props =
  | { kind: "youtube"; youtubeId: string; title: string; posterUrl?: string | null; videoId: number }
  | {
      kind: "file";
      src: string;
      mimeType?: string | null;
      title: string;
      posterUrl?: string | null;
      captionsUrl?: string | null;
      videoId: number;
    };

/**
 * Predvajalnik videa.
 * - YouTube: predvajalnik (youtube-nocookie.com) se naloži šele ob kliku,
 *   zato do klika ni zahtev do YouTuba in ne piškotkov.
 * - Naložena datoteka: izvorni predvajalnik s podnapisi (VTT), če obstajajo.
 */
export function VideoPlayer(props: Props) {
  const [active, setActive] = useState(false);

  if (props.kind === "file") {
    return (
      <video
        controls
        preload="metadata"
        poster={props.posterUrl ?? undefined}
        className="aspect-video w-full rounded-2xl bg-ink"
        onPlay={() => track("video_predvajanje", { video: props.videoId, vir: "datoteka" })}
      >
        <source src={props.src} type={props.mimeType ?? "video/mp4"} />
        {props.captionsUrl ? (
          <track kind="captions" src={props.captionsUrl} srcLang="sl" label="Slovenščina" default />
        ) : null}
        Tvoj brskalnik ne podpira predvajanja videa.
      </video>
    );
  }

  if (active) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-ink">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${props.youtubeId}?autoplay=1&rel=0`}
          title={props.title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-olive-deep">
      {props.posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- naslovna slika iz urejevalnika
        <img src={props.posterUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
      ) : null}
      <button
        type="button"
        onClick={() => {
          setActive(true);
          track("video_predvajanje", { video: props.videoId, vir: "youtube" });
        }}
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-paper"
      >
        <span className="grid h-16 w-16 place-items-center rounded-full bg-action text-2xl shadow-lg" aria-hidden="true">
          ▶
        </span>
        <span className="rounded-full bg-ink/70 px-3 py-1 text-sm font-semibold">Predvajaj video: {props.title}</span>
      </button>
      <p className="absolute bottom-2 left-3 right-3 text-center text-xs text-paper/90">
        Video se predvaja z YouTuba (način brez piškotkov). Ob kliku se poveže z YouTubom.
      </p>
    </div>
  );
}

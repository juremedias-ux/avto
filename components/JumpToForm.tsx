"use client";

import type { MouseEvent, ReactNode } from "react";

type JumpToFormProps = {
  /** ID odseka z obrazcem (cilj povezave tudi brez JavaScripta). */
  targetId: string;
  /** ID polja za e-pošto, ki prejme fokus. */
  inputId: string;
  className?: string;
  children: ReactNode;
};

/**
 * Povezava do prvega obrazca: pomakne stran do obrazca (gladko samo, če
 * uporabnik ni izbral zmanjšanega gibanja) in postavi fokus v polje za
 * e-pošto. Brez JavaScripta (ali na drugih straneh) deluje kot navadna
 * povezava na odsek začetne strani.
 */
export function JumpToForm({ targetId, inputId, className, children }: JumpToFormProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const target = document.getElementById(targetId);
    if (!target) return;
    event.preventDefault();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });

    const input = document.getElementById(inputId);
    const focusTarget =
      input ?? target.querySelector<HTMLElement>("[role='status'], [tabindex='-1']");
    focusTarget?.focus({ preventScroll: true });

    window.history.replaceState(null, "", `#${targetId}`);
  }

  return (
    <a href={`/#${targetId}`} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}

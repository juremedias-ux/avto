"use client";

import { useState } from "react";

type Result = { ustvarjeno: string[]; preskoceno: string[]; opozorila: string[] };

/**
 * Gumb na nadzorni plošči urejevalnika: ustvari vzorčne vsebine
 * (faze, teme, kategorije, članek, video, učno pot, 3 vzorčne izdelke).
 */
export function SeedButton() {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [result, setResult] = useState<Result | null>(null);

  async function run() {
    if (!window.confirm("Ustvarim vzorčne vsebine? Obstoječih vnosov z istim URL-jem ne spremenim.")) return;
    setState("busy");
    try {
      const response = await fetch("/api/vzorcne-vsebine", { method: "POST", credentials: "include" });
      if (!response.ok) throw new Error(String(response.status));
      setResult((await response.json()) as Result);
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <div style={{ marginBottom: "2rem", padding: "1.25rem", border: "1px solid var(--theme-elevation-150)", borderRadius: 8 }}>
      <h2 style={{ margin: 0, fontSize: "1.125rem" }}>Vzorčne vsebine</h2>
      <p style={{ margin: "0.5rem 0 1rem", maxWidth: "48rem" }}>
        Za prikaz platforme ustvari faze gradnje, teme, tri kategorije, vzorčni članek, video lekcijo, učno pot in tri
        vzorčne izdelke. Vse so označene kot vzorec in jih lahko kasneje urediš ali izbrišeš.
      </p>
      <button type="button" className="btn btn--style-primary btn--size-medium" onClick={run} disabled={state === "busy"}>
        {state === "busy" ? "Ustvarjam …" : "Ustvari vzorčne vsebine"}
      </button>
      {state === "error" ? <p role="alert">Ustvarjanje ni uspelo. Poskusi znova.</p> : null}
      {state === "done" && result ? (
        <div role="status" style={{ marginTop: "1rem" }}>
          <p>
            Ustvarjeno: {result.ustvarjeno.length}. Preskočeno (že obstaja): {result.preskoceno.length}.
          </p>
          {result.opozorila.length ? (
            <ul>
              {result.opozorila.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

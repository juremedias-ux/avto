import type { ReactNode } from "react";
import { PlatformFooter } from "@/components/platform/PlatformFooter";
import { PlatformHeader } from "@/components/platform/PlatformHeader";
import { PreviewBanner } from "@/components/platform/ui";

/** Ogrodje strani platforme: predogled, glava, vsebina, noga. */
export function PlatformShell({ preview, children }: { preview: boolean; children: ReactNode }) {
  return (
    <>
      {preview ? <PreviewBanner /> : null}
      <PlatformHeader />
      <main id="vsebina" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <PlatformFooter />
    </>
  );
}

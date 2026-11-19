import type { Metadata } from "next";
import { isPlatformPublic } from "@/cms/access";
import { LandingPage } from "@/components/landing/LandingPage";
import { PlatformHome } from "@/components/platform/PlatformHome";
import { getViewer } from "@/lib/cms";
import { isCmsConfigured } from "@/lib/cms-env";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

/** Ko je platforma javna, ima domača stran svoje metapodatke; sicer veljajo metapodatki strani za prijavo. */
export function generateMetadata(): Metadata {
  if (!isPlatformPublic() || !isCmsConfigured()) return {};
  const title = "GradimoCamper – vodiči in oprema za predelavo kombija v camper";
  return {
    ...pageMetadata({
      title,
      description:
        "Slovenska platforma za domačo predelavo kombija: vodiči, video lekcije in učne poti po fazah gradnje ter oprema s povezavo na vodiče.",
      path: "/",
    }),
    title: { absolute: title },
  };
}

export default async function HomePage() {
  const viewer = await getViewer();
  if (viewer) return <PlatformHome viewer={viewer} />;
  return <LandingPage />;
}

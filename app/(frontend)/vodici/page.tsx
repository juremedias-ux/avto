import Link from "next/link";
import { PathCard } from "@/components/platform/cards";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { EmptyState, PageIntro, SectionHeading } from "@/components/platform/ui";
import { queryOptions, requireViewer } from "@/lib/cms";
import { routes } from "@/lib/platform";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Vodiči gradnje",
  description: "Učne poti in načrt gradnje: predelava kombija v camper po fazah, od načrtovanja do končne opreme.",
  path: routes.guides,
});

export default async function GuidesPage() {
  const viewer = await requireViewer();
  const q = queryOptions(viewer);
  const [paths, stages] = await Promise.all([
    viewer.payload.find({ collection: "ucne-poti", ...q, sort: "-izpostavljena", limit: 50, depth: 0 }),
    viewer.payload.find({ collection: "faze", ...q, sort: "stevilka", limit: 50, depth: 0 }),
  ]);

  return (
    <PlatformShell preview={viewer.preview}>
      <PageIntro
        crumbs={[{ label: "Vodiči gradnje" }]}
        title="Vodiči gradnje"
        lead="Učne poti te vodijo korak za korakom. Načrt gradnje pokaže celotno predelavo po fazah in kaj potrebuješ v vsaki."
      />

      <section aria-labelledby="poti" className="container-page pb-12">
        <SectionHeading id="poti" title="Učne poti" />
        {paths.docs.length ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {paths.docs.map((path) => (
              <PathCard key={path.id} path={path} />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState>Učne poti so v pripravi.</EmptyState>
          </div>
        )}
      </section>

      <section aria-labelledby="faze" className="container-page pb-16">
        <SectionHeading id="faze" title="Načrt gradnje po fazah" action={{ href: routes.roadmap, label: "Odpri načrt gradnje" }} />
        {stages.docs.length ? (
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stages.docs.map((stage) => (
              <li key={stage.id} className="rounded-2xl border border-sand-200 bg-paper-raised p-5">
                <span className="text-sm font-semibold tabular-nums text-olive">Faza {stage.stevilka}</span>
                <h3 className="mt-1 text-lg font-semibold leading-snug">
                  <Link href={`${routes.roadmap}#faza-${stage.stevilka}`} className="hover:underline">
                    {stage.naziv}
                  </Link>
                </h3>
                <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink-muted">{stage.kratekOpis}</p>
              </li>
            ))}
          </ol>
        ) : (
          <div className="mt-6">
            <EmptyState>Faze gradnje še niso vnesene.</EmptyState>
          </div>
        )}
      </section>
    </PlatformShell>
  );
}

import Link from "next/link";
import type { Where } from "payload";
import { ContentCard, PathCard } from "@/components/platform/cards";
import { FilterBar, param } from "@/components/platform/FilterBar";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { EmptyState, PageIntro, SectionHeading } from "@/components/platform/ui";
import { listContent, queryOptions, requireViewer } from "@/lib/cms";
import { difficultyLabel, routes } from "@/lib/platform";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Središče znanja",
  description:
    "Vodiči, video lekcije in učne poti za domačo predelavo kombija v camper, razvrščeni po fazah gradnje in temah.",
  path: routes.learn,
});

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LearnPage({ searchParams }: Props) {
  const viewer = await requireViewer();
  const params = await searchParams;
  const q = queryOptions(viewer);

  const [stages, topics, paths] = await Promise.all([
    viewer.payload.find({ collection: "faze", ...q, sort: "stevilka", limit: 50, depth: 0 }),
    viewer.payload.find({ collection: "teme", ...q, sort: "naziv", limit: 100, depth: 0 }),
    viewer.payload.find({ collection: "ucne-poti", ...q, sort: "-izpostavljena", limit: 6, depth: 0 }),
  ]);

  const stage = stages.docs.find((s) => String(s.stevilka) === param(params, "faza"));
  const topic = topics.docs.find((t) => t.slug === param(params, "tema"));
  const difficultyValue = param(params, "zahtevnost");
  const difficulty = difficultyValue && difficultyValue in difficultyLabel ? difficultyValue : undefined;
  const kindValue = param(params, "vrsta");
  const kind = kindValue === "clanki" ? "clanek" : kindValue === "videi" ? "video" : undefined;

  const conditions: Where[] = [];
  if (stage) conditions.push({ faza: { equals: stage.id } });
  if (topic) conditions.push({ teme: { in: [topic.id] } });
  if (difficulty) conditions.push({ zahtevnost: { equals: difficulty } });

  const items = await listContent(viewer, {
    where: conditions.length ? { and: conditions } : undefined,
    kinds: kind ? [kind] : undefined,
  });

  return (
    <PlatformShell preview={viewer.preview}>
      <PageIntro
        crumbs={[{ label: "Učenje" }]}
        title="Središče znanja"
        lead="Razlage, video lekcije in učne poti za vsako fazo predelave. Začni z učno potjo ali poišči temo, ki te zanima."
      />

      {paths.docs.length ? (
        <section aria-labelledby="ucne-poti" className="container-page pb-12">
          <SectionHeading id="ucne-poti" eyebrow="Po korakih" title="Učne poti" action={{ href: routes.guides, label: "Vse učne poti" }} />
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {paths.docs.map((path) => (
              <PathCard key={path.id} path={path} />
            ))}
          </div>
        </section>
      ) : null}

      {topics.docs.length ? (
        <section aria-labelledby="teme" className="container-page pb-12">
          <h2 id="teme" className="text-xl font-semibold">
            Teme
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {topics.docs.map((t) => (
              <li key={t.id}>
                <Link
                  href={routes.topic(t.slug ?? "")}
                  className="inline-flex min-h-11 items-center rounded-full border border-sand-300 bg-paper-raised px-4 text-[0.9375rem] font-medium hover:border-ink"
                >
                  {t.naziv}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="vse-vsebine" className="container-page pb-16">
        <h2 id="vse-vsebine" className="display-3">
          Vse vsebine
        </h2>
        <div className="mt-5">
          <FilterBar
            action={routes.learn}
            count={items.length}
            filters={[
              {
                name: "faza",
                label: "Faza gradnje",
                value: stage ? String(stage.stevilka) : undefined,
                options: stages.docs.map((s) => ({ value: String(s.stevilka), label: `${s.stevilka}. ${s.naziv}` })),
              },
              {
                name: "tema",
                label: "Tema",
                value: topic?.slug ?? undefined,
                options: topics.docs.map((t) => ({ value: t.slug ?? "", label: t.naziv })),
              },
              {
                name: "zahtevnost",
                label: "Zahtevnost",
                value: difficulty,
                options: Object.entries(difficultyLabel).map(([value, label]) => ({ value, label })),
              },
              {
                name: "vrsta",
                label: "Vrsta",
                value: kind ? kindValue : undefined,
                options: [
                  { value: "clanki", label: "Pisni vodiči" },
                  { value: "videi", label: "Video lekcije" },
                ],
              },
            ]}
          />
        </div>
        {items.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ContentCard key={`${item.kind}-${item.doc.id}`} item={item} />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState>Za izbrane filtre še ni vsebin. Poskusi z manj filtri.</EmptyState>
          </div>
        )}
      </section>
    </PlatformShell>
  );
}

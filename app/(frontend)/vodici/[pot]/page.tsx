import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PathProgress, type PathStep } from "@/components/platform/PathProgress";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { JsonLd, KindLabel, PageIntro, SampleNotice } from "@/components/platform/ui";
import { findBySlug, isDoc, requireViewer } from "@/lib/cms";
import { difficultyLabel, minutes, routes } from "@/lib/platform";
import { pageMetadata, seoOf } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";
import type { Clanki, Videi } from "@/payload-types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ pot: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pot } = await params;
  const path = await findBySlug("ucne-poti", pot);
  if (!path) return {};
  const seo = seoOf(path, `${path.naslov} – učna pot`, path.opis);
  return pageMetadata({ ...seo, path: routes.path(path.slug ?? pot) });
}

export default async function LearningPathPage({ params }: Props) {
  const viewer = await requireViewer();
  const { pot } = await params;
  const path = await findBySlug("ucne-poti", pot);
  if (!path) notFound();

  const steps: PathStep[] = (path.koraki ?? []).flatMap((step): PathStep[] => {
    const ref = step.vsebina;
    if (!ref || !isDoc<Clanki | Videi>(ref.value)) return [];
    if (ref.relationTo === "videi") {
      const v = ref.value as Videi;
      return [{
        key: `videi-${v.id}`,
        href: routes.video(v.slug ?? ""),
        title: v.naslov,
        kind: "Video" as const,
        meta: [minutes(v.trajanje), difficultyLabel[v.zahtevnost]].filter(Boolean).join(" · "),
        note: step.opomba,
      }];
    }
    const a = ref.value as Clanki;
    return [{
      key: `clanki-${a.id}`,
      href: routes.article(a.slug ?? ""),
      title: a.naslov,
      kind: "Vodič" as const,
      meta: [a.casBranja ? `${minutes(a.casBranja)} branja` : "", difficultyLabel[a.zahtevnost]].filter(Boolean).join(" · "),
      note: step.opomba,
    }];
  });

  const site = getSiteUrl();

  return (
    <PlatformShell preview={viewer.preview}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: path.naslov,
          description: path.opis,
          itemListOrder: "https://schema.org/ItemListOrderAscending",
          numberOfItems: steps.length,
          itemListElement: steps.map((step, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: step.title,
            url: new URL(step.href, site).toString(),
          })),
        }}
      />
      <PageIntro
        crumbs={[{ label: "Vodiči gradnje", href: routes.guides }, { label: path.naslov }]}
        eyebrow={<KindLabel kind="pot" />}
        title={path.naslov}
        lead={path.opis}
      >
        {path.zaKoga ? (
          <p className="mt-4 text-[0.9375rem]">
            <span className="font-semibold">Za koga: </span>
            <span className="text-ink-muted">{path.zaKoga}</span>
          </p>
        ) : null}
      </PageIntro>
      <section aria-label="Koraki učne poti" className="container-page pb-16">
        <div className="mx-auto max-w-3xl">
          {path.vzorec ? (
            <div className="mb-6">
              <SampleNotice kind="vsebina" />
            </div>
          ) : null}
          <PathProgress pathId={path.id} steps={steps} />
        </div>
      </section>
    </PlatformShell>
  );
}

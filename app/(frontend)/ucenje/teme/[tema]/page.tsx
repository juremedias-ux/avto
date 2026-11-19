import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentCard } from "@/components/platform/cards";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { EmptyState, JsonLd, PageIntro } from "@/components/platform/ui";
import { findBySlug, listContent, requireViewer } from "@/lib/cms";
import { routes } from "@/lib/platform";
import { pageMetadata } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ tema: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tema } = await params;
  const topic = await findBySlug("teme", tema, 0);
  if (!topic) return {};
  return pageMetadata({
    title: `${topic.naziv} – vodiči in videi`,
    description: topic.opis ?? `Vodiči in video lekcije na temo ${topic.naziv.toLowerCase()} pri predelavi kombija.`,
    path: routes.topic(topic.slug ?? tema),
  });
}

export default async function TopicPage({ params }: Props) {
  const viewer = await requireViewer();
  const { tema } = await params;
  const topic = await findBySlug("teme", tema, 0);
  if (!topic) notFound();

  const items = await listContent(viewer, { where: { teme: { in: [topic.id] } } });

  return (
    <PlatformShell preview={viewer.preview}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: topic.naziv,
          description: topic.opis ?? undefined,
          url: new URL(routes.topic(topic.slug ?? tema), getSiteUrl()).toString(),
          inLanguage: "sl",
        }}
      />
      <PageIntro
        crumbs={[{ label: "Učenje", href: routes.learn }, { label: topic.naziv }]}
        eyebrow={<span className="eyebrow">Tema</span>}
        title={topic.naziv}
        lead={topic.opis}
      />
      <section aria-label={`Vsebine: ${topic.naziv}`} className="container-page pb-16">
        {items.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ContentCard key={`${item.kind}-${item.doc.id}`} item={item} headingLevel={2} />
            ))}
          </div>
        ) : (
          <EmptyState>Vsebine za to temo so v pripravi.</EmptyState>
        )}
      </section>
    </PlatformShell>
  );
}

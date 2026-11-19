import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Downloads, KeyPoints, LessonMeta, LessonProducts, RelatedContent, SafetyNote } from "@/components/platform/LessonParts";
import { Media } from "@/components/platform/Media";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { RichText } from "@/components/platform/RichText";
import { ReadComplete } from "@/components/platform/Track";
import { Badge, formatDate, JsonLd, KindLabel, PageIntro, SampleNotice } from "@/components/platform/ui";
import { brand } from "@/content";
import { findBySlug, isDoc, requireViewer } from "@/lib/cms";
import { difficultyLabel, minutes, routes } from "@/lib/platform";
import { pageMetadata, seoOf } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";
import type { Faze, Mediji } from "@/payload-types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await findBySlug("clanki", slug);
  if (!article) return {};
  const seo = seoOf(article, article.naslov, article.povzetek);
  return pageMetadata({ ...seo, path: routes.article(article.slug ?? slug), image: article.naslovnaSlika, type: "article" });
}

export default async function ArticlePage({ params }: Props) {
  const viewer = await requireViewer();
  const { slug } = await params;
  const article = await findBySlug("clanki", slug);
  if (!article) notFound();

  const stage = isDoc<Faze>(article.faza) ? article.faza : null;
  const url = new URL(routes.article(article.slug ?? slug), getSiteUrl()).toString();
  const image = isDoc<Mediji>(article.naslovnaSlika) ? article.naslovnaSlika : null;

  return (
    <PlatformShell preview={viewer.preview}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.naslov,
          description: article.povzetek,
          inLanguage: "sl",
          datePublished: article.createdAt,
          dateModified: article.updatedAt,
          mainEntityOfPage: url,
          author: { "@type": "Organization", name: brand.name },
          publisher: { "@type": "Organization", name: brand.name },
          ...(image?.url ? { image: new URL(image.url, getSiteUrl()).toString() } : {}),
        }}
      />
      <article>
        <PageIntro
          crumbs={[
            { label: "Učenje", href: routes.learn },
            ...(stage ? [{ label: `Faza ${stage.stevilka}: ${stage.naziv}`, href: `${routes.learn}?faza=${stage.stevilka}` }] : []),
            { label: article.naslov },
          ]}
          eyebrow={
            <>
              <KindLabel kind="clanek" />
              <Badge>{difficultyLabel[article.zahtevnost]}</Badge>
              <Badge>{minutes(article.casBranja)} branja</Badge>
            </>
          }
          title={article.naslov}
          lead={article.povzetek}
        >
          <p className="mt-4 text-sm text-ink-muted">Posodobljeno {formatDate(article.updatedAt)}</p>
        </PageIntro>

        <div className="container-page pb-12">
          <div className="mx-auto max-w-3xl space-y-6">
            {article.vzorec ? <SampleNotice kind="vsebina" /> : null}
            {image ? (
              <figure>
                <Media media={image} priority sizes="(min-width: 768px) 768px, 100vw" className="h-auto w-full rounded-2xl" />
              </figure>
            ) : null}
            <LessonMeta faza={article.faza} teme={article.teme} />
            <KeyPoints items={article.kljucniPoudarki} />
            <SafetyNote text={article.varnostnaOpomba} />
            <RichText data={article.vsebina} />
            <Downloads files={article.kontrolniSeznami} />
            <ReadComplete id={article.id} />
          </div>
        </div>
      </article>
      <LessonProducts products={article.izdelki} lessonId={article.id} />
      <RelatedContent items={article.sorodno} />
    </PlatformShell>
  );
}

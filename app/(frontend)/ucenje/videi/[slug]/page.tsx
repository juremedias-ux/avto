import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Downloads, KeyPoints, LessonMeta, LessonProducts, RelatedContent, SafetyNote } from "@/components/platform/LessonParts";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { RichText } from "@/components/platform/RichText";
import { VideoPlayer } from "@/components/platform/VideoPlayer";
import { Badge, formatDate, JsonLd, KindLabel, PageIntro, SampleNotice } from "@/components/platform/ui";
import { brand } from "@/content";
import { findBySlug, isDoc, requireViewer } from "@/lib/cms";
import { difficultyLabel, minutes, routes } from "@/lib/platform";
import { pageMetadata, seoOf } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";
import { youtubeIdFromUrl } from "@/lib/youtube";
import type { Datoteke, Faze, Mediji, VideoDatoteke } from "@/payload-types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const video = await findBySlug("videi", slug);
  if (!video) return {};
  const seo = seoOf(video, video.naslov, video.povzetek);
  return pageMetadata({ ...seo, path: routes.video(video.slug ?? slug), image: video.poster });
}

/** Čas poglavja (npr. 4:30 ali 1:02:05) v sekunde; null, če ni veljaven. */
function chapterSeconds(value: string): number | null {
  const parts = value.trim().split(":").map(Number);
  if (parts.length < 2 || parts.length > 3 || parts.some((n) => !Number.isInteger(n) || n < 0)) return null;
  return parts.reduce((total, n) => total * 60 + n, 0);
}

export default async function VideoPage({ params }: Props) {
  const viewer = await requireViewer();
  const { slug } = await params;
  const video = await findBySlug("videi", slug);
  if (!video) notFound();

  const site = getSiteUrl();
  const stage = isDoc<Faze>(video.faza) ? video.faza : null;
  const poster = isDoc<Mediji>(video.poster) ? video.poster : null;
  const file = isDoc<VideoDatoteke>(video.datoteka) ? video.datoteka : null;
  const captions = isDoc<Datoteke>(video.podnapisi) ? video.podnapisi : null;
  const youtubeId = video.vir === "youtube" ? youtubeIdFromUrl(video.youtube ?? "") : null;
  const absolute = (u: string | null | undefined) => (u ? new URL(u, site).toString() : undefined);

  let player = null;
  if (youtubeId) {
    player = <VideoPlayer kind="youtube" youtubeId={youtubeId} title={video.naslov} posterUrl={poster?.url} videoId={video.id} />;
  } else if (video.vir === "datoteka" && file?.url) {
    player = (
      <VideoPlayer
        kind="file"
        src={file.url}
        mimeType={file.mimeType}
        title={video.naslov}
        posterUrl={poster?.url}
        captionsUrl={captions?.url}
        videoId={video.id}
      />
    );
  }

  return (
    <PlatformShell preview={viewer.preview}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: video.naslov,
          description: video.povzetek,
          inLanguage: "sl",
          uploadDate: video.createdAt,
          duration: `PT${Math.max(1, Math.round(video.trajanje))}M`,
          publisher: { "@type": "Organization", name: brand.name },
          ...(poster?.url ? { thumbnailUrl: absolute(poster.url) } : {}),
          ...(youtubeId ? { embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}` } : {}),
          ...(file?.url ? { contentUrl: absolute(file.url) } : {}),
        }}
      />
      <article>
        <PageIntro
          crumbs={[
            { label: "Učenje", href: routes.learn },
            ...(stage ? [{ label: `Faza ${stage.stevilka}: ${stage.naziv}`, href: `${routes.learn}?faza=${stage.stevilka}` }] : []),
            { label: video.naslov },
          ]}
          eyebrow={
            <>
              <KindLabel kind="video" />
              <Badge>{difficultyLabel[video.zahtevnost]}</Badge>
              <Badge>{minutes(video.trajanje)}</Badge>
            </>
          }
          title={video.naslov}
          lead={video.povzetek}
        >
          <p className="mt-4 text-sm text-ink-muted">Posodobljeno {formatDate(video.updatedAt)}</p>
        </PageIntro>

        <div className="container-page pb-12">
          <div className="mx-auto max-w-4xl">
            {video.vzorec ? (
              <div className="mb-6">
                <SampleNotice kind="vsebina" />
              </div>
            ) : null}
            {player ?? (
              <div className="grid aspect-video w-full place-items-center rounded-2xl bg-[#e9e7d6] px-6 text-center text-olive">
                <p className="font-semibold">Video je v pripravi. Spodaj je pisni povzetek lekcije.</p>
              </div>
            )}
          </div>
          <div className="mx-auto mt-8 max-w-3xl space-y-6">
            <LessonMeta faza={video.faza} teme={video.teme} />
            {video.poglavja?.length ? (
              <section aria-labelledby="poglavja">
                <h2 id="poglavja" className="text-xl font-semibold">
                  Poglavja
                </h2>
                <ol className="mt-3 divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-paper-raised">
                  {video.poglavja.map((chapter) => {
                    const seconds = chapterSeconds(chapter.cas);
                    return (
                      <li key={chapter.id ?? chapter.cas} className="flex gap-4 px-4 py-3">
                        <span className="w-16 shrink-0 font-semibold tabular-nums text-olive">
                          {youtubeId && seconds !== null ? (
                            <a
                              href={`https://www.youtube.com/watch?v=${youtubeId}&t=${seconds}s`}
                              className="hover:underline"
                              rel="noopener noreferrer"
                              target="_blank"
                              aria-label={`${chapter.cas} – odpri na YouTubu`}
                            >
                              {chapter.cas}
                            </a>
                          ) : (
                            chapter.cas
                          )}
                        </span>
                        <span>{chapter.naslov}</span>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ) : null}
            <KeyPoints items={video.kljucniPoudarki} />
            <SafetyNote text={video.varnostnaOpomba} />
            <RichText data={video.opis} />
            {video.prepis?.trim() ? (
              <details className="rounded-2xl border border-sand-200 bg-paper-raised p-4 sm:p-5">
                <summary className="cursor-pointer font-semibold">Prepis videa</summary>
                <div className="mt-3 whitespace-pre-line leading-relaxed text-ink-muted">{video.prepis}</div>
              </details>
            ) : null}
            <Downloads files={video.kontrolniSeznami} />
          </div>
        </div>
      </article>
      <LessonProducts products={video.izdelki} lessonId={video.id} />
      <RelatedContent items={video.sorodno} />
    </PlatformShell>
  );
}

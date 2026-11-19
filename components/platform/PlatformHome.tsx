import Image from "next/image";
import Link from "next/link";
import { images } from "@/content";
import { CategoryCard, ContentCard, PathCard } from "@/components/platform/cards";
import { Media } from "@/components/platform/Media";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { JsonLd, SectionHeading } from "@/components/platform/ui";
import { docs, isDoc, listContent, polyDocs, queryOptions, type ContentItem, type Viewer } from "@/lib/cms";
import { routes } from "@/lib/platform";
import { getSiteUrl } from "@/lib/site";
import type { Clanki, KategorijeIzdelkov, Videi } from "@/payload-types";

const DEFAULT_HERO = {
  oznaka: "Slovenska platforma za domačo predelavo kombija",
  naslov: "Zgradi svoj camper s praktičnimi vodiči in izbranimi izdelki.",
  podnaslov:
    "Od izbire kombija do zadnjega vijaka: razlage po fazah gradnje, video lekcije in oprema, ki jo potrebuješ za posamezen korak.",
};

export async function PlatformHome({ viewer }: { viewer: Viewer }) {
  const q = queryOptions(viewer);
  const [home, stages, paths, categories, latest] = await Promise.all([
    viewer.payload.findGlobal({ slug: "domaca-stran", ...q, depth: 2 }).catch(() => null),
    viewer.payload.find({ collection: "faze", ...q, sort: "stevilka", limit: 20 }),
    viewer.payload.find({ collection: "ucne-poti", ...q, where: { izpostavljena: { equals: true } }, limit: 3 }),
    viewer.payload.find({ collection: "kategorije-izdelkov", ...q, sort: "vrstniRed", limit: 6 }),
    listContent(viewer, { limit: 6 }),
  ]);

  const hero = {
    oznaka: home?.prviZaslon?.oznaka || DEFAULT_HERO.oznaka,
    naslov: home?.prviZaslon?.naslov || DEFAULT_HERO.naslov,
    podnaslov: home?.prviZaslon?.podnaslov || DEFAULT_HERO.podnaslov,
  };
  const featured: ContentItem[] = polyDocs<Clanki | Videi>(home?.izpostavljeniVodici).map(({ relationTo, doc }) =>
    relationTo === "videi" ? { kind: "video", doc: doc as Videi } : { kind: "clanek", doc: doc as Clanki },
  );
  const guides = featured.length ? featured : latest;
  const featuredCategories = docs<KategorijeIzdelkov>(home?.izpostavljeneKategorije);
  const shownCategories = featuredCategories.length ? featuredCategories : categories.docs;
  const startPath = paths.docs[0];
  const trust = home?.zaupanje ?? [];

  return (
    <PlatformShell preview={viewer.preview}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "GradimoCamper",
          url: getSiteUrl().toString(),
          inLanguage: "sl",
          potentialAction: {
            "@type": "SearchAction",
            target: `${new URL(routes.search, getSiteUrl()).toString()}?q={iskanje}`,
            "query-input": "required name=iskanje",
          },
        }}
      />

      {/* Prvi zaslon */}
      <section aria-labelledby="naslov" className="pb-14 pt-8 sm:pt-12 lg:pb-20 lg:pt-14">
        <div className="container-page grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <p className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              {hero.oznaka}
            </p>
            <h1 id="naslov" className="display-1 mt-5">
              {hero.naslov}
            </h1>
            <p className="lead mt-5 max-w-[36rem]">{hero.podnaslov}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={startPath ? routes.path(startPath.slug ?? "") : routes.learn} className="btn-primary">
                Začni učenje
              </Link>
              <Link href={routes.products} className="btn-secondary min-h-[3.25rem] px-6 text-base">
                Razišči izdelke
              </Link>
              <Link href={routes.roadmap} className="btn-secondary min-h-[3.25rem] px-6 text-base">
                Načrtuj gradnjo
              </Link>
            </div>
          </div>
          <figure className="lg:col-span-5">
            <div className="photo-panel aspect-[4/3]" style={{ backgroundColor: images.hero.background }}>
              {isDoc(home?.prviZaslon?.slika) ? (
                <Media media={home?.prviZaslon?.slika} sizes="(min-width: 1024px) 480px, 100vw" priority className="h-auto w-full object-contain" />
              ) : (
                <Image
                  src={images.hero.src}
                  width={images.hero.width}
                  height={images.hero.height}
                  alt={images.hero.alt}
                  preload
                  fetchPriority="high"
                  loading="eager"
                  quality={80}
                  sizes="(min-width: 1024px) 459px, calc(100vw - 64px)"
                  className="h-auto w-full max-w-[459px] object-contain"
                />
              )}
            </div>
          </figure>
        </div>
      </section>

      {/* Dva dela platforme */}
      <section aria-labelledby="dva-dela" className="border-t border-sand-200 py-14 sm:py-20">
        <div className="container-page">
          <h2 id="dva-dela" className="sr-only">
            Kaj najdeš na platformi
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[var(--radius-panel)] bg-[#eceadb] p-7 sm:p-9">
              <p className="eyebrow">Učenje</p>
              <h3 className="display-3 mt-3">Najprej razumi, potem gradi.</h3>
              <p className="body-muted mt-4 max-w-md">
                Vodiči, video lekcije in učne poti po fazah gradnje. Od načrtovanja do elektrike, vode in pohištva.
              </p>
              <Link href={routes.learn} className="text-link mt-6 inline-block">
                V središče znanja →
              </Link>
            </div>
            <div className="rounded-[var(--radius-panel)] bg-sand-100 p-7 sm:p-9">
              <p className="eyebrow">Izdelki</p>
              <h3 className="display-3 mt-3">Oprema za posamezen korak.</h3>
              <p className="body-muted mt-4 max-w-md">
                Izdelki s tehničnimi podatki, združljivostjo in povezavo na vodič za vgradnjo. Brez spletne košarice: pošlješ
                povpraševanje.
              </p>
              <Link href={routes.products} className="text-link mt-6 inline-block">
                V katalog →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Vodiči za začetnike */}
      <section aria-labelledby="vodici-zacetniki" className="py-14 sm:py-20">
        <div className="container-page">
          <SectionHeading
            id="vodici-zacetniki"
            eyebrow="Za začetek"
            title="Vodiči in videi za prve korake"
            action={{ href: routes.learn, label: "Vse vsebine" }}
          />
          {startPath ? (
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <PathCard path={startPath} />
              {guides.slice(0, 2).map((item) => (
                <ContentCard key={`${item.kind}-${item.doc.id}`} item={item} />
              ))}
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {guides.slice(0, 3).map((item) => (
                <ContentCard key={`${item.kind}-${item.doc.id}`} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Načrt gradnje */}
      {stages.docs.length ? (
        <section aria-labelledby="nacrt" className="bg-olive-deep py-14 text-paper sm:py-20 dark-surface">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-olive-200">Kako poteka gradnja</p>
                <h2 id="nacrt" className="display-3 mt-2 text-paper">
                  {stages.docs.length} faz od ideje do poti
                </h2>
              </div>
              <Link href={routes.roadmap} className="font-semibold text-paper underline underline-offset-4">
                Odpri načrt gradnje →
              </Link>
            </div>
            <ol className="mt-10 grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
              {stages.docs.map((stage) => (
                <li key={stage.id} className="border-t border-olive-200/40 pt-4">
                  <span className="text-sm font-semibold tabular-nums text-olive-200">
                    {String(stage.stevilka).padStart(2, "0")}
                  </span>
                  <p className="mt-1 text-lg font-semibold leading-snug">
                    <Link href={`${routes.roadmap}#faza-${stage.stevilka}`} className="hover:underline">
                      {stage.naziv}
                    </Link>
                  </p>
                  <p className="mt-1 text-[0.9375rem] leading-relaxed text-paper/80">{stage.kratekOpis}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* Kategorije izdelkov */}
      {shownCategories.length ? (
        <section aria-labelledby="kategorije" className="py-14 sm:py-20">
          <div className="container-page">
            <SectionHeading
              id="kategorije"
              eyebrow="Izdelki"
              title="Oprema po področjih"
              action={{ href: routes.products, label: "Vsi izdelki" }}
            />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shownCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Kako delamo */}
      {trust.length ? (
        <section aria-labelledby="kako-delamo" className="border-t border-sand-200 py-14 sm:py-20">
          <div className="container-page">
            <SectionHeading id="kako-delamo" title="Kako delamo" />
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {trust.map((item) => (
                <li key={item.id ?? item.naslov} className="border-t border-sand-300 pt-4">
                  <h3 className="text-lg font-semibold">{item.naslov}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-muted">{item.besedilo}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Vprašanja */}
      <section aria-labelledby="vprasanje" className="pb-6">
        <div className="container-page">
          <div className="rounded-[var(--radius-panel)] bg-sand-100 px-6 py-10 sm:px-10 sm:py-12 lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div>
              <h2 id="vprasanje" className="display-3">
                Ne veš, kaj izbrati?
              </h2>
              <p className="body-muted mt-3 max-w-xl">
                Opiši svoj kombi in načrt. Odgovorimo z razlago in, kjer je smiselno, s predlogom opreme.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
              <Link href={routes.contact} className="btn-primary">
                Postavi vprašanje
              </Link>
              <Link href={routes.inquiry} className="btn-secondary min-h-[3.25rem] px-6 text-base">
                Seznam povpraševanja
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PlatformShell>
  );
}

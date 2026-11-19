import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ContentCard } from "@/components/platform/cards";
import { AddToInquiry } from "@/components/platform/inquiry/AddToInquiry";
import { Media } from "@/components/platform/Media";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { RichText } from "@/components/platform/RichText";
import { TrackView } from "@/components/platform/Track";
import { Badge, JsonLd, KindLabel, PageIntro, SampleNotice } from "@/components/platform/ui";
import { brand } from "@/content";
import { docs, findBySlug, isDoc, polyDocs, requireViewer } from "@/lib/cms";
import { formatPrice, installLabel, routes, statusLabel } from "@/lib/platform";
import { pageMetadata, seoOf } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";
import type { Clanki, Faze, KategorijeIzdelkov, Mediji, Videi } from "@/payload-types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ kategorija: string; izdelek: string }> };

const AVAILABILITY: Record<string, string> = {
  "na-zalogi": "https://schema.org/InStock",
  predprodaja: "https://schema.org/PreOrder",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { izdelek } = await params;
  const product = await findBySlug("izdelki", izdelek);
  if (!product) return {};
  const category = isDoc<KategorijeIzdelkov>(product.kategorija) ? product.kategorija : null;
  const seo = seoOf(product, product.naziv, product.kratekOpis);
  return pageMetadata({
    ...seo,
    path: category ? routes.product(category.slug ?? "", product.slug ?? izdelek) : routes.products,
    image: docs<Mediji>(product.galerija)[0],
  });
}

export default async function ProductPage({ params }: Props) {
  const viewer = await requireViewer();
  const { kategorija, izdelek } = await params;
  const product = await findBySlug("izdelki", izdelek);
  if (!product) notFound();
  const category = isDoc<KategorijeIzdelkov>(product.kategorija) ? product.kategorija : null;
  if (!category) notFound();
  // En kanonični naslov: napačna kategorija v URL-ju preusmeri na pravo.
  if (category.slug !== kategorija) permanentRedirect(routes.product(category.slug ?? "", product.slug ?? izdelek));

  const href = routes.product(category.slug ?? "", product.slug ?? izdelek);
  const site = getSiteUrl();
  const gallery = docs<Mediji>(product.galerija);
  const price = formatPrice(product.cena);
  const stages = docs<Faze>(product.faze);
  const guides = polyDocs<Clanki | Videi>(product.vodici).map(({ relationTo, doc }) =>
    relationTo === "videi" ? ({ kind: "video", doc: doc as Videi } as const) : ({ kind: "clanek", doc: doc as Clanki } as const),
  );
  const faq = product.pogostaVprasanja ?? [];
  const availability = AVAILABILITY[product.stanje];

  return (
    <PlatformShell preview={viewer.preview}>
      <TrackView event="izdelek_ogled" id={product.id} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.naziv,
          description: product.kratekOpis,
          category: category.naziv,
          url: new URL(href, site).toString(),
          ...(gallery.length ? { image: gallery.filter((g) => g.url).map((g) => new URL(g.url as string, site).toString()) } : {}),
          // Ponudba samo, če je cena vnesena. Brez izmišljenih ocen ali mnenj.
          ...(typeof product.cena === "number"
            ? {
                offers: {
                  "@type": "Offer",
                  price: product.cena.toFixed(2),
                  priceCurrency: "EUR",
                  url: new URL(href, site).toString(),
                  seller: { "@type": "Organization", name: brand.name },
                  ...(availability ? { availability } : {}),
                },
              }
            : {}),
        }}
      />
      {faq.length ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((item) => ({
              "@type": "Question",
              name: item.vprasanje,
              acceptedAnswer: { "@type": "Answer", text: item.odgovor },
            })),
          }}
        />
      ) : null}

      <PageIntro
        crumbs={[
          { label: "Izdelki", href: routes.products },
          { label: category.naziv, href: routes.category(category.slug ?? "") },
          { label: product.naziv },
        ]}
        title={product.naziv}
      />

      <div className="container-page pb-12">
        {product.vzorec ? (
          <div className="mb-6">
            <SampleNotice kind="izdelek" />
          </div>
        ) : null}
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            {gallery.length ? (
              <div className="grid gap-3">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand-100">
                  <Media media={gallery[0]} fill priority sizes="(min-width: 1024px) 680px, 100vw" className="object-contain p-6" />
                </div>
                {gallery.length > 1 ? (
                  <ul className="grid grid-cols-4 gap-3">
                    {gallery.slice(1, 9).map((image) => (
                      <li key={image.id} className="relative aspect-square overflow-hidden rounded-xl bg-sand-100">
                        <Media media={image} fill sizes="160px" className="object-contain p-2" />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-sand-100 text-center text-olive">
                <p className="px-6 font-semibold">Fotografija izdelka bo dodana.</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="flex flex-wrap gap-1.5">
              <KindLabel kind="izdelek" />
              <Badge>{statusLabel[product.stanje]}</Badge>
              <Badge>{installLabel[product.zahtevnostVgradnje]}</Badge>
            </div>
            <p className="lead mt-4">{product.kratekOpis}</p>
            <p className="mt-5 text-2xl font-semibold">{price ?? "Cena na povpraševanje"}</p>
            {price ? <p className="mt-1 text-sm text-ink-muted">Informativna cena. Končno ponudbo dobiš na povpraševanje.</p> : null}
            <div className="mt-6 flex flex-col gap-3">
              <AddToInquiry id={product.id} naziv={product.naziv} href={href} />
              <Link href={`${routes.contact}?izdelek=${encodeURIComponent(product.slug ?? "")}`} className="text-link self-start text-[0.9375rem]">
                Imaš vprašanje o tem izdelku?
              </Link>
            </div>
            {product.zdruzljivost ? (
              <div className="mt-8">
                <h2 className="text-lg font-semibold">Združljivost</h2>
                <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-muted">{product.zdruzljivost}</p>
              </div>
            ) : null}
            {stages.length ? (
              <div className="mt-6">
                <h2 className="text-lg font-semibold">Faza gradnje</h2>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {stages.map((stage) => (
                    <li key={stage.id}>
                      <Link href={`${routes.roadmap}#faza-${stage.stevilka}`} className="text-link text-[0.9375rem]">
                        {stage.stevilka}. {stage.naziv}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-8 lg:col-span-7">
            {product.opis ? (
              <section aria-labelledby="opis">
                <h2 id="opis" className="display-3">
                  Opis
                </h2>
                <div className="mt-4">
                  <RichText data={product.opis} />
                </div>
              </section>
            ) : null}
            {product.primeriUporabe?.length ? (
              <section aria-labelledby="uporaba">
                <h2 id="uporaba" className="text-xl font-semibold">
                  Primeri uporabe
                </h2>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed">
                  {product.primeriUporabe.map((item) => (
                    <li key={item.id ?? item.besedilo}>{item.besedilo}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            {faq.length ? (
              <section aria-labelledby="vprasanja">
                <h2 id="vprasanja" className="text-xl font-semibold">
                  Pogosta vprašanja
                </h2>
                <div className="mt-3 divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-paper-raised">
                  {faq.map((item) => (
                    <details key={item.id ?? item.vprasanje} className="group px-4 py-3 sm:px-5">
                      <summary className="flex min-h-11 cursor-pointer items-center font-semibold">{item.vprasanje}</summary>
                      <p className="mt-1 whitespace-pre-line pb-2 leading-relaxed text-ink-muted">{item.odgovor}</p>
                    </details>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
          <div className="order-first lg:order-none lg:col-span-5">
            {product.tehnicniPodatki?.length ? (
              <section aria-labelledby="podatki" className="rounded-2xl border border-sand-200 bg-paper-raised p-4 sm:p-5">
                <h2 id="podatki" className="text-lg font-semibold">
                  Tehnični podatki
                </h2>
                <table className="spec-table mt-3">
                  <tbody>
                    {product.tehnicniPodatki.map((row) => (
                      <tr key={row.id ?? row.lastnost}>
                        <th scope="row">{row.lastnost}</th>
                        <td>{row.vrednost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ) : null}
          </div>
        </div>
      </div>

      {guides.length ? (
        <section aria-labelledby="vodici-izdelka" className="border-t border-sand-200 py-12">
          <div className="container-page">
            <p className="eyebrow">Učenje</p>
            <h2 id="vodici-izdelka" className="display-3 mt-2">
              Vodiči za vgradnjo in uporabo
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((item) => (
                <ContentCard key={`${item.kind}-${item.doc.id}`} item={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </PlatformShell>
  );
}

import Link from "next/link";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { EmptyState, JsonLd, PageIntro } from "@/components/platform/ui";
import { isDoc, listContent, queryOptions, requireViewer } from "@/lib/cms";
import { routes } from "@/lib/platform";
import { pageMetadata } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";
import type { Faze, KategorijeIzdelkov } from "@/payload-types";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Načrt gradnje campervana",
  description:
    "Predelava kombija v camper po fazah: načrtovanje, priprava vozila, izolacija, elektrika, voda, pohištvo in končna oprema. Za vsako fazo vodiči in oprema.",
  path: routes.roadmap,
});

function stageId(value: unknown): number | null {
  if (typeof value === "number") return value;
  return isDoc<Faze>(value) ? value.id : null;
}

export default async function RoadmapPage() {
  const viewer = await requireViewer();
  const q = queryOptions(viewer);
  const [stages, content, products] = await Promise.all([
    viewer.payload.find({ collection: "faze", ...q, sort: "stevilka", limit: 50, depth: 0 }),
    listContent(viewer, { limit: 200 }),
    viewer.payload.find({ collection: "izdelki", ...q, limit: 200, depth: 1, sort: "naziv" }),
  ]);

  const site = getSiteUrl();

  return (
    <PlatformShell preview={viewer.preview}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "Predelava kombija v camper po fazah",
          inLanguage: "sl",
          step: stages.docs.map((stage) => ({
            "@type": "HowToStep",
            position: stage.stevilka,
            name: stage.naziv,
            text: stage.kratekOpis,
            url: new URL(`${routes.roadmap}#faza-${stage.stevilka}`, site).toString(),
          })),
        }}
      />
      <PageIntro
        crumbs={[{ label: "Vodiči gradnje", href: routes.guides }, { label: "Načrt gradnje" }]}
        title="Načrt gradnje"
        lead="Celotna predelava po fazah. Vrstni red je priporočen, ker vsaka faza pripravi podlago za naslednjo."
      />

      {stages.docs.length ? (
        <nav aria-label="Faze gradnje" className="container-page pb-8">
          <ol className="flex flex-wrap gap-2">
            {stages.docs.map((stage) => (
              <li key={stage.id}>
                <a
                  href={`#faza-${stage.stevilka}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-sand-300 bg-paper-raised px-4 text-[0.9375rem] font-medium hover:border-ink"
                >
                  {stage.stevilka}. {stage.naziv}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <div className="container-page pb-16">
        {stages.docs.length ? (
          <ol className="relative space-y-6 border-l-2 border-sand-200 pl-6 sm:pl-10">
            {stages.docs.map((stage) => {
              const lessons = content.filter((item) => stageId(item.doc.faza) === stage.id);
              const stageProducts = products.docs.filter((p) => (p.faze ?? []).some((f) => stageId(f) === stage.id));
              return (
                <li key={stage.id} id={`faza-${stage.stevilka}`} className="relative scroll-mt-24">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[2.1rem] top-1 grid h-8 w-8 place-items-center rounded-full bg-olive text-sm font-bold text-paper sm:-left-[3.1rem]"
                  >
                    {stage.stevilka}
                  </span>
                  <section aria-labelledby={`naslov-faza-${stage.stevilka}`} className="rounded-2xl border border-sand-200 bg-paper-raised p-5 sm:p-7">
                    <p className="text-sm font-semibold text-olive">Faza {stage.stevilka}</p>
                    <h2 id={`naslov-faza-${stage.stevilka}`} className="mt-1 text-2xl font-semibold tracking-[-0.02em]">
                      {stage.naziv}
                    </h2>
                    <p className="mt-2 text-[1.0625rem] leading-relaxed text-ink-muted">{stage.opis || stage.kratekOpis}</p>

                    {stage.cilji?.length ? (
                      <div className="mt-5">
                        <h3 className="font-semibold">Cilji faze</h3>
                        <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
                          {stage.cilji.map((goal) => (
                            <li key={goal.id ?? goal.besedilo}>{goal.besedilo}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                      <div>
                        <h3 className="font-semibold">Vodiči in videi</h3>
                        {lessons.length ? (
                          <ul className="mt-2 space-y-2">
                            {lessons.map((item) => (
                              <li key={`${item.kind}-${item.doc.id}`}>
                                <Link
                                  href={item.kind === "video" ? routes.video(item.doc.slug ?? "") : routes.article(item.doc.slug ?? "")}
                                  className="text-link"
                                >
                                  {item.doc.naslov}
                                </Link>
                                <span className="text-sm text-ink-muted"> · {item.kind === "video" ? "video" : "vodič"}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-[0.9375rem] text-ink-muted">Vsebine so v pripravi.</p>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">Oprema za to fazo</h3>
                        {stageProducts.length ? (
                          <ul className="mt-2 space-y-2">
                            {stageProducts.map((product) => {
                              const category = isDoc<KategorijeIzdelkov>(product.kategorija) ? product.kategorija : null;
                              return (
                                <li key={product.id}>
                                  <Link href={category ? routes.product(category.slug ?? "", product.slug ?? "") : routes.products} className="text-link">
                                    {product.naziv}
                                  </Link>
                                  {product.vzorec ? <span className="text-sm text-ink-muted"> · vzorec</span> : null}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="mt-2 text-[0.9375rem] text-ink-muted">Za to fazo še ni izdelkov v katalogu.</p>
                        )}
                      </div>
                    </div>
                  </section>
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyState>Faze gradnje še niso vnesene.</EmptyState>
        )}
      </div>
    </PlatformShell>
  );
}

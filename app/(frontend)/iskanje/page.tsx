import Link from "next/link";
import { ContentCard, ProductCard } from "@/components/platform/cards";
import { param } from "@/components/platform/FilterBar";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { TrackEvent } from "@/components/platform/Track";
import { EmptyState, PageIntro } from "@/components/platform/ui";
import { listContent, queryOptions, requireViewer } from "@/lib/cms";
import { routes } from "@/lib/platform";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Iskanje",
  description: "Išči med vodiči, video lekcijami in izdelki GradimoCamper.",
  path: routes.search,
  noindex: true,
});

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SearchPage({ searchParams }: Props) {
  const viewer = await requireViewer();
  const params = await searchParams;
  const term = (param(params, "q") ?? "").trim().slice(0, 80);
  const valid = term.length >= 2;
  const q = queryOptions(viewer);

  const [content, products, topics] = valid
    ? await Promise.all([
        listContent(viewer, {
          limit: 30,
          where: { or: [{ naslov: { like: term } }, { povzetek: { like: term } }] },
        }),
        viewer.payload.find({
          collection: "izdelki",
          ...q,
          where: { or: [{ naziv: { like: term } }, { kratekOpis: { like: term } }] },
          limit: 30,
          depth: 1,
        }),
        viewer.payload.find({ collection: "teme", ...q, where: { naziv: { like: term } }, limit: 10, depth: 0 }),
      ])
    : [[], null, null];

  const total = content.length + (products?.docs.length ?? 0) + (topics?.docs.length ?? 0);

  return (
    <PlatformShell preview={viewer.preview}>
      {valid ? <TrackEvent event="iskanje" data={{ zadetkov: total }} /> : null}
      <PageIntro crumbs={[{ label: "Iskanje" }]} title={valid ? `Rezultati za »${term}«` : "Iskanje"}>
        <form action={routes.search} method="get" role="search" className="mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row">
          <label htmlFor="iskanje-stran" className="sr-only">
            Iskalni niz
          </label>
          <input
            id="iskanje-stran"
            name="q"
            type="search"
            defaultValue={term}
            minLength={2}
            maxLength={80}
            placeholder="Npr. izolacija, baterija, okno"
            className="h-12 flex-1 rounded-xl border border-field-border bg-white px-4 text-base text-ink focus-visible:border-ink"
          />
          <button type="submit" className="btn-primary">
            Išči
          </button>
        </form>
        {valid ? (
          <p role="status" className="mt-3 text-sm text-ink-muted">
            {total === 0 ? "Ni zadetkov." : `Zadetkov: ${total}`}
          </p>
        ) : null}
      </PageIntro>

      <div className="container-page space-y-12 pb-16">
        {!valid ? <EmptyState>Vpiši vsaj dva znaka.</EmptyState> : null}
        {valid && total === 0 ? (
          <EmptyState>
            Ni zadetkov. Poskusi s krajšo besedo ali prebrskaj{" "}
            <Link href={routes.learn} className="text-link">
              središče znanja
            </Link>{" "}
            in{" "}
            <Link href={routes.products} className="text-link">
              izdelke
            </Link>
            .
          </EmptyState>
        ) : null}
        {topics?.docs.length ? (
          <section aria-labelledby="zadetki-teme">
            <h2 id="zadetki-teme" className="text-xl font-semibold">
              Teme
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {topics.docs.map((t) => (
                <li key={t.id}>
                  <Link href={routes.topic(t.slug ?? "")} className="text-link">
                    {t.naziv}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {content.length ? (
          <section aria-labelledby="zadetki-ucenje">
            <h2 id="zadetki-ucenje" className="display-3">
              Vodiči in videi
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {content.map((item) => (
                <ContentCard key={`${item.kind}-${item.doc.id}`} item={item} />
              ))}
            </div>
          </section>
        ) : null}
        {products?.docs.length ? (
          <section aria-labelledby="zadetki-izdelki">
            <h2 id="zadetki-izdelki" className="display-3">
              Izdelki
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.docs.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PlatformShell>
  );
}

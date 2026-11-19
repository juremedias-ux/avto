import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Where } from "payload";
import { ProductCard } from "@/components/platform/cards";
import { FilterBar, param } from "@/components/platform/FilterBar";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { EmptyState, JsonLd, PageIntro } from "@/components/platform/ui";
import { findBySlug, isDoc, queryOptions, requireViewer } from "@/lib/cms";
import { routes, statusLabel } from "@/lib/platform";
import { pageMetadata } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";
import type { Clanki } from "@/payload-types";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ kategorija: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kategorija } = await params;
  const category = await findBySlug("kategorije-izdelkov", kategorija, 1);
  if (!category) return {};
  return pageMetadata({
    title: `${category.naziv} – izdelki za camper`,
    description: category.opis,
    path: routes.category(category.slug ?? kategorija),
    image: category.slika,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const viewer = await requireViewer();
  const { kategorija } = await params;
  const category = await findBySlug("kategorije-izdelkov", kategorija, 1);
  if (!category) notFound();
  const sp = await searchParams;
  const q = queryOptions(viewer);

  const stages = await viewer.payload.find({ collection: "faze", ...q, sort: "stevilka", limit: 50, depth: 0 });
  const stage = stages.docs.find((s) => String(s.stevilka) === param(sp, "faza"));
  const statusValue = param(sp, "stanje");
  const status = statusValue && statusValue in statusLabel ? statusValue : undefined;

  const conditions: Where[] = [{ kategorija: { equals: category.id } }];
  if (stage) conditions.push({ faze: { in: [stage.id] } });
  if (status) conditions.push({ stanje: { equals: status } });

  const products = await viewer.payload.find({
    collection: "izdelki",
    ...q,
    where: { and: conditions },
    sort: "naziv",
    limit: 120,
    depth: 1,
  });

  const guide = isDoc<Clanki>(category.vodic) ? category.vodic : null;
  const site = getSiteUrl();
  const url = new URL(routes.category(category.slug ?? kategorija), site).toString();

  return (
    <PlatformShell preview={viewer.preview}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: category.naziv,
          description: category.opis ?? undefined,
          url,
          inLanguage: "sl",
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: products.docs.length,
            itemListElement: products.docs.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: p.naziv,
              url: new URL(routes.product(category.slug ?? kategorija, p.slug ?? ""), site).toString(),
            })),
          },
        }}
      />
      <PageIntro
        crumbs={[{ label: "Izdelki", href: routes.products }, { label: category.naziv }]}
        eyebrow={<span className="eyebrow">Področje</span>}
        title={category.naziv}
        lead={category.opis}
      >
        {guide ? (
          <div className="mt-6 flex max-w-3xl flex-col gap-3 rounded-2xl bg-[#eceadb] p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.9375rem]">
              <span className="font-semibold">Pred izbiro preberi: </span>
              {guide.naslov}
            </p>
            <Link href={routes.article(guide.slug ?? "")} className="btn-secondary shrink-0">
              Odpri vodič
            </Link>
          </div>
        ) : null}
      </PageIntro>

      <section aria-label={`Izdelki: ${category.naziv}`} className="container-page pb-16">
        <FilterBar
          action={routes.category(category.slug ?? kategorija)}
          count={products.docs.length}
          filters={[
            {
              name: "faza",
              label: "Faza gradnje",
              value: stage ? String(stage.stevilka) : undefined,
              options: stages.docs.map((s) => ({ value: String(s.stevilka), label: `${s.stevilka}. ${s.naziv}` })),
            },
            {
              name: "stanje",
              label: "Dobavljivost",
              value: status,
              options: Object.entries(statusLabel).map(([value, label]) => ({ value, label })),
            },
          ]}
        />
        {products.docs.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.docs.map((product) => (
              <ProductCard key={product.id} product={product} headingLevel={2} />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState>Izdelki na tem področju so v pripravi.</EmptyState>
          </div>
        )}
      </section>
    </PlatformShell>
  );
}

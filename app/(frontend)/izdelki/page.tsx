import type { Where } from "payload";
import { CategoryCard, ProductCard } from "@/components/platform/cards";
import { FilterBar, param } from "@/components/platform/FilterBar";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { EmptyState, PageIntro, SectionHeading } from "@/components/platform/ui";
import { queryOptions, requireViewer } from "@/lib/cms";
import { routes, statusLabel } from "@/lib/platform";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Izdelki za predelavo kombija",
  description:
    "Oprema za predelavo kombija v camper po področjih in fazah gradnje, s tehničnimi podatki in povezavo na vodiče. Povpraševanje brez obveznosti.",
  path: routes.products,
});

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ProductsPage({ searchParams }: Props) {
  const viewer = await requireViewer();
  const params = await searchParams;
  const q = queryOptions(viewer);

  const [categories, stages, counts] = await Promise.all([
    viewer.payload.find({ collection: "kategorije-izdelkov", ...q, sort: "vrstniRed", limit: 50, depth: 0 }),
    viewer.payload.find({ collection: "faze", ...q, sort: "stevilka", limit: 50, depth: 0 }),
    viewer.payload.find({ collection: "izdelki", ...q, limit: 500, depth: 0, select: { kategorija: true } }),
  ]);

  const category = categories.docs.find((c) => c.slug === param(params, "kategorija"));
  const stage = stages.docs.find((s) => String(s.stevilka) === param(params, "faza"));
  const statusValue = param(params, "stanje");
  const status = statusValue && statusValue in statusLabel ? statusValue : undefined;

  const conditions: Where[] = [];
  if (category) conditions.push({ kategorija: { equals: category.id } });
  if (stage) conditions.push({ faze: { in: [stage.id] } });
  if (status) conditions.push({ stanje: { equals: status } });

  const products = await viewer.payload.find({
    collection: "izdelki",
    ...q,
    where: conditions.length ? { and: conditions } : undefined,
    sort: "naziv",
    limit: 120,
    depth: 1,
  });

  const countFor = (id: number) =>
    counts.docs.filter((p) => (typeof p.kategorija === "number" ? p.kategorija : p.kategorija?.id) === id).length;

  return (
    <PlatformShell preview={viewer.preview}>
      <PageIntro
        crumbs={[{ label: "Izdelki" }]}
        title="Izdelki"
        lead="Oprema po področjih in fazah gradnje. Pri vsakem izdelku so tehnični podatki, združljivost in povezava na vodič. Ni spletne košarice: izbrane izdelke pošlješ kot povpraševanje brez obveznosti."
      />

      {categories.docs.length ? (
        <section aria-labelledby="podrocja" className="container-page pb-12">
          <SectionHeading id="podrocja" title="Področja" />
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.docs.map((c) => (
              <CategoryCard key={c.id} category={c} count={countFor(c.id)} />
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="vsi-izdelki" className="container-page pb-16">
        <h2 id="vsi-izdelki" className="display-3">
          Vsi izdelki
        </h2>
        <div className="mt-5">
          <FilterBar
            action={routes.products}
            count={products.docs.length}
            filters={[
              {
                name: "kategorija",
                label: "Področje",
                value: category?.slug ?? undefined,
                options: categories.docs.map((c) => ({ value: c.slug ?? "", label: c.naziv })),
              },
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
        </div>
        {products.docs.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.docs.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState>Za izbrane filtre ni izdelkov.</EmptyState>
          </div>
        )}
      </section>
    </PlatformShell>
  );
}

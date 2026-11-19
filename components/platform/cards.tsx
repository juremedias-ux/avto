import Link from "next/link";
import { Media } from "@/components/platform/Media";
import { Badge, KindLabel } from "@/components/platform/ui";
import { isDoc } from "@/lib/cms-shared";
import { difficultyLabel, formatPrice, minutes, plural, routes, statusLabel } from "@/lib/platform";
import type { Clanki, Faze, Izdelki, KategorijeIzdelkov, UcnePoti, Videi } from "@/payload-types";

function ProductPlaceholder({ label }: { label: string }) {
  return (
    <div className="grid h-full w-full place-items-center bg-sand-100 text-olive" aria-hidden="true">
      <div className="text-center">
        <svg viewBox="0 0 48 48" className="mx-auto h-12 w-12" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <rect x="8" y="12" width="32" height="26" rx="4" />
          <path d="M16 12V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M8 22h32" strokeLinecap="round" />
        </svg>
        <span className="mt-2 block text-xs font-semibold">{label}</span>
      </div>
    </div>
  );
}

function stageNumber(faza: unknown): string | null {
  return isDoc<Faze>(faza) ? `Faza ${faza.stevilka}` : null;
}

type ContentDoc = { kind: "clanek"; doc: Clanki } | { kind: "video"; doc: Videi };

/** Kartica članka ali videa. */
export function ContentCard({ item, headingLevel = 3 }: { item: ContentDoc; headingLevel?: 2 | 3 }) {
  const { kind, doc } = item;
  const href = kind === "clanek" ? routes.article(doc.slug ?? "") : routes.video(doc.slug ?? "");
  const image = kind === "clanek" ? doc.naslovnaSlika : doc.poster;
  const time = kind === "clanek" ? `${minutes(doc.casBranja)} branja` : `${minutes(doc.trajanje)} videa`;
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="card group">
      <div className="card-media">
        {isDoc(image) ? (
          <Media media={image} sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" fill className="object-cover" />
        ) : (
          <div className="grid h-full place-items-center bg-[#e9e7d6] text-olive" aria-hidden="true">
            <span className="text-sm font-semibold">{kind === "video" ? "▶ Video" : "Vodič"}</span>
          </div>
        )}
        {kind === "video" ? <span className="card-play" aria-hidden="true">▶</span> : null}
      </div>
      <div className="card-body">
        <div className="flex flex-wrap gap-1.5">
          <KindLabel kind={kind} />
          {stageNumber(doc.faza) ? <Badge>{stageNumber(doc.faza)}</Badge> : null}
        </div>
        <Heading className="mt-3 text-lg font-semibold leading-snug tracking-[-0.01em]">
          <Link href={href} className="card-link">
            {doc.naslov}
          </Link>
        </Heading>
        <p className="mt-2 line-clamp-3 text-[0.9375rem] leading-relaxed text-ink-muted">{doc.povzetek}</p>
        <p className="mt-auto pt-4 text-sm text-ink-muted">
          {time} · {difficultyLabel[doc.zahtevnost] ?? ""}
        </p>
      </div>
    </article>
  );
}

/** Kartica izdelka. */
export function ProductCard({ product, headingLevel = 3 }: { product: Izdelki; headingLevel?: 2 | 3 }) {
  const category = isDoc<KategorijeIzdelkov>(product.kategorija) ? product.kategorija : null;
  const href = category ? routes.product(category.slug ?? "", product.slug ?? "") : routes.products;
  const image = Array.isArray(product.galerija) ? product.galerija.find((g) => isDoc(g)) : null;
  const price = formatPrice(product.cena);
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="card card-product group">
      <div className="card-media bg-sand-100">
        {image ? (
          <Media media={image} sizes="(min-width: 1024px) 300px, 50vw" fill className="object-contain p-4" />
        ) : (
          <ProductPlaceholder label={category?.naziv ?? "Izdelek"} />
        )}
      </div>
      <div className="card-body">
        <div className="flex flex-wrap gap-1.5">
          <KindLabel kind="izdelek" />
          {product.vzorec ? <Badge tone="action">Vzorec</Badge> : null}
        </div>
        <Heading className="mt-3 text-lg font-semibold leading-snug tracking-[-0.01em]">
          <Link href={href} className="card-link">
            {product.naziv}
          </Link>
        </Heading>
        <p className="mt-2 line-clamp-2 text-[0.9375rem] leading-relaxed text-ink-muted">{product.kratekOpis}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4 text-sm">
          <span className="font-semibold text-ink">{price ?? "Cena na povpraševanje"}</span>
          <span className="text-ink-muted">{statusLabel[product.stanje] ?? ""}</span>
        </div>
      </div>
    </article>
  );
}

/** Kartica učne poti. */
export function PathCard({ path }: { path: UcnePoti }) {
  const steps = Array.isArray(path.koraki) ? path.koraki.length : 0;
  return (
    <article className="card card-path">
      <div className="card-body">
        <div className="flex flex-wrap gap-1.5">
          <KindLabel kind="pot" />
          {path.izpostavljena ? <Badge tone="action">Začni tukaj</Badge> : null}
        </div>
        <h3 className="mt-3 text-xl font-semibold leading-snug tracking-[-0.01em]">
          <Link href={routes.path(path.slug ?? "")} className="card-link">
            {path.naslov}
          </Link>
        </h3>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-muted">{path.opis}</p>
        <p className="mt-auto pt-4 text-sm text-ink-muted">
          {plural(steps, ["korak", "koraka", "koraki", "korakov"])}
          {path.zaKoga ? ` · ${path.zaKoga}` : ""}
        </p>
      </div>
    </article>
  );
}

/** Kartica kategorije izdelkov. */
export function CategoryCard({ category, count }: { category: KategorijeIzdelkov; count?: number }) {
  return (
    <article className="card card-product">
      <div className="card-body">
        <h3 className="text-lg font-semibold tracking-[-0.01em]">
          <Link href={routes.category(category.slug ?? "")} className="card-link">
            {category.naziv}
          </Link>
        </h3>
        {category.opis ? <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-muted">{category.opis}</p> : null}
        {typeof count === "number" ? (
          <p className="mt-auto pt-4 text-sm text-ink-muted">{count ? plural(count, ["izdelek", "izdelka", "izdelki", "izdelkov"]) : "Izdelki v pripravi"}</p>
        ) : null}
      </div>
    </article>
  );
}

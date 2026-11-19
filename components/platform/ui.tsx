import Link from "next/link";
import type { ReactNode } from "react";
import { getSiteUrl } from "@/lib/site";

/** Strukturirani podatki (schema.org) kot JSON-LD. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Vsebina je naš JSON, < je ubežan, da ne more zapreti oznake script.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export type Crumb = { label: string; href?: string };

/** Drobtinice z oznako BreadcrumbList. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "Domov", href: "/" }, ...items];
  const base = getSiteUrl();
  return (
    <>
      <nav aria-label="Drobtinice" className="text-sm text-ink-muted">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {all.map((item, index) => (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {item.href && index < all.length - 1 ? (
                <Link href={item.href} className="hover:text-ink hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={index === all.length - 1 ? "page" : undefined} className="text-ink">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.label,
            ...(item.href ? { item: new URL(item.href, base).toString() } : {}),
          })),
        }}
      />
    </>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "olive" | "sand" | "action" }) {
  const tones = {
    neutral: "border-sand-300 bg-paper-raised text-ink",
    olive: "border-transparent bg-[#e9e7d6] text-olive",
    sand: "border-transparent bg-sand-100 text-ink",
    action: "border-transparent bg-[#f6e3da] text-action-hover",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Oznaka vrste vsebine (jasna ločitev učenja in izdelkov). */
export function KindLabel({ kind }: { kind: "clanek" | "video" | "pot" | "izdelek" }) {
  const map = {
    clanek: { label: "Vodič", tone: "olive" },
    video: { label: "Video", tone: "olive" },
    pot: { label: "Učna pot", tone: "olive" },
    izdelek: { label: "Izdelek", tone: "sand" },
  } as const;
  const { label, tone } = map[kind];
  return <Badge tone={tone}>{label}</Badge>;
}

/** Opozorilo za vzorčne vsebine. */
export function SampleNotice({ kind }: { kind: "vsebina" | "izdelek" }) {
  return (
    <p role="note" className="sample-notice">
      <strong>Vzorec.</strong>{" "}
      {kind === "izdelek"
        ? "Ta izdelek je primer za prikaz strani. Podatki, cena in stanje niso resnični."
        : "To je vzorčna vsebina za prikaz strani. Pred objavo jo preglej in dopolni."}
    </p>
  );
}

/** Opozorilo, da je platforma še v predogledu (vidijo ga samo uredniki). */
export function PreviewBanner() {
  return (
    <aside aria-label="Predogled" className="bg-ink px-4 py-2 text-center text-sm text-paper">
      Predogled za urednike: platforma še ni javna. Obiskovalci vidijo stran za prijavo na obvestilo.
    </aside>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  action,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 id={id} className="display-3 mt-2">
          {title}
        </h2>
      </div>
      {action ? (
        <Link href={action.href} className="text-link text-[0.9375rem]">
          {action.label} →
        </Link>
      ) : null}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-sand-300 bg-paper-raised px-5 py-8 text-center text-ink-muted">
      {children}
    </p>
  );
}

/** Uvod strani: drobtinice, oznaka, naslov H1 in uvodno besedilo. */
export function PageIntro({
  crumbs,
  eyebrow,
  title,
  lead,
  children,
}: {
  crumbs: Crumb[];
  eyebrow?: ReactNode;
  title: string;
  lead?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="container-page pb-8 pt-6 sm:pt-8">
      <Breadcrumbs items={crumbs} />
      {eyebrow ? <div className="mt-6 flex flex-wrap gap-1.5">{eyebrow}</div> : null}
      <h1 className={`display-2 max-w-4xl ${eyebrow ? "mt-3" : "mt-6"}`}>{title}</h1>
      {lead ? <p className="lead mt-4 max-w-3xl">{lead}</p> : null}
      {children}
    </div>
  );
}

/** Oblika datuma za prikaz (npr. 18. 11. 2026). */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("sl-SI", { day: "numeric", month: "numeric", year: "numeric" }).format(date);
}

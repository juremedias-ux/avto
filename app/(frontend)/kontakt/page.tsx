import { InquiryForm } from "@/components/platform/inquiry/InquiryForm";
import { param } from "@/components/platform/FilterBar";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { PageIntro } from "@/components/platform/ui";
import { contact } from "@/content";
import { findBySlug, requireViewer } from "@/lib/cms";
import { routes } from "@/lib/platform";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Kontakt",
  description: "Vprašanje o predelavi kombija ali o izdelku? Piši nam.",
  path: routes.contact,
});

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ContactPage({ searchParams }: Props) {
  const viewer = await requireViewer();
  const params = await searchParams;
  const slug = param(params, "izdelek");
  const product = slug ? await findBySlug("izdelki", slug, 0) : null;

  return (
    <PlatformShell preview={viewer.preview}>
      <PageIntro
        crumbs={[{ label: "Kontakt" }]}
        title="Kontakt"
        lead="Opiši svoj kombi in kaj te zanima. Odgovorimo po e-pošti."
      />
      <div className="container-page grid gap-10 pb-16 lg:grid-cols-12 lg:gap-12">
        <section aria-labelledby="obrazec" className="lg:col-span-7">
          <div className="form-card">
            <h2 id="obrazec" className="text-xl font-semibold">
              Postavi vprašanje
            </h2>
            <div className="mt-5">
              <InquiryForm
                id="kontakt"
                mode="vprasanje"
                product={product ? { id: product.id, naziv: product.naziv } : null}
                submitLabel="Pošlji vprašanje"
              />
            </div>
          </div>
        </section>
        <aside aria-labelledby="drugi-kontakt" className="lg:col-span-5">
          <h2 id="drugi-kontakt" className="text-xl font-semibold">
            E-pošta
          </h2>
          <p className="mt-3 leading-relaxed text-ink-muted">
            Lahko pišeš tudi neposredno na{" "}
            <a href={`mailto:${contact.email}`} className="text-link">
              {contact.email}
            </a>
            .
          </p>
          {contact.phone ? (
            <p className="mt-3 leading-relaxed text-ink-muted">
              Telefon:{" "}
              <a href={`tel:${contact.phoneHref}`} className="text-link">
                {contact.phone}
              </a>
            </p>
          ) : null}
        </aside>
      </div>
    </PlatformShell>
  );
}

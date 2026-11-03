import Link from "next/link";
import { brand, contact, footer } from "@/content";
import { Logo } from "@/components/Logo";

export function SiteFooter() {
  return (
    <footer className="pb-10 pt-14 sm:pt-16">
      <div className="container-page">
        <div className="flex flex-col gap-10 border-t border-sand-300 pt-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-muted">{brand.tagline}</p>
          </div>

          <nav aria-label="Noga">
            <ul className="flex flex-col gap-1 text-[0.9375rem] md:items-end">
              {contact.phone ? (
                <li>
                  <span className="text-ink-muted">{footer.contactLabel}: </span>
                  <a href={`tel:${contact.phoneHref}`} className="footer-link">
                    {contact.phone}
                  </a>
                </li>
              ) : null}
              {contact.email ? (
                <li>
                  {contact.phone ? null : <span className="text-ink-muted">{footer.contactLabel}: </span>}
                  <a href={`mailto:${contact.email}`} className="footer-link">
                    {contact.email}
                  </a>
                </li>
              ) : null}
              <li>
                <Link href="/zasebnost" className="footer-link">
                  {footer.privacy}
                </Link>
              </li>
              <li>
                <Link href="/admin" prefetch={false} className="footer-link text-ink-muted" rel="nofollow">
                  {footer.admin}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}

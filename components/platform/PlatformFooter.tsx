import Link from "next/link";
import { brand, contact } from "@/content";
import { Logo } from "@/components/Logo";
import { mainNav, routes } from "@/lib/platform";

export function PlatformFooter() {
  return (
    <footer className="mt-20 border-t border-sand-300 bg-sand-50 pb-10 pt-12 sm:mt-28">
      <div className="container-page grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo />
          <p className="mt-3 max-w-sm text-[0.9375rem] leading-relaxed text-ink-muted">{brand.tagline}</p>
          {contact.email ? (
            <p className="mt-4 text-[0.9375rem]">
              <span className="text-ink-muted">Kontakt: </span>
              <a href={`mailto:${contact.email}`} className="text-link">
                {contact.email}
              </a>
            </p>
          ) : null}
        </div>
        <nav aria-label="Noga – vsebine" className="md:col-span-3">
          <h2 className="text-sm font-semibold text-ink">Raziskuj</h2>
          <ul className="mt-2 text-[0.9375rem]">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="footer-link">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Noga – pravno" className="md:col-span-4">
          <h2 className="text-sm font-semibold text-ink">Pravno in podpora</h2>
          <ul className="mt-2 text-[0.9375rem]">
            <li>
              <Link href={routes.inquiry} className="footer-link">
                Seznam povpraševanja
              </Link>
            </li>
            <li>
              <Link href={routes.privacy} className="footer-link">
                Politika zasebnosti
              </Link>
            </li>
            <li>
              <Link href={routes.terms} className="footer-link">
                Pogoji uporabe
              </Link>
            </li>
            <li>
              <Link href="/cms" prefetch={false} rel="nofollow" className="footer-link text-ink-muted">
                Urejanje vsebin
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}

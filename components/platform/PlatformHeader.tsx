import Link from "next/link";
import { Logo } from "@/components/Logo";
import { InquiryCount } from "@/components/platform/inquiry/InquiryCount";
import { mainNav, routes } from "@/lib/platform";

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <circle cx="9" cy="9" r="6" />
      <path d="m13.5 13.5 4 4" strokeLinecap="round" />
    </svg>
  );
}

function SearchForm({ id }: { id: string }) {
  return (
    <form action={routes.search} method="get" role="search" className="relative">
      <label htmlFor={id} className="sr-only">
        Išči vodiče, videe in izdelke
      </label>
      <input
        id={id}
        name="q"
        type="search"
        placeholder="Išči: izolacija, baterija …"
        className="h-11 w-full rounded-full border border-sand-300 bg-paper-raised pl-10 pr-4 text-[0.9375rem] text-ink placeholder:text-[#8a8574] focus-visible:border-ink"
        autoComplete="off"
        enterKeyHint="search"
      />
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted">
        <SearchIcon />
      </span>
    </form>
  );
}

/** Glava platforme: navigacija, stalno iskanje in seznam povpraševanja. */
export function PlatformHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-sand-200 bg-paper/95">
      <div className="container-page flex h-16 items-center gap-3 lg:h-[4.5rem] lg:gap-6">
        <Logo />

        <nav aria-label="Glavna navigacija" className="hidden flex-1 lg:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="nav-link">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto hidden w-64 xl:block">
          <SearchForm id="iskanje-glava" />
        </div>

        <Link
          href={routes.search}
          className="icon-button ml-auto xl:hidden"
          aria-label="Iskanje"
        >
          <SearchIcon />
        </Link>
        <InquiryCount />

        {/* Mobilni meni: izvorni <details>, deluje tudi brez JavaScripta. */}
        <details className="mobile-menu lg:hidden">
          <summary className="icon-button" aria-label="Meni">
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
            </svg>
          </summary>
          <div className="mobile-menu-panel">
            <SearchForm id="iskanje-meni" />
            <nav aria-label="Mobilna navigacija" className="mt-4">
              <ul className="space-y-1">
                {mainNav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="mobile-menu-link">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}

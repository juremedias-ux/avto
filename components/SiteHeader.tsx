import Link from "next/link";
import { nav } from "@/content";
import { JumpToForm } from "@/components/JumpToForm";
import { Logo } from "@/components/Logo";

export const HERO_FORM_ID = "prijava";
export const HERO_FORM_PREFIX = "prijava-zgoraj";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-sand-200 bg-paper/95">
      <div className="container-page flex h-16 items-center justify-between gap-2 sm:h-[4.5rem] sm:gap-3">
        <Logo />
        <nav aria-label="Glavna navigacija" className="flex items-center gap-1 sm:gap-2">
          <ul className="hidden items-center gap-1 md:flex">
            <li>
              <Link href="/#kaj-pripravljamo" className="nav-link">
                {nav.preparing}
              </Link>
            </li>
            <li>
              <Link href="/#pogosta-vprasanja" className="nav-link">
                {nav.faq}
              </Link>
            </li>
          </ul>
          <JumpToForm
            targetId={HERO_FORM_ID}
            inputId={`${HERO_FORM_PREFIX}-email`}
            className="btn-primary btn-small md:ml-3"
          >
            {nav.cta}
          </JumpToForm>
        </nav>
      </div>
    </header>
  );
}

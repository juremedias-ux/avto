import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Stran ne obstaja",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="vsebina" tabIndex={-1} className="container-page py-24 outline-none sm:py-32">
        <p className="eyebrow">Napaka 404</p>
        <h1 className="display-2 mt-4">Te strani ni.</h1>
        <p className="lead mt-5 max-w-xl">Povezava je morda napačna ali zastarela.</p>
        <p className="mt-8">
          <Link href="/" className="text-link">
            Na začetno stran
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}

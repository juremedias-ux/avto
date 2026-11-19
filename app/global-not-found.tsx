import type { Metadata } from "next";
import { NotFoundContent } from "@/components/NotFoundContent";
import { figtree } from "@/lib/fonts";
import { getSiteUrl } from "@/lib/site";
import "./(frontend)/globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: "Stran ne obstaja | GradimoCamper",
  robots: { index: false, follow: false },
};

/** Stran 404 za naslove, ki ne ustrezajo nobeni poti (dve korenski postavitvi). */
export default function GlobalNotFound() {
  return (
    <html lang="sl" className={figtree.variable}>
      <body>
        <a href="#vsebina" className="skip-link">
          Preskoči na vsebino
        </a>
        <NotFoundContent />
      </body>
    </html>
  );
}

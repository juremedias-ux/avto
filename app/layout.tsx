import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { brand, hero } from "@/content";
import { getSiteUrl, isIndexingAllowed } from "@/lib/site";
import "./globals.css";

// Pisava se prenese ob gradnji in streže z lastne domene (brez zahtev do Googla v brskalniku).
const figtree = Figtree({
  subsets: ["latin", "latin-ext"],
  variable: "--font-figtree",
  display: "swap",
});

const title = `${brand.name} – ${hero.title}`;

export function generateMetadata(): Metadata {
  const indexing = isIndexingAllowed();
  return {
    metadataBase: getSiteUrl(),
    title: { default: title, template: `%s | ${brand.name}` },
    description: brand.description,
    applicationName: brand.name,
    alternates: { canonical: "/" },
    robots: indexing
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: "sl_SI",
      siteName: brand.name,
      title,
      description: brand.description,
      url: "/",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: brand.description,
    },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#faf7f1",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sl" className={figtree.variable}>
      <body>
        <a href="#vsebina" className="skip-link">
          Preskoči na vsebino
        </a>
        {children}
      </body>
    </html>
  );
}

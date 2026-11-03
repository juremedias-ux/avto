import type { Metadata } from "next";

// Administracija se vedno izriše ob zahtevi (brez statične gradnje in predpomnjenja).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administracija",
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: null },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-dvh bg-paper">{children}</div>;
}

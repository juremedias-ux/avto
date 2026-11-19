import type { Metadata } from "next";
import { NotFoundContent } from "@/components/NotFoundContent";

export const metadata: Metadata = {
  title: "Stran ne obstaja",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function NotFound() {
  return <NotFoundContent />;
}

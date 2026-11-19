import config from "@payload-config";
import { generatePageMetadata, NotFoundPage } from "@payloadcms/next/views";
import type { Metadata } from "next";
import { isCmsConfigured } from "@/lib/cms-env";
import { importMap } from "../importMap.js";

type Args = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] }>;
};

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  isCmsConfigured() ? generatePageMetadata({ config, params, searchParams }) : Promise.resolve({ title: "Te strani ni" });

/** Brez nastavitev urejevalnika vsebino strani 404 izriše postavitev (layout.tsx). */
export default function NotFound({ params, searchParams }: Args) {
  if (!isCmsConfigured()) return null;
  return NotFoundPage({ config, params, searchParams, importMap });
}

import config from "@payload-config";
import { generatePageMetadata, RootPage } from "@payloadcms/next/views";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isCmsConfigured } from "@/lib/cms-env";
import { importMap } from "../importMap.js";

type Args = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] }>;
};

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  isCmsConfigured() ? generatePageMetadata({ config, params, searchParams }) : Promise.resolve({});

/** Urejevalnik. Dokler ni nastavljen (DATABASE_URL, PAYLOAD_SECRET), stran ne obstaja. */
export default function Page({ params, searchParams }: Args) {
  if (!isCmsConfigured()) notFound();
  return RootPage({ config, params, searchParams, importMap });
}

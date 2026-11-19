/* Postavitev urejevalnika Payload (/cms). Ločena korenska postavitev od javne strani. */
import config from "@payload-config";
import "@payloadcms/next/css";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import type { ServerFunctionClient } from "payload";
import Link from "next/link";
import type React from "react";
import { isCmsConfigured } from "@/lib/cms-env";
import { importMap } from "./cms/importMap.js";
import "./custom.scss";

type Args = { children: React.ReactNode };

const serverFunction: ServerFunctionClient = async function (args) {
  "use server";
  return handleServerFunctions({ ...args, config, importMap });
};

export default function Layout({ children }: Args) {
  // Brez nastavitev (DATABASE_URL, PAYLOAD_SECRET) urejevalnik ne obstaja.
  if (!isCmsConfigured()) {
    return (
      <html lang="sl">
        <body style={{ fontFamily: "system-ui, sans-serif", padding: "4rem 1.5rem", maxWidth: "40rem", margin: "0 auto" }}>
          <h1>Te strani ni.</h1>
          <p>
            <Link href="/">Na začetno stran</Link>
          </p>
          {children}
        </body>
      </html>
    );
  }
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction} htmlProps={{ lang: "sl" }}>
      {children}
    </RootLayout>
  );
}

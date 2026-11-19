import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { en } from "@payloadcms/translations/languages/en";
import { sl } from "@payloadcms/translations/languages/sl";
import { buildConfig } from "payload";
import sharp from "sharp";
import { Editors } from "./cms/collections/editors";
import { Inquiries } from "./cms/collections/inquiries";
import { Articles, LearningPaths, Videos } from "./cms/collections/learning";
import { Products } from "./cms/collections/products";
import { ProductCategories, Stages, Topics } from "./cms/collections/taxonomy";
import { Documents, Media, VideoFiles } from "./cms/collections/uploads";
import { AboutPage, HomePage } from "./cms/globals";
import { migrations } from "./cms/migrations";
import { databasePoolConfig } from "./lib/cms-env";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const allowedOrigins = [
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined,
  process.env.NODE_ENV !== "production" ? "http://localhost:3000" : undefined,
].filter((v): v is string => Boolean(v));

/**
 * Urejevalnik vsebin GradimoCamper (Payload CMS).
 * - urejanje na /cms, podatki v obstoječi bazi Supabase (shema "cms"),
 * - datoteke v Vercel Blob (nalaganje neposredno iz brskalnika),
 * - brez GraphQL, brez telemetrije.
 */
export default buildConfig({
  secret: process.env.PAYLOAD_SECRET ?? "",
  telemetry: false,
  routes: { admin: "/cms", api: "/api" },
  graphQL: { disable: true },
  csrf: allowedOrigins,
  admin: {
    user: Editors.slug,
    meta: { titleSuffix: " – GradimoCamper CMS" },
    importMap: { baseDir: dirname },
    dateFormat: "d. M. yyyy HH:mm",
    components: { beforeDashboard: ["/cms/components/SeedButton#SeedButton"] },
  },
  endpoints: [
    {
      // POST /api/vzorcne-vsebine: samo za prijavljene urednike.
      path: "/vzorcne-vsebine",
      method: "post",
      handler: async (req) => {
        if (!req.user) return Response.json({ napaka: "Potrebna je prijava." }, { status: 401 });
        const { seedSampleContent } = await import("./cms/seed");
        try {
          const origin = req.url ? new URL(req.url).origin : null;
          return Response.json(await seedSampleContent(req.payload, { origin }));
        } catch {
          req.payload.logger.error("[vzorci] ustvarjanje vzorčnih vsebin ni uspelo");
          return Response.json({ napaka: "Ustvarjanje ni uspelo." }, { status: 500 });
        }
      },
    },
  ],
  i18n: { supportedLanguages: { sl, en }, fallbackLanguage: "sl" },
  collections: [
    Articles,
    Videos,
    LearningPaths,
    Products,
    ProductCategories,
    Inquiries,
    Stages,
    Topics,
    Media,
    VideoFiles,
    Documents,
    Editors,
  ],
  globals: [HomePage, AboutPage],
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: databasePoolConfig(),
    schemaName: "cms",
    migrationDir: path.resolve(dirname, "cms/migrations"),
    prodMigrations: migrations,
    push: false,
  }),
  sharp,
  upload: { limits: { fileSize: 60_000_000 } },
  plugins: [
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      // Shema baze je enaka ne glede na to, ali je shramba vklopljena.
      alwaysInsertFields: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      clientUploads: true,
      addRandomSuffix: true,
      collections: {
        mediji: { disablePayloadAccessControl: true },
        "video-datoteke": { disablePayloadAccessControl: true },
        datoteke: { disablePayloadAccessControl: true },
      },
    }),
  ],
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
});

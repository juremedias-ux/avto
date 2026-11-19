import config from "@payload-config";
import "@payloadcms/next/css";
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from "@payloadcms/next/routes";
import { isCmsConfigured } from "@/lib/cms-env";

type Handler = (request: Request, context: { params: Promise<{ slug: string[] }> }) => Promise<Response>;

/** Dokler urejevalnik ni nastavljen, API vrne 404 brez podrobnosti. */
function guard(handler: Handler): Handler {
  return (request, context) =>
    isCmsConfigured() ? handler(request, context) : Promise.resolve(Response.json({ napaka: "Ni najdeno." }, { status: 404 }));
}

export const GET = guard(REST_GET(config));
export const POST = guard(REST_POST(config));
export const DELETE = guard(REST_DELETE(config));
export const PATCH = guard(REST_PATCH(config));
export const PUT = guard(REST_PUT(config));
export const OPTIONS = guard(REST_OPTIONS(config));

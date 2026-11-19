import type { CollectionConfig } from "payload";
import { editorsOnly, publicOrEditor } from "@/cms/access";

/** Slike za članke, izdelke in naslovnice. */
export const Media: CollectionConfig = {
  slug: "mediji",
  labels: { singular: "Slika", plural: "Slike" },
  admin: { group: "Datoteke", useAsTitle: "alt" },
  access: { read: publicOrEditor, create: editorsOnly, update: editorsOnly, delete: editorsOnly },
  upload: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    focalPoint: true,
  },
  fields: [
    {
      name: "alt",
      label: "Opis slike (za bralnike zaslona in iskalnike)",
      type: "text",
      required: true,
    },
    {
      name: "avtorstvo",
      label: "Avtor oziroma vir in pravice za uporabo",
      type: "text",
      admin: { description: "Npr. »Lastna fotografija« ali »Z dovoljenjem proizvajalca X«." },
    },
  ],
};

/** Kratki video posnetki, naloženi na platformo (daljše objavi na YouTubu). */
export const VideoFiles: CollectionConfig = {
  slug: "video-datoteke",
  labels: { singular: "Video datoteka", plural: "Video datoteke" },
  admin: {
    group: "Datoteke",
    useAsTitle: "naslov",
    description:
      "Brezplačni paket Vercel Blob ima 1 GB prostora in 10 GB prenosa na mesec. Nalagaj samo kratke posnetke (MP4, do ~50 MB); daljše objavi na YouTubu.",
  },
  access: { read: publicOrEditor, create: editorsOnly, update: editorsOnly, delete: editorsOnly },
  upload: { mimeTypes: ["video/mp4", "video/webm"] },
  fields: [{ name: "naslov", label: "Naslov", type: "text", required: true }],
};

/** Dokumenti: kontrolni seznami (PDF) in podnapisi (VTT). */
export const Documents: CollectionConfig = {
  slug: "datoteke",
  labels: { singular: "Dokument", plural: "Dokumenti" },
  admin: { group: "Datoteke", useAsTitle: "naslov" },
  access: { read: publicOrEditor, create: editorsOnly, update: editorsOnly, delete: editorsOnly },
  upload: { mimeTypes: ["application/pdf", "text/vtt"] },
  fields: [
    { name: "naslov", label: "Naslov", type: "text", required: true },
    { name: "opis", label: "Kratek opis", type: "textarea" },
  ],
};

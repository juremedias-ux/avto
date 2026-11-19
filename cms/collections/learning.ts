import type { CollectionConfig, Field } from "payload";
import { youtubeIdFromUrl } from "@/lib/youtube";
import { editorsOnly, publishedOrEditor } from "@/cms/access";
import {
  difficultyField,
  sampleField,
  seoField,
  slugField,
  stageField,
  topicsField,
} from "@/cms/fields";

const summaryField: Field = {
  name: "povzetek",
  label: "Povzetek (2–3 povedi, prikaže se na karticah in v iskalnikih)",
  type: "textarea",
  required: true,
  maxLength: 320,
};

const takeawaysField: Field = {
  name: "kljucniPoudarki",
  label: "Ključni poudarki",
  type: "array",
  fields: [{ name: "besedilo", label: "Poudarek", type: "text", required: true }],
};

const safetyField: Field = {
  name: "varnostnaOpomba",
  label: "Varnostna opomba (neobvezno)",
  type: "textarea",
  admin: { description: "Prikaže se v izpostavljenem okvirju, npr. pri elektriki ali plinu." },
};

const relatedFields: Field[] = [
  {
    name: "kontrolniSeznami",
    label: "Prenosljivi kontrolni seznami (PDF)",
    type: "upload",
    relationTo: "datoteke",
    hasMany: true,
  },
  {
    name: "izdelki",
    label: "Izdelki iz tega vodiča",
    type: "relationship",
    relationTo: "izdelki",
    hasMany: true,
  },
  {
    name: "sorodno",
    label: "Sorodni članki in videi",
    type: "relationship",
    relationTo: ["clanki", "videi"],
    hasMany: true,
  },
];

/** Članki in vodiči. */
export const Articles: CollectionConfig = {
  slug: "clanki",
  labels: { singular: "Članek", plural: "Članki" },
  admin: {
    group: "Učenje",
    useAsTitle: "naslov",
    defaultColumns: ["naslov", "faza", "zahtevnost", "_status", "updatedAt"],
  },
  versions: { drafts: true, maxPerDoc: 20 },
  access: { read: publishedOrEditor, create: editorsOnly, update: editorsOnly, delete: editorsOnly },
  fields: [
    { name: "naslov", label: "Naslov", type: "text", required: true },
    slugField(),
    summaryField,
    { name: "naslovnaSlika", label: "Naslovna slika", type: "upload", relationTo: "mediji" },
    {
      name: "casBranja",
      label: "Čas branja (minute)",
      type: "number",
      min: 1,
      required: true,
      admin: { position: "sidebar" },
    },
    difficultyField,
    stageField,
    topicsField,
    { name: "vsebina", label: "Vsebina", type: "richText", required: true },
    takeawaysField,
    safetyField,
    ...relatedFields,
    sampleField,
    seoField,
  ],
};

/** Video lekcije: naložen kratek posnetek ali povezava na YouTube. */
export const Videos: CollectionConfig = {
  slug: "videi",
  labels: { singular: "Video lekcija", plural: "Video lekcije" },
  admin: {
    group: "Učenje",
    useAsTitle: "naslov",
    defaultColumns: ["naslov", "vir", "faza", "_status", "updatedAt"],
  },
  versions: { drafts: true, maxPerDoc: 20 },
  access: { read: publishedOrEditor, create: editorsOnly, update: editorsOnly, delete: editorsOnly },
  fields: [
    { name: "naslov", label: "Naslov", type: "text", required: true },
    slugField(),
    summaryField,
    {
      name: "vir",
      label: "Vir videa",
      type: "radio",
      required: true,
      defaultValue: "youtube",
      options: [
        { label: "YouTube (priporočeno za daljše videe)", value: "youtube" },
        { label: "Naložena datoteka (kratki posnetki)", value: "datoteka" },
        { label: "Video še ni pripravljen", value: "ni" },
      ],
    },
    {
      name: "youtube",
      label: "Povezava YouTube",
      type: "text",
      admin: { condition: (_d, s) => s?.vir === "youtube", description: "Npr. https://www.youtube.com/watch?v=…" },
      validate: (value: unknown, { siblingData }: { siblingData: Record<string, unknown> }) => {
        if (siblingData?.vir !== "youtube") return true;
        return typeof value === "string" && youtubeIdFromUrl(value)
          ? true
          : "Vpiši veljavno povezavo na video YouTube.";
      },
    },
    {
      name: "datoteka",
      label: "Video datoteka",
      type: "upload",
      relationTo: "video-datoteke",
      admin: { condition: (_d, s) => s?.vir === "datoteka" },
    },
    {
      name: "podnapisi",
      label: "Podnapisi (VTT, za naloženo datoteko)",
      type: "upload",
      relationTo: "datoteke",
      admin: { condition: (_d, s) => s?.vir === "datoteka" },
    },
    { name: "poster", label: "Naslovna slika videa", type: "upload", relationTo: "mediji" },
    {
      name: "trajanje",
      label: "Trajanje (minute)",
      type: "number",
      min: 1,
      required: true,
      admin: { position: "sidebar" },
    },
    difficultyField,
    stageField,
    topicsField,
    {
      name: "poglavja",
      label: "Poglavja (časovni zaznamki)",
      type: "array",
      fields: [
        { name: "cas", label: "Čas (npr. 02:15)", type: "text", required: true },
        { name: "naslov", label: "Naslov", type: "text", required: true },
      ],
    },
    { name: "opis", label: "Opis in navodila", type: "richText" },
    {
      name: "prepis",
      label: "Prepis govora",
      type: "textarea",
      admin: { description: "Za dostopnost: celotno besedilo, ki se v videu izgovori." },
    },
    takeawaysField,
    safetyField,
    ...relatedFields,
    sampleField,
    seoField,
  ],
};

/** Učne poti: urejeno zaporedje člankov in videov. */
export const LearningPaths: CollectionConfig = {
  slug: "ucne-poti",
  labels: { singular: "Učna pot", plural: "Učne poti" },
  admin: { group: "Učenje", useAsTitle: "naslov", defaultColumns: ["naslov", "_status", "updatedAt"] },
  versions: { drafts: true, maxPerDoc: 20 },
  access: { read: publishedOrEditor, create: editorsOnly, update: editorsOnly, delete: editorsOnly },
  fields: [
    { name: "naslov", label: "Naslov", type: "text", required: true },
    slugField("naslov", ["nacrt-gradnje"]),
    { name: "opis", label: "Opis", type: "textarea", required: true },
    { name: "zaKoga", label: "Za koga je", type: "text" },
    {
      name: "koraki",
      label: "Koraki",
      type: "array",
      minRows: 1,
      required: true,
      fields: [
        {
          name: "vsebina",
          label: "Članek ali video",
          type: "relationship",
          relationTo: ["clanki", "videi"],
          required: true,
        },
        { name: "opomba", label: "Opomba za ta korak", type: "text" },
      ],
    },
    {
      name: "izpostavljena",
      label: "Prikaži kot »Začni tukaj«",
      type: "checkbox",
      defaultValue: false,
      admin: { position: "sidebar" },
    },
    sampleField,
    seoField,
  ],
};

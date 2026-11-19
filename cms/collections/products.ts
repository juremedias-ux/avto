import type { CollectionConfig } from "payload";
import { editorsOnly, publishedOrEditor } from "@/cms/access";
import { sampleField, seoField, slugField } from "@/cms/fields";

export const PRODUCT_STATUS = [
  { label: "Na zalogi", value: "na-zalogi" },
  { label: "Predprodaja", value: "predprodaja" },
  { label: "Na povpraševanje", value: "na-povprasevanje" },
  { label: "Kmalu na voljo", value: "kmalu" },
] as const;

export const INSTALL_DIFFICULTY = [
  { label: "Preprosta vgradnja", value: "preprosta" },
  { label: "Potrebno nekaj izkušenj", value: "srednja" },
  { label: "Priporočena strokovna vgradnja", value: "strokovna" },
] as const;

/** Izdelki v katalogu (brez spletnega plačila: povpraševanje, vprašanje, rezervacija). */
export const Products: CollectionConfig = {
  slug: "izdelki",
  labels: { singular: "Izdelek", plural: "Izdelki" },
  admin: {
    group: "Izdelki",
    useAsTitle: "naziv",
    defaultColumns: ["naziv", "kategorija", "stanje", "_status", "updatedAt"],
  },
  versions: { drafts: true, maxPerDoc: 20 },
  access: { read: publishedOrEditor, create: editorsOnly, update: editorsOnly, delete: editorsOnly },
  fields: [
    { name: "naziv", label: "Naziv", type: "text", required: true },
    slugField("naziv"),
    {
      name: "kategorija",
      label: "Kategorija",
      type: "relationship",
      relationTo: "kategorije-izdelkov",
      required: true,
      admin: { position: "sidebar" },
    },
    {
      name: "faze",
      label: "Faze gradnje",
      type: "relationship",
      relationTo: "faze",
      hasMany: true,
      admin: { position: "sidebar" },
    },
    {
      name: "galerija",
      label: "Slike",
      type: "upload",
      relationTo: "mediji",
      hasMany: true,
    },
    {
      name: "kratekOpis",
      label: "Kratek opis (korist za uporabnika, 1–2 povedi)",
      type: "textarea",
      required: true,
      maxLength: 280,
    },
    { name: "opis", label: "Podroben opis", type: "richText" },
    {
      name: "tehnicniPodatki",
      label: "Tehnični podatki",
      type: "array",
      fields: [
        { name: "lastnost", label: "Lastnost", type: "text", required: true },
        { name: "vrednost", label: "Vrednost", type: "text", required: true },
      ],
    },
    {
      name: "zdruzljivost",
      label: "Združljivost",
      type: "textarea",
      admin: { description: "S čim izdelek deluje in s čim ne (sistemi, napetosti, vozila)." },
    },
    {
      name: "primeriUporabe",
      label: "Primeri uporabe",
      type: "array",
      fields: [{ name: "besedilo", label: "Primer", type: "text", required: true }],
    },
    {
      name: "zahtevnostVgradnje",
      label: "Zahtevnost vgradnje",
      type: "select",
      required: true,
      defaultValue: "srednja",
      options: [...INSTALL_DIFFICULTY],
      admin: { position: "sidebar" },
    },
    {
      name: "stanje",
      label: "Stanje",
      type: "select",
      required: true,
      defaultValue: "na-povprasevanje",
      options: [...PRODUCT_STATUS],
      admin: { position: "sidebar" },
    },
    {
      name: "cena",
      label: "Cena v EUR z DDV (prazno = cena na povpraševanje)",
      type: "number",
      min: 0,
      admin: { position: "sidebar", step: 0.01 },
    },
    {
      name: "vodici",
      label: "Vodiči za izbiro in vgradnjo",
      type: "relationship",
      relationTo: ["clanki", "videi"],
      hasMany: true,
    },
    {
      name: "pogostaVprasanja",
      label: "Pogosta vprašanja",
      type: "array",
      fields: [
        { name: "vprasanje", label: "Vprašanje", type: "text", required: true },
        { name: "odgovor", label: "Odgovor", type: "textarea", required: true },
      ],
    },
    sampleField,
    seoField,
  ],
};

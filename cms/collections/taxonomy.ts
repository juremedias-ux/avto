import type { CollectionConfig } from "payload";
import { editorsOnly, publicOrEditor } from "@/cms/access";
import { slugField } from "@/cms/fields";

/** Faze gradnje (hrbtenica učenja in izdelkov). */
export const Stages: CollectionConfig = {
  slug: "faze",
  labels: { singular: "Faza gradnje", plural: "Faze gradnje" },
  admin: { group: "Razvrščanje", useAsTitle: "naziv", defaultColumns: ["stevilka", "naziv"] },
  defaultSort: "stevilka",
  access: { read: publicOrEditor, create: editorsOnly, update: editorsOnly, delete: editorsOnly },
  fields: [
    { name: "naziv", label: "Naziv", type: "text", required: true },
    slugField("naziv"),
    {
      name: "stevilka",
      label: "Zaporedna številka",
      type: "number",
      required: true,
      min: 1,
      admin: { position: "sidebar" },
    },
    { name: "kratekOpis", label: "Kratek opis (ena poved)", type: "text", required: true },
    { name: "opis", label: "Opis faze", type: "textarea" },
    {
      name: "cilji",
      label: "Kaj imaš ob koncu faze",
      type: "array",
      fields: [{ name: "besedilo", label: "Besedilo", type: "text", required: true }],
    },
  ],
};

/** Teme (izolacija, elektrika, voda …). */
export const Topics: CollectionConfig = {
  slug: "teme",
  labels: { singular: "Tema", plural: "Teme" },
  admin: { group: "Razvrščanje", useAsTitle: "naziv" },
  defaultSort: "naziv",
  access: { read: publicOrEditor, create: editorsOnly, update: editorsOnly, delete: editorsOnly },
  fields: [
    { name: "naziv", label: "Naziv", type: "text", required: true },
    slugField("naziv"),
    { name: "opis", label: "Kratek opis", type: "textarea" },
  ],
};

/** Kategorije izdelkov. */
export const ProductCategories: CollectionConfig = {
  slug: "kategorije-izdelkov",
  labels: { singular: "Kategorija izdelkov", plural: "Kategorije izdelkov" },
  admin: { group: "Izdelki", useAsTitle: "naziv", defaultColumns: ["naziv", "vrstniRed"] },
  defaultSort: "vrstniRed",
  access: { read: publicOrEditor, create: editorsOnly, update: editorsOnly, delete: editorsOnly },
  fields: [
    { name: "naziv", label: "Naziv", type: "text", required: true },
    slugField("naziv"),
    { name: "opis", label: "Opis", type: "textarea" },
    { name: "slika", label: "Slika", type: "upload", relationTo: "mediji" },
    {
      name: "vodic",
      label: "Vodič »Kako izbrati« (neobvezno)",
      type: "relationship",
      relationTo: "clanki",
    },
    {
      name: "vrstniRed",
      label: "Vrstni red",
      type: "number",
      defaultValue: 10,
      admin: { position: "sidebar" },
    },
  ],
};

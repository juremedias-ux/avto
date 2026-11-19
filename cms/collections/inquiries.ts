import type { CollectionConfig } from "payload";
import { editorsOnly } from "@/cms/access";

export const INQUIRY_TYPES = [
  { label: "Povpraševanje za ponudbo", value: "povprasevanje" },
  { label: "Vprašanje", value: "vprasanje" },
  { label: "Rezervacija", value: "rezervacija" },
] as const;

/**
 * Povpraševanja in vprašanja obiskovalcev. Ustvari jih samo strežnik
 * (obrazec na /povprasevanje); javnega zapisovanja prek API ni.
 */
export const Inquiries: CollectionConfig = {
  slug: "povprasevanja",
  labels: { singular: "Povpraševanje", plural: "Povpraševanja" },
  admin: {
    group: "Povpraševanja",
    useAsTitle: "email",
    defaultColumns: ["email", "vrsta", "stanje", "createdAt"],
    description: "Povpraševanja in vprašanja z obrazca. Odgovori po e-pošti in posodobi stanje.",
  },
  defaultSort: "-createdAt",
  access: { read: editorsOnly, create: () => false, update: editorsOnly, delete: editorsOnly },
  fields: [
    {
      name: "vrsta",
      label: "Vrsta",
      type: "select",
      required: true,
      defaultValue: "povprasevanje",
      options: [...INQUIRY_TYPES],
    },
    { name: "ime", label: "Ime", type: "text" },
    { name: "email", label: "E-poštni naslov", type: "email", required: true },
    { name: "sporocilo", label: "Sporočilo", type: "textarea" },
    {
      name: "izdelki",
      label: "Izdelki",
      type: "array",
      fields: [
        { name: "izdelek", label: "Izdelek", type: "relationship", relationTo: "izdelki" },
        { name: "naziv", label: "Naziv ob oddaji", type: "text" },
        { name: "kolicina", label: "Količina", type: "number", min: 1, defaultValue: 1 },
      ],
    },
    {
      name: "stanje",
      label: "Stanje obravnave",
      type: "select",
      required: true,
      defaultValue: "nova",
      options: [
        { label: "Novo", value: "nova" },
        { label: "V obdelavi", value: "v-obdelavi" },
        { label: "Zaključeno", value: "zakljuceno" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "besediloObvestila",
      label: "Različica obvestila o obdelavi podatkov",
      type: "text",
      admin: { readOnly: true, position: "sidebar" },
    },
  ],
};

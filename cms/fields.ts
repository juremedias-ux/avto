import type { Field, FieldHook } from "payload";
import { SLUG_PATTERN, slugify } from "@/lib/slugify";

/** Polje URL, ki se samodejno izpolni iz izbranega polja (npr. naslova). */
export function slugField(fromField = "naslov", reserved: string[] = []): Field {
  const fillFromTitle: FieldHook = ({ value, data }) => {
    if (typeof value === "string" && value.trim()) return slugify(value);
    const source = data?.[fromField];
    return typeof source === "string" ? slugify(source) : value;
  };

  return {
    name: "slug",
    label: "URL (samodejno iz naslova)",
    type: "text",
    unique: true,
    index: true,
    admin: {
      position: "sidebar",
      description: "Del spletnega naslova. Če ga pustiš praznega, se ustvari iz naslova.",
    },
    hooks: { beforeValidate: [fillFromTitle] },
    validate: (value: unknown) => {
      if (typeof value !== "string" || !SLUG_PATTERN.test(value)) return "Uporabi samo male črke, številke in vezaje.";
      if (reserved.includes(value)) return `URL »${value}« je rezerviran za drugo stran. Izberi drugega.`;
      return true;
    },
  };
}

/** Oznaka vzorčne vsebine: na strani se prikaže jasno opozorilo. */
export const sampleField: Field = {
  name: "vzorec",
  label: "Vzorčna vsebina (prikaže opozorilo na strani)",
  type: "checkbox",
  defaultValue: false,
  admin: { position: "sidebar" },
};

/** Naslov in opis za iskalnike in deljenje. */
export const seoField: Field = {
  name: "seo",
  label: "Iskalniki in deljenje",
  type: "group",
  admin: { description: "Neobvezno. Če je prazno, se uporabita naslov in povzetek." },
  fields: [
    { name: "naslov", label: "Naslov za iskalnike", type: "text", maxLength: 70 },
    { name: "opis", label: "Opis za iskalnike", type: "textarea", maxLength: 170 },
  ],
};

export const difficultyOptions = [
  { label: "Začetnik", value: "zacetnik" },
  { label: "Srednje zahtevno", value: "srednje" },
  { label: "Napredno", value: "napredno" },
];

export const difficultyField: Field = {
  name: "zahtevnost",
  label: "Zahtevnost",
  type: "select",
  required: true,
  defaultValue: "zacetnik",
  options: difficultyOptions,
  admin: { position: "sidebar" },
};

export const stageField: Field = {
  name: "faza",
  label: "Faza gradnje",
  type: "relationship",
  relationTo: "faze",
  required: true,
  admin: { position: "sidebar" },
};

export const topicsField: Field = {
  name: "teme",
  label: "Teme",
  type: "relationship",
  relationTo: "teme",
  hasMany: true,
  admin: { position: "sidebar" },
};

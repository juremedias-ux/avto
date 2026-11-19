import type { GlobalConfig } from "payload";

const readPublic: GlobalConfig["access"] = {
  read: ({ req }) => Boolean(req.user) || process.env.PLATFORM_PUBLIC === "true",
  update: ({ req }) => Boolean(req.user),
};

/** Domača stran platforme: besedila in izpostavljene vsebine. */
export const HomePage: GlobalConfig = {
  slug: "domaca-stran",
  label: "Domača stran",
  admin: { group: "Strani" },
  access: readPublic,
  fields: [
    {
      name: "prviZaslon",
      label: "Prvi zaslon",
      type: "group",
      fields: [
        { name: "oznaka", label: "Oznaka nad naslovom", type: "text" },
        { name: "naslov", label: "Glavni naslov", type: "text", required: true },
        { name: "podnaslov", label: "Podnaslov", type: "textarea", required: true },
        { name: "slika", label: "Slika", type: "upload", relationTo: "mediji" },
      ],
    },
    {
      name: "izpostavljeniVodici",
      label: "Izpostavljeni vodiči za začetnike",
      type: "relationship",
      relationTo: ["clanki", "videi"],
      hasMany: true,
      maxRows: 6,
    },
    {
      name: "izpostavljeneKategorije",
      label: "Izpostavljene kategorije izdelkov",
      type: "relationship",
      relationTo: "kategorije-izdelkov",
      hasMany: true,
      maxRows: 6,
    },
    {
      name: "zaupanje",
      label: "Kako delamo (samo resnične navedbe)",
      type: "array",
      maxRows: 4,
      fields: [
        { name: "naslov", label: "Naslov", type: "text", required: true },
        { name: "besedilo", label: "Besedilo", type: "textarea", required: true },
      ],
    },
  ],
};

/** Stran »O nas«. */
export const AboutPage: GlobalConfig = {
  slug: "o-nas",
  label: "O nas",
  admin: { group: "Strani" },
  access: readPublic,
  fields: [
    { name: "naslov", label: "Naslov", type: "text", required: true },
    { name: "uvod", label: "Uvod", type: "textarea" },
    { name: "vsebina", label: "Vsebina", type: "richText" },
  ],
};

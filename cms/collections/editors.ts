import { APIError, type CollectionConfig } from "payload";

const MIN_TOKEN_LENGTH = 16;

/**
 * Uredniki (dostop do /cms). Javne registracije ni.
 *
 * Prvega urednika lahko ustvari samo, kdor pozna CMS_SETUP_TOKEN
 * (nastavitev na strežniku). Brez tega bi lahko prvi račun na prazni
 * bazi ustvaril kdorkoli. Nadaljnje urednike dodajajo samo prijavljeni
 * uredniki.
 */
export const Editors: CollectionConfig = {
  slug: "uredniki",
  labels: { singular: "Urednik", plural: "Uredniki" },
  admin: { useAsTitle: "email", group: "Nastavitve" },
  auth: {
    tokenExpiration: 60 * 60 * 8,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    cookies: { sameSite: "Lax", secure: process.env.NODE_ENV === "production" },
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
    admin: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeChange: [
      async ({ operation, req, data }) => {
        if (operation !== "create" || req.user) return data;
        // Ustvarjanje brez prijave = prvi urednik. Zahtevamo nastavitveni žeton.
        const expected = process.env.CMS_SETUP_TOKEN ?? "";
        const given = typeof data?.nastavitveniZeton === "string" ? data.nastavitveniZeton.trim() : "";
        if (expected.length < MIN_TOKEN_LENGTH || given !== expected) {
          throw new APIError("Napačen ali manjkajoč nastavitveni žeton.", 403, undefined, true);
        }
        return { ...data, nastavitveniZeton: null };
      },
    ],
  },
  fields: [
    { name: "ime", label: "Ime", type: "text" },
    {
      name: "nastavitveniZeton",
      label: "Nastavitveni žeton (samo za prvega urednika)",
      type: "text",
      // Vrednost se nikoli ne shrani (počisti jo spodnji kavelj in beforeChange zgoraj).
      hooks: { beforeChange: [() => null] },
      access: { read: () => false },
      admin: {
        description: "Vrednost spremenljivke CMS_SETUP_TOKEN na strežniku.",
        condition: (_data, _sibling, { user }) => !user,
      },
    },
  ],
};

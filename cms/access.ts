import type { Access, Where } from "payload";

/** Ali je platforma javna. Dokler ni (PLATFORM_PUBLIC ni "true"), vidijo vsebine samo uredniki. */
export function isPlatformPublic(): boolean {
  return process.env.PLATFORM_PUBLIC === "true";
}

const published: Where = { _status: { equals: "published" } };

/** Uredniki vse; obiskovalci samo objavljeno in samo, ko je platforma javna. */
export const publishedOrEditor: Access = ({ req }) => {
  if (req.user) return true;
  return isPlatformPublic() ? published : false;
};

/** Brez osnutkov: uredniki vse, obiskovalci vse, ko je platforma javna. */
export const publicOrEditor: Access = ({ req }) => Boolean(req.user) || isPlatformPublic();

export const editorsOnly: Access = ({ req }) => Boolean(req.user);

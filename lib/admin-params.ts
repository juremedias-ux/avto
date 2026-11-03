import { SEARCH_MAX_LENGTH, type SortOrder } from "@/lib/waitlist";

/** Parametri pregleda v administraciji (iz URL-ja ali skritih polj obrazca). */
export type AdminQuery = {
  search: string;
  page: number;
  sort: SortOrder;
};

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined | null): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function parseAdminQuery(params: RawParams): AdminQuery {
  const pageNumber = Number.parseInt(first(params.stran), 10);
  return {
    search: first(params.iskanje).trim().slice(0, SEARCH_MAX_LENGTH),
    page: Number.isFinite(pageNumber) && pageNumber > 0 ? Math.min(pageNumber, 100000) : 1,
    sort: first(params.razvrsti) === "najstarejse" ? "najstarejse" : "najnovejse",
  };
}

export function adminQueryFromForm(formData: FormData): AdminQuery {
  const get = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  return parseAdminQuery({
    stran: get("stran"),
    iskanje: get("iskanje"),
    razvrsti: get("razvrsti"),
  });
}

/** Sestavi relativni URL administracije (vedno /admin, brez odprtih preusmeritev). */
export function adminUrl(query: Partial<AdminQuery>, notice?: string): string {
  const params = new URLSearchParams();
  if (query.search) params.set("iskanje", query.search);
  if (query.sort && query.sort !== "najnovejse") params.set("razvrsti", query.sort);
  if (query.page && query.page > 1) params.set("stran", String(query.page));
  if (notice) params.set("obvestilo", notice);
  const qs = params.toString();
  return qs ? `/admin?${qs}` : "/admin";
}

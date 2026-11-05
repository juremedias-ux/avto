import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { VideoGrid } from "@/components/video/video-grid";
import { requireAppContext } from "@/lib/auth";
import { VIDEO_STATUSES, type VideoRow } from "@/lib/db/types";
import { format } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { ASPECT_RATIOS, MODEL_IDS, MODELS } from "@/lib/models";
import { videoFiltersSchema } from "@/lib/validation";
import { toVideoCards } from "@/lib/video-view";

const PAGE_SIZE = 24;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.library.title };
}

export default async function LibraryPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await requireAppContext("/library");
  const { t } = await getI18n();
  const filters = videoFiltersSchema.parse(await searchParams);
  const page = filters.page ?? 1;

  let query = ctx.db
    .from("videos")
    .select("*", { count: "exact" })
    .eq("organization_id", ctx.organization.id)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.model) query = query.eq("model", filters.model);
  if (filters.format) query = query.eq("aspect_ratio", filters.format);
  if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00Z`);
  if (filters.to) {
    const end = new Date(`${filters.to}T00:00:00Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    query = query.lt("created_at", end.toISOString());
  }
  const { data, count } = await query.overrideTypes<VideoRow[], { merge: false }>();
  const cards = await toVideoCards(ctx, data ?? []);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...filters, page: p })) if (v !== undefined && v !== "") params.set(k, String(v));
    return `/library?${params.toString()}`;
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t.library.title}</h1>
        <p className="text-sm text-muted-foreground">{t.library.subtitle}</p>
      </div>
      <Card className="py-4">
        <CardContent className="px-4">
          <form method="get" className="grid grid-cols-2 gap-3 md:grid-cols-6 md:items-end">
            <label className="grid gap-1.5 text-xs font-medium">
              {t.library.filterStatus}
              <NativeSelect name="status" defaultValue={filters.status ?? ""}>
                <option value="">{t.common.all}</option>
                {VIDEO_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t.status[s]}
                  </option>
                ))}
              </NativeSelect>
            </label>
            <label className="grid gap-1.5 text-xs font-medium">
              {t.library.filterModel}
              <NativeSelect name="model" defaultValue={filters.model ?? ""}>
                <option value="">{t.common.all}</option>
                {MODEL_IDS.map((m) => (
                  <option key={m} value={m}>
                    {MODELS[m].label}
                  </option>
                ))}
              </NativeSelect>
            </label>
            <label className="grid gap-1.5 text-xs font-medium">
              {t.library.filterFormat}
              <NativeSelect name="format" defaultValue={filters.format ?? ""}>
                <option value="">{t.common.all}</option>
                {ASPECT_RATIOS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </NativeSelect>
            </label>
            <label className="grid gap-1.5 text-xs font-medium">
              {t.library.filterFrom}
              <Input type="date" name="from" defaultValue={filters.from ?? ""} />
            </label>
            <label className="grid gap-1.5 text-xs font-medium">
              {t.library.filterTo}
              <Input type="date" name="to" defaultValue={filters.to ?? ""} />
            </label>
            <div className="col-span-2 flex gap-2 md:col-span-1">
              <Button type="submit" className="flex-1">
                {t.common.apply}
              </Button>
              <Button asChild variant="ghost">
                <Link href="/library">{t.common.clear}</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {cards.length > 0 ? (
        <VideoGrid videos={cards} />
      ) : (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{t.library.empty}</p>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-3 text-sm" aria-label="Pagination">
          {page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(page - 1)}>{t.common.previous}</Link>
            </Button>
          ) : null}
          <span className="text-muted-foreground">
            {format(t.common.page, { page })} / {totalPages}
          </span>
          {page < totalPages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(page + 1)}>{t.common.next}</Link>
            </Button>
          ) : null}
        </nav>
      )}
    </div>
  );
}

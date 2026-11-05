import { Pager } from "@/components/admin/pager";
import { StatusBadge } from "@/components/video/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ADMIN_PAGE_SIZE, adminPage } from "@/lib/admin";
import { requirePlatformAdmin } from "@/lib/auth";
import { VIDEO_STATUSES, type VideoJobRow, type VideoRow } from "@/lib/db/types";
import { formatDateTime, formatUsd } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { modelLabel } from "@/lib/video-view";

type Row = VideoRow & {
  organization: { name: string } | null;
  user: { email: string } | null;
  jobs: Pick<VideoJobRow, "provider_task_id" | "provider_units" | "provider_cost_usd" | "estimated_provider_units" | "status">[];
};

export default async function AdminVideosPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { service } = await requirePlatformAdmin();
  const { t, locale } = await getI18n();
  const params = await searchParams;
  const page = adminPage(params.page);
  const status = VIDEO_STATUSES.find((s) => s === params.status);

  let query = service
    .from("videos")
    .select(
      "*, organization:organizations(name), user:users!videos_user_id_fkey(email), jobs:video_jobs(provider_task_id, provider_units, provider_cost_usd, estimated_provider_units, status)",
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE);
  if (status) query = query.eq("status", status);
  const { data } = await query.overrideTypes<Row[], { merge: false }>();
  const rows = (data ?? []).slice(0, ADMIN_PAGE_SIZE);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t.admin.videos}</h1>
      <form method="get" className="flex max-w-sm gap-2">
        <NativeSelect name="status" defaultValue={status ?? ""} aria-label={t.admin.columns.status}>
          <option value="">{t.common.all}</option>
          {VIDEO_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t.status[s]}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit" variant="secondary">
          {t.common.apply}
        </Button>
      </form>
      <Card className="py-2">
        <CardContent className="px-2 sm:px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.admin.columns.created}</TableHead>
                <TableHead>{t.admin.columns.status}</TableHead>
                <TableHead>{t.admin.columns.organization}</TableHead>
                <TableHead>{t.admin.columns.model}</TableHead>
                <TableHead>{t.admin.columns.duration}</TableHead>
                <TableHead className="text-right">{t.admin.columns.credits}</TableHead>
                <TableHead className="text-right">{t.admin.columns.providerUnits}</TableHead>
                <TableHead className="text-right">{t.admin.columns.providerCost}</TableHead>
                <TableHead>Kling task</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((v) => {
                const job = v.jobs[0];
                const actual = job?.provider_units !== null && job?.provider_units !== undefined;
                return (
                  <TableRow key={v.id} className={v.deleted_at ? "opacity-60" : undefined}>
                    <TableCell>{formatDateTime(v.created_at, locale)}</TableCell>
                    <TableCell>
                      <StatusBadge status={v.status} label={t.status[v.status]} />
                      {v.error_code && <div className="mt-1 text-xs text-destructive">{v.error_code}</div>}
                    </TableCell>
                    <TableCell>
                      {v.organization?.name ?? "—"}
                      <div className="text-xs text-muted-foreground">{v.user?.email}</div>
                    </TableCell>
                    <TableCell>
                      {modelLabel(v.model)}
                      <div className="text-xs text-muted-foreground">
                        {v.resolution} · {v.aspect_ratio}
                        {v.audio ? " · audio" : ""}
                      </div>
                    </TableCell>
                    <TableCell>{v.duration_seconds} s</TableCell>
                    <TableCell className="text-right">
                      {v.credits_charged - v.credits_refunded}/{v.credits_cost}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(job?.provider_units ?? job?.estimated_provider_units ?? 0).toFixed(2)}
                      {!actual && <div className="text-xs text-muted-foreground">{t.admin.estimated}</div>}
                    </TableCell>
                    <TableCell className="text-right">{job?.provider_cost_usd !== null && job?.provider_cost_usd !== undefined ? formatUsd(Number(job.provider_cost_usd), locale) : "—"}</TableCell>
                    <TableCell className="max-w-40 truncate font-mono text-xs">{job?.provider_task_id ?? "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Pager basePath="/admin/videos" page={page} hasNext={(data ?? []).length > ADMIN_PAGE_SIZE} params={{ status }} />
    </>
  );
}

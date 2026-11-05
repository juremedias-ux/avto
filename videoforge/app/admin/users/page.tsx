import { AdjustCreditsForm, UserStatusForm } from "@/components/admin/forms";
import { Pager } from "@/components/admin/pager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ADMIN_PAGE_SIZE, adminPage, ilikeTerm } from "@/lib/admin";
import { requirePlatformAdmin } from "@/lib/auth";
import type { UserRow } from "@/lib/db/types";
import { formatDate, formatUsd } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

type Stats = {
  user_id: string;
  video_count: number;
  succeeded_count: number;
  failed_count: number;
  credits_spent: number;
  provider_units: number;
  provider_cost_usd: number;
};

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { service } = await requirePlatformAdmin();
  const { t, locale } = await getI18n();
  const params = await searchParams;
  const page = adminPage(params.page);
  const term = ilikeTerm(params.q);

  let query = service
    .from("users")
    .select("*, personal:organizations!organizations_owner_id_fkey(id, credit_balance, is_personal)")
    .order("created_at", { ascending: false })
    .range((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE);
  if (term) query = query.or(`email.ilike.${term},full_name.ilike.${term}`);
  const { data } = await query.overrideTypes<
    (UserRow & { personal: { id: string; credit_balance: number; is_personal: boolean }[] })[],
    { merge: false }
  >();
  const rows = (data ?? []).slice(0, ADMIN_PAGE_SIZE);
  const { data: stats } = rows.length
    ? await service.rpc("admin_user_stats", { p_user_ids: rows.map((u) => u.id) })
    : { data: [] };
  const byUser = new Map(((stats ?? []) as Stats[]).map((s) => [s.user_id, s]));

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t.admin.users}</h1>
      <form method="get" className="flex max-w-md gap-2">
        <Input name="q" defaultValue={params.q ?? ""} placeholder={t.admin.search} aria-label={t.admin.search} />
        <Button type="submit" variant="secondary">
          {t.common.apply}
        </Button>
      </form>
      <Card className="py-2">
        <CardContent className="px-2 sm:px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.admin.columns.user}</TableHead>
                <TableHead>{t.admin.columns.status}</TableHead>
                <TableHead className="text-right">{t.admin.columns.videos}</TableHead>
                <TableHead className="text-right">{t.admin.columns.creditsSpent}</TableHead>
                <TableHead className="text-right">{t.admin.columns.providerUnits}</TableHead>
                <TableHead className="text-right">{t.admin.columns.providerCost}</TableHead>
                <TableHead>{t.admin.columns.created}</TableHead>
                <TableHead>{t.common.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => {
                const s = byUser.get(u.id);
                const personal = u.personal.find((o) => o.is_personal);
                return (
                  <TableRow key={u.id} className="align-top">
                    <TableCell>
                      <div className="font-medium">{u.full_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                      {u.is_platform_admin && <Badge variant="destructive">admin</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.status === "active" ? "success" : u.status === "suspended" ? "warning" : "destructive"}>
                        {t.admin.statuses[u.status]}
                      </Badge>
                      {u.status_reason && <div className="mt-1 max-w-40 truncate text-xs text-muted-foreground">{u.status_reason}</div>}
                    </TableCell>
                    <TableCell className="text-right">
                      {s?.video_count ?? 0}
                      <div className="text-xs text-muted-foreground">
                        ✓{s?.succeeded_count ?? 0} ✗{s?.failed_count ?? 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{s?.credits_spent ?? 0}</TableCell>
                    <TableCell className="text-right">{Number(s?.provider_units ?? 0).toFixed(1)}</TableCell>
                    <TableCell className="text-right">{formatUsd(Number(s?.provider_cost_usd ?? 0), locale)}</TableCell>
                    <TableCell>{formatDate(u.created_at, locale)}</TableCell>
                    <TableCell className="grid min-w-80 gap-3 whitespace-normal">
                      <UserStatusForm userId={u.id} status={u.status} />
                      {personal && (
                        <div className="grid gap-1">
                          <span className="text-xs text-muted-foreground">
                            {t.settings.personal}: {personal.credit_balance}
                          </span>
                          <AdjustCreditsForm organizationId={personal.id} />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Pager basePath="/admin/users" page={page} hasNext={(data ?? []).length > ADMIN_PAGE_SIZE} params={{ q: params.q }} />
    </>
  );
}

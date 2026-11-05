import { AdjustCreditsForm } from "@/components/admin/forms";
import { Pager } from "@/components/admin/pager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ADMIN_PAGE_SIZE, adminPage, ilikeTerm } from "@/lib/admin";
import { requirePlatformAdmin } from "@/lib/auth";
import type { OrganizationRow } from "@/lib/db/types";
import { formatDate, formatUsd } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

type OrgStats = { organization_id: string; member_count: number; video_count: number; credits_spent: number; provider_cost_usd: number };

export default async function AdminOrganizationsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { service } = await requirePlatformAdmin();
  const { t, locale } = await getI18n();
  const params = await searchParams;
  const page = adminPage(params.page);
  const term = ilikeTerm(params.q);

  let query = service
    .from("organizations")
    .select("*, owner:users!organizations_owner_id_fkey(email)")
    .order("created_at", { ascending: false })
    .range((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE);
  if (term) query = query.ilike("name", term.replaceAll("*", "%"));
  const { data } = await query.overrideTypes<(OrganizationRow & { owner: { email: string } | null })[], { merge: false }>();
  const rows = (data ?? []).slice(0, ADMIN_PAGE_SIZE);
  const { data: stats } = rows.length
    ? await service.rpc("admin_organization_stats", { p_organization_ids: rows.map((o) => o.id) })
    : { data: [] };
  const byOrg = new Map(((stats ?? []) as OrgStats[]).map((s) => [s.organization_id, s]));

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t.admin.organizations}</h1>
      <form method="get" className="flex max-w-md gap-2">
        <Input name="q" defaultValue={params.q ?? ""} placeholder={t.admin.columns.organization} aria-label={t.admin.columns.organization} />
        <Button type="submit" variant="secondary">
          {t.common.apply}
        </Button>
      </form>
      <Card className="py-2">
        <CardContent className="px-2 sm:px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.admin.columns.organization}</TableHead>
                <TableHead className="text-right">{t.admin.columns.members}</TableHead>
                <TableHead className="text-right">{t.admin.columns.balance}</TableHead>
                <TableHead className="text-right">{t.admin.columns.videos}</TableHead>
                <TableHead className="text-right">{t.admin.columns.creditsSpent}</TableHead>
                <TableHead className="text-right">{t.admin.columns.providerCost}</TableHead>
                <TableHead>{t.admin.columns.created}</TableHead>
                <TableHead>{t.admin.addCredits}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((o) => {
                const s = byOrg.get(o.id);
                return (
                  <TableRow key={o.id} className="align-top">
                    <TableCell>
                      <div className="font-medium">{o.name}</div>
                      <div className="text-xs text-muted-foreground">{o.owner?.email ?? "—"}</div>
                      {o.is_personal && <Badge variant="secondary">{t.settings.personal}</Badge>}
                    </TableCell>
                    <TableCell className="text-right">{s?.member_count ?? 0}</TableCell>
                    <TableCell className="text-right font-medium">{o.credit_balance}</TableCell>
                    <TableCell className="text-right">{s?.video_count ?? 0}</TableCell>
                    <TableCell className="text-right">{s?.credits_spent ?? 0}</TableCell>
                    <TableCell className="text-right">{formatUsd(Number(s?.provider_cost_usd ?? 0), locale)}</TableCell>
                    <TableCell>{formatDate(o.created_at, locale)}</TableCell>
                    <TableCell className="min-w-80 whitespace-normal">
                      <AdjustCreditsForm organizationId={o.id} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Pager basePath="/admin/organizations" page={page} hasNext={(data ?? []).length > ADMIN_PAGE_SIZE} params={{ q: params.q }} />
    </>
  );
}

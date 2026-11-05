import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requirePlatformAdmin } from "@/lib/auth";
import { formatMoney } from "@/lib/billing/plans";
import { formatUsd } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

type Totals = {
  users: number;
  organizations: number;
  videos: number;
  videos_succeeded: number;
  videos_failed: number;
  videos_active: number;
  credits_outstanding: number;
  credits_spent: number;
  provider_cost_usd: number;
  revenue_cents: number;
};

function oneDayAgoIso(): string {
  return new Date(Date.now() - 24 * 3600 * 1000).toISOString();
}

export default async function AdminOverviewPage() {
  const { service } = await requirePlatformAdmin();
  const { t, locale } = await getI18n();
  const [{ data: totals }, { data: recentErrors }] = await Promise.all([
    service.rpc("admin_totals"),
    service
      .from("api_usage_logs")
      .select("operation, error_category, http_status, provider_code, created_at")
      .eq("success", false)
      .gte("created_at", oneDayAgoIso())
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const tot = (totals ?? {}) as Partial<Totals>;
  const tiles = [
    [t.admin.totals.users, String(tot.users ?? 0)],
    [t.admin.totals.organizations, String(tot.organizations ?? 0)],
    [t.admin.totals.videos, String(tot.videos ?? 0)],
    [t.admin.totals.videosActive, String(tot.videos_active ?? 0)],
    [t.admin.totals.videosFailed, String(tot.videos_failed ?? 0)],
    [t.admin.totals.creditsOutstanding, String(tot.credits_outstanding ?? 0)],
    [t.admin.totals.creditsSpent, String(tot.credits_spent ?? 0)],
    [t.admin.totals.providerCost, formatUsd(Number(tot.provider_cost_usd ?? 0), locale)],
    [t.admin.totals.revenue, formatMoney(Number(tot.revenue_cents ?? 0), "eur", locale)],
  ];
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t.admin.overview}</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {tiles.map(([label, value]) => (
          <Card key={label} className="gap-1 py-4">
            <CardHeader className="px-4">
              <CardDescription>{label}</CardDescription>
            </CardHeader>
            <CardContent className="px-4 text-xl font-semibold">{value}</CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Kling API — failed calls (24 h)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Operation</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>HTTP</TableHead>
                <TableHead>Code</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(recentErrors ?? []).map((e: { operation: string; error_category: string | null; http_status: number | null; provider_code: number | null; created_at: string }, i: number) => (
                <TableRow key={i}>
                  <TableCell>{new Date(e.created_at).toLocaleString(locale === "sl" ? "sl-SI" : "en-IE")}</TableCell>
                  <TableCell>{e.operation}</TableCell>
                  <TableCell>{e.error_category ?? "—"}</TableCell>
                  <TableCell>{e.http_status ?? "—"}</TableCell>
                  <TableCell>{e.provider_code ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

import { Pager } from "@/components/admin/pager";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ADMIN_PAGE_SIZE, adminPage } from "@/lib/admin";
import { requirePlatformAdmin } from "@/lib/auth";
import { formatMoney } from "@/lib/billing/plans";
import type { CreditTransactionRow, CreditTxType } from "@/lib/db/types";
import { formatDateTime } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

const TYPES: CreditTxType[] = ["signup_bonus", "purchase", "subscription_grant", "generation", "refund", "admin_adjustment"];

export default async function AdminTransactionsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { service } = await requirePlatformAdmin();
  const { t, locale } = await getI18n();
  const params = await searchParams;
  const page = adminPage(params.page);
  const type = TYPES.find((x) => x === params.type);

  let query = service
    .from("credit_transactions")
    .select("*, organization:organizations(name), user:users!credit_transactions_user_id_fkey(email)")
    .order("created_at", { ascending: false })
    .range((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE);
  if (type) query = query.eq("type", type);
  const { data } = await query.overrideTypes<
    (CreditTransactionRow & { organization: { name: string } | null; user: { email: string } | null })[],
    { merge: false }
  >();
  const rows = (data ?? []).slice(0, ADMIN_PAGE_SIZE);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t.admin.transactions}</h1>
      <form method="get" className="flex max-w-sm gap-2">
        <NativeSelect name="type" defaultValue={type ?? ""} aria-label={t.admin.columns.type}>
          <option value="">{t.common.all}</option>
          {TYPES.map((x) => (
            <option key={x} value={x}>
              {t.billing.txTypes[x]}
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
                <TableHead>{t.billing.date}</TableHead>
                <TableHead>{t.admin.columns.organization}</TableHead>
                <TableHead>{t.admin.columns.user}</TableHead>
                <TableHead>{t.admin.columns.type}</TableHead>
                <TableHead className="text-right">{t.admin.columns.amount}</TableHead>
                <TableHead className="text-right">{t.billing.balanceAfter}</TableHead>
                <TableHead>{t.billing.description}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{formatDateTime(tx.created_at, locale)}</TableCell>
                  <TableCell>{tx.organization?.name ?? "—"}</TableCell>
                  <TableCell className="text-xs">{tx.user?.email ?? "—"}</TableCell>
                  <TableCell>{t.billing.txTypes[tx.type]}</TableCell>
                  <TableCell className={cn("text-right font-medium", tx.amount > 0 && "text-success")}>
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </TableCell>
                  <TableCell className="text-right">{tx.balance_after}</TableCell>
                  <TableCell className="max-w-72 truncate text-muted-foreground">
                    {tx.amount_paid_cents !== null && tx.currency ? `${formatMoney(tx.amount_paid_cents, tx.currency, locale)} · ` : ""}
                    {tx.description}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Pager basePath="/admin/transactions" page={page} hasNext={(data ?? []).length > ADMIN_PAGE_SIZE} params={{ type }} />
    </>
  );
}

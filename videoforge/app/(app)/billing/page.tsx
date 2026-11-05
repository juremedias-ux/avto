import type { Metadata } from "next";
import { CheckIcon } from "lucide-react";
import { checkoutAction, portalAction } from "@/app/actions/billing";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAppContext } from "@/lib/auth";
import { CREDIT_PACKS, formatMoney, SUBSCRIPTION_PLAN } from "@/lib/billing/plans";
import { getSubscriptionPrice } from "@/lib/billing/service";
import type { CreditTransactionRow, SubscriptionRow } from "@/lib/db/types";
import { getStripeEnv } from "@/lib/env";
import { format, formatDate, formatDateTime, plural } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.billing.title };
}

export default async function BillingPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await requireAppContext("/billing");
  const { t, locale } = await getI18n();
  const params = await searchParams;
  const stripeReady = Boolean(getStripeEnv());
  const isAdmin = ctx.role === "admin";
  const suspended = ctx.profile.status !== "active";
  const canBuy = stripeReady && isAdmin && !suspended;

  const [{ data: transactions }, { data: subscriptions }, subscriptionPrice] = await Promise.all([
    ctx.db
      .from("credit_transactions")
      .select("*")
      .eq("organization_id", ctx.organization.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .overrideTypes<CreditTransactionRow[], { merge: false }>(),
    ctx.db
      .from("subscriptions")
      .select("*")
      .eq("organization_id", ctx.organization.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .overrideTypes<SubscriptionRow[], { merge: false }>(),
    getSubscriptionPrice(),
  ]);
  const subscription = subscriptions?.[0];
  const subscriptionActive = subscription && ["active", "trialing", "past_due"].includes(subscription.status);
  const price = subscriptionPrice ?? { cents: SUBSCRIPTION_PLAN.fallbackPriceCents, currency: SUBSCRIPTION_PLAN.currency };

  const notice =
    params.checkout === "success" ? { message: t.billing.checkoutSuccess }
    : params.checkout === "canceled" ? { message: t.billing.checkoutCanceled }
    : params.error === "not_configured" ? { error: t.billing.notConfigured }
    : params.error === "forbidden" ? { error: t.billing.adminOnly }
    : params.error === "suspended" ? { error: t.billing.suspended }
    : params.error ? { error: t.common.unknownError }
    : null;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t.billing.title}</h1>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">{t.billing.balance}</div>
          <div className="text-2xl font-semibold">{plural(t.credits, ctx.organization.credit_balance, locale)}</div>
        </div>
      </div>
      {notice && <FormMessage {...notice} />}
      {!stripeReady && <FormMessage error={t.billing.notConfigured} />}
      {stripeReady && !isAdmin && <FormMessage error={t.billing.adminOnly} />}

      <section className="grid gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t.billing.packsTitle}</h2>
          <p className="text-sm text-muted-foreground">{t.billing.packsSubtitle}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <Card key={pack.id}>
              <CardHeader>
                <CardTitle className="text-2xl">{plural(t.credits, pack.credits, locale)}</CardTitle>
                <CardDescription>
                  {format(t.billing.perCredit, {
                    price: formatMoney(Math.round(pack.priceCents / pack.credits), pack.currency, locale),
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xl font-semibold">{formatMoney(pack.priceCents, pack.currency, locale)}</CardContent>
              <CardFooter>
                <form action={checkoutAction} className="w-full">
                  <input type="hidden" name="kind" value="pack" />
                  <input type="hidden" name="packId" value={pack.id} />
                  <SubmitButton className="w-full" disabled={!canBuy}>
                    {t.billing.buy}
                  </SubmitButton>
                </form>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            {t.billing.subscriptionTitle}
            {subscription && <Badge variant={subscriptionActive ? "success" : "secondary"}>{subscription.status}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <p className="text-xl font-semibold">{format(t.billing.perMonth, { price: formatMoney(price.cents, price.currency, locale) })}</p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckIcon className="size-4 text-success" aria-hidden />
            {format(t.billing.subscriptionBody, { credits: SUBSCRIPTION_PLAN.monthlyCredits })}
          </p>
          {subscription?.current_period_end && (
            <p className="text-sm text-muted-foreground">
              {format(subscription.cancel_at_period_end ? t.billing.cancels : t.billing.renews, {
                date: formatDate(subscription.current_period_end, locale),
              })}
            </p>
          )}
        </CardContent>
        <CardFooter className="gap-2">
          {subscriptionActive ? (
            <form action={portalAction}>
              <SubmitButton variant="outline" disabled={!stripeReady || !isAdmin}>
                {t.billing.manage}
              </SubmitButton>
            </form>
          ) : (
            <form action={checkoutAction}>
              <input type="hidden" name="kind" value="subscription" />
              <SubmitButton disabled={!canBuy || !getStripeEnv()?.subscriptionPriceId}>{t.billing.subscribe}</SubmitButton>
            </form>
          )}
        </CardFooter>
      </Card>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">{t.billing.historyTitle}</h2>
        <Card className="py-2">
          <CardContent className="px-2 sm:px-4">
            {transactions && transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.billing.date}</TableHead>
                    <TableHead>{t.billing.type}</TableHead>
                    <TableHead className="text-right">{t.billing.amount}</TableHead>
                    <TableHead className="text-right">{t.billing.balanceAfter}</TableHead>
                    <TableHead>{t.billing.description}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{formatDateTime(tx.created_at, locale)}</TableCell>
                      <TableCell>{t.billing.txTypes[tx.type]}</TableCell>
                      <TableCell className={cn("text-right font-medium", tx.amount > 0 ? "text-success" : "text-foreground")}>
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                      </TableCell>
                      <TableCell className="text-right">{tx.balance_after}</TableCell>
                      <TableCell className="max-w-64 truncate text-muted-foreground">
                        {tx.amount_paid_cents !== null && tx.currency
                          ? `${formatMoney(tx.amount_paid_cents, tx.currency, locale)} · `
                          : ""}
                        {tx.description}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="p-4 text-sm text-muted-foreground">{t.billing.historyEmpty}</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { CoinsIcon, FilmIcon, Loader2Icon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VideoGrid } from "@/components/video/video-grid";
import { requireAppContext } from "@/lib/auth";
import type { VideoRow } from "@/lib/db/types";
import { format, plural } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { toVideoCards } from "@/lib/video-view";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.dashboard.title };
}

export default async function DashboardPage() {
  const ctx = await requireAppContext("/dashboard");
  const { t, locale } = await getI18n();
  const orgId = ctx.organization.id;

  const count = (status?: string[]) => {
    let q = ctx.db.from("videos").select("id", { count: "exact", head: true }).eq("organization_id", orgId);
    if (status) q = q.in("status", status);
    return q;
  };
  const [total, succeeded, active, recent] = await Promise.all([
    count(),
    count(["succeeded"]),
    count(["draft", "queued", "processing"]),
    ctx.db
      .from("videos")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(6)
      .overrideTypes<VideoRow[], { merge: false }>(),
  ]);
  const cards = await toVideoCards(ctx, recent.data ?? []);

  const stats = [
    { label: t.dashboard.balance, value: plural(t.credits, ctx.organization.credit_balance, locale), icon: CoinsIcon },
    { label: t.dashboard.totalVideos, value: String(total.count ?? 0), icon: FilmIcon },
    { label: t.dashboard.succeeded, value: String(succeeded.count ?? 0), icon: SparklesIcon },
    { label: t.dashboard.inProgress, value: String(active.count ?? 0), icon: Loader2Icon },
  ];

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {format(t.dashboard.welcome, { name: ctx.profile.full_name ?? ctx.profile.email })}
          </h1>
          <p className="text-sm text-muted-foreground">{ctx.organization.name}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/billing">{t.dashboard.buyCredits}</Link>
          </Button>
          <Button asChild>
            <Link href="/create">{t.dashboard.createCta}</Link>
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="gap-2 py-4">
            <CardHeader className="px-4">
              <CardDescription className="flex items-center gap-2">
                <Icon className="size-4" aria-hidden />
                {label}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 text-xl font-semibold">{value}</CardContent>
          </Card>
        ))}
      </div>
      <section className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t.dashboard.recent}</h2>
          <Link href="/library" className="text-sm text-muted-foreground hover:text-foreground">
            {t.dashboard.viewAll}
          </Link>
        </div>
        {cards.length > 0 ? (
          <VideoGrid videos={cards} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.dashboard.empty}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/create">{t.dashboard.createCta}</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

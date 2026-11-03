import type { Metadata } from "next";
import Link from "next/link";
import { deleteEntryAction, revokeConsentAction } from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ConfirmAction } from "@/components/admin/ConfirmAction";
import { adminUrl, parseAdminQuery } from "@/lib/admin-params";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  getWaitlistStats,
  listWaitlist,
  PAGE_SIZE,
  SEARCH_MAX_LENGTH,
  type WaitlistRow,
} from "@/lib/waitlist";

export const metadata: Metadata = { title: "Prijave" };

const NOTICES: Record<string, { text: string; tone: "ok" | "error" }> = {
  "preklicano-zagon": { text: "Privolitev za obvestilo ob zagonu je preklicana.", tone: "ok" },
  "preklicano-novice": { text: "Privolitev za novice je preklicana.", tone: "ok" },
  izbrisano: { text: "Prijava je trajno izbrisana.", tone: "ok" },
  "ni-najdeno": {
    text: "Zapisa ni bilo mogoče najti ali je bil že spremenjen.",
    tone: "error",
  },
  napaka: { text: "Dejanja ni bilo mogoče izvesti. Poskusi znova.", tone: "error" },
};

const SOURCE_LABEL: Record<WaitlistRow["source"], string> = {
  prvi_zaslon: "Prvi zaslon",
  zakljucek: "Zaključek strani",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAdmin();
  const params = await searchParams;
  const query = parseAdminQuery(params);
  const noticeKey = typeof params.obvestilo === "string" ? params.obvestilo : "";
  const notice = NOTICES[noticeKey];

  const [stats, list] = await Promise.all([
    getWaitlistStats(session),
    listWaitlist(session, query),
  ]);

  const totalPages = list ? Math.max(1, Math.ceil(list.total / PAGE_SIZE)) : 1;
  const loadFailed = !stats || !list;

  return (
    <>
      <AdminHeader email={session.email} />
      <main id="vsebina" tabIndex={-1} className="container-page py-10 outline-none sm:py-12">
        <h1 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl">Prijave</h1>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-muted">
          Lastništvo e-poštnih naslovov ni preverjeno (ni potrditvenega sporočila). Preklicane
          privolitve niso vključene v izvoz za ustrezni namen.
        </p>

        {notice ? (
          <p
            role="status"
            className={`mt-6 rounded-xl px-4 py-3 text-[0.9375rem] font-medium ${
              notice.tone === "ok" ? "bg-success-bg text-success" : "bg-error-bg text-error"
            }`}
          >
            {notice.text}
          </p>
        ) : null}

        {loadFailed ? (
          <p role="alert" className="mt-6 rounded-xl bg-error-bg px-4 py-3 font-medium text-error">
            Podatkov trenutno ni bilo mogoče naložiti. Osveži stran ali poskusi pozneje.
          </p>
        ) : null}

        <section aria-label="Povzetek" className="mt-8 grid gap-3 sm:grid-cols-3">
          <Stat label="Prijave za obvestilo ob zagonu" value={stats?.launchActive} hint="aktivne privolitve" />
          <Stat label="Privolitve za novice" value={stats?.newsletterActive} hint="aktivne privolitve" />
          <Stat label="Vsi zapisi" value={stats?.total} hint="vključno s preklicanimi" />
        </section>

        <section aria-labelledby="izvoz-naslov" className="mt-8 flex flex-wrap items-center gap-3">
          <h2 id="izvoz-naslov" className="mr-2 text-base font-semibold">
            Izvoz CSV
          </h2>
          <a href="/admin/izvoz/zagon" className="btn-secondary" download>
            Obvestilo ob zagonu
          </a>
          <a href="/admin/izvoz/novice" className="btn-secondary" download>
            Novice
          </a>
        </section>

        <section aria-labelledby="seznam-naslov" className="mt-10">
          <h2 id="seznam-naslov" className="sr-only">
            Seznam prijav
          </h2>
          <form method="get" action="/admin" className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="iskanje" className="block text-sm font-semibold">
                Išči po e-poštnem naslovu
              </label>
              <input
                id="iskanje"
                name="iskanje"
                type="search"
                defaultValue={query.search}
                maxLength={SEARCH_MAX_LENGTH}
                autoComplete="off"
                className="field-input mt-1.5"
              />
            </div>
            <div>
              <label htmlFor="razvrsti" className="block text-sm font-semibold">
                Razvrsti po datumu
              </label>
              <select
                id="razvrsti"
                name="razvrsti"
                defaultValue={query.sort}
                className="field-input mt-1.5 pr-10"
              >
                <option value="najnovejse">Najnovejše najprej</option>
                <option value="najstarejse">Najstarejše najprej</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                Prikaži
              </button>
              {query.search || query.sort !== "najnovejse" ? (
                <Link href="/admin" className="btn-secondary min-h-[3.25rem]">
                  Ponastavi
                </Link>
              ) : null}
            </div>
          </form>

          {list ? (
            <p className="mt-6 text-sm text-ink-muted" aria-live="polite">
              {list.total === 1 ? "1 zapis" : `${list.total} zapisov`}
              {query.search ? ` za »${query.search}«` : ""} · stran {Math.min(query.page, totalPages)} od{" "}
              {totalPages}
            </p>
          ) : null}

          <div
            className="mt-3 overflow-x-auto rounded-2xl border border-sand-200 bg-paper-raised"
            tabIndex={0}
            role="region"
            aria-label="Tabela prijav"
          >
            <table className="w-full min-w-[56rem] border-collapse text-left text-[0.9375rem]">
              <thead className="bg-sand-50 text-sm text-ink-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">E-poštni naslov</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Prijava</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Obvestilo ob zagonu</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Novice</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Vir</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Dejanja</th>
                </tr>
              </thead>
              <tbody>
                {list && list.rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-ink-muted">
                      {query.search ? "Ni zadetkov." : "Prijav še ni."}
                    </td>
                  </tr>
                ) : null}
                {list?.rows.map((row) => (
                  <tr key={row.id} className="border-t border-sand-200 align-top">
                    <td className="break-all px-4 py-4 font-medium">{row.email}</td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {formatDateTime(row.created_at)}
                      <span className="mt-1 block text-xs text-ink-muted">
                        besedilo {row.consent_text_version}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <ConsentState
                        active={row.launch_consent}
                        givenAt={row.launch_consent_at}
                        revokedAt={row.launch_revoked_at}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <ConsentState
                        active={row.newsletter_consent}
                        givenAt={row.newsletter_consent_at}
                        revokedAt={row.newsletter_revoked_at}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">{SOURCE_LABEL[row.source] ?? row.source}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {row.launch_consent ? (
                          <ConfirmAction
                            action={revokeConsentAction}
                            label="Prekliči zagon"
                            confirmLabel="Potrdi preklic"
                            warning="Privolitev za obvestilo ob zagonu bo preklicana. Ponovna aktivacija ni mogoča."
                            id={row.id}
                            purpose="zagon"
                            query={query}
                            context={row.email}
                          />
                        ) : null}
                        {row.newsletter_consent ? (
                          <ConfirmAction
                            action={revokeConsentAction}
                            label="Prekliči novice"
                            confirmLabel="Potrdi preklic"
                            warning="Privolitev za novice bo preklicana. Ponovna aktivacija ni mogoča."
                            id={row.id}
                            purpose="novice"
                            query={query}
                            context={row.email}
                          />
                        ) : null}
                        <ConfirmAction
                          action={deleteEntryAction}
                          label="Izbriši"
                          confirmLabel="Trajno izbriši"
                          warning="Prijava bo trajno izbrisana. Tega ni mogoče razveljaviti."
                          id={row.id}
                          query={query}
                          danger
                          context={row.email}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {list && totalPages > 1 ? (
            <nav aria-label="Straničenje" className="mt-6 flex items-center justify-between gap-3">
              {query.page > 1 ? (
                <Link
                  href={adminUrl({ ...query, page: Math.min(query.page - 1, totalPages) })}
                  className="btn-secondary"
                >
                  ← Prejšnja
                </Link>
              ) : (
                <span />
              )}
              {query.page < totalPages ? (
                <Link href={adminUrl({ ...query, page: query.page + 1 })} className="btn-secondary">
                  Naslednja →
                </Link>
              ) : null}
            </nav>
          ) : null}
        </section>
      </main>
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value?: number; hint: string }) {
  return (
    <div className="rounded-2xl border border-sand-200 bg-paper-raised p-5">
      <p className="text-sm font-semibold text-ink-muted">{label}</p>
      <p className="mt-2 text-4xl font-bold tabular-nums tracking-[-0.03em]">
        {value ?? "–"}
      </p>
      <p className="mt-1 text-xs text-ink-muted">{hint}</p>
    </div>
  );
}

function ConsentState({
  active,
  givenAt,
  revokedAt,
}: {
  active: boolean;
  givenAt: string | null;
  revokedAt: string | null;
}) {
  if (active && givenAt) {
    return (
      <span>
        <span className="font-semibold text-success">Da</span>
        <span className="block text-xs text-ink-muted">od {formatDate(givenAt)}</span>
      </span>
    );
  }
  if (revokedAt) {
    return (
      <span>
        <span className="font-semibold text-error">Preklicano</span>
        <span className="block text-xs text-ink-muted">{formatDate(revokedAt)}</span>
      </span>
    );
  }
  return <span className="text-ink-muted">Ne</span>;
}

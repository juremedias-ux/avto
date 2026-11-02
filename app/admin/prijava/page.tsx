import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdminStatus } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Prijava lastnika",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const status = await getAdminStatus();
  if (status.status === "ok") redirect("/admin");

  const params = await searchParams;
  const info =
    params.seja === "potekla"
      ? "Seja je potekla. Prijavi se znova."
      : params.odjava === "1"
        ? "Odjava je uspela."
        : null;

  return (
    <>
      <AdminHeader />
      <main id="vsebina" tabIndex={-1} className="container-page flex justify-center py-14 outline-none sm:py-20">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold tracking-[-0.03em]">Prijava lastnika</h1>

          {status.status === "not_configured" ? (
            <div className="mt-6 rounded-2xl border border-sand-200 bg-paper-raised p-6 text-[0.9375rem] leading-relaxed">
              <p className="font-semibold">Administracija še ni nastavljena.</p>
              <p className="mt-2 text-ink-muted">
                Na strežniku manjkajo nastavitve SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY,
                SUPABASE_SECRET_KEY ali ADMIN_USER_ID. Postopek je opisan v datoteki README.
              </p>
            </div>
          ) : status.status === "forbidden" ? (
            <div className="mt-6 rounded-2xl border border-sand-200 bg-paper-raised p-6">
              <p role="alert" className="font-semibold text-error">
                Ta račun nima dostopa do administracije.
              </p>
              <form action={signOutAction} className="mt-4">
                <button type="submit" className="btn-secondary">
                  Odjava
                </button>
              </form>
            </div>
          ) : (
            <>
              <p className="mt-2 text-[0.9375rem] text-ink-muted">
                Dostop ima samo lastnik GradimoCamper. Javne registracije ni.
              </p>
              {info ? (
                <p role="status" className="mt-6 rounded-xl bg-sand-100 px-4 py-3 text-[0.9375rem] font-medium">
                  {info}
                </p>
              ) : null}
              <div className="form-card mt-6">
                <LoginForm />
              </div>
            </>
          )}

          <p className="mt-8 text-sm">
            <Link href="/" className="text-link">
              Nazaj na stran GradimoCamper
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}

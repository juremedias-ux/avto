import { signOutAction } from "@/app/admin/actions";
import { Logo } from "@/components/Logo";

export function AdminHeader({ email }: { email?: string | null }) {
  return (
    <header className="border-b border-sand-200 bg-paper">
      <div className="container-page flex min-h-16 flex-wrap items-center justify-between gap-3 py-2">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-semibold text-ink-muted">
            Administracija
          </span>
        </div>
        {email !== undefined ? (
          <div className="flex items-center gap-3">
            {email ? (
              <span className="hidden text-sm text-ink-muted sm:inline">{email}</span>
            ) : null}
            <form action={signOutAction}>
              <button type="submit" className="btn-secondary">
                Odjava
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </header>
  );
}

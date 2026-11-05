import type { Metadata } from "next";
import { removeMemberAction, switchOrganizationAction, updateMemberRoleAction } from "@/app/actions/org";
import { FormMessage } from "@/components/form-message";
import {
  AddMemberForm,
  CreateOrganizationForm,
  ProfileForm,
  RenameOrganizationForm,
} from "@/components/settings/forms";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAppContext } from "@/lib/auth";
import type { OrgRole } from "@/lib/db/types";
import { format, plural } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.settings.title };
}

type MemberRow = { user_id: string; role: OrgRole; user: { full_name: string | null; email: string } | null };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await requireAppContext("/settings");
  const { t, locale } = await getI18n();
  const params = await searchParams;
  const isAdmin = ctx.role === "admin";
  const errorMap = t.settings.errors as Record<string, string>;
  const pageError = params.error ? (errorMap[params.error] ?? t.common.unknownError) : null;

  const { data: members } = await ctx.db
    .from("organization_members")
    .select("user_id, role, user:users(full_name, email)")
    .eq("organization_id", ctx.organization.id)
    .order("created_at", { ascending: true })
    .overrideTypes<MemberRow[], { merge: false }>();

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t.settings.title}</h1>
      {pageError && <FormMessage error={pageError} />}

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.profile}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm fullName={ctx.profile.full_name ?? ""} email={ctx.profile.email} locale={ctx.profile.locale} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.organizations}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <ul className="grid gap-2">
            {ctx.memberships.map((m) => (
              <li key={m.organization.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                <div className="grid gap-1">
                  <span className="flex flex-wrap items-center gap-2 font-medium">
                    {m.organization.name}
                    {m.organization.is_personal && <Badge variant="secondary">{t.settings.personal}</Badge>}
                    <Badge variant="outline">{t.settings.roles[m.role]}</Badge>
                  </span>
                  <span className="text-xs text-muted-foreground">{plural(t.credits, m.organization.credit_balance, locale)}</span>
                </div>
                {m.organization.id === ctx.organization.id ? (
                  <Badge variant="success">{t.settings.active}</Badge>
                ) : (
                  <form action={switchOrganizationAction}>
                    <input type="hidden" name="organizationId" value={m.organization.id} />
                    <SubmitButton size="sm" variant="outline">
                      {t.settings.switch}
                    </SubmitButton>
                  </form>
                )}
              </li>
            ))}
          </ul>
          <CreateOrganizationForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{format(t.settings.members, { name: ctx.organization.name })}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          {isAdmin && <RenameOrganizationForm name={ctx.organization.name} />}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.settings.fullName}</TableHead>
                <TableHead>{t.settings.email}</TableHead>
                <TableHead>{t.settings.role}</TableHead>
                <TableHead className="text-right">{t.common.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(members ?? []).map((m) => {
                const self = m.user_id === ctx.profile.id;
                return (
                  <TableRow key={m.user_id}>
                    <TableCell>
                      {m.user?.full_name ?? "—"}
                      {self && <span className="text-muted-foreground"> ({t.settings.you})</span>}
                    </TableCell>
                    <TableCell>{m.user?.email}</TableCell>
                    <TableCell>
                      {isAdmin && !ctx.organization.is_personal ? (
                        <form action={updateMemberRoleAction} className="flex items-center gap-2">
                          <input type="hidden" name="organizationId" value={ctx.organization.id} />
                          <input type="hidden" name="userId" value={m.user_id} />
                          <input type="hidden" name="role" value={m.role === "admin" ? "member" : "admin"} />
                          <Badge variant="outline">{t.settings.roles[m.role]}</Badge>
                          <SubmitButton size="sm" variant="ghost">
                            → {t.settings.roles[m.role === "admin" ? "member" : "admin"]}
                          </SubmitButton>
                        </form>
                      ) : (
                        <Badge variant="outline">{t.settings.roles[m.role]}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!ctx.organization.is_personal && (isAdmin || self) && (
                        <form action={removeMemberAction}>
                          <input type="hidden" name="organizationId" value={ctx.organization.id} />
                          <input type="hidden" name="userId" value={m.user_id} />
                          <SubmitButton size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                            {self ? t.settings.leave : t.settings.remove}
                          </SubmitButton>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {isAdmin && !ctx.organization.is_personal && <AddMemberForm organizationId={ctx.organization.id} />}
        </CardContent>
      </Card>
    </div>
  );
}

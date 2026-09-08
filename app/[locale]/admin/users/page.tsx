import type { Database } from "@/types/database";
import type { Metadata } from "next";
import { Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { RoleSelect } from "@/components/admin/role-select";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Manage Users — Admin" };

export default async function AdminUsersPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  await requireAdmin(locale, `/${locale}/admin/users`);
  const t = await getTranslations({ locale, namespace: "admin" });

  if (!isSupabaseConfigured()) {
    return (
      <section className="container-px mx-auto py-14">
        <h1 className="font-display text-2xl font-semibold mb-8">
          {t("manageUsers")}
        </h1>
        <p className="rounded-xl2 border border-ink/8 dark:border-white/10 p-6 text-sm text-ink/60 dark:text-sand/60">
          {t("connectSupabaseUsers")}
        </p>
      </section>
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const profiles =
    error || !data
      ? []
      : (data as unknown as Database["public"]["Tables"]["profiles"]["Row"][]);

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-2">
        {t("manageUsers")}
      </h1>

      <p className="mb-8 text-sm text-ink/60 dark:text-sand/60">
        {t("registeredUsers", { count: profiles.length })}
      </p>

      {profiles.length === 0 ? (
        <EmptyState icon={Users} title={t("noUsersTitle")} description={t("noUsersDescription")} />
      ) : (
        <>
          {/* Mobile: card stack (< sm) — matches AdminListTable's pattern:
              a horizontally-scrolling table works on a phone but the role
              <select> ends up too small/cramped to use reliably. */}
          <div className="flex flex-col gap-3 sm:hidden">
            {profiles.map((p) => (
              <div key={p.id} className="rounded-xl2 border border-ink/8 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="truncate font-semibold">{p.full_name || "—"}</p>
                <p className="mt-0.5 text-xs text-ink/50 dark:text-sand/50">
                  {new Date(p.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <div className="mt-2.5 border-t border-ink/8 pt-2.5 dark:border-white/10">
                  <RoleSelect locale={locale} userId={p.id} role={p.role} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop/tablet: table (>= sm) */}
          <div className="hidden overflow-x-auto rounded-xl2 border border-ink/8 dark:border-white/10 sm:block">
            <table className="w-full text-sm">
              <thead className="bg-ink/[0.03] dark:bg-white/5">
                <tr>
                  <th className="px-5 py-3 text-start font-semibold">{t("colName")}</th>
                  <th className="px-5 py-3 text-start font-semibold">{t("colJoined")}</th>
                  <th className="px-5 py-3 text-start font-semibold">{t("colRole")}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-ink/8 dark:divide-white/10">
                {profiles.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3 font-medium">
                      {p.full_name || "—"}
                    </td>

                    <td className="px-5 py-3 text-ink/60 dark:text-sand/60">
                      {new Date(p.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    <td className="px-5 py-3">
                      <RoleSelect
                        locale={locale}
                        userId={p.id}
                        role={p.role}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
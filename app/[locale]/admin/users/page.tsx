import type { Database } from "@/types/database";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { RoleSelect } from "@/components/admin/role-select";

export const metadata: Metadata = { title: "Manage Users — Admin" };

export default async function AdminUsersPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  await requireAdmin(locale, `/${locale}/admin/users`);

  if (!isSupabaseConfigured()) {
    return (
      <section className="container-px mx-auto py-14">
        <h1 className="font-display text-2xl font-semibold mb-8">
          Manage Users
        </h1>
        <p className="rounded-xl2 border border-ink/8 dark:border-white/10 p-6 text-sm text-ink/60 dark:text-sand/60">
          Connect a Supabase project to manage real users. See the README to
          get started.
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
        Manage Users
      </h1>

      <p className="mb-8 text-sm text-ink/60 dark:text-sand/60">
        {profiles.length} registered users
      </p>

      <div className="overflow-x-auto rounded-xl2 border border-ink/8 dark:border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-ink/[0.03] dark:bg-white/5">
            <tr>
              <th className="px-5 py-3 text-start font-semibold">Name</th>
              <th className="px-5 py-3 text-start font-semibold">Joined</th>
              <th className="px-5 py-3 text-start font-semibold">Role</th>
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
    </section>
  );
}
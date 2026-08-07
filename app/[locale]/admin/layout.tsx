import type { Metadata } from "next";
import { requireListingsAccess } from "@/lib/supabase/guards";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import type { Locale } from "@/lib/i18n/config";

// Applies to every route under /admin — a private, authenticated section
// that should never be indexed, regardless of what each page's own
// metadata sets (page-level metadata doesn't override `robots` here since
// none of the admin pages declare their own `robots` field).
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  // Owner-only pages (users, settings, categories, etc.) still enforce
  // their own requireOwner/requireAdmin check — this is deliberately the
  // more permissive requireListingsAccess (owner OR business_owner) so
  // business owners don't get bounced before ever seeing the sidebar on
  // the hotels/restaurants/cafes pages they DO have access to.
  await requireListingsAccess(locale, `/${locale}/admin`);

  // Deliberately lighter padding than the existing `container-px` every
  // admin page already wraps its own content in (px-5 md:px-8 lg:px-12) —
  // this just makes room for the sidebar rail without stacking two full
  // container paddings on top of each other.
  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-3 pt-6 md:px-4 lg:flex-row lg:items-start lg:px-6">
      <aside className="lg:w-64 lg:shrink-0">
        <AdminSidebar locale={locale} />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

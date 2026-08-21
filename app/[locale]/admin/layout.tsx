import type { Metadata } from "next";
import { requireAdminAreaAccess } from "@/lib/supabase/guards";
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
  // their own requireOwner check; the Partners/Requests/Content pages
  // enforce requirePlatformPermission for their exact permission — this is
  // deliberately the more permissive requireAdminAreaAccess (owner OR
  // business_owner OR a team member with ANY active platform permission)
  // so nobody legitimate gets bounced before their own page's stricter
  // check ever runs.
  await requireAdminAreaAccess(locale, `/${locale}/admin`);

  // Deliberately lighter padding than the existing `container-px` every
  // admin page already wraps its own content in (px-5 md:px-8 lg:px-12) —
  // this just makes room for the sidebar rail without stacking two full
  // container paddings on top of each other.
  //
  // pt-6 alone (24px) used to be the ONLY top clearance here, against a
  // fixed, always-on-top <SiteHeader> (components/layout/site-header.tsx)
  // that's `h-20` (80px) plus `env(safe-area-inset-top)` — every admin page
  // rendered with its title and top content genuinely hidden under that bar
  // (worse on Android/iOS where the safe-area inset adds even more). Fixed
  // once, here, at the shared layout — not per-page — using the same
  // `calc(env(safe-area-inset-top) + 5rem)` header-height expression
  // components/business/business-sidebar.tsx's mobile bar already
  // establishes for this exact problem, plus a small breathing-room addend
  // so content doesn't sit flush against the header's bottom edge.
  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-3 pt-[calc(env(safe-area-inset-top)+5.5rem)] md:px-4 lg:flex-row lg:items-start lg:px-6">
      <aside className="lg:w-64 lg:shrink-0">
        <AdminSidebar locale={locale} />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

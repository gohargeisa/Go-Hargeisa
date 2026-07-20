import type { Metadata } from "next";

// Applies to every route under /admin — a private, authenticated section
// that should never be indexed, regardless of what each page's own
// metadata sets (page-level metadata doesn't override `robots` here since
// none of the admin pages declare their own `robots` field).
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

// The user dashboard is private and personalized — never index it.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}

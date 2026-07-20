import type { Metadata } from "next";

// Login/register/callback pages have no SEO value and shouldn't be indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}

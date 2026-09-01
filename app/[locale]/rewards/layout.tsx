import type { Metadata } from "next";

// The Rewards experience is private + personalized (a signed-in customer's
// membership, points, QR). Never index it — same posture as /dashboard.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function RewardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

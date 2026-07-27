import { getTranslations } from "next-intl/server";
import { Calendar, Eye, MessageSquare, TicketCheck } from "lucide-react";

export async function BusinessSummary({
  totalViews,
  totalBookings,
  totalReviews,
  memberSince,
}: {
  totalViews: number;
  totalBookings: number;
  totalReviews: number;
  memberSince: string;
}) {
  const t = await getTranslations("businessDashboard");

  const items = [
    { icon: Eye, label: t("totalViews"), value: totalViews },
    { icon: TicketCheck, label: t("totalBookings"), value: totalBookings },
    { icon: MessageSquare, label: t("totalReviews"), value: totalReviews },
    {
      icon: Calendar,
      label: t("memberSince"),
      value: new Date(memberSince).toLocaleDateString(undefined, { month: "short", year: "numeric" }),
    },
  ];

  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
      <h3 className="mb-4 font-display text-base font-bold">{t("businessSummaryTitle")}</h3>
      <div className="grid grid-cols-2 gap-4">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label}>
            <Icon size={16} className="text-primary" aria-hidden="true" />
            <p className="mt-2 font-display text-lg font-bold">{value}</p>
            <p className="text-xs text-ink/50 dark:text-sand/50">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

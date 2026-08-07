import type { LucideIcon } from "lucide-react";

/** Shared card wrapper for a titled block of dashboard settings — used by
 * both SettingsPanel and SecurityPanel so the two visually match. */
export function SettingsSection({
  icon: Icon,
  title,
  tone = "default",
  children,
}: {
  icon: LucideIcon;
  title: string;
  tone?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-xl2 border p-5 shadow-soft transition-shadow duration-300 ease-premium sm:p-6 ${
        tone === "danger"
          ? "border-red-500/25 bg-red-500/[0.03] dark:bg-red-500/[0.06]"
          : "border-ink/8 hover:shadow-card dark:border-white/10"
      }`}
    >
      <h3
        className={`flex items-center gap-2 font-display text-base font-semibold ${
          tone === "danger" ? "text-red-600 dark:text-red-400" : ""
        }`}
      >
        <Icon size={16} className={tone === "danger" ? "text-red-600 dark:text-red-400" : "text-primary"} />
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

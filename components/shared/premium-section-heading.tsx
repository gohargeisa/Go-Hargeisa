/**
 * Centered "eyebrow pill + display title + subtitle" section heading —
 * the block hand-repeated across app/[locale]/attractions/page.tsx and
 * app/[locale]/about/page.tsx (4-5 times each). Extracted here so every
 * page redesigned after those two reuses one component instead of
 * duplicating the same three lines of markup again.
 */
export function PremiumSectionHeading({
  eyebrow,
  title,
  subtitle,
  tone = "light",
  className = "",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <div className={`mx-auto max-w-2xl text-center ${className}`}>
      {eyebrow && (
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${
            dark ? "border border-white/20 bg-white/10 text-white" : "bg-primary/10 text-primary-800"
          }`}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={`text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl ${
          eyebrow ? "mt-3" : ""
        } ${dark ? "text-white" : ""}`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-2 ${dark ? "text-white/80" : "text-ink/60 dark:text-sand/60"}`}>{subtitle}</p>
      )}
    </div>
  );
}

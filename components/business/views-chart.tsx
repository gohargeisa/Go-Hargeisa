"use client";

import { useMemo, useState } from "react";
import { m } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AnalyticsRange, ViewsSeriesPoint } from "@/lib/data/business";

const RANGE_KEYS: AnalyticsRange[] = ["7d", "30d", "90d", "12m"];

/**
 * Hand-rolled SVG line chart — no charting library, consistent with this
 * project's pattern of avoiding new dependencies where a small custom
 * component suffices. All 4 ranges are fetched server-side up front so
 * switching between them is instant, local state (no refetch).
 */
export function ViewsChart({
  series,
  title,
}: {
  series: Record<AnalyticsRange, ViewsSeriesPoint[]>;
  title: string;
}) {
  const t = useTranslations("businessDashboard");
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const points = series[range];
  const total = points.reduce((sum, p) => sum + p.count, 0);
  const max = Math.max(1, ...points.map((p) => p.count));

  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: "", areaPath: "" };
    const w = 100;
    const h = 32;
    const stepX = points.length > 1 ? w / (points.length - 1) : 0;
    const line = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${(i * stepX).toFixed(2)} ${(h - (p.count / max) * h).toFixed(2)}`)
      .join(" ");
    return { linePath: line, areaPath: `${line} L ${w} ${h} L 0 ${h} Z` };
  }, [points, max]);

  const labelStep = Math.max(1, Math.ceil(points.length / 6));
  const visibleLabels = points.filter((_, i) => i % labelStep === 0 || i === points.length - 1);

  const rangeLabels: Record<AnalyticsRange, string> = {
    "7d": t("range7d"),
    "30d": t("range30d"),
    "90d": t("range90d"),
    "12m": t("range12m"),
  };

  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <p className="text-sm text-ink/50 dark:text-sand/50">
            {total} {t("views")}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {RANGE_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                range === key
                  ? "bg-primary text-white"
                  : "border border-ink/12 text-ink/60 hover:border-primary hover:text-primary dark:border-white/15 dark:text-sand/60"
              }`}
            >
              {rangeLabels[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {total === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl2 border border-dashed border-ink/12 text-center dark:border-white/15">
            <BarChart3 size={26} className="text-ink/25" aria-hidden="true" />
            <p className="text-sm font-medium text-ink/50 dark:text-sand/50">{t("noAnalyticsYetTitle")}</p>
            <p className="max-w-[220px] text-xs text-ink/40 dark:text-sand/40">{t("noAnalyticsYetDescription")}</p>
          </div>
        ) : (
          <>
            <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-48 w-full overflow-visible">
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                </linearGradient>
              </defs>
              <m.path
                key={`${range}-area`}
                d={areaPath}
                fill="url(#viewsGradient)"
                stroke="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
              <m.path
                key={`${range}-line`}
                d={linePath}
                fill="none"
                stroke="#F59E0B"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            <div className="mt-2 flex justify-between text-[11px] text-ink/40 dark:text-sand/40">
              {visibleLabels.map((p, i) => (
                <span key={i}>{p.label}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { Star, MapPin, Globe2, ShieldCheck } from "lucide-react";

const stats = [
  { icon: MapPin, value: "50+", label: "Curated places" },
  { icon: Star, value: "4.6", label: "Average rating" },
  { icon: Globe2, value: "3", label: "Languages" },
  { icon: ShieldCheck, value: "100%", label: "Locally verified" },
];

export function TrustBar() {
  return (
    <div className="relative z-10 -mt-12 md:-mt-16">
      <div className="container-px mx-auto">
        <div
          className="animate-fadeUp grid grid-cols-2 gap-px overflow-hidden rounded-xl3 border border-ink/8 bg-ink/8 shadow-[0_20px_50px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-white/10 sm:grid-cols-4"
          style={{ animationDelay: "150ms", animationFillMode: "backwards" }}
        >
          {stats.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="group flex items-center gap-3.5 bg-white/95 p-5 transition-colors duration-300 hover:bg-primary/5 dark:bg-ink/95 dark:hover:bg-primary/10 md:p-6"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary transition-transform duration-300 group-hover:scale-110 dark:from-primary/25 dark:to-primary/10">
                <Icon size={19} aria-hidden="true" />
              </span>
              <div className="min-w-0 leading-tight">
                <p className="font-display text-xl font-bold">{value}</p>
                <p className="truncate text-xs text-ink/55 dark:text-sand/55">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

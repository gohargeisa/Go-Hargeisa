import { Star, MapPin, Globe2, ShieldCheck } from "lucide-react";

const stats = [
  { icon: MapPin, value: "50+", label: "Curated places" },
  { icon: Star, value: "4.6", label: "Average rating" },
  { icon: Globe2, value: "3", label: "Languages" },
  { icon: ShieldCheck, value: "100%", label: "Locally verified" },
];

export function TrustBar() {
  return (
    <div className="relative z-10 -mt-10 md:-mt-14">
      <div className="container-px mx-auto">
        <div className="grid grid-cols-2 gap-3 rounded-xl3 border border-ink/8 dark:border-white/10 bg-white/95 dark:bg-ink/90 backdrop-blur-xl p-5 shadow-glass sm:grid-cols-4 md:p-6">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon size={18} />
              </span>
              <div className="leading-tight">
                <p className="font-display text-lg font-semibold">{value}</p>
                <p className="text-xs text-ink/55 dark:text-sand/55">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

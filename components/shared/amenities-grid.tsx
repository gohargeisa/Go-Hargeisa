import {
  Wifi, Car, UtensilsCrossed, Zap, Users, ConciergeBell, Wind, Dumbbell,
  Waves, Coffee, ShieldCheck, ParkingCircle, Check,
} from "lucide-react";

const ICONS: Record<string, typeof Wifi> = {
  "free wifi": Wifi,
  wifi: Wifi,
  parking: ParkingCircle,
  restaurant: UtensilsCrossed,
  "generator backup": Zap,
  "conference room": Users,
  "room service": ConciergeBell,
  "air conditioning": Wind,
  gym: Dumbbell,
  pool: Waves,
  garden: Coffee,
  security: ShieldCheck,
};

export function AmenitiesGrid({ amenities }: { amenities: string[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {amenities.map((a) => {
        const Icon = ICONS[a.toLowerCase()] ?? Check;
        return (
          <div
            key={a}
            className="flex items-center gap-2.5 rounded-xl border border-ink/8 dark:border-white/10 px-3.5 py-3 text-sm"
          >
            <Icon size={17} className="text-primary shrink-0" />
            {a}
          </div>
        );
      })}
    </div>
  );
}

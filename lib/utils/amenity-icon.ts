import {
  Bell,
  Car,
  CheckCircle2,
  Coffee,
  Dumbbell,
  Plane,
  Snowflake,
  Sparkles,
  Trees,
  UtensilsCrossed,
  Users,
  Waves,
  Wifi,
  Wine,
  Zap,
} from "lucide-react";

const AMENITY_ICONS: { match: RegExp; icon: typeof Wifi }[] = [
  { match: /wi[\s-]?fi/i, icon: Wifi },
  { match: /park/i, icon: Car },
  { match: /breakfast/i, icon: Coffee },
  { match: /restaurant|dining/i, icon: UtensilsCrossed },
  { match: /gym|fitness/i, icon: Dumbbell },
  { match: /garden/i, icon: Trees },
  { match: /shuttle|airport/i, icon: Plane },
  { match: /air ?condition|\bac\b/i, icon: Snowflake },
  { match: /generator|power/i, icon: Zap },
  { match: /conference|meeting/i, icon: Users },
  { match: /room service|concierge/i, icon: Bell },
  { match: /pool/i, icon: Waves },
  { match: /spa/i, icon: Sparkles },
  { match: /bar\b/i, icon: Wine },
];

export function amenityIcon(label: string) {
  return AMENITY_ICONS.find((a) => a.match.test(label))?.icon ?? CheckCircle2;
}

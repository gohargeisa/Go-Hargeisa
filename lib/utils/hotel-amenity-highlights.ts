import { Briefcase, Car, Coffee, Plane, UtensilsCrossed, Users, Wifi, type LucideIcon } from "lucide-react";

export interface AmenityHighlight {
  match: RegExp;
  icon: LucideIcon;
  label: string;
}

/**
 * Keyword → icon/label mapping derived from hotel.amenities tags, shared by
 * the Overview highlight strip and the quick-info cards so both read the
 * exact same set of matches instead of maintaining two copies.
 */
export const AMENITY_HIGHLIGHTS: AmenityHighlight[] = [
  { match: /wi[\s-]?fi/i, icon: Wifi, label: "Free WiFi" },
  { match: /park/i, icon: Car, label: "Parking" },
  { match: /shuttle|airport/i, icon: Plane, label: "Airport Shuttle" },
  { match: /restaurant|dining/i, icon: UtensilsCrossed, label: "Restaurant" },
  { match: /caf[eé]/i, icon: Coffee, label: "Cafe" },
  { match: /family/i, icon: Users, label: "Family Friendly" },
  { match: /business/i, icon: Briefcase, label: "Business Friendly" },
];

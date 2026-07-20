import { useTranslations } from "next-intl";
import type { MapPoint } from "@/types";
import { SectionHeader } from "@/components/shared/section-header";
import { MapLoader } from "@/components/map/map-loader";

export function MapSection({ points }: { points: MapPoint[] }) {
  const t = useTranslations("home");
  return (
    <section className="container-px mx-auto py-16 md:py-20">
      <SectionHeader eyebrow="Get your bearings" title={t("mapTitle")} />
      <MapLoader points={points} />
    </section>
  );
}

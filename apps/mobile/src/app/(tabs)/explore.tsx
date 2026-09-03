/**
 * Explore — search + map. P1b: native shell only. P1d/P2: FlashList of
 * results + a MapLibre view (OpenFreeMap tiles, keyless).
 */
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { useConfirmExitOnBack } from "@/lib/back-handler";
import { spacing } from "@/theme";
import { AppText, Card, Screen } from "@/ui";

export default function ExploreScreen() {
  useConfirmExitOnBack();
  const { t } = useTranslation();

  return (
    <Screen scroll>
      <View style={{ gap: 4, marginBottom: spacing.section }}>
        <AppText variant="display">{t("nav.explore", "Explore")}</AppText>
        <AppText variant="body" color="muted">
          {t(
            "explore.subtitle",
            "Search businesses, partners and places across Hargeisa.",
          )}
        </AppText>
      </View>
      <Card>
        <AppText variant="bodyStrong">
          {t("explore.mapComingTitle", "Map + search")}
        </AppText>
        <AppText variant="caption" color="muted">
          {t(
            "explore.mapComingBody",
            "A native MapLibre map with free OpenFreeMap tiles and a results list.",
          )}
        </AppText>
      </Card>
    </Screen>
  );
}

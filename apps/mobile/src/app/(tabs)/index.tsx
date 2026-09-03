/**
 * Home — discovery. P1b renders the native shell (header, greeting, section
 * scaffold); P1d wires it to `/api/v1` for real categories / featured /
 * near-you data and the tap-through to partner detail.
 */
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { useConfirmExitOnBack } from "@/lib/back-handler";
import { useAuth } from "@/providers/supabase-provider";
import { spacing } from "@/theme";
import { AppText, Card, Screen, Skeleton } from "@/ui";
import { OfflineBanner } from "@/ui/states";

export default function HomeScreen() {
  useConfirmExitOnBack();
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <Screen scroll>
      <OfflineBanner label={t("common.offline", "You're offline")} />

      <View style={{ gap: 4, marginBottom: spacing.section }}>
        <AppText variant="label" color="muted">
          {t("home.eyebrow", "Go Hargeisa")}
        </AppText>
        <AppText variant="display">
          {user
            ? t("home.welcomeBack", "Welcome back")
            : t("home.title", "Discover Hargeisa")}
        </AppText>
      </View>

      <View style={{ gap: 12 }}>
        <AppText variant="heading">
          {t("home.categories", "Browse by category")}
        </AppText>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Skeleton height={96} radius={20} />
          <Skeleton height={96} radius={20} />
          <Skeleton height={96} radius={20} />
        </View>

        <View style={{ height: spacing.section }} />

        <AppText variant="heading">
          {t("home.featured", "Featured partners")}
        </AppText>
        <Card>
          <AppText variant="bodyStrong">
            {t("home.sliceComingTitle", "Live data lands in the next step")}
          </AppText>
          <AppText variant="caption" color="muted">
            {t(
              "home.sliceComingBody",
              "This screen is the native shell. The Home → partner listing → detail flow is wired to the API next.",
            )}
          </AppText>
        </Card>
      </View>
    </Screen>
  );
}

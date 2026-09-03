/**
 * `PartnerCard` — a city-services listing as a native pressable card.
 * Image-dominant (per the Go Hargeisa card convention), with a small
 * partner badge + rating line.
 */
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import type { CityServiceListItem } from "@gohargeisa/api";

import { useTheme } from "@/providers/theme-provider";
import { radii } from "@/theme";
import { AppText, AppImage, Card } from "@/ui";

export function PartnerCard({ item }: { item: CityServiceListItem }) {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <Card
      padded={false}
      onPress={() => router.push(`/partner/${item.slug}`)}
      style={{ marginBottom: 14 }}
    >
      <View style={{ position: "relative" }}>
        <AppImage
          uri={item.image}
          aspectRatio={16 / 10}
          radius={0}
          fallbackLabel={item.name}
        />
        {item.isPartner ? (
          <View
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              backgroundColor: theme.colors.chrome,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: radii.pill,
            }}
          >
            <AppText variant="label" color="inverse">
              {t("partner.badge", "Partner")}
            </AppText>
          </View>
        ) : null}
      </View>

      <View style={{ padding: 14, gap: 4 }}>
        {item.categoryName ? (
          <AppText variant="label" color="muted">
            {item.categoryName.toUpperCase()}
          </AppText>
        ) : null}
        <AppText variant="heading" numberOfLines={1}>
          {item.name}
        </AppText>
        {item.description ? (
          <AppText variant="caption" color="muted" numberOfLines={2}>
            {item.description}
          </AppText>
        ) : null}
        {item.reviewCount > 0 ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
            <Ionicons name="star" size={13} color={theme.colors.primary} />
            <AppText variant="caption">
              {item.rating.toFixed(1)}{" "}
              <AppText variant="caption" color="muted">
                ({item.reviewCount})
              </AppText>
            </AppText>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

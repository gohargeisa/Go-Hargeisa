/**
 * `RestaurantCard` — mirrors `PartnerCard`'s exact shape (image-dominant per
 * the Go Hargeisa card convention) for the separate restaurants vertical.
 */
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import type { RestaurantListItem } from "@gohargeisa/api";

import { useTheme } from "@/providers/theme-provider";
import { useLocale } from "@/i18n/use-locale";
import { radii } from "@/theme";
import { AppText, AppImage, Card } from "@/ui";

export function RestaurantCard({ item }: { item: RestaurantListItem }) {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { isRtl } = useLocale();

  return (
    <Card
      padded={false}
      onPress={() => router.push(`/restaurants/${item.slug}`)}
      style={{ marginBottom: 14 }}
    >
      <View style={{ position: "relative" }}>
        <AppImage uri={item.image} aspectRatio={16 / 10} radius={0} fallbackLabel={item.name} />
        {item.isPartner ? (
          <View
            style={{
              position: "absolute",
              top: 10,
              ...(isRtl ? { right: 10 } : { left: 10 }),
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
        <AppText variant="label" color="muted">
          {item.cuisine.length > 0 ? item.cuisine.join(" · ").toUpperCase() : item.priceRange}
        </AppText>
        <AppText variant="heading" numberOfLines={1}>
          {item.name}
        </AppText>
        {item.shortDescription ? (
          <AppText variant="caption" color="muted" numberOfLines={2}>
            {item.shortDescription}
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

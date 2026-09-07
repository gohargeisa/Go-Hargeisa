/**
 * Restaurants — a separate vertical from city_services (own table, own DTO,
 * own route tree — see packages/api/src/types.ts's RestaurantListItem
 * comment). Search-only list, mirrors Explore's structure without category
 * chips (restaurants have no category taxonomy of their own).
 */
import { useState } from "react";
import { View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useTranslation } from "react-i18next";

import { useConfirmExitOnBack } from "@/lib/back-handler";
import { useRestaurants } from "@/lib/queries";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { spacing } from "@/theme";
import { AppText, Input, Screen, Skeleton } from "@/ui";
import { EmptyState, ErrorState, OfflineBanner } from "@/ui/states";
import { RestaurantCard } from "@/components/restaurant-card";

export default function RestaurantsScreen() {
  useConfirmExitOnBack();
  const { t } = useTranslation();

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 350);
  const list = useRestaurants({ q: debouncedQuery || undefined, pageSize: 50 });

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: spacing.screenX, paddingTop: 4, gap: 12 }}>
        <AppText variant="display">{t("restaurants.title", "Restaurants")}</AppText>
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder={t("restaurants.searchPlaceholder", "Search restaurants…")}
          autoCorrect={false}
        />
      </View>

      <OfflineBanner label={t("common.offline", "You're offline")} />

      <View style={{ flex: 1, paddingHorizontal: spacing.screenX, paddingTop: 12 }}>
        {list.isPending ? (
          <View style={{ gap: 14 }}>
            <Skeleton height={220} radius={24} />
            <Skeleton height={220} radius={24} />
            <Skeleton height={220} radius={24} />
          </View>
        ) : list.isError ? (
          <ErrorState
            title={t("restaurants.error", "Couldn't load restaurants")}
            onAction={() => list.refetch()}
            actionLabel={t("common.retry", "Retry")}
          />
        ) : list.data.items.length === 0 ? (
          <EmptyState
            title={t("restaurants.emptyTitle", "No restaurants found")}
            message={t("restaurants.emptyBody", "Try a different search.")}
          />
        ) : (
          <FlashList
            data={list.data.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <RestaurantCard item={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.section }}
          />
        )}
      </View>
    </Screen>
  );
}

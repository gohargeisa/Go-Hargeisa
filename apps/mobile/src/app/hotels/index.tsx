/**
 * Hotels — a separate vertical from city_services (own table, own DTO, own
 * route tree). Search-only list, mirrors restaurants/index.tsx exactly.
 */
import { useState } from "react";
import { View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useTranslation } from "react-i18next";

import { useConfirmExitOnBack } from "@/lib/back-handler";
import { useHotels } from "@/lib/queries";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { spacing } from "@/theme";
import { AppText, Input, Screen, Skeleton } from "@/ui";
import { EmptyState, ErrorState, OfflineBanner } from "@/ui/states";
import { HotelCard } from "@/components/hotel-card";

export default function HotelsScreen() {
  useConfirmExitOnBack();
  const { t } = useTranslation();

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 350);
  const list = useHotels({ q: debouncedQuery || undefined, pageSize: 50 });

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: spacing.screenX, paddingTop: 4, gap: 12 }}>
        <AppText variant="display">{t("hotels.title", "Hotels")}</AppText>
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder={t("hotels.searchPlaceholder", "Search hotels…")}
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
            title={t("hotels.error", "Couldn't load hotels")}
            onAction={() => list.refetch()}
            actionLabel={t("common.retry", "Retry")}
          />
        ) : list.data.items.length === 0 ? (
          <EmptyState
            title={t("hotels.emptyTitle", "No hotels found")}
            message={t("hotels.emptyBody", "Try a different search.")}
          />
        ) : (
          <FlashList
            data={list.data.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <HotelCard item={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.section }}
          />
        )}
      </View>
    </Screen>
  );
}

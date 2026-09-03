/**
 * Explore — native search + category filter over `/api/v1/city-services`.
 * A `FlashList` of `PartnerCard`s; tap → native partner detail.
 */
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { useConfirmExitOnBack } from "@/lib/back-handler";
import { useCategories, useCityServices } from "@/lib/queries";
import { useTheme } from "@/providers/theme-provider";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { radii, spacing } from "@/theme";
import { AppText, Input, Screen, Skeleton } from "@/ui";
import { EmptyState, ErrorState } from "@/ui/states";
import { PartnerCard } from "@/components/partner-card";

export default function ExploreScreen() {
  useConfirmExitOnBack();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const params = useLocalSearchParams<{ category?: string }>();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | undefined>(params.category);
  const debouncedQuery = useDebouncedValue(query, 350);

  const categories = useCategories();
  const list = useCityServices({
    q: debouncedQuery || undefined,
    category,
    pageSize: 50,
  });

  const chips = useMemo(
    () => [{ id: "__all", slug: undefined as string | undefined, name: t("explore.all", "All") }, ...(categories.data ?? [])],
    [categories.data, t],
  );

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: spacing.screenX, paddingTop: 4, gap: 12 }}>
        <AppText variant="display">{t("nav.explore", "Explore")}</AppText>
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder={t("explore.searchPlaceholder", "Search businesses…")}
          autoCorrect={false}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 8,
          paddingHorizontal: spacing.screenX,
          paddingVertical: 12,
        }}
      >
        {chips.map((c) => {
          const active = category === c.slug || (!category && c.id === "__all");
          return (
            <Pressable
              key={c.id}
              onPress={() => setCategory(c.slug)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: radii.pill,
                borderWidth: 1,
                borderColor: active ? theme.colors.primary : theme.colors.border,
                backgroundColor: active ? theme.colors.primary : theme.colors.surface,
              }}
            >
              <AppText variant="label" color={active ? "inverse" : "default"}>
                {c.name}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ flex: 1, paddingHorizontal: spacing.screenX }}>
        {list.isPending ? (
          <View style={{ gap: 14 }}>
            <Skeleton height={220} radius={24} />
            <Skeleton height={220} radius={24} />
            <Skeleton height={220} radius={24} />
          </View>
        ) : list.isError ? (
          <ErrorState
            title={t("explore.error", "Couldn't load results")}
            onAction={() => list.refetch()}
            actionLabel={t("common.retry", "Retry")}
          />
        ) : list.data.items.length === 0 ? (
          <EmptyState
            title={t("explore.noResultsTitle", "No matches")}
            message={t("explore.noResultsBody", "Try a different search or category.")}
          />
        ) : (
          <FlashList
            data={list.data.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PartnerCard item={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.section }}
            ListHeaderComponent={
              <AppText variant="caption" color="muted" style={{ marginBottom: 8 }}>
                {t("explore.resultCount", "{count} results", {
                  count: list.data.total,
                })}
              </AppText>
            }
          />
        )}
      </View>
    </Screen>
  );
}

/**
 * Category — a focused native browse screen for one category: its header
 * (name + description + count) over its published listings. Reached from the
 * Home category chips and from deep links (`/category/<slug>`).
 *
 * Distinct from Explore (free search across everything); this is "show me
 * everything in Pharmacies".
 */
import { useMemo } from "react";
import { Pressable, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useConfirmExitOnBack } from "@/lib/back-handler";
import { useCategories, useCityServices } from "@/lib/queries";
import { useTheme } from "@/providers/theme-provider";
import { spacing } from "@/theme";
import { AppText, Screen, Skeleton } from "@/ui";
import { EmptyState, ErrorState, OfflineBanner } from "@/ui/states";
import { PartnerCard } from "@/components/partner-card";

export default function CategoryScreen() {
  useConfirmExitOnBack();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const categories = useCategories();
  const category = useMemo(
    () => categories.data?.find((c) => c.slug === slug),
    [categories.data, slug],
  );
  const list = useCityServices({ category: slug, pageSize: 50 });

  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return (
    <Screen padded={false} edges={{ top: false }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.screenX,
          paddingBottom: 12,
          backgroundColor: theme.colors.background,
          gap: 8,
        }}
      >
        <Pressable onPress={back} hitSlop={10} style={{ width: 40, height: 32, justifyContent: "center" }}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </Pressable>
        {category ? (
          <>
            <AppText variant="display">{category.name}</AppText>
            {category.description ? (
              <AppText variant="body" color="muted">
                {category.description}
              </AppText>
            ) : null}
            <AppText variant="label" color="muted">
              {t("home.placesCount", "{count} places", {
                count: list.data?.total ?? category.businessCount,
              })}
            </AppText>
          </>
        ) : (
          <Skeleton height={30} width="60%" />
        )}
      </View>

      <OfflineBanner label={t("common.offline", "You're offline")} />

      <View style={{ flex: 1, paddingHorizontal: spacing.screenX }}>
        {list.isPending ? (
          <View style={{ gap: 14, paddingTop: 8 }}>
            <Skeleton height={220} radius={24} />
            <Skeleton height={220} radius={24} />
          </View>
        ) : list.isError ? (
          <ErrorState
            title={t("category.error", "Couldn't load this category")}
            onAction={() => list.refetch()}
            actionLabel={t("common.retry", "Retry")}
          />
        ) : list.data.items.length === 0 ? (
          <EmptyState
            title={t("category.emptyTitle", "Nothing here yet")}
            message={t("category.emptyBody", "No published businesses in this category right now.")}
          />
        ) : (
          <FlashList
            data={list.data.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PartnerCard item={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + spacing.section }}
          />
        )}
      </View>
    </Screen>
  );
}

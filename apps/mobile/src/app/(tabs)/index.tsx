/**
 * Home — native discovery. Category chips + featured partners, both from the
 * live `/api/v1` layer. Tap a category → Explore (filtered); tap a partner →
 * native detail screen.
 */
import { ScrollView, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { useConfirmExitOnBack } from "@/lib/back-handler";
import { useCategories, useCityServices } from "@/lib/queries";
import { useAuth } from "@/providers/supabase-provider";
import { useTheme } from "@/providers/theme-provider";
import { radii, spacing } from "@/theme";
import { AppText, Card, Screen, Skeleton } from "@/ui";
import { ErrorState, OfflineBanner } from "@/ui/states";
import { PartnerCard } from "@/components/partner-card";

export default function HomeScreen() {
  useConfirmExitOnBack();
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();

  const categories = useCategories();
  const featured = useCityServices({ pageSize: 6 });

  const refreshing = categories.isRefetching || featured.isRefetching;
  const onRefresh = () => {
    categories.refetch();
    featured.refetch();
  };

  return (
    <Screen scroll refreshing={refreshing} onRefresh={onRefresh}>
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

      {/* Categories */}
      <AppText variant="heading" style={{ marginBottom: 12 }}>
        {t("home.categories", "Browse by category")}
      </AppText>
      {categories.isPending ? (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Skeleton width={120} height={40} radius={999} />
          <Skeleton width={120} height={40} radius={999} />
          <Skeleton width={90} height={40} radius={999} />
        </View>
      ) : categories.isError ? (
        <ErrorState
          title={t("home.categoriesError", "Couldn't load categories")}
          onAction={() => categories.refetch()}
          actionLabel={t("common.retry", "Retry")}
        />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingRight: spacing.screenX }}
        >
          {categories.data.map((c) => (
            <Pressable
              key={c.id}
              onPress={() =>
                router.push({ pathname: "/explore", params: { category: c.slug } })
              }
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: radii.pill,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              }}
            >
              <AppText variant="bodyStrong">{c.name}</AppText>
              <AppText variant="label" color="muted">
                {t("home.placesCount", "{count} places", { count: c.businessCount })}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={{ height: spacing.section }} />

      {/* Featured partners */}
      <AppText variant="heading" style={{ marginBottom: 12 }}>
        {t("home.featured", "Featured partners")}
      </AppText>
      {featured.isPending ? (
        <View style={{ gap: 14 }}>
          <Skeleton height={220} radius={24} />
          <Skeleton height={220} radius={24} />
        </View>
      ) : featured.isError ? (
        <ErrorState
          title={t("home.featuredError", "Couldn't load listings")}
          onAction={() => featured.refetch()}
          actionLabel={t("common.retry", "Retry")}
        />
      ) : featured.data.items.length === 0 ? (
        <Card>
          <AppText variant="bodyStrong">
            {t("home.emptyTitle", "Nothing here yet")}
          </AppText>
          <AppText variant="caption" color="muted">
            {t("home.emptyBody", "New businesses are being added — check back soon.")}
          </AppText>
        </Card>
      ) : (
        <>
          {featured.data.items.map((item) => (
            <PartnerCard key={item.id} item={item} />
          ))}
          <Pressable
            onPress={() => router.push("/explore")}
            style={{ paddingVertical: 12, alignItems: "center" }}
          >
            <AppText variant="bodyStrong" color="primary">
              {t("home.seeAll", "See all businesses")}
            </AppText>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

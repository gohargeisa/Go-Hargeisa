/**
 * Restaurant detail — native, mirrors `partner/[slug].tsx`'s structure
 * (hero, identity, actions, description, map, gallery, reviews) adapted to
 * the separate `RestaurantDetail` DTO. No favorites here — city_services'
 * on-device Save is scoped to that vertical only (see lib/favorites.ts);
 * extending it to restaurants/cafes is a separate, unrequested change.
 */
import { Linking, Pressable, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { getOpenStatus, toWhatsAppHref } from "@gohargeisa/core";
import type { OpeningHoursGroup } from "@gohargeisa/types";

import { openDirections } from "@/lib/maps";
import { useRestaurant } from "@/lib/queries";
import { useCart } from "@/lib/cart";
import { useMyReview } from "@/lib/reviews";
import { useTheme } from "@/providers/theme-provider";
import { radii, spacing } from "@/theme";
import { AppText, Button, Card, Screen, Skeleton } from "@/ui";
import { ErrorState } from "@/ui/states";
import { PartnerMap } from "@/components/partner-map";
import { DetailBackButton } from "@/components/detail-back-button";
import { ProductCard } from "@/components/product-card";

const HERO_HEIGHT = 280;

export default function RestaurantDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const { data, isPending, isError, refetch } = useRestaurant(slug);
  const { itemCount: cartItemCount } = useCart();
  const myReview = useMyReview("restaurant", data?.id);

  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));

  if (isPending) {
    return (
      <Screen>
        <Skeleton height={HERO_HEIGHT} radius={0} />
        <View style={{ padding: spacing.screenX, gap: 12 }}>
          <Skeleton height={28} width="70%" />
          <Skeleton height={16} width="40%" />
          <Skeleton height={80} />
        </View>
      </Screen>
    );
  }

  if (isError || !data) {
    return (
      <Screen>
        <ErrorState
          title={t("partner.loadError", "Couldn't load this business")}
          onAction={() => refetch()}
          actionLabel={t("common.retry", "Retry")}
        />
      </Screen>
    );
  }

  const open = getOpenStatus(
    (data.openingHoursStructured as OpeningHoursGroup[] | null) ?? [],
    {
      is24Hours: data.is24Hours,
      temporarilyClosed: data.temporarilyClosed,
      permanentlyClosed: data.permanentlyClosed,
    },
  );
  const openLabel =
    open.state === "open"
      ? t("partner.openNow", "Open now")
      : open.state === "closed"
        ? t("partner.closed", "Closed")
        : open.state === "temporarilyClosed"
          ? t("partner.tempClosed", "Temporarily closed")
          : open.state === "permanentlyClosed"
            ? t("partner.permClosed", "Permanently closed")
            : t("partner.openNow", "Open now");
  const openColor = open.state === "open" ? theme.colors.primary : theme.colors.textMuted;

  const actions: { icon: keyof typeof Ionicons.glyphMap; label: string; run: () => void }[] = [];
  if (data.phone)
    actions.push({
      icon: "call-outline",
      label: t("partner.call", "Call"),
      run: () => Linking.openURL(`tel:${data.phone}`),
    });
  if (data.whatsapp)
    actions.push({
      icon: "logo-whatsapp",
      label: t("partner.whatsapp", "WhatsApp"),
      run: () => Linking.openURL(toWhatsAppHref(data.whatsapp as string)),
    });
  if (data.coords)
    actions.push({
      icon: "navigate-outline",
      label: t("partner.directions", "Directions"),
      run: () =>
        data.coords
          ? openDirections({ latitude: data.coords.lat, longitude: data.coords.lng })
          : undefined,
    });
  else if (data.mapsUrl)
    actions.push({
      icon: "map-outline",
      label: t("partner.map", "Map"),
      run: () => Linking.openURL(data.mapsUrl as string),
    });
  if (data.website)
    actions.push({
      icon: "globe-outline",
      label: t("partner.website", "Website"),
      run: () => Linking.openURL(data.website as string),
    });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.section }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: HERO_HEIGHT, backgroundColor: theme.colors.border }}>
          {data.image ? (
            <Image
              source={{ uri: data.image }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={200}
            />
          ) : null}
        </View>

        <View style={{ paddingHorizontal: spacing.screenX, paddingTop: 16, gap: 10 }}>
          {data.cuisine.length > 0 ? (
            <AppText variant="label" color="muted">
              {data.cuisine.join(" · ").toUpperCase()}
            </AppText>
          ) : null}
          <AppText variant="title">{data.name}</AppText>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <AppText variant="caption" style={{ color: openColor }}>
              ● {openLabel}
            </AppText>
            <AppText variant="caption" color="muted">
              {data.priceRange}
            </AppText>
            {data.reviewCount > 0 ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="star" size={13} color={theme.colors.primary} />
                <AppText variant="caption">
                  {data.rating.toFixed(1)} ({data.reviewCount})
                </AppText>
              </View>
            ) : null}
          </View>

          {data.reservable ? (
            <Button
              label={t("reservations.reserveTable", "Reserve a Table")}
              onPress={() =>
                router.push({
                  pathname: "/booking/table/[listingType]/[id]",
                  params: { listingType: "restaurant", id: data.id, name: data.name },
                })
              }
              variant="secondary"
              size="sm"
              fullWidth={false}
              icon={<Ionicons name="restaurant-outline" size={16} color={theme.colors.primary} />}
            />
          ) : null}

          {actions.length > 0 ? (
            <View style={{ flexDirection: "row", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
              {actions.map((a) => (
                <Pressable
                  key={a.label}
                  onPress={a.run}
                  style={{
                    alignItems: "center",
                    gap: 4,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: radii.lg,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    minWidth: 78,
                  }}
                >
                  <Ionicons name={a.icon} size={20} color={theme.colors.primary} />
                  <AppText variant="label">{a.label}</AppText>
                </Pressable>
              ))}
            </View>
          ) : null}

          {data.description ? (
            <View style={{ marginTop: 12, gap: 6 }}>
              <AppText variant="heading">{t("partner.about", "About")}</AppText>
              <AppText variant="body" color="muted">
                {data.description}
              </AppText>
            </View>
          ) : null}

          {data.menuHighlights.length > 0 ? (
            <View style={{ marginTop: 12, gap: 8 }}>
              <AppText variant="heading">{t("restaurants.menu", "Menu highlights")}</AppText>
              {data.menuHighlights.slice(0, 10).map((m, i) => (
                <View key={`${m.name}-${i}`} style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                  <AppText variant="body" style={{ flex: 1 }}>
                    {m.name}
                  </AppText>
                  {m.price ? (
                    <AppText variant="body" color="muted">
                      {m.price}
                    </AppText>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          {data.openingHours && !data.openingHoursStructured ? (
            <View style={{ marginTop: 12, gap: 6 }}>
              <AppText variant="heading">{t("partner.hours", "Opening hours")}</AppText>
              <AppText variant="body" color="muted">
                {data.openingHours}
              </AppText>
            </View>
          ) : null}

          {data.coords ? (
            <View style={{ marginTop: 12, gap: 8 }}>
              <AppText variant="heading">{t("partner.location", "Location")}</AppText>
              <PartnerMap lat={data.coords.lat} lng={data.coords.lng} label={data.name} />
            </View>
          ) : null}

          {data.amenities.length > 0 ? (
            <View style={{ marginTop: 12, gap: 8 }}>
              <AppText variant="heading">{t("partner.amenities", "Amenities")}</AppText>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {data.amenities.map((a) => (
                  <View
                    key={a}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: radii.pill,
                      backgroundColor: theme.colors.surface,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                    }}
                  >
                    <AppText variant="label">{a}</AppText>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        {data.products.length > 0 ? (
          <View style={{ marginTop: 16 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: spacing.screenX,
                marginBottom: 8,
              }}
            >
              <AppText variant="heading">{t("products.catalogTitle", "Products")}</AppText>
              {cartItemCount > 0 ? (
                <Pressable onPress={() => router.push("/cart")}>
                  <AppText variant="label" color="primary">
                    {t("cart.viewCart", "View Cart")} ({cartItemCount})
                  </AppText>
                </Pressable>
              ) : null}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.screenX }}
            >
              {data.products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  listingType="restaurant"
                  listingId={data.id}
                  slug={data.slug}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {data.gallery.length > 0 ? (
          <View style={{ marginTop: 16 }}>
            <AppText variant="heading" style={{ paddingHorizontal: spacing.screenX, marginBottom: 8 }}>
              {t("partner.gallery", "Photos")}
            </AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingHorizontal: spacing.screenX }}
            >
              {data.gallery.map((g, i) => (
                <Image
                  key={`${g.url}-${i}`}
                  source={{ uri: g.url }}
                  style={{ width: 220, height: 150, borderRadius: radii.lg }}
                  contentFit="cover"
                  transition={200}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={{ marginTop: 20, paddingHorizontal: spacing.screenX, gap: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <AppText variant="heading">{t("partner.reviews", "Reviews")}</AppText>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/review/[listingType]/[id]",
                  params: { listingType: "restaurant", id: data.id, slug: data.slug },
                })
              }
            >
              <AppText variant="label" color="primary">
                {myReview.data ? t("review.editReview", "Edit review") : t("review.leaveReview", "Leave a review")}
              </AppText>
            </Pressable>
          </View>
          {data.reviews.length === 0 ? (
            <AppText variant="caption" color="muted">
              {t("review.beFirstReview", "Be the first to leave a review.")}
            </AppText>
          ) : null}
        </View>

        {data.reviews.length > 0 ? (
          <View style={{ paddingHorizontal: spacing.screenX, gap: 10 }}>
            {data.reviews.slice(0, 10).map((r) => (
              <Card key={r.id}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <AppText variant="bodyStrong">{r.authorName}</AppText>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Ionicons name="star" size={12} color={theme.colors.primary} />
                    <AppText variant="caption">{r.rating}</AppText>
                  </View>
                </View>
                {r.comment ? (
                  <AppText variant="caption" color="muted" style={{ marginTop: 4 }}>
                    {r.comment}
                  </AppText>
                ) : null}
              </Card>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <DetailBackButton onPress={back} />
    </View>
  );
}

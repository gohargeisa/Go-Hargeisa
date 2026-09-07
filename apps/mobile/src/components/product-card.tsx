/**
 * `ProductCard` — one item in a listing's product catalog grid.
 */
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import type { ProductDTO } from "@gohargeisa/api";

import { radii } from "@/theme";
import { AppText, AppImage, Card } from "@/ui";
import type { CartListingType } from "@/lib/cart";

export function ProductCard({
  product,
  listingType,
  listingId,
  slug,
}: {
  product: ProductDTO;
  listingType: CartListingType;
  listingId: string;
  slug: string;
}) {
  const router = useRouter();
  const { t } = useTranslation();

  const hasSale = product.originalPrice && product.originalPrice > (product.price ?? 0);

  return (
    <Card
      padded={false}
      onPress={() =>
        router.push({
          pathname: "/product/[listingType]/[id]",
          params: { listingType, id: product.id, listingId, slug },
        })
      }
      style={{ width: 168, marginEnd: 12 }}
    >
      <AppImage uri={product.image} aspectRatio={1} radius={0} fallbackLabel={product.name} />
      <View style={{ padding: 10, gap: 4 }}>
        <AppText variant="caption" numberOfLines={2} style={{ minHeight: 32 }}>
          {product.name}
        </AppText>
        {product.price != null ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <AppText variant="bodyStrong" color="primary">
              ${product.price.toFixed(2)}
            </AppText>
            {hasSale ? (
              <AppText
                variant="label"
                color="muted"
                style={{ textDecorationLine: "line-through" }}
              >
                ${product.originalPrice!.toFixed(2)}
              </AppText>
            ) : null}
          </View>
        ) : (
          <AppText variant="label" color="muted">
            {t("products.contactForPricing", "Contact for pricing")}
          </AppText>
        )}
        {!product.isAvailable ? (
          <View
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: radii.pill,
              backgroundColor: "#FEE2E2",
            }}
          >
            <AppText variant="label" style={{ color: "#B91C1C" }}>
              {t("products.unavailableBadge", "Unavailable")}
            </AppText>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

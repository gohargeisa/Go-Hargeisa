/**
 * Product detail — variant/option selection, add-ons, quantity, add to
 * cart. Reached from a listing's product catalog section (partner/cafes/
 * restaurants detail screens). The product itself comes from the already-
 * fetched listing detail (TanStack Query cache hit, no extra network call) —
 * products aren't fetched by their own id endpoint, they're embedded in the
 * listing payload (see packages/api/src/types.ts's ProductDTO comment).
 */
import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import type { ProductDTO, ProductOptionDTO } from "@gohargeisa/api";

import { useAddToCart, type AddResult, type CartListingType, type CartSelectedOption } from "@/lib/cart";
import { useCityService, useRestaurant, useCafe } from "@/lib/queries";
import { useTheme } from "@/providers/theme-provider";
import { radii, spacing } from "@/theme";
import { AppText, Button, Input, Screen, SelectField, Skeleton } from "@/ui";
import { ErrorState } from "@/ui/states";

function findProduct(products: ProductDTO[] | undefined, id: string): ProductDTO | undefined {
  return products?.find((p) => p.id === id);
}

export default function ProductDetailScreen() {
  const { listingType, id, listingId, slug } = useLocalSearchParams<{
    listingType: CartListingType;
    id: string;
    listingId: string;
    slug: string;
  }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { addToCart, clearAndAdd } = useAddToCart();

  const cityService = useCityService(listingType === "city_service" ? slug : undefined);
  const restaurant = useRestaurant(listingType === "restaurant" ? slug : undefined);
  const cafe = useCafe(listingType === "cafe" ? slug : undefined);

  const listing =
    listingType === "restaurant" ? restaurant : listingType === "cafe" ? cafe : cityService;

  const [variantId, setVariantId] = useState<string>("");
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [optionValues, setOptionValues] = useState<Record<string, string | string[] | boolean | number>>({});
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);

  if (listing.isPending) {
    return (
      <Screen scroll>
        <View style={{ gap: 12 }}>
          <Skeleton height={280} radius={16} />
          <Skeleton height={28} width="60%" />
          <Skeleton height={48} />
        </View>
      </Screen>
    );
  }

  const data = listing.data as { name: string; products: ProductDTO[]; deliveryEnabled: boolean } | undefined;
  const product = findProduct(data?.products, id);

  if (listing.isError || !data || !product) {
    return (
      <Screen>
        <ErrorState
          title={t("products.loadError", "Couldn't load this product")}
          onAction={() => listing.refetch()}
          actionLabel={t("common.retry", "Retry")}
        />
      </Screen>
    );
  }

  const businessName = data.name;
  const selectedVariant = product.variants.find((v) => v.id === variantId);
  const unitPrice = selectedVariant?.price ?? product.price ?? 0;
  const selectedAddons = product.addons.filter((a) => selectedAddonIds.includes(a.id));

  const selectedOptions: CartSelectedOption[] = product.options
    .filter((o) => optionValues[o.key] !== undefined && optionValues[o.key] !== "" && optionValues[o.key] !== false)
    .map((o) => resolveSelectedOption(o, optionValues[o.key]));

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const optionsTotal = selectedOptions.reduce((sum, o) => sum + o.priceDelta, 0);
  const lineTotal = unitPrice * quantity + addonsTotal + optionsTotal;

  const missingRequiredOption = product.options.find(
    (o) => o.required && (optionValues[o.key] === undefined || optionValues[o.key] === ""),
  );

  function onAddToCart() {
    // TS can't carry the outer `!data || !product` early-return's narrowing
    // into this nested function — both are already guaranteed defined by
    // the time this component can render this far.
    if (!data || !product) return;
    setError(null);
    if (product.variants.length > 0 && !variantId) {
      setError(t("products.selectVariantRequired", "Please select an option."));
      return;
    }
    if (missingRequiredOption) {
      setError(t("products.selectOptionRequired", "Please complete the required options."));
      return;
    }

    const business = {
      listingType,
      listingId,
      businessName,
      deliveryEnabled: data.deliveryEnabled,
    };

    void addToCart(business, product, quantity, selectedAddons, selectedVariant, selectedOptions).then(
      (result: AddResult) => {
        if (result === "conflict") {
          Alert.alert(
            t("cart.crossBusinessTitle", "Start a new order?"),
            t(
              "cart.crossBusinessBody",
              "Your cart contains items from another business. Adding this item will clear your current cart and start a new order.",
            ),
            [
              { text: t("common.cancel", "Cancel"), style: "cancel" },
              {
                text: t("cart.clearAndContinue", "Clear Cart & Continue"),
                style: "destructive",
                onPress: () =>
                  void clearAndAdd(business, product, quantity, selectedAddons, selectedVariant, selectedOptions),
              },
            ],
          );
          return;
        }
        router.push("/cart");
      },
    );
  }

  return (
    <Screen scroll>
      <View style={{ height: 280, backgroundColor: theme.colors.border, marginHorizontal: -spacing.screenX, marginTop: -0 }}>
        {(selectedVariant?.image ?? product.image) ? (
          <Image
            source={{ uri: selectedVariant?.image ?? product.image ?? undefined }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : null}
      </View>

      <View style={{ gap: 14, marginTop: 16 }}>
        <AppText variant="title">{product.name}</AppText>
        {product.description ? (
          <AppText variant="body" color="muted">
            {product.description}
          </AppText>
        ) : null}
        <AppText variant="display" color="primary">
          ${unitPrice > 0 ? unitPrice.toFixed(2) : product.price?.toFixed(2) ?? "—"}
        </AppText>

        {product.variants.length > 0 ? (
          <SelectField
            label={t("products.variantLabel", "Option")}
            value={variantId}
            onChange={setVariantId}
            options={product.variants.map((v) => ({
              value: v.id,
              label: v.name,
              disabled: !v.isAvailable,
              sublabel: v.isAvailable ? undefined : t("hotels.unavailableBadge", "Unavailable"),
            }))}
            placeholder={t("products.selectVariantPlaceholder", "Select an option")}
          />
        ) : null}

        {product.options.map((option) => (
          <ProductOptionInput
            key={option.id}
            option={option}
            value={optionValues[option.key]}
            onChange={(v) => setOptionValues((prev) => ({ ...prev, [option.key]: v }))}
          />
        ))}

        {product.addons.length > 0 ? (
          <View style={{ gap: 8 }}>
            <AppText variant="heading">{t("products.addonsLabel", "Add-ons")}</AppText>
            {product.addons.map((addon) => {
              const checked = selectedAddonIds.includes(addon.id);
              return (
                <Pressable
                  key={addon.id}
                  onPress={() =>
                    setSelectedAddonIds((prev) =>
                      checked ? prev.filter((id2) => id2 !== addon.id) : [...prev, addon.id],
                    )
                  }
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: checked ? theme.colors.primary : theme.colors.border,
                    backgroundColor: checked ? theme.colors.primary + "0D" : theme.colors.surface,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons
                      name={checked ? "checkbox" : "square-outline"}
                      size={18}
                      color={checked ? theme.colors.primary : theme.colors.textMuted}
                    />
                    <AppText variant="body">{addon.name}</AppText>
                  </View>
                  <AppText variant="caption" color="muted">
                    {addon.price > 0 ? `+$${addon.price.toFixed(2)}` : t("products.free", "Free")}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            height: 56,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.border,
            paddingHorizontal: 14,
          }}
        >
          <AppText variant="bodyStrong">{t("products.quantityLabel", "Quantity")}</AppText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <Pressable
              onPress={() => setQuantity((n) => Math.max(1, n - 1))}
              disabled={quantity <= 1}
              hitSlop={8}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: "center",
                justifyContent: "center",
                opacity: quantity <= 1 ? 0.4 : 1,
              }}
            >
              <Ionicons name="remove" size={16} color={theme.colors.text} />
            </Pressable>
            <AppText variant="bodyStrong" style={{ minWidth: 24, textAlign: "center" }}>
              {quantity}
            </AppText>
            <Pressable
              onPress={() => setQuantity((n) => Math.min(20, n + 1))}
              hitSlop={8}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="add" size={16} color={theme.colors.text} />
            </Pressable>
          </View>
        </View>

        {error ? (
          <AppText variant="caption" style={{ color: "#DC2626" }}>
            {error}
          </AppText>
        ) : null}

        <Button
          label={`${t("products.addToCart", "Add to Cart")} · $${lineTotal.toFixed(2)}`}
          onPress={onAddToCart}
          disabled={!product.isAvailable}
        />
      </View>
    </Screen>
  );
}

function resolveSelectedOption(
  option: ProductOptionDTO,
  value: string | string[] | boolean | number,
): CartSelectedOption {
  if (option.type === "select") {
    const choice = option.choices.find((c) => c.value === value);
    return {
      key: option.key,
      label: option.label,
      type: option.type,
      value,
      valueLabel: choice?.label ?? String(value),
      priceDelta: choice?.priceDelta ?? 0,
    };
  }
  if (option.type === "multiselect") {
    const values = Array.isArray(value) ? value : [];
    const chosen = option.choices.filter((c) => values.includes(c.value));
    return {
      key: option.key,
      label: option.label,
      type: option.type,
      value,
      valueLabel: chosen.map((c) => c.label).join(", "),
      priceDelta: chosen.reduce((sum, c) => sum + (c.priceDelta ?? 0), 0),
    };
  }
  if (option.type === "boolean") {
    return {
      key: option.key,
      label: option.label,
      type: option.type,
      value,
      valueLabel: value ? option.label : "",
      priceDelta: value ? option.priceDelta : 0,
    };
  }
  if (option.type === "number") {
    const n = typeof value === "number" ? value : Number(value) || 0;
    return {
      key: option.key,
      label: option.label,
      type: option.type,
      value: n,
      valueLabel: String(n),
      priceDelta: option.priceDelta * n,
    };
  }
  return {
    key: option.key,
    label: option.label,
    type: option.type,
    value,
    valueLabel: String(value),
    priceDelta: 0,
  };
}

function ProductOptionInput({
  option,
  value,
  onChange,
}: {
  option: ProductOptionDTO;
  value: string | string[] | boolean | number | undefined;
  onChange: (v: string | string[] | boolean | number) => void;
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const label = option.required ? `${option.label} *` : option.label;

  if (option.type === "select") {
    return (
      <SelectField
        label={label}
        value={(value as string) ?? ""}
        onChange={onChange}
        options={option.choices.map((c) => ({ value: c.value, label: c.label }))}
        placeholder={option.placeholder ?? t("common.select", "Select")}
      />
    );
  }

  if (option.type === "multiselect") {
    const values = Array.isArray(value) ? value : [];
    return (
      <View style={{ gap: 6 }}>
        <AppText variant="label" color="muted">
          {label}
        </AppText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {option.choices.map((choice) => {
            const checked = values.includes(choice.value);
            return (
              <Pressable
                key={choice.value}
                onPress={() =>
                  onChange(checked ? values.filter((v) => v !== choice.value) : [...values, choice.value])
                }
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: radii.pill,
                  borderWidth: 1,
                  borderColor: checked ? theme.colors.primary : theme.colors.border,
                  backgroundColor: checked ? theme.colors.primary : theme.colors.surface,
                }}
              >
                <AppText variant="label" color={checked ? "inverse" : "default"}>
                  {choice.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  if (option.type === "boolean") {
    const checked = Boolean(value);
    return (
      <Pressable
        onPress={() => onChange(!checked)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: checked ? theme.colors.primary : theme.colors.border,
          backgroundColor: checked ? theme.colors.primary + "0D" : theme.colors.surface,
        }}
      >
        <AppText variant="body">{label}</AppText>
        <Ionicons
          name={checked ? "checkbox" : "square-outline"}
          size={18}
          color={checked ? theme.colors.primary : theme.colors.textMuted}
        />
      </Pressable>
    );
  }

  if (option.type === "number") {
    return (
      <Input
        label={label}
        value={value != null ? String(value) : ""}
        onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ""))}
        keyboardType="numeric"
        placeholder={option.placeholder ?? undefined}
      />
    );
  }

  return (
    <Input
      label={label}
      value={(value as string) ?? ""}
      onChangeText={onChange}
      maxLength={option.maxLength ?? undefined}
      placeholder={option.placeholder ?? undefined}
    />
  );
}

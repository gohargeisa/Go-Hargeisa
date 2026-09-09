/**
 * Cart — lists the on-device cart's items, lets the shopper adjust quantity
 * or remove a line, then proceeds to checkout. ONE CART = ONE BUSINESS (see
 * lib/cart.ts) — there is no cross-business merge to handle here.
 */
import { Alert, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { lineTotal, removeItem, setQuantity, clearCart, useCart } from "@/lib/cart";
import { useTheme } from "@/providers/theme-provider";
import { spacing } from "@/theme";
import { AppText, Button, Card, Screen } from "@/ui";
import { EmptyState } from "@/ui/states";

export default function CartScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { cart, ready, subtotal } = useCart();

  const close = () => (router.canDismiss() ? router.dismiss() : router.replace("/"));

  const confirmClear = () => {
    Alert.alert(t("cart.clearCart", "Clear Cart"), t("cart.clearCartConfirm", "Remove all items from your cart?"), [
      { text: t("common.cancel", "Cancel"), style: "cancel" },
      { text: t("cart.clearCart", "Clear Cart"), style: "destructive", onPress: () => void clearCart() },
    ]);
  };

  return (
    <Screen scroll>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.section }}>
        <AppText variant="display">{t("cart.title", "Your Cart")}</AppText>
        <Pressable onPress={close} hitSlop={10} style={{ padding: 4 }}>
          <Ionicons name="close" size={24} color={theme.colors.textMuted} />
        </Pressable>
      </View>

      {!ready ? null : cart.items.length === 0 ? (
        <EmptyState
          title={t("cart.empty", "Your cart is empty")}
          message={t("cart.emptyDescription", "Add products to get started.")}
        />
      ) : (
        <View style={{ gap: 12 }}>
          {cart.businessName ? (
            <AppText variant="body" color="muted">
              {cart.businessName}
            </AppText>
          ) : null}

          {cart.items.map((item) => (
            <Card key={item.key} style={{ gap: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong">
                    {item.name}
                    {item.variantName ? ` (${item.variantName})` : ""}
                  </AppText>
                  {item.selectedOptions && item.selectedOptions.length > 0 ? (
                    <AppText variant="caption" color="muted">
                      {item.selectedOptions.map((o) => `${o.label}: ${o.valueLabel}`).join(" · ")}
                    </AppText>
                  ) : null}
                  {item.addons.length > 0 ? (
                    <AppText variant="caption" color="muted">
                      {item.addons.map((a) => a.name).join(", ")}
                    </AppText>
                  ) : null}
                </View>
                <AppText variant="bodyStrong">${lineTotal(item).toFixed(2)}</AppText>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                  <Pressable
                    onPress={() => void setQuantity(item.key, item.quantity - 1)}
                    hitSlop={8}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="remove" size={14} color={theme.colors.text} />
                  </Pressable>
                  <AppText variant="bodyStrong">{item.quantity}</AppText>
                  <Pressable
                    onPress={() => void setQuantity(item.key, item.quantity + 1)}
                    hitSlop={8}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="add" size={14} color={theme.colors.text} />
                  </Pressable>
                </View>
                <Pressable onPress={() => void removeItem(item.key)} hitSlop={8}>
                  <AppText variant="label" style={{ color: "#DC2626" }}>
                    {t("cart.remove", "Remove")}
                  </AppText>
                </Pressable>
              </View>
            </Card>
          ))}

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
            <AppText variant="heading">{t("cart.subtotal", "Subtotal")}</AppText>
            <AppText variant="heading">${subtotal.toFixed(2)}</AppText>
          </View>

          <Button label={t("cart.checkout", "Checkout")} onPress={() => router.push("/checkout")} />
          <Pressable onPress={confirmClear} style={{ alignItems: "center", paddingVertical: 8 }}>
            <AppText variant="label" color="muted">
              {t("cart.clearCart", "Clear Cart")}
            </AppText>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}

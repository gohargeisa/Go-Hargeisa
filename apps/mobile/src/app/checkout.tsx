/**
 * Checkout — same field-gating logic as the website's CheckoutForm:
 * delivery/pickup only when the business has deliveryEnabled, delivery
 * address only when delivery is chosen, recipient/occasion/card-message/
 * delivery-time only when any cart line's category is a flower/gift
 * category. No tax preview (v1 scope decision) — subtotal + add-ons only;
 * the real total (including any tax) is still computed correctly
 * server-side by submit_cart_order and reflected in the order confirmation.
 */
import { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { lineTotal, useCart, clearCart, getOrderAttemptId } from "@/lib/cart";
import { OrderError, useSubmitCartOrder } from "@/lib/product-orders";
import { useTheme } from "@/providers/theme-provider";
import { spacing } from "@/theme";
import { AppText, Button, Card, Input, Screen } from "@/ui";

/** Mirrors lib/config/product-categories.ts's FLOWER_SPECIALTY_CATEGORIES on
 *  the website exactly — a small, stable, pure list, duplicated rather than
 *  shared to avoid a new cross-package dependency for six string literals. */
const FLOWER_SPECIALTY_CATEGORIES = ["bouquet", "floral_arrangement", "occasion_gift", "plant", "cake", "gift_sets"];

function todayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { cart, subtotal } = useCart();
  const submit = useSubmitCartOrder();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState<Date | null>(null);
  const [preferredTime, setPreferredTime] = useState<Date | null>(null);
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [occasion, setOccasion] = useState("");
  const [messageNote, setMessageNote] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const close = () => (router.canDismiss() ? router.dismiss() : router.replace("/"));

  const hasGiftItem = cart.items.some((i) => i.category && FLOWER_SPECIALTY_CATEGORIES.includes(i.category));

  if (submit.isSuccess) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: spacing.section }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.primary + "1A",
            }}
          >
            <Ionicons name="checkmark-circle" size={40} color={theme.colors.primary} />
          </View>
          <AppText variant="title" style={{ textAlign: "center" }}>
            {t("products.orderSuccessTitle", "Order Request Received")}
          </AppText>
          <AppText variant="body" color="muted" style={{ textAlign: "center" }}>
            {t("products.orderSuccessBody", "Your order request has been sent. The business will review it and confirm shortly.")}
          </AppText>
          {submit.data ? (
            <View
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <AppText variant="label">{submit.data}</AppText>
            </View>
          ) : null}
          <Button label={t("common.done", "Done")} onPress={close} />
        </View>
      </Screen>
    );
  }

  function onSubmit() {
    setError(null);
    if (!customerName.trim() || !customerPhone.trim()) {
      setError(t("products.errorRequired", "Full name and phone number are required."));
      return;
    }
    if (cart.deliveryEnabled && fulfillmentType === "delivery" && !deliveryAddress.trim()) {
      setError(t("products.errorDeliveryAddressRequired", "A delivery address is required for delivery orders."));
      return;
    }
    if (cart.items.length === 0 || !cart.listingType || !cart.listingId) {
      setError(t("products.errorCartEmpty", "Your cart is empty."));
      return;
    }

    void getOrderAttemptId().then((idempotencyKey) => {
      submit.mutate(
        {
          listingType: cart.listingType!,
          listingId: cart.listingId!,
          items: cart.items,
          customerName,
          customerPhone,
          fulfillmentType: cart.deliveryEnabled ? fulfillmentType : "pickup",
          deliveryAddress: deliveryAddress || undefined,
          preferredDate: preferredDate ? toIsoDate(preferredDate) : undefined,
          preferredTime: hasGiftItem && preferredTime ? toHHMM(preferredTime) : undefined,
          recipientName: recipientName || undefined,
          recipientPhone: recipientPhone || undefined,
          occasion: occasion || undefined,
          messageNote: messageNote || undefined,
          notes: notes || undefined,
          idempotencyKey,
        },
        {
          onSuccess: () => void clearCart(),
          onError: (err) => {
            const message =
              err instanceof OrderError ? err.message : t("products.errorGeneric", "Something went wrong. Please try again.");
            setError(message);
          },
        },
      );
    });
  }

  return (
    <Screen scroll>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.section }}>
        <AppText variant="display">{t("cart.checkout", "Checkout")}</AppText>
        <Pressable onPress={close} hitSlop={10} style={{ padding: 4 }}>
          <Ionicons name="close" size={24} color={theme.colors.textMuted} />
        </Pressable>
      </View>

      <View style={{ gap: 14 }}>
        <Card style={{ gap: 6 }}>
          {cart.items.map((item) => (
            <View key={item.key} style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <AppText variant="caption" color="muted" numberOfLines={1} style={{ flex: 1 }}>
                {item.name}
                {item.variantName ? ` (${item.variantName})` : ""} × {item.quantity}
              </AppText>
              <AppText variant="caption">${lineTotal(item).toFixed(2)}</AppText>
            </View>
          ))}
          <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 4 }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText variant="bodyStrong">{t("cart.subtotal", "Subtotal")}</AppText>
            <AppText variant="bodyStrong">${subtotal.toFixed(2)}</AppText>
          </View>
        </Card>

        <Input label={t("products.nameLabel", "Full name")} value={customerName} onChangeText={setCustomerName} />
        <Input
          label={t("products.phoneLabel", "Phone number")}
          value={customerPhone}
          onChangeText={setCustomerPhone}
          keyboardType="phone-pad"
          placeholder="+252 63 000 0000"
        />

        {cart.deliveryEnabled ? (
          <View style={{ gap: 8 }}>
            <AppText variant="label" color="muted">
              {t("products.fulfillmentLabel", "Delivery or Pickup")}
            </AppText>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["pickup", "delivery"] as const).map((type) => {
                const active = fulfillmentType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setFulfillmentType(type)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      alignItems: "center",
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                      backgroundColor: active ? theme.colors.primary + "0D" : theme.colors.surface,
                    }}
                  >
                    <AppText variant="bodyStrong" color={active ? "primary" : "default"}>
                      {type === "pickup"
                        ? t("products.fulfillmentPickup", "Pickup")
                        : t("products.fulfillmentDelivery", "Delivery")}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {cart.deliveryEnabled && fulfillmentType === "delivery" ? (
          <Input
            label={t("products.deliveryAddressLabel", "Delivery address")}
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
          />
        ) : null}

        <View>
          <AppText variant="label" color="muted" style={{ marginBottom: 6 }}>
            {t("products.preferredDateLabel", "Preferred date (optional)")}
          </AppText>
          <Pressable
            onPress={() => setShowDate(true)}
            style={{
              height: 48,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              paddingHorizontal: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <AppText variant="body" color={preferredDate ? "default" : "muted"}>
              {preferredDate ? preferredDate.toLocaleDateString() : t("common.select", "Select")}
            </AppText>
            <Ionicons name="calendar-outline" size={18} color={theme.colors.textMuted} />
          </Pressable>
        </View>
        {showDate ? (
          <DateTimePicker
            value={preferredDate ?? todayDate()}
            mode="date"
            minimumDate={todayDate()}
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={(_e, selected) => {
              setShowDate(Platform.OS === "ios");
              if (selected) setPreferredDate(selected);
            }}
          />
        ) : null}

        {hasGiftItem ? (
          <>
            <View>
              <AppText variant="label" color="muted" style={{ marginBottom: 6 }}>
                {t("products.preferredTimeLabel", "Delivery time (optional)")}
              </AppText>
              <Pressable
                onPress={() => setShowTime(true)}
                style={{
                  height: 48,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  paddingHorizontal: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <AppText variant="body" color={preferredTime ? "default" : "muted"}>
                  {preferredTime
                    ? preferredTime.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
                    : t("common.select", "Select")}
                </AppText>
                <Ionicons name="time-outline" size={18} color={theme.colors.textMuted} />
              </Pressable>
            </View>
            {showTime ? (
              <DateTimePicker
                value={preferredTime ?? new Date()}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_e, selected) => {
                  setShowTime(Platform.OS === "ios");
                  if (selected) setPreferredTime(selected);
                }}
              />
            ) : null}

            <Input
              label={t("products.recipientNameLabel", "Recipient name (optional)")}
              value={recipientName}
              onChangeText={setRecipientName}
            />
            <Input
              label={t("products.recipientPhoneLabel", "Recipient phone (optional)")}
              value={recipientPhone}
              onChangeText={setRecipientPhone}
              keyboardType="phone-pad"
            />
            <Input label={t("products.occasionLabel", "Occasion (optional)")} value={occasion} onChangeText={setOccasion} />
            <Input
              label={t("products.messageNoteLabel", "Card message (optional)")}
              value={messageNote}
              onChangeText={setMessageNote}
              multiline
              style={{ height: 80, paddingTop: 12, textAlignVertical: "top" }}
            />
          </>
        ) : null}

        <Input
          label={t("products.notesLabel", "Notes (optional)")}
          value={notes}
          onChangeText={setNotes}
          multiline
          style={{ height: 80, paddingTop: 12, textAlignVertical: "top" }}
        />

        {error ? (
          <Card style={{ backgroundColor: theme.colors.background, borderColor: "#DC2626" }}>
            <AppText variant="caption" style={{ color: "#DC2626" }}>
              {error}
            </AppText>
          </Card>
        ) : null}

        <Button label={t("products.submit", "Send Request")} onPress={onSubmit} loading={submit.isPending} />
      </View>
    </Screen>
  );
}

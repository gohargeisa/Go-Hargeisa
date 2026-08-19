"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { OrderableListingType, ProductAddon } from "@/types";
import { cartItemKey, cartItemCount, cartSubtotal, type CartItem, type CartState } from "./types";

const STORAGE_KEY = "gohargeisa_cart_v1";

const EMPTY_CART: CartState = {
  listingType: null,
  listingId: null,
  businessName: null,
  deliveryEnabled: false,
  addons: [],
  items: [],
  orderAttemptId: null,
};

function loadCart(): CartState {
  if (typeof window === "undefined") return EMPTY_CART;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_CART;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return EMPTY_CART;
    return { ...EMPTY_CART, ...parsed };
  } catch {
    return EMPTY_CART;
  }
}

export interface AddToCartBusiness {
  listingType: OrderableListingType;
  listingId: string;
  businessName: string;
  deliveryEnabled: boolean;
  /** The business-wide add-on vocabulary the customer can pick from for any
   * product it sells (e.g. cafes.flower_addons) — empty when the business
   * has none. */
  addons: ProductAddon[];
}

export interface AddToCartProduct {
  productId: string;
  name: string;
  nameAr?: string;
  nameSo?: string;
  image?: string;
  unitPrice: number;
  /** Present only when a specific shade/finish/size was selected — see
   * ProductVariant (types/index.ts). Omit entirely for a non-variant
   * product, identical to every product before variants existed. */
  variantId?: string;
  variantName?: string;
  variantSku?: string;
}

type AddResult = "added" | "conflict";

interface CartContextValue {
  cart: CartState;
  isOpen: boolean;
  view: "cart" | "checkout" | "confirmation";
  lastOrderReference: string | null;
  itemCount: number;
  subtotal: number;
  openCart: () => void;
  closeCart: () => void;
  goToCheckout: () => void;
  backToCart: () => void;
  showConfirmation: (reference: string) => void;
  /** Returns "conflict" (without mutating the cart) when the cart already
   * holds items from a different business — the caller (AddToCartButton)
   * shows a confirmation dialog and calls clearAndAdd() if the shopper
   * confirms starting a new order. */
  addItem: (business: AddToCartBusiness, product: AddToCartProduct, quantity: number, selectedAddons: ProductAddon[]) => AddResult;
  clearAndAdd: (business: AddToCartBusiness, product: AddToCartProduct, quantity: number, selectedAddons: ProductAddon[]) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  /** Returns the current checkout attempt's idempotency key, generating and
   * persisting one (into cart state, and so into localStorage) the first
   * time it's called for a given cart. Calling it again before the cart is
   * cleared always returns the same value — a submit retry (double-click,
   * network retry, resubmission after a refresh) reuses it; clearCart()
   * resets it to null, so the next order starts with a fresh one. */
  getOrderAttemptId: () => string;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState>(EMPTY_CART);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"cart" | "checkout" | "confirmation">("cart");
  const [lastOrderReference, setLastOrderReference] = useState<string | null>(null);

  useEffect(() => {
    setCart(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  const buildLine = useCallback(
    (product: AddToCartProduct, quantity: number, selectedAddons: ProductAddon[]): CartItem => ({
      key: cartItemKey(product.productId, selectedAddons.map((a) => a.id), product.variantId),
      productId: product.productId,
      name: product.name,
      nameAr: product.nameAr,
      nameSo: product.nameSo,
      image: product.image,
      unitPrice: product.unitPrice,
      quantity,
      addons: selectedAddons,
      variantId: product.variantId,
      variantName: product.variantName,
      variantSku: product.variantSku,
    }),
    []
  );

  const addItem = useCallback(
    (business: AddToCartBusiness, product: AddToCartProduct, quantity: number, selectedAddons: ProductAddon[]): AddResult => {
      let result: AddResult = "added";
      setCart((prev) => {
        if (prev.items.length > 0 && (prev.listingType !== business.listingType || prev.listingId !== business.listingId)) {
          result = "conflict";
          return prev;
        }
        const line = buildLine(product, quantity, selectedAddons);
        const existingIndex = prev.items.findIndex((i) => i.key === line.key);
        const items =
          existingIndex >= 0
            ? prev.items.map((i, idx) => (idx === existingIndex ? { ...i, quantity: Math.min(20, i.quantity + quantity) } : i))
            : [...prev.items, line];
        return {
          listingType: business.listingType,
          listingId: business.listingId,
          businessName: business.businessName,
          deliveryEnabled: business.deliveryEnabled,
          addons: business.addons,
          items,
          // Preserved, not reset — adding another line to a cart already
          // mid-checkout must not silently issue a new idempotency key out
          // from under an in-flight submit.
          orderAttemptId: prev.orderAttemptId,
        };
      });
      return result;
    },
    [buildLine]
  );

  const clearAndAdd = useCallback(
    (business: AddToCartBusiness, product: AddToCartProduct, quantity: number, selectedAddons: ProductAddon[]) => {
      const line = buildLine(product, quantity, selectedAddons);
      setCart({
        listingType: business.listingType,
        listingId: business.listingId,
        businessName: business.businessName,
        deliveryEnabled: business.deliveryEnabled,
        addons: business.addons,
        // Explicitly fresh — this replaces a whole different cart (the
        // conflict-confirmation path), so any pending attempt id for the
        // abandoned cart must not carry over.
        orderAttemptId: null,
        items: [line],
      });
    },
    [buildLine]
  );

  const removeItem = useCallback((key: string) => {
    setCart((prev) => {
      const items = prev.items.filter((i) => i.key !== key);
      return items.length === 0 ? EMPTY_CART : { ...prev, items };
    });
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setCart((prev) => {
      if (quantity < 1) {
        const items = prev.items.filter((i) => i.key !== key);
        return items.length === 0 ? EMPTY_CART : { ...prev, items };
      }
      const items = prev.items.map((i) => (i.key === key ? { ...i, quantity: Math.min(20, quantity) } : i));
      return { ...prev, items };
    });
  }, []);

  const clearCart = useCallback(() => setCart(EMPTY_CART), []);

  const getOrderAttemptId = useCallback((): string => {
    if (cart.orderAttemptId) return cart.orderAttemptId;
    const id = crypto.randomUUID();
    setCart((prev) => (prev.orderAttemptId ? prev : { ...prev, orderAttemptId: id }));
    return id;
  }, [cart.orderAttemptId]);

  const openCart = useCallback(() => {
    setView("cart");
    setIsOpen(true);
  }, []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const goToCheckout = useCallback(() => setView("checkout"), []);
  const backToCart = useCallback(() => setView("cart"), []);
  const showConfirmation = useCallback((reference: string) => {
    setLastOrderReference(reference);
    setView("confirmation");
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      isOpen,
      view,
      lastOrderReference,
      itemCount: cartItemCount(cart.items),
      subtotal: cartSubtotal(cart.items),
      openCart,
      closeCart,
      goToCheckout,
      backToCart,
      showConfirmation,
      addItem,
      clearAndAdd,
      removeItem,
      setQuantity,
      clearCart,
      getOrderAttemptId,
    }),
    [
      cart,
      isOpen,
      view,
      lastOrderReference,
      openCart,
      closeCart,
      goToCheckout,
      backToCart,
      showConfirmation,
      addItem,
      clearAndAdd,
      removeItem,
      setQuantity,
      clearCart,
      getOrderAttemptId,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

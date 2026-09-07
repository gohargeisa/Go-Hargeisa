/**
 * The on-device cart — ONE CART = ONE BUSINESS, same rule as the website's
 * lib/cart/{types,cart-context}.tsx, ported to the module-level
 * cache+listeners+AsyncStorage pattern already used by lib/favorites.ts
 * (simpler than a React Context for this app, and consistent with the one
 * other on-device store already in this codebase) rather than the website's
 * Context-based CartProvider.
 *
 * Pricing math (`lineTotal`/`cartSubtotal`) MUST match `submit_cart_order`'s
 * server-side formula exactly — see lib/cart/types.ts's own comment on the
 * website. The RPC re-resolves and re-prices everything itself; this is a
 * display convenience, never trusted.
 */
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ProductAddonDTO, ProductDTO, ProductVariantDTO } from "@gohargeisa/api";

const STORAGE_KEY = "gohargeisa.cart.v1";

export type CartListingType = "city_service" | "cafe" | "restaurant";

export interface CartSelectedOption {
  key: string;
  label: string;
  type: string;
  value: string | string[] | boolean | number;
  valueLabel: string;
  priceDelta: number;
}

export interface CartItem {
  key: string;
  productId: string;
  name: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  addons: ProductAddonDTO[];
  variantId?: string;
  variantName?: string;
  variantSku?: string;
  category: string | null;
  selectedOptions?: CartSelectedOption[];
}

export interface CartState {
  listingType: CartListingType | null;
  listingId: string | null;
  businessName: string | null;
  deliveryEnabled: boolean;
  items: CartItem[];
  /** Idempotency key for the current checkout attempt — generated once
   *  (getOrderAttemptId) and cleared only when the cart is, so a retry
   *  (double-tap, network retry) of the same attempt always carries the
   *  same key. */
  orderAttemptId: string | null;
}

export interface CartBusiness {
  listingType: CartListingType;
  listingId: string;
  businessName: string;
  deliveryEnabled: boolean;
}

export interface AddToCartProduct {
  productId: string;
  name: string;
  image: string | null;
  unitPrice: number;
  variantId?: string;
  variantName?: string;
  variantSku?: string;
  category: string | null;
  selectedOptions?: CartSelectedOption[];
}

const EMPTY_CART: CartState = {
  listingType: null,
  listingId: null,
  businessName: null,
  deliveryEnabled: false,
  items: [],
  orderAttemptId: null,
};

/** Serialized `key=value` pairs, sorted so option order never changes the
 *  key — mirrors lib/cart/types.ts's cartItemKey exactly. */
export function cartItemKey(
  productId: string,
  addonIds: string[],
  variantId?: string,
  selectedOptions?: CartSelectedOption[],
): string {
  let key = `${productId}::${[...addonIds].sort().join(",")}`;
  if (variantId) key += `::${variantId}`;
  if (selectedOptions && selectedOptions.length > 0) {
    const serialized = [...selectedOptions]
      .map((o) => `${o.key}=${Array.isArray(o.value) ? [...o.value].sort().join(",") : String(o.value)}`)
      .sort()
      .join("|");
    key += `::opts:${serialized}`;
  }
  return key;
}

/** Matches submit_cart_order()'s formula: unit price scales with quantity,
 *  add-ons and selected options are each a flat per-line charge. */
export function lineTotal(item: CartItem): number {
  const addonsTotal = item.addons.reduce((sum, a) => sum + a.price, 0);
  const optionsTotal = (item.selectedOptions ?? []).reduce((sum, o) => sum + o.priceDelta, 0);
  return item.unitPrice * item.quantity + addonsTotal + optionsTotal;
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + lineTotal(item), 0);
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/** RFC-4122-ish v4 id — good enough for an idempotency key, no crypto
 *  dependency needed (Hermes doesn't reliably expose crypto.randomUUID()). */
function randomId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cache: CartState | null = null;
const listeners = new Set<(cart: CartState) => void>();

async function load(): Promise<CartState> {
  if (cache) return cache;
  let result: CartState;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    result = parsed && Array.isArray(parsed.items) ? { ...EMPTY_CART, ...parsed } : EMPTY_CART;
  } catch {
    result = EMPTY_CART;
  }
  cache = result;
  return result;
}

async function persist(next: CartState): Promise<void> {
  cache = next;
  listeners.forEach((l) => l(next));
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // best-effort — the in-memory cache still reflects the change this session
  }
}

function buildLine(product: AddToCartProduct, quantity: number, selectedAddons: ProductAddonDTO[]): CartItem {
  return {
    key: cartItemKey(product.productId, selectedAddons.map((a) => a.id), product.variantId, product.selectedOptions),
    productId: product.productId,
    name: product.name,
    image: product.image,
    unitPrice: product.unitPrice,
    quantity,
    addons: selectedAddons,
    variantId: product.variantId,
    variantName: product.variantName,
    variantSku: product.variantSku,
    category: product.category,
    selectedOptions: product.selectedOptions,
  };
}

export type AddResult = "added" | "conflict";

/** Returns "conflict" (without mutating the cart) when the cart already
 *  holds items from a different business — the caller shows a confirmation
 *  and calls clearAndAdd() if the shopper confirms starting a new order. */
export async function addItem(
  business: CartBusiness,
  product: AddToCartProduct,
  quantity: number,
  selectedAddons: ProductAddonDTO[],
): Promise<AddResult> {
  const prev = await load();
  if (prev.items.length > 0 && (prev.listingType !== business.listingType || prev.listingId !== business.listingId)) {
    return "conflict";
  }
  const line = buildLine(product, quantity, selectedAddons);
  const existingIndex = prev.items.findIndex((i) => i.key === line.key);
  const items =
    existingIndex >= 0
      ? prev.items.map((i, idx) => (idx === existingIndex ? { ...i, quantity: Math.min(20, i.quantity + quantity) } : i))
      : [...prev.items, line];

  await persist({
    listingType: business.listingType,
    listingId: business.listingId,
    businessName: business.businessName,
    deliveryEnabled: business.deliveryEnabled,
    items,
    orderAttemptId: prev.orderAttemptId,
  });
  return "added";
}

export async function clearAndAdd(
  business: CartBusiness,
  product: AddToCartProduct,
  quantity: number,
  selectedAddons: ProductAddonDTO[],
): Promise<void> {
  const line = buildLine(product, quantity, selectedAddons);
  await persist({
    listingType: business.listingType,
    listingId: business.listingId,
    businessName: business.businessName,
    deliveryEnabled: business.deliveryEnabled,
    items: [line],
    orderAttemptId: null,
  });
}

export async function removeItem(key: string): Promise<void> {
  const prev = await load();
  const items = prev.items.filter((i) => i.key !== key);
  await persist(items.length === 0 ? EMPTY_CART : { ...prev, items });
}

export async function setQuantity(key: string, quantity: number): Promise<void> {
  const prev = await load();
  if (quantity < 1) {
    return removeItem(key);
  }
  const items = prev.items.map((i) => (i.key === key ? { ...i, quantity: Math.min(20, quantity) } : i));
  await persist({ ...prev, items });
}

export async function clearCart(): Promise<void> {
  await persist(EMPTY_CART);
}

export async function getOrderAttemptId(): Promise<string> {
  const prev = await load();
  if (prev.orderAttemptId) return prev.orderAttemptId;
  const id = randomId();
  await persist({ ...prev, orderAttemptId: id });
  return id;
}

/** Reactive cart state for screens/components. `ready` is false only until
 *  the first AsyncStorage read completes. */
export function useCart(): { cart: CartState; ready: boolean; itemCount: number; subtotal: number } {
  const [cart, setCart] = useState<CartState>(cache ?? EMPTY_CART);
  const [ready, setReady] = useState(cache !== null);

  useEffect(() => {
    let active = true;
    load().then((initial) => {
      if (active) {
        setCart(initial);
        setReady(true);
      }
    });
    const listener = (next: CartState) => setCart(next);
    listeners.add(listener);
    return () => {
      active = false;
      listeners.delete(listener);
    };
  }, []);

  return { cart, ready, itemCount: cartItemCount(cart.items), subtotal: cartSubtotal(cart.items) };
}

/** Convenience: the product-detail screen's add-to-cart action, resolving
 *  addons the same way the website's getValidAddonsForProduct did — except
 *  here that merge already happened server-side (see toProductDTO on the
 *  website), so this just wires the already-correct `product.addons`. */
function toAddToCartProduct(
  product: ProductDTO,
  variant?: ProductVariantDTO,
  selectedOptions?: CartSelectedOption[],
): AddToCartProduct {
  return {
    productId: product.id,
    name: product.name,
    image: variant?.image ?? product.image,
    unitPrice: variant?.price ?? product.price ?? 0,
    variantId: variant?.id,
    variantName: variant?.name,
    variantSku: variant?.sku ?? undefined,
    category: product.category,
    selectedOptions,
  };
}

export function useAddToCart() {
  const addToCart = useCallback(
    (
      business: CartBusiness,
      product: ProductDTO,
      quantity: number,
      selectedAddons: ProductAddonDTO[],
      variant?: ProductVariantDTO,
      selectedOptions?: CartSelectedOption[],
    ): Promise<AddResult> =>
      addItem(business, toAddToCartProduct(product, variant, selectedOptions), quantity, selectedAddons),
    [],
  );

  const clearAndAddProduct = useCallback(
    (
      business: CartBusiness,
      product: ProductDTO,
      quantity: number,
      selectedAddons: ProductAddonDTO[],
      variant?: ProductVariantDTO,
      selectedOptions?: CartSelectedOption[],
    ): Promise<void> =>
      clearAndAdd(business, toAddToCartProduct(product, variant, selectedOptions), quantity, selectedAddons),
    [],
  );

  return { addToCart, clearAndAdd: clearAndAddProduct };
}

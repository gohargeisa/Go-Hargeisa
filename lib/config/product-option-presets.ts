import type { ProductCategory } from "@/types";
import type { ProductOptionInput } from "@/lib/actions/product-options";
import type { ProductListingType } from "@/lib/actions/products";
import { FLOWER_SPECIALTY_CATEGORIES } from "@/lib/config/product-categories";

/** One suggested starting point for a product's own options — not a
 * category-wide default applied automatically, just a one-click prefill an
 * owner can then edit/remove before saving (see ProductOptionsManager). The
 * options system itself stays exactly as generic/per-product as it already
 * is; this only removes the blank-page problem of "what fields should a
 * flower bouquet even have?" without hardcoding a Flower/Cake/Makeup
 * component fork anywhere in the ordering UI itself. */
export type OptionPreset = Omit<ProductOptionInput, "sortOrder"> & { presetLabel: string; presetLabelAr: string; presetLabelSo: string };

const CAKE_ONLY: ProductCategory[] = ["cake"];
const FLOWER_GIFT_CATEGORIES: ProductCategory[] = FLOWER_SPECIALTY_CATEGORIES.filter((c) => !CAKE_ONLY.includes(c));
const MAKEUP_CATEGORIES: ProductCategory[] = ["makeup", "cosmetics"];

const FLOWER_PRESETS: OptionPreset[] = [
  {
    presetLabel: "Size", presetLabelAr: "الحجم", presetLabelSo: "Cabbirka",
    key: "size", label: "Size", labelAr: "الحجم", labelSo: "Cabbirka", type: "select", required: false, priceDelta: 0,
    choices: [
      { value: "small", label: "Small", labelAr: "صغير", labelSo: "Yar" },
      { value: "medium", label: "Medium", labelAr: "متوسط", labelSo: "Dhexdhexaad" },
      { value: "large", label: "Large", labelAr: "كبير", labelSo: "Weyn" },
    ],
  },
  {
    presetLabel: "Color", presetLabelAr: "اللون", presetLabelSo: "Midabka",
    key: "color", label: "Color", labelAr: "اللون", labelSo: "Midabka", type: "select", required: false, priceDelta: 0,
    choices: [
      { value: "red", label: "Red", labelAr: "أحمر", labelSo: "Guduud" },
      { value: "pink", label: "Pink", labelAr: "وردي", labelSo: "Casaan Khafiif" },
      { value: "white", label: "White", labelAr: "أبيض", labelSo: "Cad" },
      { value: "yellow", label: "Yellow", labelAr: "أصفر", labelSo: "Jaale" },
      { value: "mixed", label: "Mixed", labelAr: "مشكل", labelSo: "Isku Darsan" },
    ],
  },
  {
    presetLabel: "Gift Wrap", presetLabelAr: "تغليف الهدية", presetLabelSo: "Duudduubka Hadiyadda",
    key: "gift_wrap", label: "Gift Wrap", labelAr: "تغليف الهدية", labelSo: "Duudduubka Hadiyadda", type: "boolean", required: false, priceDelta: 3, choices: [],
  },
  {
    presetLabel: "Card Message", presetLabelAr: "رسالة البطاقة", presetLabelSo: "Fariinta Kaadhka",
    key: "card_message", label: "Card Message", labelAr: "رسالة البطاقة", labelSo: "Fariinta Kaadhka", type: "text", required: false, priceDelta: 0, choices: [], maxLength: 200,
  },
];

const CAKE_PRESETS: OptionPreset[] = [
  {
    presetLabel: "Size", presetLabelAr: "الحجم", presetLabelSo: "Cabbirka",
    key: "size", label: "Size", labelAr: "الحجم", labelSo: "Cabbirka", type: "select", required: false, priceDelta: 0,
    choices: [
      { value: "small", label: "Small (serves 4-6)", labelAr: "صغير (يكفي 4-6)", labelSo: "Yar (u filan 4-6)" },
      { value: "medium", label: "Medium (serves 8-12)", labelAr: "متوسط (يكفي 8-12)", labelSo: "Dhexdhexaad (u filan 8-12)" },
      { value: "large", label: "Large (serves 15-20)", labelAr: "كبير (يكفي 15-20)", labelSo: "Weyn (u filan 15-20)" },
    ],
  },
  {
    presetLabel: "Flavor", presetLabelAr: "النكهة", presetLabelSo: "Dhadhanka",
    key: "flavor", label: "Flavor", labelAr: "النكهة", labelSo: "Dhadhanka", type: "select", required: false, priceDelta: 0,
    choices: [
      { value: "vanilla", label: "Vanilla", labelAr: "فانيليا", labelSo: "Faniila" },
      { value: "chocolate", label: "Chocolate", labelAr: "شوكولاتة", labelSo: "Shukulaato" },
      { value: "red_velvet", label: "Red Velvet", labelAr: "ريد فيلفيت", labelSo: "Red Velvet" },
      { value: "fruit", label: "Fruit", labelAr: "فواكه", labelSo: "Khudaar" },
    ],
  },
  {
    presetLabel: "Filling", presetLabelAr: "الحشوة", presetLabelSo: "Buuxinta",
    key: "filling", label: "Filling", labelAr: "الحشوة", labelSo: "Buuxinta", type: "select", required: false, priceDelta: 0,
    choices: [
      { value: "cream", label: "Cream", labelAr: "كريمة", labelSo: "Kareemo" },
      { value: "chocolate_ganache", label: "Chocolate Ganache", labelAr: "غاناش الشوكولاتة", labelSo: "Ganache Shukulaato" },
      { value: "fruit_jam", label: "Fruit Jam", labelAr: "مربى الفواكه", labelSo: "Jaam Khudaar" },
      { value: "none", label: "None", labelAr: "بدون", labelSo: "Midna" },
    ],
  },
  {
    presetLabel: "Frosting", presetLabelAr: "التزيين", presetLabelSo: "Dahaadhka",
    key: "frosting", label: "Frosting", labelAr: "التزيين", labelSo: "Dahaadhka", type: "select", required: false, priceDelta: 0,
    choices: [
      { value: "buttercream", label: "Buttercream", labelAr: "كريمة الزبدة", labelSo: "Buttercream" },
      { value: "fondant", label: "Fondant", labelAr: "فوندان", labelSo: "Fondant" },
      { value: "whipped_cream", label: "Whipped Cream", labelAr: "كريمة مخفوقة", labelSo: "Kareemo la Garaacay" },
    ],
  },
  {
    presetLabel: "Writing on Cake", presetLabelAr: "كتابة على الكعكة", presetLabelSo: "Qorista Keega",
    key: "writing", label: "Writing on Cake", labelAr: "كتابة على الكعكة", labelSo: "Qorista Keega", type: "text", required: false, priceDelta: 0, choices: [], maxLength: 60,
  },
];

const MAKEUP_PRESETS: OptionPreset[] = [
  {
    presetLabel: "Shade", presetLabelAr: "درجة اللون", presetLabelSo: "Midabka",
    key: "shade", label: "Shade", labelAr: "درجة اللون", labelSo: "Midabka", type: "select", required: false, priceDelta: 0,
    choices: [
      { value: "fair", label: "Fair", labelAr: "فاتح جدًا", labelSo: "Aad u Khafiif" },
      { value: "light", label: "Light", labelAr: "فاتح", labelSo: "Khafiif" },
      { value: "medium", label: "Medium", labelAr: "متوسط", labelSo: "Dhexdhexaad" },
      { value: "tan", label: "Tan", labelAr: "أسمر فاتح", labelSo: "Bunni Khafiif" },
      { value: "deep", label: "Deep", labelAr: "غامق", labelSo: "Madow" },
    ],
  },
  {
    presetLabel: "Size", presetLabelAr: "الحجم", presetLabelSo: "Cabbirka",
    key: "size", label: "Size", labelAr: "الحجم", labelSo: "Cabbirka", type: "select", required: false, priceDelta: 0,
    choices: [
      { value: "mini", label: "Mini", labelAr: "صغير جدًا", labelSo: "Aad u Yar" },
      { value: "standard", label: "Standard", labelAr: "عادي", labelSo: "Caadi" },
      { value: "value_size", label: "Value Size", labelAr: "الحجم الاقتصادي", labelSo: "Cabbirka Dheeraadka ah" },
    ],
  },
];

const CAFE_DRINK_PRESETS: OptionPreset[] = [
  {
    presetLabel: "Temperature", presetLabelAr: "الحرارة", presetLabelSo: "Heerkulka",
    key: "temperature", label: "Temperature", labelAr: "الحرارة", labelSo: "Heerkulka", type: "select", required: false, priceDelta: 0,
    choices: [
      { value: "hot", label: "Hot", labelAr: "ساخن", labelSo: "Kulul" },
      { value: "iced", label: "Iced", labelAr: "بارد", labelSo: "Qabow" },
    ],
  },
  {
    presetLabel: "Size", presetLabelAr: "الحجم", presetLabelSo: "Cabbirka",
    key: "size", label: "Size", labelAr: "الحجم", labelSo: "Cabbirka", type: "select", required: false, priceDelta: 0,
    choices: [
      { value: "small", label: "Small", labelAr: "صغير", labelSo: "Yar" },
      { value: "medium", label: "Medium", labelAr: "متوسط", labelSo: "Dhexdhexaad" },
      { value: "large", label: "Large", labelAr: "كبير", labelSo: "Weyn" },
    ],
  },
  {
    presetLabel: "Milk Type", presetLabelAr: "نوع الحليب", presetLabelSo: "Nooca Caanaha",
    key: "milk_type", label: "Milk Type", labelAr: "نوع الحليب", labelSo: "Nooca Caanaha", type: "select", required: false, priceDelta: 0,
    choices: [
      { value: "whole", label: "Whole Milk", labelAr: "حليب كامل الدسم", labelSo: "Caano Buuxa" },
      { value: "skim", label: "Skim Milk", labelAr: "حليب خالي الدسم", labelSo: "Caano La Saaray Subagga" },
      { value: "oat", label: "Oat Milk", labelAr: "حليب الشوفان", labelSo: "Caanaha Oat-ka" },
      { value: "almond", label: "Almond Milk", labelAr: "حليب اللوز", labelSo: "Caanaha Almond-ka" },
      { value: "none", label: "No Milk", labelAr: "بدون حليب", labelSo: "Caano La'aan" },
    ],
  },
  {
    presetLabel: "Sugar Level", presetLabelAr: "مستوى السكر", presetLabelSo: "Heerka Sonkorta",
    key: "sugar_level", label: "Sugar Level", labelAr: "مستوى السكر", labelSo: "Heerka Sonkorta", type: "select", required: false, priceDelta: 0,
    choices: [
      { value: "none", label: "No Sugar", labelAr: "بدون سكر", labelSo: "Sonkor La'aan" },
      { value: "less", label: "Less Sugar", labelAr: "سكر أقل", labelSo: "Sonkor Yar" },
      { value: "regular", label: "Regular", labelAr: "عادي", labelSo: "Caadi" },
      { value: "extra", label: "Extra Sweet", labelAr: "حلو زيادة", labelSo: "Aad u Macaan" },
    ],
  },
];

const RESTAURANT_PRESETS: OptionPreset[] = [
  {
    presetLabel: "Spice Level", presetLabelAr: "مستوى الحرارة", presetLabelSo: "Heerka Xanuunka",
    key: "spice_level", label: "Spice Level", labelAr: "مستوى الحرارة", labelSo: "Heerka Xanuunka", type: "select", required: false, priceDelta: 0,
    choices: [
      { value: "mild", label: "Mild", labelAr: "خفيف", labelSo: "Khafiif" },
      { value: "medium", label: "Medium", labelAr: "متوسط", labelSo: "Dhexdhexaad" },
      { value: "spicy", label: "Spicy", labelAr: "حار", labelSo: "Xanuun Badan" },
    ],
  },
  {
    presetLabel: "Extras", presetLabelAr: "إضافات", presetLabelSo: "Dheeraad",
    key: "extras", label: "Extras", labelAr: "إضافات", labelSo: "Dheeraad", type: "multiselect", required: false, priceDelta: 0,
    choices: [
      { value: "extra_cheese", label: "Extra Cheese", labelAr: "جبنة إضافية", labelSo: "Farmaajo Dheeraad ah", priceDelta: 1 },
      { value: "extra_sauce", label: "Extra Sauce", labelAr: "صلصة إضافية", labelSo: "Saliid Dheeraad ah", priceDelta: 0.5 },
      { value: "no_onions", label: "No Onions", labelAr: "بدون بصل", labelSo: "Basal La'aan" },
      { value: "no_tomato", label: "No Tomato", labelAr: "بدون طماطم", labelSo: "Yaanyo La'aan" },
    ],
  },
];

/**
 * Suggested option presets for a product — combines its own category (fixed
 * vocabulary: flowers/cakes/makeup) with its business's listing type
 * (cafe/restaurant menu items use free-text categories like "hot_coffee",
 * so a category match alone would miss them). Returns [] when nothing
 * relevant applies — most products (hotels have none at all; a perfume shop
 * with no preset category) get no suggestions, exactly as today.
 */
export function getOptionPresets(category: ProductCategory | undefined, listingType: ProductListingType): OptionPreset[] {
  if (category && CAKE_ONLY.includes(category)) return CAKE_PRESETS;
  if (category && FLOWER_GIFT_CATEGORIES.includes(category)) return FLOWER_PRESETS;
  if (category && MAKEUP_CATEGORIES.includes(category)) return MAKEUP_PRESETS;
  if (listingType === "cafe") return CAFE_DRINK_PRESETS;
  if (listingType === "restaurant") return RESTAURANT_PRESETS;
  return [];
}

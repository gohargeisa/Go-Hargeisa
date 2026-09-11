/**
 * Excellence Café — curated real photography for the restaurant page.
 * Excellence-Café-only; every path points at a real photo of this
 * restaurant, copied (never moved) from the business owner's own supplied
 * camera library on the owner's Desktop (`Excellence Café/Smash/`, ~110
 * professional frames + a printed-menu set). Selection + resize records:
 * scripts/build-excellence-cafe-photos.mjs (first pass) and
 * scripts/update-excellence-cafe-assets.mjs (2026-09-11 — added the real
 * covered-terrace and buffet-hall room shots the first pass had missed, and
 * installed the owner's new transparent logo). Two source photos showing
 * children were excluded; two dessert photos were cropped to remove a
 * personal item in the background — none of this touches the originals.
 *
 * NB: the source set's `atmosphere/rooftop-terrace-wide-*.jpg` filenames are
 * from the first pass and are WRONG — those two files are Turkish-eggs
 * breakfast plates, not room shots. They are kept on disk (not renamed) but
 * referenced below only as `food`. The real terrace is
 * `atmosphere/terrace-dining-wide.jpg`.
 *
 * The Hero, story and Featured Dishes selections live here (not hard-coded
 * in the components) so the curation can be revised without touching layout.
 */
const BASE = "/images/partners/excellence-cafe";

// Hero — the covered garden terrace (2026-09-11, on request): the same real,
// owner-watermarked photo used as the "A look around" story's feature image
// (atmosphere/terrace-dining-wide.jpg — verified in that section's own
// header). Chosen over the mezze-spread food shot as the primary hero so the
// first thing a visitor sees is the actual place, not a plate. The mezze
// spread stays in Featured Dishes/gallery; nothing else changed.
export const EXCELLENCE_CAFE_HERO = {
  src: `${BASE}/atmosphere/terrace-dining-wide.jpg`,
} as const;

export interface ExcellenceCafePhoto {
  src: string;
  /** camelCase identifier, humanized into alt text at render time (see
   * lib/utils/humanize-photo-key.ts) — avoids needing ~60 individual
   * `photoAlt_*` translation keys for a curated-but-plain photo set with no
   * per-photo story copy (unlike The Village's small, hand-written 8-photo
   * story sequence, which does carry real per-photo captions). */
  key: string;
}

/**
 * "A day at Excellence Café" editorial visual-story set — the same pattern
 * as lib/config/the-village-photos.ts (feature → alternating splits →
 * cinematic band → detail trio). Every frame is a real owner-supplied photo
 * of this café's own dining room, buffet, service and coffee counter; each
 * `key` maps to `excellenceCafe.story_<key>_title` / `_body` /
 * `photoAlt_<key>` in messages/{en,ar,so}.json, written to describe only
 * what the photo actually shows (verified frame-by-frame — the source set's
 * folder names were unreliable). `objectPosition` is tuned per frame.
 */
export type ExcellenceCafeStoryRole = "feature" | "split" | "band" | "detail";

export interface ExcellenceCafeStoryPhoto {
  key: string;
  src: string;
  role: ExcellenceCafeStoryRole;
  objectPosition: string;
}

export const EXCELLENCE_CAFE_STORY_PHOTOS: ExcellenceCafeStoryPhoto[] = [
  // feature: the covered garden terrace — long wooden tables, grey woven
  // chairs, black pergola frame, mashrabiya screens, string lights, a lawn
  // beyond. Owner-watermarked ("Excellence Café", bottom-right).
  { key: "terrace", src: `${BASE}/atmosphere/terrace-dining-wide.jpg`, role: "feature", objectPosition: "50% 55%" },
  // split: the indoor buffet hall — skirted linen tables, gold + steel
  // chafing dishes, forest-mural wall, staff in branded shirts.
  { key: "buffetHall", src: `${BASE}/atmosphere/buffet-hall-wide.jpg`, role: "split", objectPosition: "50% 45%" },
  // split: pour-over coffee being brewed on a scale at the counter.
  { key: "coffeeCounter", src: `${BASE}/drinks/v60-pour-over.jpg`, role: "split", objectPosition: "50% 45%" },
  // band: the official "DAILY LUNCH BUFFET — a premium buffet experience,
  // every day" pull-up banner beside the buffet table.
  { key: "buffetBanner", src: `${BASE}/atmosphere/daily-lunch-buffet-sign.jpg`, role: "band", objectPosition: "50% 55%" },
  // detail trio: a group table laid on the terrace, tea carried to the
  // table, a branded dessert plate.
  { key: "groupTable", src: `${BASE}/atmosphere/terrace-group-table.jpg`, role: "detail", objectPosition: "50% 45%" },
  { key: "teaService", src: `${BASE}/atmosphere/staff-tea-branded-apron.jpg`, role: "detail", objectPosition: "50% 35%" },
  { key: "dessertPlate", src: `${BASE}/desserts/caramel-cheesecake-branded-plate.jpg`, role: "detail", objectPosition: "50% 50%" },
];

/**
 * Coffee & Drinks showcase — a curated subset of the real drink photos
 * below, surfaced as a visual strip in the "Coffee & Drinks" block rather
 * than left only inside the full gallery grid. Captions are humanized from
 * each key at render time (same rule as FEATURED above — no invented menu
 * name/price is attached).
 */
export const EXCELLENCE_CAFE_DRINKS_SHOWCASE: ExcellenceCafePhoto[] = [
  { key: "cappuccino", src: `${BASE}/drinks/cappuccino.jpg` },
  { key: "icedCoffee", src: `${BASE}/drinks/iced-coffee.jpg` },
  { key: "v60PourOver", src: `${BASE}/drinks/v60-pour-over.jpg` },
  { key: "strawberryFrappe", src: `${BASE}/drinks/strawberry-frappe.jpg` },
  { key: "oreoMilkshake", src: `${BASE}/drinks/oreo-milkshake.jpg` },
  { key: "watermelonJuice", src: `${BASE}/drinks/watermelon-juice.jpg` },
];

export const EXCELLENCE_CAFE_FEATURED: ExcellenceCafePhoto[] = [
  { key: "chickenPizza", src: `${BASE}/featured/chicken-pizza.jpg` },
  { key: "koftaSkewers", src: `${BASE}/featured/kofta-skewers-sizzling.jpg` },
  { key: "cheeseburger", src: `${BASE}/featured/cheeseburger.jpg` },
  { key: "crispyChickenBurger", src: `${BASE}/featured/crispy-chicken-burger.jpg` },
  { key: "bakedCheesePasta", src: `${BASE}/featured/baked-cheese-pasta.jpg` },
  { key: "chickenGordonBleu", src: `${BASE}/featured/chicken-gordon-bleu.jpg` },
  { key: "biryani", src: `${BASE}/featured/biryani.jpg` },
  { key: "butterChicken", src: `${BASE}/featured/butter-chicken.jpg` },
];

/**
 * Full gallery set fed to BusinessPhotoGallery, tagged with the existing
 * RESTAURANT_GALLERY_CATEGORIES vocabulary (lib/utils/gallery-categories.ts)
 * — food / drinks / atmosphere (the terrace, buffet hall and service shots
 * carry this tag). Kept as one flat list (rather than per-section exports
 * like FEATURED above) since the gallery component does its own category
 * filtering from this shape.
 */
export const EXCELLENCE_CAFE_GALLERY: { src: string; category: "food" | "drinks" | "atmosphere"; key: string }[] = [
  // Establishing / space shots first — the covered garden terrace and the
  // indoor buffet hall lead the "all" view.
  { key: "coveredGardenTerrace", src: `${BASE}/atmosphere/terrace-dining-wide.jpg`, category: "atmosphere" },
  { key: "terraceGroupTable", src: `${BASE}/atmosphere/terrace-group-table.jpg`, category: "atmosphere" },
  { key: "indoorBuffetHall", src: `${BASE}/atmosphere/buffet-hall-wide.jpg`, category: "atmosphere" },
  { key: "dailyLunchBuffetBanner", src: `${BASE}/atmosphere/daily-lunch-buffet-sign.jpg`, category: "atmosphere" },
  { key: "buffetSpreadCloseup", src: `${BASE}/atmosphere/buffet-spread-closeup.jpg`, category: "atmosphere" },
  { key: "staffPlatingBuffet", src: `${BASE}/atmosphere/staff-plating-buffet.jpg`, category: "atmosphere" },
  { key: "buffetHallBanner", src: `${BASE}/atmosphere/lunch-buffet-spread-banner.jpg`, category: "atmosphere" },
  { key: "staffAtBuffetLine", src: `${BASE}/atmosphere/staff-serving-buffet.jpg`, category: "atmosphere" },
  // Breakfast
  { key: "englishBreakfastPlate", src: `${BASE}/breakfast/english-breakfast-plate.jpg`, category: "food" },
  // Turkish-style eggs with toast — one plated indoors, one on an outdoor
  // table with tea (folder-named "rooftop-terrace" in the source set, but
  // they are breakfast plates, not room shots — categorised as food).
  { key: "turkishEggsToast", src: `${BASE}/atmosphere/rooftop-terrace-wide-1.jpg`, category: "food" },
  { key: "turkishEggsToastTea", src: `${BASE}/atmosphere/rooftop-terrace-wide-2.jpg`, category: "food" },
  { key: "croissantEggBreakfast", src: `${BASE}/breakfast/croissant-egg-breakfast.jpg`, category: "food" },
  { key: "loxooxSuqaarBranded", src: `${BASE}/breakfast/loxoox-suqaar-branded.jpg`, category: "food" },
  { key: "waffleSyrupPour", src: `${BASE}/breakfast/waffle-syrup-pour.jpg`, category: "food" },
  { key: "shakshukaEggs", src: `${BASE}/breakfast/shakshuka-eggs.jpg`, category: "food" },
  { key: "eggAvocadoToast", src: `${BASE}/breakfast/egg-avocado-toast.jpg`, category: "food" },
  { key: "cambaburPancakeSyrup", src: `${BASE}/breakfast/cambabur-pancake-syrup.jpg`, category: "food" },
  { key: "grilledCheeseSandwich", src: `${BASE}/breakfast/grilled-cheese-sandwich.jpg`, category: "food" },
  // Main courses
  { key: "curryBiryani", src: `${BASE}/main-courses/curry-biryani.jpg`, category: "food" },
  { key: "goatLambShank", src: `${BASE}/main-courses/goat-lamb-shank.jpg`, category: "food" },
  { key: "crispyFish", src: `${BASE}/main-courses/crispy-fish.jpg`, category: "food" },
  { key: "beefCurrySizzling", src: `${BASE}/main-courses/beef-curry-sizzling-plate.jpg`, category: "food" },
  { key: "chickenPiccata", src: `${BASE}/main-courses/chicken-piccata.jpg`, category: "food" },
  { key: "chickenCordonBleuPlated", src: `${BASE}/main-courses/chicken-cordon-bleu-plated.jpg`, category: "food" },
  { key: "glazedSkewersWithRice", src: `${BASE}/main-courses/glazed-skewers-with-rice.jpg`, category: "food" },
  // Pizza
  { key: "vegetablePizza", src: `${BASE}/pizza/vegetable-pizza.jpg`, category: "food" },
  { key: "buffetPizzaChafingDish", src: `${BASE}/pizza/buffet-pizza-chafing-dish.jpg`, category: "food" },
  // Burgers / sandwiches
  { key: "cheeseburgerStack", src: `${BASE}/burgers-sandwiches/cheeseburger-stack.jpg`, category: "food" },
  { key: "wrapSlicedOpen", src: `${BASE}/burgers-sandwiches/wrap-sliced-open.jpg`, category: "food" },
  { key: "chickenTunaSandwich", src: `${BASE}/burgers-sandwiches/chicken-tuna-sandwich.jpg`, category: "food" },
  { key: "croissantSandwich", src: `${BASE}/burgers-sandwiches/croissant-sandwich.jpg`, category: "food" },
  { key: "croqueMonsieurBake", src: `${BASE}/burgers-sandwiches/croque-monsieur-cheese-bake.jpg`, category: "food" },
  // Pastas
  { key: "bakedCheesyPastaPull", src: `${BASE}/pastas/baked-cheesy-pasta-cheese-pull.jpg`, category: "food" },
  { key: "pestoChickenPasta", src: `${BASE}/pastas/pesto-chicken-pasta-garlic-bread.jpg`, category: "food" },
  // Salads
  { key: "greekSalad", src: `${BASE}/salads/greek-salad.jpg`, category: "food" },
  { key: "roastedVegetableSalad", src: `${BASE}/salads/roasted-vegetable-salad.jpg`, category: "food" },
  { key: "tabbouleh", src: `${BASE}/salads/tabbouleh.jpg`, category: "food" },
  { key: "mutabalMezze", src: `${BASE}/salads/mutabal-mezze-cucumber.jpg`, category: "food" },
  { key: "chickenCaesarSalad", src: `${BASE}/salads/chicken-caesar-salad.jpg`, category: "food" },
  // Desserts
  { key: "chocolateCakeWithTea", src: `${BASE}/desserts/chocolate-cake-with-tea.jpg`, category: "food" },
  { key: "caramelCheesecake", src: `${BASE}/desserts/caramel-cheesecake.jpg`, category: "food" },
  { key: "caramelCheesecakeBranded", src: `${BASE}/desserts/caramel-cheesecake-branded-plate.jpg`, category: "food" },
  { key: "berryCheesecake", src: `${BASE}/desserts/berry-cheesecake.jpg`, category: "food" },
  { key: "caramelCheesecakeCloseup", src: `${BASE}/desserts/caramel-cheesecake-closeup.jpg`, category: "food" },
  { key: "chocolateChipCookies", src: `${BASE}/desserts/chocolate-chip-cookies.jpg`, category: "food" },
  // Drinks — visual only; no matching menu category/prices exist (see
  // components/excellence-cafe/excellence-cafe-experience.tsx's own note).
  { key: "icedCoffee", src: `${BASE}/drinks/iced-coffee.jpg`, category: "drinks" },
  { key: "cappuccino", src: `${BASE}/drinks/cappuccino.jpg`, category: "drinks" },
  { key: "blueRedOmbreMocktail", src: `${BASE}/drinks/blue-red-ombre-mocktail.jpg`, category: "drinks" },
  { key: "v60PourOver", src: `${BASE}/drinks/v60-pour-over.jpg`, category: "drinks" },
  { key: "matchaLatte", src: `${BASE}/drinks/matcha-latte.jpg`, category: "drinks" },
  { key: "oreoMilkshake", src: `${BASE}/drinks/oreo-milkshake.jpg`, category: "drinks" },
  { key: "vanillaMilkshake", src: `${BASE}/drinks/vanilla-milkshake.jpg`, category: "drinks" },
  { key: "strawberryFrappe", src: `${BASE}/drinks/strawberry-frappe.jpg`, category: "drinks" },
  { key: "watermelonJuice", src: `${BASE}/drinks/watermelon-juice.jpg`, category: "drinks" },
  { key: "orangeCarrotJuice", src: `${BASE}/drinks/orange-carrot-juice.jpg`, category: "drinks" },
  { key: "turmericLatte", src: `${BASE}/drinks/turmeric-latte.jpg`, category: "drinks" },
  { key: "threeIcedCoffeesBranded", src: `${BASE}/drinks/three-iced-coffees-branded.jpg`, category: "drinks" },
  { key: "mojitoStyleMocktail", src: `${BASE}/drinks/mojito-style-mocktail.jpg`, category: "drinks" },
  // More atmosphere / service — branded cups, chafing dishes, table service.
  { key: "brandedCupStack", src: `${BASE}/atmosphere/branded-cup-stack.jpg`, category: "atmosphere" },
  { key: "buffetChafingDishes", src: `${BASE}/atmosphere/buffet-chafing-dish-interior.jpg`, category: "atmosphere" },
  { key: "staffTeaService", src: `${BASE}/atmosphere/staff-tea-branded-apron.jpg`, category: "atmosphere" },
];

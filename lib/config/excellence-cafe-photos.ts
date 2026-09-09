/**
 * Excellence Café — curated real photography for the restaurant page.
 * Excellence-Café-only; every path points at a real photo of this
 * restaurant, copied (never moved) from the business owner's own supplied
 * camera library (115 photos reviewed; the strongest subset per section was
 * kept — see scripts/build-excellence-cafe-photos.mjs for the full curation
 * + crop record). Two source photos showing children were excluded
 * entirely; two dessert photos were cropped to remove a personal handbag/
 * perfume bottle visible in the background — neither the exclusion nor the
 * crop touches the original files on disk.
 *
 * The Hero and Featured Dishes selections live here (not hard-coded in the
 * components) so the curation can be revised without touching layout code.
 */
const BASE = "/images/partners/excellence-cafe";

export const EXCELLENCE_CAFE_HERO = {
  src: `${BASE}/hero/mezze-spread-wide.jpg`,
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
 * — food/drinks/dining_area(unused, no interior-seating photos curated)/
 * atmosphere/other. Built from the same curated copy this file's BASE
 * folder holds; kept as one flat list (rather than per-section exports like
 * FEATURED above) since the gallery component does its own category
 * filtering from this shape.
 */
export const EXCELLENCE_CAFE_GALLERY: { src: string; category: "food" | "drinks" | "atmosphere"; key: string }[] = [
  // Breakfast
  { key: "englishBreakfastPlate", src: `${BASE}/breakfast/english-breakfast-plate.jpg`, category: "food" },
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
  // Atmosphere
  { key: "rooftopTerraceWide1", src: `${BASE}/atmosphere/rooftop-terrace-wide-1.jpg`, category: "atmosphere" },
  { key: "rooftopTerraceWide2", src: `${BASE}/atmosphere/rooftop-terrace-wide-2.jpg`, category: "atmosphere" },
  { key: "brandedCupStack", src: `${BASE}/atmosphere/branded-cup-stack.jpg`, category: "atmosphere" },
  { key: "lunchBuffetSpreadBanner", src: `${BASE}/atmosphere/lunch-buffet-spread-banner.jpg`, category: "atmosphere" },
  { key: "buffetChafingDishInterior", src: `${BASE}/atmosphere/buffet-chafing-dish-interior.jpg`, category: "atmosphere" },
  { key: "staffServingBuffet", src: `${BASE}/atmosphere/staff-serving-buffet.jpg`, category: "atmosphere" },
  { key: "staffTeaBrandedApron", src: `${BASE}/atmosphere/staff-tea-branded-apron.jpg`, category: "atmosphere" },
  { key: "dailyLunchBuffetSign", src: `${BASE}/atmosphere/daily-lunch-buffet-sign.jpg`, category: "atmosphere" },
];

/**
 * Display-time dish descriptions for The Village Hargeisa, applied the same
 * way FLORMAR_PRODUCT_DESCRIPTIONS already is (see lib/config/
 * flormar-product-details.ts) — read-only, keyed by the exact
 * `products.name`, NEVER written back to the database.
 *
 * WHY THIS EXISTS: only 10 of The Village's 59 `products` rows carry a
 * `description`. The restaurant's own printed menu (four photographs in the
 * Desktop "The Village" folder, catalogued in
 * docs/the-village-menu-corrections.md) has verbatim copy for almost every
 * dish. This file surfaces exactly that copy — nothing generated, guessed
 * or paraphrased — so the premium digital menu reads completely without a
 * production write.
 *
 * COVERAGE — 26 dishes. Deliberately NOT included:
 *   - the 10 dishes that already have a DB `description` (left untouched)
 *   - "Hawaiian" pizza — the last word of its description is cut off on the
 *     menu photo ("...premium smoked ___"), so it stays uncertain
 *   - Pastas — the printed menu gives no per-dish copy for them
 *   - "The Village Specials" (12 dishes) — not present on any of the four
 *     printed-menu photos; flagged for the owner to confirm, never invented
 *
 * A dish not listed here keeps its existing behaviour (DB description, or
 * none). English only: there are no verified Arabic/Somali dish
 * translations, and the page already shows English dish names + the 10
 * existing English DB descriptions on /ar and /so — this stays consistent
 * with that.
 */
export const THE_VILLAGE_DISH_DESCRIPTIONS: Record<string, string> = {
  // Saj-Shawarma & Sandwiches
  "Chicken Shawarma on Saj Bread":
    "Saj bread stuffed with thinly sliced grilled golden chicken shawarma, cucumber pickles, French fries and garlic sauce.",
  "Meat Shawarma on Saj Bread":
    "Saj bread stuffed with thinly sliced grilled meat shawarma, cucumber pickles, onion, tomato, parsley and tahini sauce.",
  "Hummus with Chicken Shawarma":
    "Chicken shawarma platter — thinly sliced chicken shawarma served over a generous spread of hummus.",
  "Hummus with Meat Shawarma":
    "Meat shawarma platter — thinly sliced meat shawarma served over a generous spread of hummus.",
  "Falafel in Saj Bread":
    "Saj bread sandwich of a deep-fried patty made from ground chickpeas, fava beans, parsley and spices. Served with fries and salad.",
  "Shish Kabab in Saj Bread": "Saj bread sandwich stuffed with grilled Lebanese meat kebab, tomato and parsley.",
  "Shrimp in Saj Bread":
    "Saj bread sandwich stuffed with fried or grilled shrimp and special sauce. Served with French fries and salad.",
  "Grilled Shish Tawook in Saj Bread":
    "Saj bread sandwich stuffed with marinated and grilled chicken. Served with French fries and salad.",
  Quesadillas:
    "Fresh flour tortilla grilled with a choice of chicken, fish or beef. Served with French fries and garlic sauce.",

  // Grills (Mediterranean BBQ)
  "Tikka Shuqaf":
    "Marinated tender grilled meat cubes. Served with grilled tomato, onion, French fries, hummus and bread.",
  "Shiish Kebab":
    "The chef's marinated minced lamb skewers. Served with grilled tomato, onion, French fries, hummus and bread.",
  "Shiish Tawooq":
    "The chef's marinated minced chicken skewers. Served with grilled tomato, onion, French fries, garlic and bread.",
  "Kebab-Khashkhash":
    "Minced meat skewers served on top of spicy tomato sauce, with grilled tomato, onion, French fries, hummus and bread.",
  "Grilled Lamb Chops":
    "B.B.Q lamb chops. Served with grilled tomato, onion, French fries, hummus and bread.",
  "Mixed Grill":
    "Mixed skewers of meat tikka, shish tawook and shish kebab with lamb chops and arayes. Served with grilled tomato, onion, French fries, hummus and bread.",

  // All Day Breakfast
  "Fresh Fruit Salad": "A colourful mix of nature's sweetest gifts — a vibrant selection.",
  Porridge: "Oatmeal cereal served with honey and milk.",
  "Fluffy Loxoox": "Traditional Somali pancake served with a choice of muqmad, or olive oil and honey.",
  "French Toast": "Toast served with homemade syrup and a choice of fresh fruits.",
  "Pan Cakes": "Served with homemade syrup and a choice of fresh fruits.",
  Eggs: "Boiled, omelette, shakshuka or sunny side.",
  "English Breakfast": "The classic English breakfast with beef, baked beans, grilled tomatoes and fried eggs.",
  "Beef Stir Fry (Suqar)":
    "Beef cubes marinated with traditional spices and sautéed with onion, tomato and bell pepper.",
  "Sauteed Liver": "Locally flavoured sautéed choice of camel or goat liver with vegetables.",
  Beans: "A choice of full, baked or green beans cooked with vegetables and herbs.",
  "Arabic Breakfast":
    "The classic Arabic breakfast with jam, honey, bread and cheese, plus dips, za'atar (a spice mix of thyme, sumac, sesame seeds and olive oil), fresh fruit and vegetables, olives, pickles and eggs.",
};

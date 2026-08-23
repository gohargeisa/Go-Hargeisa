/**
 * The Village Hargeisa's complete menu, exactly as supplied by the business
 * owner (names, categories, prices, descriptions) — not researched, not
 * invented. Kept as data (not inlined in a script) so it can be reviewed,
 * diffed, and re-run independently of however it gets seeded.
 *
 * BLOCKED as of 2026-09-03: inserting these rows fails against production
 * today because `products.category` carries a check constraint (added by
 * 20260903000003_products_kids_clothing_category.sql) that only allows
 * cosmetics/perfume/flower categories — no restaurant category at all. The
 * fix is prepared at supabase/migrations/20260903000004_products_category_
 * free_text.sql (drops that constraint, restoring the free-text behavior
 * 20260823000002_universal_cart_orders.sql already documented as the
 * intended design) but is NOT applied to production — see that file's own
 * header and scripts/seed-village-menu.ts for the run command once it is.
 *
 * Every `option` here maps to a real `product_options` row (see
 * scripts/seed-village-menu.ts) using the existing, already-generic
 * ProductOption/ProductOptionsForm system — no new schema or UI needed.
 */

export type VillageMenuOptionKind = "pizzaSize" | "pastaProtein" | "specialsSide" | "shrimpPreparation";

export interface VillageMenuItem {
  name: string;
  price: number;
  description?: string;
  option?: VillageMenuOptionKind;
}

export interface VillageMenuCategory {
  category: string;
  items: VillageMenuItem[];
}

export const VILLAGE_MENU: VillageMenuCategory[] = [
  {
    category: "All Day Breakfast",
    items: [
      { name: "Fresh Fruit Salad", price: 3.5 },
      { name: "Porridge", price: 3.5 },
      { name: "Fluffy Loxoox", price: 3.5 },
      { name: "French Toast", price: 5.0 },
      { name: "Pan Cakes", price: 5.0 },
      { name: "Eggs", price: 5.0 },
      { name: "English Breakfast", price: 7.0 },
      { name: "Beef Stir Fry (Suqaar)", price: 6.0 },
      { name: "Sauteed Liver", price: 6.0 },
      { name: "Beans", price: 4.5 },
      { name: "Arabic Breakfast", price: 7.5 },
    ],
  },
  {
    category: "Side Dishes",
    items: [
      { name: "Honey", price: 0.5 },
      { name: "Yogurt", price: 0.5 },
      { name: "Olives", price: 0.5 },
      { name: "Zait a Za'atar", price: 1.0 },
      { name: "Mukhallal (Pickled Vegetables)", price: 0.5 },
    ],
  },
  {
    category: "Saj — Shawarma & Sandwiches",
    items: [
      { name: "Chicken Shawarma on Saj Bread", price: 6.0 },
      { name: "Meat Shawarma on Saj Bread", price: 7.0 },
      { name: "Hummus with Chicken Shawarma", price: 7.0 },
      { name: "Hummus with Meat Shawarma", price: 7.5 },
      { name: "Falafel in Saj Bread", price: 5.0 },
      { name: "Shish Kabab in Saj Bread", price: 7.5 },
      { name: "Shrimp in Saj Bread", price: 7.0, option: "shrimpPreparation" },
      { name: "Grilled Shish Tawook in Saj Bread", price: 7.0 },
      { name: "Quesadillas", price: 7.5 },
    ],
  },
  {
    category: "Burgers",
    items: [
      { name: "Classic Cheese Burger", price: 7.0, description: "Prime beef topped with cheese, lettuce, tomatoes, onion and pickles." },
      { name: "Texas", price: 7.5, description: "Prime beef patty with cheddar cheese, fried egg, lettuce and barbecue sauce." },
      { name: "Crispy Chicken Burger", price: 7.0, description: "Juicy golden-fried chicken fillet, fresh lettuce, pickles and creamy mayo in a toasted bun." },
    ],
  },
  {
    category: "Grills — Mediterranean BBQ",
    items: [
      { name: "Tikka Shuqaf", price: 10.0 },
      { name: "Shish Kebab", price: 9.0 },
      { name: "Shish Tawooq", price: 8.0 },
      { name: "Kebab-Khashkash", price: 9.5 },
      { name: "Grilled Lamb Chops", price: 10.0 },
      { name: "Mixed Grill Medium", price: 14.0 },
      { name: "Mixed Grill Large", price: 21.0 },
    ],
  },
  {
    category: "The Village Specials",
    items: [
      { name: "Sweet and Sour Crispy Chicken", price: 8.5, option: "specialsSide" },
      { name: "Butter Chicken", price: 8.5, option: "specialsSide" },
      { name: "Grilled Chicken", price: 8.5, option: "specialsSide" },
      { name: "Pepper Steak", price: 9.5, option: "specialsSide" },
      { name: "Fajita", price: 8.5, option: "specialsSide" },
      { name: "Grilled Shrimps 200g", price: 9.5, option: "specialsSide" },
      { name: "Haneed Lamb", price: 10.0, option: "specialsSide" },
      { name: "Daud Basha", price: 9.0, option: "specialsSide" },
      { name: "Shaya Steak", price: 9.5, option: "specialsSide" },
      { name: "Grilled Fish", price: 9.0, option: "specialsSide" },
      { name: "Curry Fish", price: 9.0, option: "specialsSide" },
      { name: "Fried Finger Fish", price: 9.0, option: "specialsSide" },
    ],
  },
  {
    category: "Signature Pizza",
    items: [
      { name: "Margherita", price: 7.0, description: "Mozzarella, pomodoro sauce & oregano.", option: "pizzaSize" },
      { name: "Chicken Pizza", price: 7.0, description: "Chicken, mozzarella, bell peppers, onions and tomato basil sauce on a crispy crust.", option: "pizzaSize" },
      { name: "Beef Pizza", price: 7.0, description: "Meat, mozzarella, bell peppers, onions and tomato basil sauce on a crispy crust.", option: "pizzaSize" },
      { name: "The Village Pizza", price: 7.0, description: "Mix of beef & chicken with mozzarella, pomodoro sauce, green chillies and black olives.", option: "pizzaSize" },
      { name: "Spicy Tuna Pizza", price: 7.0, description: "Spicy tuna, mozzarella, red onions, chili flakes and hot sauce on a crispy crust.", option: "pizzaSize" },
      // No description was supplied for Hawaiian — left unset rather than
      // invented (the classic ham+pineapple combo is assumed knowledge,
      // not something the business actually told us).
      { name: "Hawaiian", price: 7.0, option: "pizzaSize" },
    ],
  },
  {
    category: "Pastas",
    items: [
      { name: "Alfredo Pasta", price: 8.0, option: "pastaProtein" },
      { name: "Penne Arabiata", price: 8.0, option: "pastaProtein" },
      { name: "Spaghetti Bolognese", price: 8.0, option: "pastaProtein" },
      { name: "Lasagna", price: 8.0, option: "pastaProtein" },
      { name: "Bechamel", price: 8.0, option: "pastaProtein" },
    ],
  },
  {
    category: "Manakeesh",
    items: [
      { name: "Zaatar", price: 4.5, description: "Traditional Levantine flatbread topped with a fragrant blend of zaatar herbs, olive oil and sesame seeds." },
      { name: "Meat", price: 5.5, description: "Stone-baked flatbread topped with seasoned minced meat." },
    ],
  },
];

export const VILLAGE_MENU_OPTION_DEFS: Record<
  VillageMenuOptionKind,
  { key: string; label: string; choices: { value: string; label: string; priceDelta?: number }[] }
> = {
  pizzaSize: {
    key: "size",
    label: "Size",
    choices: [
      { value: "small", label: "Small", priceDelta: 0 },
      { value: "medium", label: "Medium", priceDelta: 2 },
      { value: "large", label: "Large", priceDelta: 4 },
    ],
  },
  pastaProtein: {
    key: "protein",
    label: "Protein",
    choices: [
      { value: "chicken", label: "Chicken" },
      { value: "meat", label: "Meat" },
      { value: "fish", label: "Fish" },
    ],
  },
  specialsSide: {
    key: "side",
    label: "Side",
    choices: [
      { value: "steamed_rice", label: "Steamed Rice" },
      { value: "pasta", label: "Pasta" },
      { value: "mashed_potatoes", label: "Mashed Potatoes" },
      { value: "french_fries", label: "French Fries" },
      { value: "vegetables", label: "Vegetables" },
    ],
  },
  shrimpPreparation: {
    key: "preparation",
    label: "Preparation",
    choices: [
      { value: "fried", label: "Fried" },
      { value: "grilled", label: "Grilled" },
    ],
  },
};

export const VILLAGE_MENU_ITEM_COUNT = VILLAGE_MENU.reduce((sum, c) => sum + c.items.length, 0);

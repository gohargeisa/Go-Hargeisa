/**
 * Excellence Café's complete menu, transcribed verbatim from the business's
 * own 8 official printed-menu photographs — every name, category and price
 * here traces directly to that source, nothing invented or researched.
 * Three verified ambiguities from the source photos, each resolved by the
 * business owner rather than guessed:
 *
 *   1. "Chocolate Cake" appears twice on the Dessert page at two different
 *      prices ($2.50 and $2.00) — kept as two separate, unlabeled entries.
 *   2. "Frappuccino" and "Chocolate Frappe" each appear twice — once under
 *      Iced Coffee ($2.95), once under Frappes ($3.00) — kept as printed,
 *      one row per category (same name, different category + price).
 *   3. Fresh Juices / Milkshakes / Smoothies / Mojitos were requested as
 *      menu categories, but no official menu page lists any such section —
 *      deliberately NOT included here; the real photos of these drinks are
 *      shown as gallery-only content (lib/config/excellence-cafe-photos.ts),
 *      never given an invented name or price.
 *
 * Sized items (Burgers, Wraps, Pizza, Whole Fish) use the same real
 * `ProductOption` (type "select", key "size") + `priceDelta` mechanism as
 * lib/data/village-menu-seed.ts's pizza sizing — one product row, a base
 * price, and a per-choice delta computed from the two/three printed prices.
 * "Choices of Pasta & Sauses" and "Iced Lemon Tea" (flavor) and "Full Cream
 * Cake" (flavor) use the same option mechanism for their own printed
 * choice lists, all at $0 delta (the source menu prices them flat).
 */

export interface ExcellenceCafeOptionChoice {
  value: string;
  label: string;
  priceDelta?: number;
}

export interface ExcellenceCafeOption {
  key: string;
  label: string;
  choices: ExcellenceCafeOptionChoice[];
}

export interface ExcellenceCafeMenuItem {
  name: string;
  price: number;
  options?: ExcellenceCafeOption[];
}

export interface ExcellenceCafeMenuCategory {
  category: string;
  items: ExcellenceCafeMenuItem[];
}

const sizeOption = (small: number, medium: number, large: number): ExcellenceCafeOption => ({
  key: "size",
  label: "Size",
  choices: [
    { value: "small", label: "Small", priceDelta: 0 },
    { value: "medium", label: "Medium", priceDelta: Number((medium - small).toFixed(2)) },
    { value: "large", label: "Large", priceDelta: Number((large - small).toFixed(2)) },
  ],
});

const singleDoubleOption = (single: number, double: number): ExcellenceCafeOption => ({
  key: "size",
  label: "Size",
  choices: [
    { value: "single", label: "Single", priceDelta: 0 },
    { value: "double", label: "Double", priceDelta: Number((double - single).toFixed(2)) },
  ],
});

const normalJumboOption = (normal: number, jumbo: number): ExcellenceCafeOption => ({
  key: "size",
  label: "Size",
  choices: [
    { value: "normal", label: "Normal", priceDelta: 0 },
    { value: "jumbo", label: "Jumbo", priceDelta: Number((jumbo - normal).toFixed(2)) },
  ],
});

export const EXCELLENCE_CAFE_MENU: ExcellenceCafeMenuCategory[] = [
  {
    category: "Breakfast",
    items: [
      { name: "Small Chopped Meat-Suqaar", price: 6 },
      { name: "Liver", price: 6 },
      { name: "Camel Liver", price: 5 },
      { name: "Kidney", price: 7 },
      { name: "Beans", price: 5 },
      { name: "Cambabur", price: 5 },
      { name: "Loxoox", price: 4 },
      { name: "Muqmad", price: 6 },
      { name: "Oatmeal", price: 5 },
      { name: "Waffle", price: 7 },
      { name: "Pancakes", price: 7 },
      { name: "Cornflax", price: 5 },
      { name: "French Toast", price: 8 },
      { name: "Toast and Butter", price: 6 },
      { name: "Shakshoka", price: 6 },
      { name: "Scrambled Eggs", price: 6 },
      { name: "Egg&Roll", price: 7 },
      { name: "Turkish Breakfast (2 persons)", price: 15 },
      { name: "English Breakfast", price: 10 },
      { name: "Arabic Breakfast", price: 10 },
      { name: "Cilibir Egg Turkey", price: 7 },
      { name: "Cromcio", price: 8 },
      { name: "Eggs Florentine", price: 7 },
      { name: "Egg & Avocado Poached Eggs", price: 7 },
      { name: "Mushroom Omelette", price: 7 },
      { name: "Spanish Omelette", price: 7 },
      { name: "Liver Omelette", price: 8 },
      { name: "Granola", price: 8 },
      { name: "Chicken Mayo Sandwich", price: 7 },
      { name: "Tuna Croissant Sandwich", price: 7 },
      { name: "Toast Cheese Sandwich", price: 7 },
      { name: "Mashroom Cheese Omelet", price: 7 },
      { name: "Liver Cheese Omelet", price: 8 },
      { name: "Bendict Egg", price: 7 },
    ],
  },
  {
    category: "Main Courses",
    items: [
      { name: "Butter Chicken", price: 9.9 },
      { name: "Biryani Chicken", price: 9.9 },
      { name: "Biryani Fish", price: 9.9 },
      { name: "Biryani Meat", price: 9.9 },
      { name: "Biryani Kufta", price: 11 },
      { name: "Biryani Shrimps", price: 11 },
      { name: "Chicken Curry", price: 9.9 },
      { name: "Beef Curry", price: 9.9 },
      { name: "Fish Curry", price: 9.9 },
      { name: "Chicken Piccata Mash Potato", price: 9.9 },
      { name: "Chicken Peas Rice", price: 9.9 },
      { name: "Chicken Mushroom", price: 9.9 },
      { name: "Chicken Stroganoff Rice", price: 9.9 },
      { name: "Chicken Katsu Rice", price: 9.9 },
      { name: "Grilled Fish Saffron Sauce", price: 9.9 },
      { name: "Hammor Fish Harra", price: 9.9 },
      { name: "Beef Steak", price: 9.99 },
      { name: "Daud Basha", price: 9.99 },
      { name: "Mixed Grill", price: 12 },
      { name: "Chicken Legs", price: 9 },
      { name: "Grill Chicken", price: 9 },
      { name: "Fajita", price: 9 },
      { name: "Goat Haneed", price: 9.99 },
      { name: "Geel Haneed", price: 10 },
      { name: "Shish Kebab", price: 10 },
      { name: "Shish Tawook", price: 10 },
      { name: "Kufta", price: 11 },
      { name: "Fish Steak", price: 9 },
      { name: "Grill Fish", price: 9 },
      { name: "Crispy Fish", price: 10 },
      { name: "Finger Fish", price: 9 },
      { name: "Scallop Fish", price: 9 },
      { name: "Suqar with Rice", price: 7 },
      { name: "Chicken Gordonblu", price: 9 },
      { name: "Chines Fish Ball", price: 9 },
      { name: "Whole Fish", price: 12, options: [sizeOption(12, 18, 25)] },
    ],
  },
  {
    category: "Pastas",
    items: [
      { name: "Lasagne", price: 10 },
      {
        name: "Choices of Pasta & Sauses",
        price: 10,
        options: [
          {
            key: "base",
            label: "Base",
            choices: [
              { value: "beef", label: "Beef" },
              { value: "chicken", label: "Chicken" },
              { value: "camel", label: "Camel" },
              { value: "vegetables", label: "Vegetables" },
            ],
          },
          {
            key: "sauce",
            label: "Sauce",
            choices: [
              { value: "bolognese", label: "Bolognese" },
              { value: "classic_mac_cheese", label: "Classic Mac & Cheese" },
              { value: "meatballs", label: "Meatballs" },
              { value: "vegetable", label: "Vegetable" },
              { value: "alfredo_chicken", label: "Alfredo Chicken" },
              { value: "stir_fried_carbonara", label: "Stir Fried Carbonara" },
            ],
          },
        ],
      },
    ],
  },
  {
    category: "Kids Menu",
    items: [
      { name: "Chicken Slider", price: 5 },
      { name: "Beef Slider", price: 5 },
      { name: "Spaghetti Meat Ball", price: 5 },
      { name: "Fish and Chips", price: 5 },
      { name: "Macaroni & Cheese", price: 5 },
      { name: "Chicken Nuggets Chips", price: 6 },
      { name: "Pizzetta (Mini Pizza)", price: 4 },
    ],
  },
  {
    category: "Burgers",
    items: [
      { name: "Chicken Burger", price: 6, options: [singleDoubleOption(6, 8)] },
      { name: "Beef Burger", price: 6, options: [singleDoubleOption(6, 8)] },
      { name: "Cheese Burger", price: 7, options: [singleDoubleOption(7, 9)] },
    ],
  },
  {
    category: "Sandwiches",
    items: [
      { name: "Chicken Sandwich", price: 6 },
      { name: "Beef Sandwich", price: 6 },
      { name: "Fish Sandwich", price: 6 },
      { name: "Chicken Crispy Sandwich", price: 8 },
      { name: "Chinese Beef Sandwich", price: 8 },
      { name: "Quesadilla", price: 9.9 },
    ],
  },
  {
    category: "Wraps",
    items: [
      { name: "Chicken Wrap", price: 6, options: [normalJumboOption(6, 8)] },
      { name: "Beef Wrap", price: 6, options: [normalJumboOption(6, 8)] },
      { name: "Fish Wrap", price: 6, options: [normalJumboOption(6, 8)] },
      { name: "Vegetable Wrap", price: 6, options: [normalJumboOption(6, 8)] },
    ],
  },
  {
    category: "Pizza",
    items: [
      { name: "Beef & Onion", price: 8, options: [sizeOption(8, 10, 12)] },
      { name: "BBQ Chicken", price: 8, options: [sizeOption(8, 10, 12)] },
      { name: "Chicken Alfredo", price: 8, options: [sizeOption(8, 10, 12)] },
      { name: "Spicy Tuna", price: 8, options: [sizeOption(8, 10, 12)] },
      { name: "Tandoori Chicken", price: 8, options: [sizeOption(8, 10, 12)] },
      { name: "Peri Peri Chicken", price: 8, options: [sizeOption(8, 10, 12)] },
      { name: "Pizza Hotdogs", price: 8, options: [sizeOption(8, 10, 12)] },
      { name: "Pizza Margherita", price: 7, options: [sizeOption(7, 9, 11)] },
      { name: "Pizza Chicken", price: 8, options: [sizeOption(8, 10, 12)] },
      { name: "Pizza Beef", price: 8, options: [sizeOption(8, 10, 12)] },
      { name: "Pizza Fish", price: 8, options: [sizeOption(8, 10, 12)] },
      { name: "4 Season Pizza", price: 10, options: [sizeOption(10, 12, 15)] },
    ],
  },
  {
    category: "Salads",
    items: [
      { name: "Excellence Asian Salad", price: 7 },
      { name: "Mix Maza", price: 7 },
      { name: "Ceasor Salad", price: 6 },
      { name: "Greek Salad", price: 6 },
      { name: "Coleslaw Salad", price: 6 },
      { name: "Avocado Salad", price: 6 },
      { name: "Garden Salad", price: 6 },
      { name: "Tabolla Salad", price: 6 },
      { name: "Motable Salad", price: 6 },
      { name: "Roast Vegetables Salad", price: 6 },
      { name: "Fatush", price: 6 },
      { name: "Mutabal", price: 6 },
      { name: "Baba Ghanoush", price: 5 },
      { name: "Hummus", price: 5 },
      { name: "Hummus with Meat", price: 7 },
      { name: "Falafel", price: 4 },
      { name: "Fatayer", price: 3 },
      { name: "Kibbeh 4pcs", price: 2 },
      { name: "Leaves-Warq Cinab", price: 4 },
    ],
  },
  {
    category: "Dessert",
    items: [
      { name: "Cinnamon Cake", price: 2.5 },
      { name: "Ginger Cake", price: 2.5 },
      { name: "Dates Cake", price: 2.5 },
      { name: "Carrot Cake", price: 2.5 },
      { name: "Pineapple Cake", price: 2.5 },
      { name: "Fruit Cake", price: 2.5 },
      { name: "Chocolate Cake", price: 2.5 },
      { name: "Strawberry Cake", price: 2.5 },
      { name: "Plain Cake", price: 1.5 },
      // Second "Chocolate Cake" listing at a different printed price — kept
      // unlabeled per the business owner's own instruction (see file header).
      { name: "Chocolate Cake", price: 2.0 },
      { name: "Donut (2pcs)", price: 2.0 },
      { name: "Croissaint", price: 2.0 },
      { name: "Chocolate Croissaint", price: 3.0 },
      { name: "Cheese Croissaint", price: 3.0 },
      { name: "Red Velvet Cake", price: 3.0 },
      { name: "Oreo Cream Cake", price: 3.0 },
      { name: "Black Forest Cake", price: 2.9 },
      { name: "White Forest Cake", price: 2.9 },
      { name: "Tiramisu Cake", price: 2.9 },
      { name: "Caramel Cheese Cake", price: 2.9 },
      { name: "Strawberry Cheese Cake", price: 2.9 },
      { name: "Chocolate Cheese Cake", price: 2.9 },
      { name: "Cinnamon Roll", price: 2.5 },
      { name: "Muffin", price: 1.5 },
      { name: "Eclari", price: 2.0 },
      { name: "Cookies", price: 1.5 },
      {
        name: "Full Cream Cake",
        price: 25,
        options: [
          {
            key: "flavor",
            label: "Flavor",
            choices: [
              { value: "fruit", label: "Fruit" },
              { value: "chocolate", label: "Chocolate" },
              { value: "strawberry", label: "Strawberry" },
              { value: "tiramisu", label: "Tiramisu" },
            ],
          },
        ],
      },
      { name: "Um Ali", price: 3.0 },
      { name: "Baklava", price: 3.0 },
      { name: "Basbusa", price: 3.0 },
      { name: "Knafeh", price: 3.0 },
    ],
  },
  {
    category: "Coffee",
    items: [
      { name: "Espresso", price: 1.8 },
      { name: "Cappuccino", price: 2 },
      { name: "Latte", price: 2 },
      { name: "American", price: 2 },
      { name: "Mocha", price: 2 },
      { name: "Macchiato", price: 2 },
      { name: "Latte Macchiato", price: 2 },
      { name: "Vanilla Latte", price: 2 },
      { name: "Camelcino", price: 2 },
      { name: "Hot Chocolate", price: 2 },
      { name: "Turmeric Latte", price: 2 },
      { name: "Arabic Coffee", price: 2 },
      { name: "Turkish Coffee", price: 2 },
      { name: "Hario V60", price: 3 },
      { name: "Chemex", price: 3 },
      { name: "French Press", price: 3 },
    ],
  },
  {
    category: "Iced Coffee",
    items: [
      { name: "Iced Caramel Latte", price: 2.95 },
      { name: "Iced Spanish Latte", price: 2.95 },
      { name: "Frappuccino", price: 2.95 },
      { name: "Iced Vanilla Latte", price: 2.95 },
      { name: "Iced Americano", price: 2.95 },
      { name: "Iced Cappuccino", price: 2.95 },
      { name: "Chocolate Frappe", price: 2.95 },
      { name: "Vanilla Mocha", price: 2.95 },
      { name: "Affogato Coffee", price: 2.95 },
      {
        name: "Iced Lemon Tea",
        price: 2.95,
        options: [
          {
            key: "flavor",
            label: "Flavor",
            choices: [
              { value: "peach", label: "Peach" },
              { value: "passion", label: "Passion" },
              { value: "strawberry", label: "Strawberry" },
            ],
          },
        ],
      },
    ],
  },
  {
    category: "Tea",
    items: [
      { name: "Somali Tea", price: 1.2 },
      { name: "Camel Tea", price: 1.6 },
      { name: "Black Tea", price: 1.2 },
      { name: "Lemon/Mint Tea", price: 1.6 },
      { name: "Herbal Tea", price: 2 },
      { name: "Dawo Tea", price: 2 },
      { name: "Turkish Tea", price: 1.5 },
    ],
  },
  {
    category: "Frappes",
    items: [
      { name: "Vanilla Frappe", price: 3.0 },
      // Frappuccino / Chocolate Frappe also appear under Iced Coffee above
      // at a different price ($2.95) — both listings kept as printed, per
      // the business owner (see file header).
      { name: "Chocolate Frappe", price: 3.0 },
      { name: "Caramel Frappe", price: 3.0 },
      { name: "Frappuccino", price: 3.0 },
    ],
  },
];

export const EXCELLENCE_CAFE_MENU_ITEM_COUNT = EXCELLENCE_CAFE_MENU.reduce((sum, c) => sum + c.items.length, 0);

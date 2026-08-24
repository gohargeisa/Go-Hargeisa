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
  /** Illustrative dish photo — sourced from openly-licensed stock photography
   * (Wikimedia Commons / Pexels / Unsplash), never claimed as an official
   * Village Hargeisa photograph (see the sourcing note this file's header
   * links to). Optional so a future item can be added before its image is
   * sourced without breaking anything. */
  image?: string;
}

export interface VillageMenuCategory {
  category: string;
  items: VillageMenuItem[];
}

export const VILLAGE_MENU: VillageMenuCategory[] = [
  {
    category: "All Day Breakfast",
    items: [
      { name: "Fresh Fruit Salad", price: 3.5, image: "https://upload.wikimedia.org/wikipedia/commons/0/04/Fruit_salad%28yum_yum%29.JPG" },
      { name: "Porridge", price: 3.5, image: "https://upload.wikimedia.org/wikipedia/commons/6/67/Oatmeal_%281%29.jpg" },
      { name: "Fluffy Loxoox", price: 3.5, image: "https://upload.wikimedia.org/wikipedia/commons/4/44/LahohS.jpg" },
      { name: "French Toast", price: 5.0, image: "https://upload.wikimedia.org/wikipedia/commons/4/42/FrenchToast.JPG" },
      { name: "Pan Cakes", price: 5.0, image: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Pancakes.jpg" },
      { name: "Eggs", price: 5.0, image: "https://upload.wikimedia.org/wikipedia/commons/2/23/Fried_eggs.jpg" },
      { name: "English Breakfast", price: 7.0, image: "https://upload.wikimedia.org/wikipedia/commons/2/20/Full_English_Breakfast.JPG" },
      { name: "Beef Stir Fry (Suqaar)", price: 6.0, image: "https://images.pexels.com/photos/37743272/pexels-photo-37743272.jpeg?cs=srgb&dl=pexels-davegarcia-37743272.jpg&fm=jpg" },
      { name: "Sauteed Liver", price: 6.0, image: "https://upload.wikimedia.org/wikipedia/commons/c/ce/Liver_and_Onions_at_the_Rathauskeller.jpg" },
      { name: "Beans", price: 4.5, image: "https://upload.wikimedia.org/wikipedia/commons/5/50/Baked_Beans_On_Toast.jpg" },
      { name: "Arabic Breakfast", price: 7.5, image: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Arabic_Breakfast_with_Tachina_and_Chips%2C_Dahab.jpg" },
    ],
  },
  {
    category: "Side Dishes",
    items: [
      { name: "Honey", price: 0.5, image: "https://upload.wikimedia.org/wikipedia/commons/7/7f/Honey_%28Italian-miele%29_in_a_jar.jpg" },
      { name: "Yogurt", price: 0.5, image: "https://upload.wikimedia.org/wikipedia/commons/5/57/Yoghurt_in_bowl.jpg" },
      { name: "Olives", price: 0.5, image: "https://upload.wikimedia.org/wikipedia/commons/6/64/Olives_in_bowl.jpg" },
      { name: "Zait a Za'atar", price: 1.0, image: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Zaatar-Zatar_blend_mainstay_ingredients_from_Levant_countries.jpg" },
      { name: "Mukhallal (Pickled Vegetables)", price: 0.5, image: "https://images.pexels.com/photos/20350167/pexels-photo-20350167.jpeg" },
    ],
  },
  {
    category: "Saj — Shawarma & Sandwiches",
    items: [
      { name: "Chicken Shawarma on Saj Bread", price: 6.0, image: "https://images.unsplash.com/photo-1719282431565-3b30bb7d2658" },
      { name: "Meat Shawarma on Saj Bread", price: 7.0, image: "https://images.unsplash.com/photo-1699728088614-7d1d4277414b" },
      { name: "Hummus with Chicken Shawarma", price: 7.0, image: "https://images.pexels.com/photos/6735031/pexels-photo-6735031.jpeg" },
      { name: "Hummus with Meat Shawarma", price: 7.5, image: "https://images.pexels.com/photos/5191824/pexels-photo-5191824.jpeg" },
      { name: "Falafel in Saj Bread", price: 5.0, image: "https://images.unsplash.com/photo-1741980597454-54f338cea614" },
      { name: "Shish Kabab in Saj Bread", price: 7.5, image: "https://images.unsplash.com/photo-1633321702518-7feccafb94d5" },
      { name: "Shrimp in Saj Bread", price: 7.0, option: "shrimpPreparation", image: "https://images.unsplash.com/photo-1624300629298-e9de39c13be5" },
      { name: "Grilled Shish Tawook in Saj Bread", price: 7.0, image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143" },
      { name: "Quesadillas", price: 7.5, image: "https://images.unsplash.com/photo-1719957770167-bb66133ba808" },
    ],
  },
  {
    category: "Burgers",
    items: [
      { name: "Classic Cheese Burger", price: 7.0, description: "Prime beef topped with cheese, lettuce, tomatoes, onion and pickles.", image: "https://upload.wikimedia.org/wikipedia/commons/4/4d/Cheeseburger.jpg" },
      { name: "Texas", price: 7.5, description: "Prime beef patty with cheddar cheese, fried egg, lettuce and barbecue sauce.", image: "https://images.unsplash.com/photo-1560971017-ae4b60d62354" },
      { name: "Crispy Chicken Burger", price: 7.0, description: "Juicy golden-fried chicken fillet, fresh lettuce, pickles and creamy mayo in a toasted bun.", image: "https://images.unsplash.com/photo-1637710847214-f91d99669e18" },
    ],
  },
  {
    category: "Grills — Mediterranean BBQ",
    items: [
      { name: "Tikka Shuqaf", price: 10.0, image: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Chicken_Tikka_Kebab.jpg" },
      { name: "Shish Kebab", price: 9.0, image: "https://upload.wikimedia.org/wikipedia/commons/4/46/Dana_%C5%9Fi%C5%9F_%28veal_shish_kebab%29.jpg" },
      { name: "Shish Tawooq", price: 8.0, image: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Shish_taouk.jpg" },
      { name: "Kebab-Khashkash", price: 9.5, image: "https://upload.wikimedia.org/wikipedia/commons/1/19/Grilled_Kefta_Skewers.jpg" },
      { name: "Grilled Lamb Chops", price: 10.0, image: "https://upload.wikimedia.org/wikipedia/commons/1/11/Lamb_chop_on_the_barbecue_03.jpg" },
      { name: "Mixed Grill Medium", price: 14.0, image: "https://upload.wikimedia.org/wikipedia/commons/6/66/Iraqi_Mixed_Grill_Platter_with_Traditional_Accompaniments.jpg" },
      { name: "Mixed Grill Large", price: 21.0, image: "https://images.unsplash.com/photo-1763647818263-62a9256f097c" },
    ],
  },
  {
    category: "The Village Specials",
    items: [
      { name: "Sweet and Sour Crispy Chicken", price: 8.5, option: "specialsSide", image: "https://upload.wikimedia.org/wikipedia/commons/0/06/Ayam_asam_manis_warung_ijo_ubud_-_Sweet_Sour_Crispy_Chicken.jpg" },
      { name: "Butter Chicken", price: 8.5, option: "specialsSide", image: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Murgh_Makhani_%28Butter_Chicken%29_2_%288925280003%29.jpg" },
      { name: "Grilled Chicken", price: 8.5, option: "specialsSide", image: "https://upload.wikimedia.org/wikipedia/commons/9/97/Grilled_Chicken_on_the_Barbie%2C_Outback_Steakhouse.jpg" },
      { name: "Pepper Steak", price: 9.5, option: "specialsSide", image: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Pepper_Steak_%282225347845%29.jpg" },
      { name: "Fajita", price: 8.5, option: "specialsSide", image: "https://upload.wikimedia.org/wikipedia/commons/e/e6/Chicken_Fajitas%2C_Cabo_Flags%2C_West_Palm_Beach.jpg" },
      { name: "Grilled Shrimps 200g", price: 9.5, option: "specialsSide", image: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Grilled_Shrimp_Skewers.jpg" },
      { name: "Haneed Lamb", price: 10.0, option: "specialsSide", image: "https://upload.wikimedia.org/wikipedia/commons/3/30/Lamb_haneeth_at_Marib_restaurant%2C_Springfield%2C_Virginia.jpg" },
      { name: "Daud Basha", price: 9.0, option: "specialsSide", image: "https://upload.wikimedia.org/wikipedia/commons/6/66/Dawood_Basha_01.jpg" },
      { name: "Shaya Steak", price: 9.5, option: "specialsSide", image: "https://upload.wikimedia.org/wikipedia/commons/9/96/Grilled_steak_with_baked_potato_and_gravy.jpg" },
      { name: "Grilled Fish", price: 9.0, option: "specialsSide", image: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Plated_grilled_fish.jpg" },
      { name: "Curry Fish", price: 9.0, option: "specialsSide", image: "https://upload.wikimedia.org/wikipedia/commons/5/50/Kerala_fish_curry.JPG" },
      { name: "Fried Finger Fish", price: 9.0, option: "specialsSide", image: "https://upload.wikimedia.org/wikipedia/commons/2/29/Fish_Fingers_with_creamy_mayo.jpg" },
    ],
  },
  {
    category: "Signature Pizza",
    items: [
      { name: "Margherita", price: 7.0, description: "Mozzarella, pomodoro sauce & oregano.", option: "pizzaSize", image: "https://upload.wikimedia.org/wikipedia/commons/d/d8/Pizza_margherita.png" },
      { name: "Chicken Pizza", price: 7.0, description: "Chicken, mozzarella, bell peppers, onions and tomato basil sauce on a crispy crust.", option: "pizzaSize", image: "https://upload.wikimedia.org/wikipedia/commons/1/12/8-inch_Spring_Chicken_pizza_from_Ledo_Pizza.jpg" },
      { name: "Beef Pizza", price: 7.0, description: "Meat, mozzarella, bell peppers, onions and tomato basil sauce on a crispy crust.", option: "pizzaSize", image: "https://upload.wikimedia.org/wikipedia/commons/b/be/Pizza_Hut_Meat_Lover%27s_pizza.JPG" },
      { name: "The Village Pizza", price: 7.0, description: "Mix of beef & chicken with mozzarella, pomodoro sauce, green chillies and black olives.", option: "pizzaSize", image: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Supreme_pizza.jpg" },
      { name: "Spicy Tuna Pizza", price: 7.0, description: "Spicy tuna, mozzarella, red onions, chili flakes and hot sauce on a crispy crust.", option: "pizzaSize", image: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Kotipizza_Quattro_Stagioni.jpg" },
      // No description was supplied for Hawaiian — left unset rather than
      // invented (the classic ham+pineapple combo is assumed knowledge,
      // not something the business actually told us).
      { name: "Hawaiian", price: 7.0, option: "pizzaSize", image: "https://upload.wikimedia.org/wikipedia/commons/d/d1/Hawaiian_pizza_1.jpg" },
    ],
  },
  {
    category: "Pastas",
    items: [
      { name: "Alfredo Pasta", price: 8.0, option: "pastaProtein", image: "https://upload.wikimedia.org/wikipedia/commons/5/57/Chicken_fettuccine_alfredo.JPG" },
      { name: "Penne Arabiata", price: 8.0, option: "pastaProtein", image: "https://upload.wikimedia.org/wikipedia/commons/2/24/Penne_all%27arrabbiata.jpg" },
      { name: "Spaghetti Bolognese", price: 8.0, option: "pastaProtein", image: "https://upload.wikimedia.org/wikipedia/commons/c/c3/Spaghetti_bolognese.jpg" },
      { name: "Lasagna", price: 8.0, option: "pastaProtein", image: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Lasagna.jpg" },
      { name: "Bechamel", price: 8.0, option: "pastaProtein", image: "https://upload.wikimedia.org/wikipedia/commons/4/45/Macaroni_bechamel.jpg" },
    ],
  },
  {
    category: "Manakeesh",
    items: [
      { name: "Zaatar", price: 4.5, description: "Traditional Levantine flatbread topped with a fragrant blend of zaatar herbs, olive oil and sesame seeds.", image: "https://upload.wikimedia.org/wikipedia/commons/9/94/Israeli_zaatar_manakeesh.jpg" },
      { name: "Meat", price: 5.5, description: "Stone-baked flatbread topped with seasoned minced meat.", image: "https://upload.wikimedia.org/wikipedia/commons/d/d2/Sfiha2.jpg" },
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

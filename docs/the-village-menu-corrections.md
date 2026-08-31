# The Village Hargeisa — menu data corrections

Reference list produced while building the premium restaurant page
(`/restaurants/the-village-hargeisa`). **Nothing here was written to the
production database.**

STATUS (updated):
- **§1 descriptions — APPLIED as a display-time override.** The 26 verified
  dish descriptions below now live in `lib/config/the-village-menu-details.ts`
  and are merged onto the products at render (only where the DB has none) —
  the exact FLORMAR_PRODUCT_DESCRIPTIONS pattern, no DB write. Copying them
  into `products.description` via the CMS later is optional; the override
  yields to a real DB value the moment one exists.
- **§2 Mixed Grill price — NOT changed. Needs a real DB/CMS edit** (see note).
- **§4 English Breakfast add-on — NOT changed. Needs one CMS row** (see note).
- **§3 Village Specials, §5 photos, §6 AR/SO, §7 restaurant description** —
  still require your action in the CMS.

Sources: the restaurant's own printed menu (4 photos) + the
`The_Village_Hargeisa_Menu.xlsx` in the Desktop **The Village** folder,
compared against the live `products` / `product_options` /
`product_addons` rows for listing `2237bbdf-4f24-494e-b7e0-b90b58e8c39f`.

---

## 1. Dish descriptions (missing from DB — present on the printed menu)

Only 13 of 59 products have a `description`. The printed menu has copy for
almost all of them. Verbatim transcriptions (fix any OCR slips against the
physical menu before saving):

### Saj-Shawarma & Sandwiches
| Dish | Description |
|---|---|
| Chicken Shawarma on Saj Bread | Saj bread stuffed with thinly sliced grilled golden chicken shawarma, cucumber pickles, French fries & garlic sauce. |
| Meat Shawarma on Saj Bread | Saj bread stuffed with thinly sliced grilled meat shawarma, cucumber pickles, onion, tomato, parsley & tahini sauce. |
| Hummus with Chicken Shawarma | Chicken shawarma platter — thinly sliced chicken shawarma served over a generous spread of hummus. |
| Hummus with Meat Shawarma | Shawarma platter — thinly sliced meat shawarma served over a generous spread of hummus. |
| Falafel in Saj Bread | Saj bread sandwich of a deep-fried patty made from ground chickpeas, fava beans, parsley & spices. Served with fries & salad. |
| Shish Kabab in Saj Bread | Saj bread sandwich stuffed with grilled Lebanese meat kebab, tomato & parsley. |
| Shrimp in Saj Bread | Saj bread sandwich stuffed with fried or grilled shrimp & special sauce. Served with French fries and salad. |
| Grilled Shish Tawook in Saj Bread | Saj bread sandwich stuffed with marinated & grilled chicken. Served with French fries and salad. |
| Quesadillas | Fresh flour tortilla grilled with a choice of chicken, fish or beef. Served with French fries & garlic sauce. |

### Burgers
| Dish | Description |
|---|---|
| Classic Cheese Burger | Prime beef topped with cheese, lettuce, tomatoes, onion and pickles. |
| Texas | Prime beef patty with cheddar cheese, fried egg, lettuce and barbeque sauce. |
| Crispy Chicken Burger | Juicy golden-fried chicken fillet, fresh lettuce, pickles and creamy mayo in a toasted bun. |

### Signature Pizza  (all sizes: S $7 / M $9 / L $11 — already in `product_options`)
| Dish | Description |
|---|---|
| Margarita | Mozzarella, pomodoro sauce & oregano. *(already in DB)* |
| Hawaiian | A timeless tropical favorite: rich tomato sauce, melted mozzarella and premium smoked **[ham? — last word is cut off on the menu photo; confirm]**. |
| Chicken / Beef / The Village / Spicy Tuna | *already in DB* |

### Manakeesh
| Dish | Description |
|---|---|
| Zaatar | Traditional Levantine flatbread topped with a fragrant blend of za'atar herbs, olive oil and sesame seeds. |
| Meat | Stone-baked flatbread topped with seasoned minced meat. |

### Pastas  (base $8; "choice of chicken, meat or fish" — already in `product_options`)
No per-dish descriptions on the printed menu.

### Grills (Mediterranean BBQ)
| Dish | Description |
|---|---|
| Tikka Shuqaf | Marinated tender grilled meat cubes. Served with grilled tomato, onion, French fries, hummus & bread. |
| Shiish Kebab | The chef's marinated minced lamb skewers. Served with grilled tomato, onion, French fries, hummus & bread. |
| Shiish Tawooq | The chef's marinated minced chicken skewers. Served with grilled tomato, onion, French fries, garlic & bread. |
| Kebab-Khashkhash | Minced meat skewers on a bed of spicy tomato sauce. Served with grilled tomato, onion, French fries, hummus & bread. |
| Grilled Lamb Chops | BBQ lamb chops marinated with special spices. Served with grilled tomato, onion, French fries, hummus & bread. |
| Mixed Grill | Mixed skewers of beef tikka, shish tawook and shish kebab with lamb chops and arayes. Served with grilled tomato, onion, French fries, hummus & bread. |

### All Day Breakfast
| Dish | Description |
|---|---|
| Fresh Fruit Salad | A colourful mix of nature's sweetest fruits — a vibrant seasonal selection. |
| Porridge | Oatmeal porridge served with honey and milk. |
| Fluffy Loxoox | Traditional Somali pancake served with a choice of muqmad, or olive oil and honey. |
| French Toast | Toast served with homemade syrup and a choice of fresh fruits. |
| Pan Cakes | Served with homemade syrup and a choice of fresh fruits. |
| Eggs | Boiled, omelette, shakshuka or sunny side. |
| English Breakfast | The classic English breakfast: beef, baked beans, grilled tomatoes and fried eggs. |
| Beef Stir Fry (Suqar) | Beef cubes marinated with traditional spices and sautéed with onion, tomato and bell pepper. |
| Sauteed Liver | Locally-flavoured sautéed camel or goat liver with vegetables. |
| Beans | A choice of full, baked or green beans cooked with vegetables and herbs. |
| Arabic Breakfast | The classic Arabic breakfast: jam, honey, bread, cheese, dips, za'atar, fresh fruit and vegetables, olives, pickles and eggs. |

---

## 2. Price / structure discrepancies

| Item | Database now | Printed menu | Suggested fix |
|---|---|---|---|
| **Mixed Grill** | one product, base **$14**, size option Medium (+$0) / Large (+$7) | **Medium $16.00**, Large **$21.00** | set base price **$16**, Large `priceDelta` **+$5** (net $21). Or split into two products to match the printed layout. |

> **Why this wasn't applied as an override:** `submit_cart_order` re-resolves
> every price from `products.price` + `product_options.choices` server-side
> (client prices are ignored, by design). A display-only override would show
> $16 in the menu while the cart still charged $14 — a real mismatch. The
> menu currently shows the DB values ($14 / $21), which stay consistent with
> what checkout charges. Fix `products.price` (and the Large delta) in the
> Business dashboard → Products, and it corrects everywhere at once.
| Beef Stir Fry name | "Beef Stir Fry (Suqar)" | "Suqaar" | spelling only — optional |
| Shrimp / Shish Kabab | "Shrimp in Saj Bread", "Shish Kabab in Saj Bread" | "…Fried or Grilled", "Shiish Kabab…" | cosmetic; the Fried/Grilled choice already exists as an option |

---

## 3. `The Village Specials` category (12 dishes)

Sweet and Sour Crispy Chicken, Butter Chicken, Grilled Chicken, Pepper
Steak, Fajita, Grilled Shrimps 200g, Haneed Lamb, Daud Basha, Shaya Steak,
Grilled Fish, Curry Fish, Fried Finger Fish — **in the database, not in the
4 printed-menu photos provided.** Left untouched (not deleted). Please
confirm these dishes, their prices and the "Side" choice
(Steamed Rice / Pasta / Mashed Potatoes / French Fries / Vegetables) are
current, or provide the menu page they came from.

---

## 4. Add-on group assignment gap

The **"Side Dishes"** add-on group (Honey $0.50, Yogurt $0.50, Olives
$0.50, Zait & Za'atar $1.00, Mukhalal $0.50) is correctly attached to 10
of the 11 All Day Breakfast dishes. **"English Breakfast" is missing the
assignment.**

> **Why this wasn't applied as an override:** `submit_cart_order` only
> credits an add-on when a `product_addon_groups` row links its group to
> that exact product — otherwise the add-on is silently dropped from the
> order. Showing the "Side Dishes" line on English Breakfast without that
> row would let a customer pick Honey and then not be charged / served it.
> Add the single row in Business dashboard → Add-on Groups → assign
> "Side Dishes" to **English Breakfast** (`3d82d030-bcf7-461e-ba5f-1b22a8f1e760`).

---

## 5. Photography

46 of 59 products currently store a Wikipedia / Unsplash / Pexels
placeholder image. **The new page hides all of these** — the menu is
text-first and only genuine Village photography is shown (in the
"Signature Selection" strip, from the 13 dishes with real uploads under
`…/listing-images/restaurants/the-village-hargeisa/products/`).

- Upload real dish photos via the Business dashboard → Products → image
  field. They appear automatically (Signature Selection + the dish detail
  modal), no code change.
- Reviewed the 12 existing Village-bucket uploads (`…/the-village-hargeisa/
  products/*.jpg`): all are genuine food photography in the restaurant's own
  storage bucket (not stock, not social). Assignments look right except
  **"Hummus with Chicken Shawarma"** — the photo shows hummus topped with
  diced/chunky **meat**, not thinly-sliced chicken. It's still a real
  hummus-shawarma platter shot, so it's left in place; swap it if the
  restaurant has a chicken version.
- `restaurants.gallery` is empty → the page has no photo gallery section.
  Add interior / ambiance photos to that field to enable one.

---

## 6. Arabic / Somali

No `name_ar` / `name_so` / `description_ar` / `description_so` exist for
any of the 59 products, and the restaurant row has no `name_ar` /
localized `short_description` / `description`. The page therefore shows
English dish names + descriptions on `/ar` and `/so` (all *interface*
text — section titles, buttons, category nav, add-on labels — is fully
translated with correct RTL). Add the translations via the CMS to
localize the menu content itself.

---

## 7. Restaurant description

`restaurants.description` currently ends with *"Opening hours have not yet
been confirmed by the business."* — that trailing sentence is trimmed at
render on the new page (opening hours are omitted entirely, per the brief;
no fabricated schedule). Recommend removing it from the stored description
and populating `opening_hours_structured` once real hours are confirmed —
the page will then show a proper hours section automatically.

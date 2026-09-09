// One-time build step for the Excellence Café preview page: copies a curated
// subset of the 115 source camera photos (never moves/deletes the originals)
// from the Desktop source folder into public/images/partners/excellence-cafe/,
// resized for web (max width 1600px, jpeg q82 — same treatment every other
// partner's real photography gets before being committed) and renamed to
// descriptive kebab-case filenames. Two photos (IZON2757, IZON2760) are
// cropped first to remove a personal handbag/perfume bottle visible in the
// background — everything else is a straight resize+copy, pixels otherwise
// untouched. Two source photos (5M4A9952, 5M4A9960 — candid shots of
// children) are deliberately excluded entirely, per the approved plan.
import sharp from "sharp";
import path from "node:path";

const SRC = "C:/Users/YASEEN/OneDrive/Desktop/Excellence Café/Smash";
const DEST = "public/images/partners/excellence-cafe";

async function copyResized(srcFile, destRelPath, extract) {
  const srcPath = path.join(SRC, srcFile);
  const destPath = path.join(DEST, destRelPath);
  let img = sharp(srcPath).rotate();
  if (extract) img = img.extract(extract);
  await img.resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 82 }).toFile(destPath);
  console.log("✔", destRelPath);
}

const jobs = [
  // Hero
  ["IZON5081.JPG", "hero/mezze-spread-wide.jpg"],
  ["IZON0668.JPG", "hero/rooftop-terrace-wide.jpg"],

  // Featured dishes
  ["5M4A3908.JPG", "featured/chicken-pizza.jpg"],
  ["5M4A6019.JPG", "featured/kofta-skewers-sizzling.jpg"],
  ["5M4A4610.JPG", "featured/cheeseburger.jpg"],
  ["5M4A4315.JPG", "featured/crispy-chicken-burger.jpg"],
  ["5M4A4752.JPG", "featured/baked-cheese-pasta.jpg"],
  ["IZON2165.JPG", "featured/chicken-gordon-bleu.jpg"],
  ["5M4A9151.JPG", "featured/biryani.jpg"],
  ["5M4A9094.JPG", "featured/butter-chicken.jpg"],

  // Breakfast
  ["5M4A8892.JPG", "breakfast/english-breakfast-plate.jpg"],
  ["5M4A8905.JPG", "breakfast/croissant-egg-breakfast.jpg"],
  ["IMGL2256.JPG", "breakfast/loxoox-suqaar-branded.jpg"],
  ["IZON1114.JPG", "breakfast/waffle-syrup-pour.jpg"],
  ["IZON0676.JPG", "breakfast/shakshuka-eggs.jpg"],
  ["IZON0687.JPG", "breakfast/egg-avocado-toast.jpg"],
  ["IZON5135.JPG", "breakfast/cambabur-pancake-syrup.jpg"],
  ["IZON0335.JPG", "breakfast/grilled-cheese-sandwich.jpg"],

  // Main courses
  ["5M4A0423.JPG", "main-courses/curry-biryani.jpg"],
  ["5M4A4351.JPG", "main-courses/goat-lamb-shank.jpg"],
  ["5M4A4796.JPG", "main-courses/crispy-fish.jpg"],
  ["5M4A4818.JPG", "main-courses/beef-curry-sizzling-plate.jpg"],
  ["5M4A9057.JPG", "main-courses/chicken-piccata.jpg"],
  ["IZON2195.JPG", "main-courses/chicken-cordon-bleu-plated.jpg"],
  ["IZON3886.JPG", "main-courses/glazed-skewers-with-rice.jpg"],

  // Pizza
  ["5M4A0396.JPG", "pizza/vegetable-pizza.jpg"],
  ["5M4A9927.JPG", "pizza/buffet-pizza-chafing-dish.jpg"],

  // Burgers / sandwiches
  ["5M4A4613.JPG", "burgers-sandwiches/cheeseburger-stack.jpg"],
  ["5M4A3912.JPG", "burgers-sandwiches/wrap-sliced-open.jpg"],
  ["IZON0371.JPG", "burgers-sandwiches/chicken-tuna-sandwich.jpg"],
  ["IZON0469.JPG", "burgers-sandwiches/croissant-sandwich.jpg"],
  ["IZON0707.JPG", "burgers-sandwiches/croque-monsieur-cheese-bake.jpg"],

  // Pastas
  ["5M4A4760.JPG", "pastas/baked-cheesy-pasta-cheese-pull.jpg"],
  ["IZON0512.JPG", "pastas/pesto-chicken-pasta-garlic-bread.jpg"],

  // Salads
  ["IZON7182.JPG", "salads/greek-salad.jpg"],
  ["IZON7190.JPG", "salads/roasted-vegetable-salad.jpg"],
  ["IZON7225.JPG", "salads/tabbouleh.jpg"],
  ["IZON7263.JPG", "salads/mutabal-mezze-cucumber.jpg"],
  ["IZON7299.JPG", "salads/chicken-caesar-salad.jpg"],

  // Desserts
  ["IZON2234.JPG", "desserts/chocolate-cake-with-tea.jpg"],
  ["IZON2722.JPG", "desserts/caramel-cheesecake.jpg"],
  ["IZON2747.JPG", "desserts/caramel-cheesecake-branded-plate.jpg"],
  // Cropped below to remove the handbag/perfume bottle in the background.
  ["IZON2757.JPG", "desserts/berry-cheesecake.jpg", { left: 0, top: 2650, width: 3648, height: 5472 - 2650 }],
  ["IZON2760.JPG", "desserts/caramel-cheesecake-closeup.jpg", { left: 0, top: 2850, width: 3648, height: 5472 - 2850 }],
  ["5M4A0442.JPG", "desserts/chocolate-chip-cookies.jpg"],

  // Drinks — visual-only (no menu entries; juices/milkshakes/mojitos/coffee)
  ["5M4A0087.JPG", "drinks/iced-coffee.jpg"],
  ["5M4A0102.JPG", "drinks/cappuccino.jpg"],
  ["5M4A0121.JPG", "drinks/blue-red-ombre-mocktail.jpg"],
  ["5M4A0141.JPG", "drinks/v60-pour-over.jpg"],
  ["5M4A0440.JPG", "drinks/matcha-latte.jpg"],
  ["5M4A4150.JPG", "drinks/oreo-milkshake.jpg"],
  ["IZON5159.JPG", "drinks/vanilla-milkshake.jpg"],
  ["5M4A4862.JPG", "drinks/strawberry-frappe.jpg"],
  ["5M4A6050.JPG", "drinks/watermelon-juice.jpg"],
  ["5M4A6061.JPG", "drinks/orange-carrot-juice.jpg"],
  ["IMGL2315.JPG", "drinks/turmeric-latte.jpg"],
  ["IZON5105.JPG", "drinks/three-iced-coffees-branded.jpg"],
  ["IZON7618.JPG", "drinks/mojito-style-mocktail.jpg"],

  // Atmosphere
  ["IZON0668.JPG", "atmosphere/rooftop-terrace-wide-1.jpg"],
  ["IZON0672.JPG", "atmosphere/rooftop-terrace-wide-2.jpg"],
  ["5M4A0106.JPG", "atmosphere/branded-cup-stack.jpg"],
  ["5M4A9863.JPG", "atmosphere/lunch-buffet-spread-banner.jpg"],
  ["5M4A9888.JPG", "atmosphere/buffet-chafing-dish-interior.jpg"],
  ["5M4A9941.JPG", "atmosphere/staff-serving-buffet.jpg"],
  ["IZON7626.JPG", "atmosphere/staff-tea-branded-apron.jpg"],
  ["5M4A9908.JPG", "atmosphere/daily-lunch-buffet-sign.jpg"],
];

for (const [src, dest, extract] of jobs) {
  await copyResized(src, dest, extract);
}
console.log(`\nDone — ${jobs.length} photos copied into ${DEST}`);

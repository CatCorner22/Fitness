import type { Goal } from "@/lib/types";
import type { HistamineLoad } from "./histamine";

export type FastFoodFit = "cut" | "protein" | "bulk" | "breakfast";

export type FastFoodItem = {
  id: string;
  restaurantId: string;
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  why: string;
  order: string;
  fit: FastFoodFit[];
  histamine: HistamineLoad;
  /** Least-bad drive-thru pick on a low-histamine block. Still not a fresh-cook plate. */
  leastBadOnLowHistamine?: boolean;
};

export type FastFoodRestaurant = {
  id: string;
  name: string;
  blurb: string;
};

function item(
  restaurantId: string,
  slug: string,
  name: string,
  serving: string,
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  why: string,
  order: string,
  fit: FastFoodFit[],
  histamine: HistamineLoad,
  leastBadOnLowHistamine?: boolean,
): FastFoodItem {
  return {
    id: `ff-${restaurantId}-${slug}`,
    restaurantId,
    name,
    serving,
    calories,
    protein,
    carbs,
    fat,
    why,
    order,
    fit,
    histamine,
    leastBadOnLowHistamine,
  };
}

export const FAST_FOOD_RESTAURANTS: FastFoodRestaurant[] = [
  {
    id: "cfa",
    name: "Chick-fil-A",
    blurb: "Grilled nuggets are the protein-per-calorie win. Skip the waffle fries and most sauces.",
  },
  {
    id: "chipotle",
    name: "Chipotle",
    blurb: "Build a bowl. Double chicken, salsa, lettuce. Rice if you trained. Queso and chips are the surplus.",
  },
  {
    id: "mcdonalds",
    name: "McDonald's",
    blurb: "Egg McMuffin or a hamburger, not a meal deal. Fries and soda are optional, not implied.",
  },
  {
    id: "wendys",
    name: "Wendy's",
    blurb: "Chili plus a grilled chicken sandwich beats a Baconator. Apple slices over fries.",
  },
  {
    id: "tacobell",
    name: "Taco Bell",
    blurb: "Chicken + beans, skip the fried shell stack. Fresco-style or no creamy sauces.",
  },
  {
    id: "subway",
    name: "Subway",
    blurb: "6-inch turkey or grilled chicken, mustard, vegetables. Cheese and mayo are the calorie jump.",
  },
  {
    id: "panda",
    name: "Panda Express",
    blurb: "Grilled teriyaki or string bean chicken with half steamed rice. Skip orange chicken as a default.",
  },
  {
    id: "innout",
    name: "In-N-Out",
    blurb: "Protein-style hamburger. A Double-Double is a bulk meal, not a side.",
  },
];

const FAST_FOOD_ITEMS: FastFoodItem[] = [
  item(
    "cfa",
    "grilled-nuggets-12",
    "Chick-fil-A Grilled Nuggets (12)",
    "12 pieces",
    200,
    38,
    2,
    4.5,
    "38 g protein in 200 kcal. The honest CFA order on a cut or a busy training day.",
    "12-count grilled nuggets. No fries. Sauce on the side or skip — BBQ and ranch are not free.",
    ["cut", "protein"],
    "caution",
    true,
  ),
  item(
    "cfa",
    "grilled-nuggets-8",
    "Chick-fil-A Grilled Nuggets (8)",
    "8 pieces",
    130,
    25,
    1,
    3,
    "Smaller box, still 25 g protein. Pair with a fruit cup if lunch needs carbs.",
    "8-count grilled nuggets. Fruit cup instead of fries.",
    ["cut", "protein"],
    "caution",
    true,
  ),
  item(
    "cfa",
    "grilled-sandwich",
    "Chick-fil-A Grilled Chicken Sandwich",
    "1 sandwich",
    390,
    28,
    45,
    11,
    "Bun + grilled filet when you need carbs around a session. Not as lean as the nuggets.",
    "Grilled chicken sandwich. No cheese. Honey roasted BBQ on the side if you want it.",
    ["protein", "bulk"],
    "caution",
  ),
  item(
    "cfa",
    "egg-white-grill",
    "Chick-fil-A Egg White Grill",
    "1 sandwich",
    300,
    27,
    29,
    8,
    "Breakfast that actually has protein. Cheese is on it — skip if you are dairy-sensitive.",
    "Egg White Grill. Ask to hold cheese if you want it cleaner.",
    ["breakfast", "protein", "cut"],
    "high",
  ),
  item(
    "cfa",
    "fruit-cup",
    "Chick-fil-A Fruit Cup",
    "1 small cup",
    60,
    1,
    15,
    0,
    "The side that is not waffle fries. Use it with grilled nuggets, not as a meal.",
    "Small fruit cup.",
    ["cut", "breakfast"],
    "caution",
    true,
  ),
  item(
    "chipotle",
    "double-chicken-bowl",
    "Chipotle Double Chicken Bowl (no rice)",
    "bowl: 2× chicken, fajita veg, salsa, lettuce",
    410,
    65,
    10,
    14,
    "Official scoops: two chicken, fajita vegetables, tomato salsa, lettuce. High protein, no rice.",
    "Bowl, double chicken, fajita veggies, tomato salsa, lettuce. No rice, beans, cheese, sour cream, or chips.",
    ["cut", "protein"],
    "caution",
    true,
  ),
  item(
    "chipotle",
    "chicken-rice-bowl",
    "Chipotle Chicken Bowl (rice + salsa)",
    "bowl: chicken, white rice, salsa, lettuce",
    420,
    36,
    45,
    11,
    "One chicken scoop and rice for a training lunch. Portions at the line vary — this is the published scoop math.",
    "Bowl, chicken, cilantro-lime white rice, tomato salsa, lettuce. Skip queso, sour cream, and the bag of chips.",
    ["protein", "bulk"],
    "caution",
  ),
  item(
    "mcdonalds",
    "egg-mcmuffin",
    "McDonald's Egg McMuffin",
    "1 sandwich",
    310,
    17,
    30,
    13,
    "Best default breakfast there. Not a protein shake — just not hotcakes.",
    "Egg McMuffin. No hash browns, no large coffee syrup.",
    ["breakfast", "protein"],
    "high",
  ),
  item(
    "mcdonalds",
    "mcdouble",
    "McDonald's McDouble",
    "1 sandwich",
    400,
    22,
    33,
    20,
    "Cheap protein when that is the only window. Skip the combo fries.",
    "McDouble, no combo. Water or diet drink.",
    ["protein", "bulk"],
    "high",
  ),
  item(
    "mcdonalds",
    "hamburger",
    "McDonald's Hamburger",
    "1 sandwich",
    250,
    12,
    31,
    9,
    "Smaller burger if you already ate and just need something in the car.",
    "Single hamburger, not a Double Quarter Pounder meal.",
    ["cut"],
    "high",
  ),
  item(
    "wendys",
    "grilled-chicken-sandwich",
    "Wendy's Grilled Chicken Sandwich",
    "1 sandwich",
    370,
    34,
    36,
    8,
    "Grilled chicken with a real protein number. Apple slices instead of fries.",
    "Grilled chicken sandwich. No combo, or swap fries for a small chili / apple slices.",
    ["protein", "cut"],
    "caution",
  ),
  item(
    "wendys",
    "small-chili",
    "Wendy's Small Chili",
    "1 small",
    240,
    16,
    21,
    11,
    "A side that is food, not a bun. Beans + beef. Fine next to the grilled sandwich.",
    "Small chili. No sour cream or cheese pile on top.",
    ["protein", "cut", "breakfast"],
    "high",
  ),
  item(
    "tacobell",
    "cantina-chicken-bowl",
    "Taco Bell Cantina Chicken Bowl",
    "1 bowl",
    480,
    24,
    44,
    23,
    "Chicken, rice, beans. Ask for no avocado ranch and no extra cheese if you want it less heavy.",
    "Cantina Chicken Bowl. Hold creamy sauces if you can. Skip nacho fries.",
    ["protein", "bulk"],
    "high",
  ),
  item(
    "tacobell",
    "chicken-soft-taco",
    "Taco Bell Chicken Soft Taco",
    "1 taco",
    170,
    9,
    16,
    7,
    "Small, loggable unit. Two of these beat a Crunchwrap if you are guessing.",
    "Chicken soft taco, fresco-style if offered. Two if that is lunch.",
    ["cut"],
    "caution",
  ),
  item(
    "subway",
    "turkey-6",
    "Subway 6-inch Turkey",
    "6-inch, mustard + veg",
    280,
    18,
    46,
    3.5,
    "Lean sandwich math if you skip cheese and mayo. Bread is most of the carbs.",
    "6-inch turkey breast, 9-grain or Italian, mustard, vegetables, no cheese, no mayo.",
    ["cut", "protein"],
    "caution",
  ),
  item(
    "subway",
    "grilled-chicken-6",
    "Subway 6-inch Grilled Chicken",
    "6-inch, mustard + veg",
    320,
    27,
    41,
    5,
    "More protein than turkey on the same bread. Still skip the cookies.",
    "6-inch grilled chicken, mustard, vegetables, no cheese.",
    ["protein", "cut"],
    "caution",
    true,
  ),
  item(
    "panda",
    "grilled-teriyaki",
    "Panda Express Grilled Teriyaki Chicken",
    "1 entrée + ½ steamed rice",
    490,
    41,
    42,
    13,
    "The grilled plate plus half a steamed rice, not orange chicken and fried rice.",
    "Grilled teriyaki chicken, half steamed rice, mixed veg if they will plate it. No chow mein.",
    ["protein", "bulk"],
    "caution",
  ),
  item(
    "panda",
    "string-bean-chicken",
    "Panda Express String Bean Chicken Breast",
    "1 entrée",
    210,
    14,
    13,
    12,
    "Lighter entrée. Pair with steamed veg, not a second fried side.",
    "String bean chicken breast as the entrée. Super greens or steamed rice, not fried rice.",
    ["cut"],
    "caution",
  ),
  item(
    "innout",
    "protein-style-hamburger",
    "In-N-Out Hamburger, protein-style",
    "1 burger, lettuce wrap",
    240,
    13,
    11,
    17,
    "Same burger, no bun. A Double-Double protein-style is the bulk version.",
    "Hamburger, protein-style. Mustard and onion if you want. Skip animal-style on a cut.",
    ["cut", "protein"],
    "caution",
  ),
  item(
    "innout",
    "protein-style-double-double",
    "In-N-Out Double-Double, protein-style",
    "1 burger, lettuce wrap",
    520,
    33,
    11,
    39,
    "High protein, high fat. Log it as a meal, not a snack next to fries.",
    "Double-Double, protein-style. No fries, or share them.",
    ["bulk", "protein"],
    "high",
  ),
];

export const FAST_FOOD_BY_ID = new Map(FAST_FOOD_ITEMS.map((row) => [row.id, row]));

export function isFastFoodId(id: string) {
  return id.startsWith("ff-");
}

function isCutDiet(dietId: string | null | undefined) {
  return dietId === "steady_cut" || dietId === "mini_cut" || dietId === "low_histamine_cut" || dietId === "beach_week" || dietId === "stage_lean";
}

function isBulkDiet(dietId: string | null | undefined) {
  return dietId === "lean_bulk";
}

function isLowHistamine(dietId: string | null | undefined) {
  return dietId === "low_histamine" || dietId === "low_histamine_cut";
}

function scoreFastFoodItem(
  row: FastFoodItem,
  options: { dietId?: string | null; goal?: Goal | null },
) {
  const density = row.protein / Math.max(row.calories, 1);
  let score = density * 120 + Math.min(row.protein, 50) * 0.4;
  const cut = isCutDiet(options.dietId);
  const bulk = isBulkDiet(options.dietId);
  const histamine = isLowHistamine(options.dietId);

  if (cut) {
    if (row.fit.includes("cut")) score += 8;
    if (row.calories > 500) score -= 10;
    if (row.protein >= 25 && row.calories <= 420) score += 6;
  }
  if (bulk) {
    if (row.fit.includes("bulk")) score += 8;
    if (row.calories < 280) score -= 4;
  }
  if (
    options.goal === "powerlifting" ||
    options.goal === "bodybuilding" ||
    options.goal === "glute_specialization"
  ) {
    if (row.fit.includes("protein")) score += 3;
  }
  if (histamine) {
    if (row.leastBadOnLowHistamine) score += 14;
    else if (row.histamine === "high") score -= 20;
    else if (row.histamine === "caution") score -= 4;
  }
  return score;
}

export function recommendationsForRestaurant(
  restaurantId: string,
  options: { dietId?: string | null; goal?: Goal | null } = {},
) {
  return FAST_FOOD_ITEMS.filter((row) => row.restaurantId === restaurantId).sort(
    (a, b) => scoreFastFoodItem(b, options) - scoreFastFoodItem(a, options),
  );
}

export function fastFoodCatalogFoods() {
  return FAST_FOOD_ITEMS.map((row) => ({
    id: row.id,
    name: row.name,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    serving: row.serving,
  }));
}

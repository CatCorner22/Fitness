import type { HistamineLoad } from "./histamine";

/** Source category, used to filter menus by dietary pattern. */
export type FoodKind = "meat" | "fish" | "egg" | "dairy" | "plant";

export type StarterFood = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  /** Elimination-style SIGHI-inspired rank. Not a diagnosis. */
  histamine: HistamineLoad;
  kind: FoodKind;
};

/** Macros per serving, rounded from USDA FoodData Central (SR Legacy / Foundation) entries. */
export const STARTER_FOODS: StarterFood[] = [
  { id: "food-eggs", name: "Eggs (2 large)", calories: 144, protein: 12.6, carbs: 0.8, fat: 9.5, serving: "2 eggs", histamine: "low", kind: "egg" },
  { id: "food-egg-whites", name: "Egg whites", calories: 52, protein: 10.9, carbs: 0.7, fat: 0.2, serving: "100 g (about 3 large)", histamine: "low", kind: "egg" },
  { id: "food-chicken", name: "Chicken breast, cooked", calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: "100 g", histamine: "low", kind: "meat" },
  { id: "food-turkey", name: "Turkey breast, cooked", calories: 135, protein: 30, carbs: 0, fat: 0.7, serving: "100 g", histamine: "low", kind: "meat" },
  { id: "food-salmon", name: "Salmon, cooked", calories: 208, protein: 20, carbs: 0, fat: 13, serving: "100 g", histamine: "high", kind: "fish" },
  { id: "food-cod", name: "Cod, baked", calories: 105, protein: 23, carbs: 0, fat: 0.9, serving: "100 g", histamine: "caution", kind: "fish" },
  { id: "food-shrimp", name: "Shrimp, cooked", calories: 99, protein: 24, carbs: 0.2, fat: 0.3, serving: "100 g", histamine: "high", kind: "fish" },
  { id: "food-tuna", name: "Tuna, canned in water", calories: 116, protein: 26, carbs: 0, fat: 1, serving: "100 g drained", histamine: "high", kind: "fish" },
  { id: "food-greek-yogurt", name: "Greek yogurt, plain 2%", calories: 73, protein: 10, carbs: 3.9, fat: 1.9, serving: "100 g", histamine: "high", kind: "dairy" },
  { id: "food-whey", name: "Whey protein shake", calories: 120, protein: 24, carbs: 3, fat: 1.5, serving: "1 scoop", histamine: "caution", kind: "dairy" },
  { id: "food-pea-protein", name: "Pea protein shake", calories: 120, protein: 24, carbs: 1, fat: 2, serving: "1 scoop", histamine: "caution", kind: "plant" },
  { id: "food-cottage", name: "Cottage cheese 2%", calories: 81, protein: 11, carbs: 5, fat: 2.3, serving: "100 g", histamine: "high", kind: "dairy" },
  { id: "food-beef", name: "Lean ground beef 93%", calories: 152, protein: 21, carbs: 0, fat: 7, serving: "100 g cooked", histamine: "caution", kind: "meat" },
  { id: "food-tofu", name: "Firm tofu", calories: 144, protein: 17, carbs: 3, fat: 9, serving: "100 g", histamine: "caution", kind: "plant" },
  { id: "food-tempeh", name: "Tempeh", calories: 192, protein: 20, carbs: 8, fat: 11, serving: "100 g", histamine: "high", kind: "plant" },
  { id: "food-edamame", name: "Edamame, shelled", calories: 122, protein: 11, carbs: 10, fat: 5, serving: "100 g", histamine: "caution", kind: "plant" },
  { id: "food-lentils", name: "Lentils, cooked", calories: 116, protein: 9, carbs: 20, fat: 0.4, serving: "100 g", histamine: "caution", kind: "plant" },
  { id: "food-rice", name: "White rice, cooked", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, serving: "100 g", histamine: "low", kind: "plant" },
  { id: "food-quinoa", name: "Quinoa, cooked", calories: 120, protein: 4.4, carbs: 21, fat: 1.9, serving: "100 g", histamine: "low", kind: "plant" },
  { id: "food-oats", name: "Oats, dry", calories: 150, protein: 5, carbs: 27, fat: 3, serving: "40 g", histamine: "low", kind: "plant" },
  { id: "food-banana", name: "Banana", calories: 105, protein: 1.3, carbs: 27, fat: 0.4, serving: "1 medium", histamine: "caution", kind: "plant" },
  { id: "food-berries", name: "Mixed berries", calories: 57, protein: 0.7, carbs: 14, fat: 0.3, serving: "100 g", histamine: "caution", kind: "plant" },
  { id: "food-blueberries", name: "Blueberries", calories: 57, protein: 0.7, carbs: 14, fat: 0.3, serving: "100 g", histamine: "low", kind: "plant" },
  { id: "food-apple", name: "Apple", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, serving: "1 medium", histamine: "low", kind: "plant" },
  { id: "food-pear", name: "Pear", calories: 101, protein: 0.6, carbs: 27, fat: 0.2, serving: "1 medium", histamine: "low", kind: "plant" },
  { id: "food-potato", name: "Potato, baked", calories: 93, protein: 2.5, carbs: 21, fat: 0.1, serving: "100 g", histamine: "low", kind: "plant" },
  { id: "food-sweet-potato", name: "Sweet potato, baked", calories: 90, protein: 2, carbs: 21, fat: 0.1, serving: "100 g", histamine: "low", kind: "plant" },
  { id: "food-bread", name: "Sourdough slice", calories: 90, protein: 3, carbs: 17, fat: 1, serving: "1 slice", histamine: "high", kind: "plant" },
  { id: "food-olive-oil", name: "Olive oil", calories: 119, protein: 0, carbs: 0, fat: 13.5, serving: "1 tbsp", histamine: "low", kind: "plant" },
  { id: "food-avocado", name: "Avocado", calories: 160, protein: 2, carbs: 9, fat: 15, serving: "100 g", histamine: "high", kind: "plant" },
  { id: "food-almonds", name: "Almonds", calories: 170, protein: 6, carbs: 6, fat: 15, serving: "28 g", histamine: "high", kind: "plant" },
  { id: "food-broccoli", name: "Broccoli", calories: 35, protein: 2.4, carbs: 7, fat: 0.4, serving: "100 g", histamine: "low", kind: "plant" },
  { id: "food-spinach", name: "Spinach", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, serving: "100 g", histamine: "high", kind: "plant" },
  { id: "food-zucchini", name: "Zucchini", calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, serving: "100 g", histamine: "low", kind: "plant" },
  { id: "food-carrot", name: "Carrot", calories: 41, protein: 0.9, carbs: 10, fat: 0.2, serving: "100 g", histamine: "low", kind: "plant" },
  { id: "food-cucumber", name: "Cucumber", calories: 16, protein: 0.7, carbs: 3.6, fat: 0.1, serving: "100 g", histamine: "low", kind: "plant" },
  { id: "food-bell-pepper", name: "Bell pepper", calories: 31, protein: 1, carbs: 6, fat: 0.3, serving: "100 g", histamine: "low", kind: "plant" },
  { id: "food-milk", name: "Milk 2%", calories: 122, protein: 8, carbs: 12, fat: 5, serving: "240 ml", histamine: "caution", kind: "dairy" },
  { id: "food-cheese", name: "Cheddar", calories: 113, protein: 7, carbs: 0.4, fat: 9, serving: "28 g", histamine: "high", kind: "dairy" },
  { id: "food-pasta", name: "Pasta, cooked", calories: 131, protein: 5, carbs: 25, fat: 1.1, serving: "100 g", histamine: "caution", kind: "plant" },
  { id: "food-beans", name: "Black beans, cooked", calories: 132, protein: 8.9, carbs: 24, fat: 0.5, serving: "100 g", histamine: "high", kind: "plant" },
  { id: "food-peanut-butter", name: "Peanut butter", calories: 188, protein: 8, carbs: 6, fat: 16, serving: "2 tbsp", histamine: "high", kind: "plant" },
  { id: "food-coffee", name: "Black coffee", calories: 2, protein: 0.3, carbs: 0, fat: 0, serving: "240 ml", histamine: "caution", kind: "plant" },
  { id: "food-latte", name: "Caffe latte", calories: 150, protein: 8, carbs: 12, fat: 6, serving: "240 ml", histamine: "caution", kind: "dairy" },
  { id: "food-bagel", name: "Bagel", calories: 277, protein: 11, carbs: 55, fat: 1.4, serving: "1 bagel", histamine: "high", kind: "plant" },
  { id: "food-protein-bar", name: "Protein bar", calories: 200, protein: 20, carbs: 22, fat: 6, serving: "1 bar", histamine: "caution", kind: "dairy" },
  { id: "food-pizza-slice", name: "Pizza slice", calories: 285, protein: 12, carbs: 36, fat: 10, serving: "1 slice", histamine: "high", kind: "dairy" },
  { id: "food-overnight-oats", name: "Overnight oats", calories: 320, protein: 18, carbs: 42, fat: 8, serving: "1 bowl", histamine: "low", kind: "dairy" },
];

const EXCLUDED_KINDS: Record<"omnivore" | "pescatarian" | "vegetarian" | "vegan", readonly FoodKind[]> = {
  omnivore: [],
  pescatarian: ["meat"],
  vegetarian: ["meat", "fish"],
  vegan: ["meat", "fish", "egg", "dairy"],
};

export function foodFitsPattern(food: Pick<StarterFood, "kind">, pattern: keyof typeof EXCLUDED_KINDS) {
  return !EXCLUDED_KINDS[pattern].includes(food.kind);
}

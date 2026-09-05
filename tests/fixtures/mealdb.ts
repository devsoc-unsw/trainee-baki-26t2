import type { MealDBMeal, MealDBMealSummary } from "@/types/mealdb";

export interface BuildMealDBMealOptions {
  overrides?: Partial<MealDBMeal>;
  ingredients?: Array<{ name: string; measure: string }>;
}

/**
 * Builds a minimal-but-realistic TheMealDB meal record. Ingredient
 * and measure pairs are packed into the numbered strIngredient1..20
 * / strMeasure1..20 slots the API uses.
 *
 * `overrides` and `ingredients` are separate arguments (rather than
 * a single Partial<MealDBMeal>) because MealDBMeal has an index
 * signature of `string | undefined`, which conflicts with typing an
 * `ingredients` array of objects.
 */
export const buildMealDBMeal = (
  options: BuildMealDBMealOptions = {},
): MealDBMeal => {
  const { overrides = {}, ingredients = [] } = options;
  const base: MealDBMeal = {
    idMeal: "52772",
    strMeal: "Carrot Cake",
    strInstructions: "Bake it.",
    strMealThumb: "https://example.com/img.jpg",
    strCategory: "Dessert",
  };
  for (let i = 1; i <= 20; i++) {
    base[`strIngredient${i}`] = "";
    base[`strMeasure${i}`] = "";
  }
  ingredients.forEach((ing, index) => {
    base[`strIngredient${index + 1}`] = ing.name;
    base[`strMeasure${index + 1}`] = ing.measure;
  });
  return { ...base, ...overrides };
};

export const buildMealSummary = (
  overrides: Partial<MealDBMealSummary> = {},
): MealDBMealSummary => ({
  idMeal: "52772",
  strMeal: "Carrot Cake",
  strMealThumb: "https://example.com/img.jpg",
  ...overrides,
});

/**
 * Wraps a value into a Response object that `fetch()` mocks can
 * return. Defaults to a 200 OK JSON response.
 */
export const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

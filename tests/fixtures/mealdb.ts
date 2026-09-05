import type { MealDBMeal, MealDBMealSummary } from "@/types/mealdb";

/**
 * Builds a minimal-but-realistic TheMealDB meal record. Callers can
 * override any field; ingredient/measure pairs are packed into the
 * numbered strIngredient1..20 / strMeasure1..20 slots the API uses.
 */
export const buildMealDBMeal = (
  overrides: Partial<MealDBMeal> & {
    ingredients?: Array<{ name: string; measure: string }>;
  } = {},
): MealDBMeal => {
  const { ingredients = [], ...rest } = overrides;
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
  return { ...base, ...rest };
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

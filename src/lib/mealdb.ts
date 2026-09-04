import type {
  MealDBFilterResponse,
  MealDBIngredient,
  MealDBLookupResponse,
  MealDBMeal,
  MealDBMealSummary,
  MealDBSearchResponse,
} from "@/types/mealdb";

// TheMealDB API route
const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

/**
 * 
 * @param name - The meal name to search for, i.e "Carrot Cake"
 *               Matches are made by TheMealDB
 * @returns A promise resolving to an array of matching meals (can be multiple)
 *          Or an empty array if no meals are found
 * @throws An error if it fails to fetch (DOES NOT ERROR IF NO MEALS ARE FOUND)
 */
export async function searchMealsByName(name: string) : Promise<MealDBMeal[]> {
  const res = await fetch(`${BASE_URL}/search.php?s=${encodeURIComponent(name)}`);
  
  if (!res.ok) {
    throw new Error(`TheMealDB request failed: ${res.status}`);
  }

  const data: MealDBSearchResponse = await res.json();
  return data.meals ?? [];
}

/**
 *
 * @param meal - A singular meal returned by TheMealDB
 * @returns An array of ingredients that includes a name and a measure
 *          with both the amount and units e.g "1 tablespoon"
 *          Or an empty array if no ingredients are found
 * @throws An error if the meal argument is null or undefined
 *
 * Iterates all 20 ingredient slots because TheMealDB populates them
 * sparsely — a blank NAME marks an unused slot and is skipped, but a
 * present name with an empty MEASURE is still a real ingredient (e.g.
 * "salt to taste") and is kept with measure defaulted to "".
 */
export function extractIngredients(meal: MealDBMeal) : MealDBIngredient[] {
  const ingredients: MealDBIngredient[] = [];

  if (meal == null) {
    throw new Error(`Meal could not be found`);
  }

  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (!name || !name.trim()) {
      continue;
    }
    ingredients.push({
      name: name.trim(),
      measure: (measure ?? "").trim()
    })
  }

  return ingredients;
}

/**
 *
 * @param ingredient - Ingredient name to filter meals by, e.g. "chicken".
 * @returns A promise resolving to meal summaries (id, name, thumbnail).
 *          filter.php intentionally omits ingredient lists — callers
 *          that need full details must follow up with lookupMealById.
 *          Empty array when TheMealDB has no matches.
 * @throws An error if the network request fails (an empty result set
 *         is not treated as an error).
 */
export async function filterMealsByIngredient(
  ingredient: string,
): Promise<MealDBMealSummary[]> {
  const res = await fetch(
    `${BASE_URL}/filter.php?i=${encodeURIComponent(ingredient)}`,
  );

  if (!res.ok) {
    throw new Error(`TheMealDB request failed: ${res.status}`);
  }

  const data: MealDBFilterResponse = await res.json();
  return data.meals ?? [];
}

/**
 *
 * @param id - TheMealDB numeric id (idMeal), e.g. "52772".
 * @returns A promise resolving to the full meal record, or null when
 *          no meal exists for the given id.
 * @throws An error if the network request fails.
 */
export async function lookupMealById(id: string): Promise<MealDBMeal | null> {
  const res = await fetch(
    `${BASE_URL}/lookup.php?i=${encodeURIComponent(id)}`,
  );

  if (!res.ok) {
    throw new Error(`TheMealDB request failed: ${res.status}`);
  }

  const data: MealDBLookupResponse = await res.json();
  return data.meals?.[0] ?? null;
}
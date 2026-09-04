import type { MealDBMeal, MealDBIngredient, MealDBSearchResponse } from "@/lib/types";

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
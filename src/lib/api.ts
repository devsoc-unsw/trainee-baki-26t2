/**
 * Browser-side API client. Every function here is a thin fetch
 * wrapper around a route handler under src/app/api/; no business
 * logic lives in this file. The five exported signatures are the
 * public contract the pages depend on — keep them stable when the
 * routes evolve.
 */

import { parseMeasure } from "@/lib/parseMeasure";
import type {
  DietaryTag,
  GroceryItem,
  Ingredient,
  Meal,
  StoreOffer,
} from "@/types";

export { parseMeasure };

/**
 * Wraps a fetch that already succeeded (`res.ok === true`) so callers
 * get a JSON-parsed body typed to the shape they asked for.
 */
const parseJson = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    let code = "http_error";
    let message = `Request failed with HTTP ${res.status}`;
    try {
      const body = (await res.json()) as {
        error?: { code?: string; message?: string };
      };
      if (body.error?.code) code = body.error.code;
      if (body.error?.message) message = body.error.message;
    } catch {
      // fall through with the generic HTTP message
    }
    throw new Error(`${code}: ${message}`);
  }
  return (await res.json()) as T;
};

/**
 * Requests a per-store price comparison from POST /api/stores/compare.
 *
 * @param items - Grocery items to price.
 * @returns One StoreOffer per configured store. An empty items array
 *   still returns a response (with empty product lines per store).
 * @throws When the network request fails or the server responds with
 *   a non-2xx status; the thrown Error's message contains the
 *   `code: message` from the route's error contract when available.
 */
export async function getStoreComparison(
  items: GroceryItem[],
): Promise<StoreOffer[]> {
  const res = await fetch("/api/stores/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  const body = await parseJson<{ offers: StoreOffer[] }>(res);
  return body.offers;
}

/**
 * Looks up a meal by name via GET /api/meals/search.
 *
 * @param name - User-entered meal name.
 * @param restrictions - Dietary tags the returned meal must satisfy.
 *   Empty means no filtering.
 * @returns The first matching meal that satisfies every restriction,
 *   or null when TheMealDB returns no results or no candidate passes
 *   the filter.
 * @throws When the network request fails or the server responds with
 *   a non-2xx status.
 */
export async function getMealByName(
  name: string,
  restrictions: DietaryTag[],
): Promise<Meal | null> {
  const url = new URL("/api/meals/search", window.location.origin);
  url.searchParams.set("name", name);
  if (restrictions.length > 0) {
    url.searchParams.set("restrictions", restrictions.join(","));
  }
  const res = await fetch(url.toString());
  const body = await parseJson<{ meal: Meal | null }>(res);
  return body.meal;
}

/**
 * Suggests meals using ingredients the user already has via
 * GET /api/meals/by-ingredients.
 *
 * @param ingredients - User pantry ingredients (free text).
 * @param filters - Post-ranking filters applied server-side.
 * @returns Meals ranked and filtered per the route contract; empty
 *   array when no ingredients are supplied (never round-trips).
 * @throws When the network request fails or the server responds with
 *   a non-2xx status.
 */
export async function getMealsFromIngredients(
  ingredients: string[],
  filters: { quickMeal: boolean; highProtein: boolean },
): Promise<Meal[]> {
  if (ingredients.length === 0) return [];
  const url = new URL("/api/meals/by-ingredients", window.location.origin);
  url.searchParams.set("ingredients", ingredients.join(","));
  url.searchParams.set("quickMeal", String(filters.quickMeal));
  url.searchParams.set("highProtein", String(filters.highProtein));
  const res = await fetch(url.toString());
  const body = await parseJson<{ meals: Meal[] }>(res);
  return body.meals;
}

/**
 * Fetches the ingredient list for a previously-selected meal via
 * GET /api/meals/:id/ingredients.
 *
 * @param mealId - The Meal.id returned by getMealByName.
 * @returns The meal's ingredients as {name, quantity, unit}.
 * @throws When the network request fails or the server responds with
 *   a non-2xx status.
 */
export async function getIngredientsForMeal(
  mealId: string,
): Promise<Ingredient[]> {
  const encoded = encodeURIComponent(mealId);
  const res = await fetch(`/api/meals/${encoded}/ingredients`);
  const body = await parseJson<{ ingredients: Ingredient[] }>(res);
  return body.ingredients;
}

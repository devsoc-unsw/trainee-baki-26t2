import "server-only";

import { UpstreamError } from "@/server/errors";
import type {
  MealDBFilterResponse,
  MealDBIngredient,
  MealDBLookupResponse,
  MealDBMeal,
  MealDBMealSummary,
  MealDBSearchResponse,
} from "@/types/mealdb";

const BASE_URL =
  process.env.MEALDB_BASE_URL ?? "https://www.themealdb.com/api/json/v1/1";

/**
 * Revalidate window for every TheMealDB response. The database's
 * public v1 API is effectively static — recipe additions are rare
 * and TheMealDB does not expose a mutation surface. One hour keeps
 * dev-mode navigation snappy while still letting a real content
 * change roll out within a working day. Increase (or lower) here if
 * upstream volatility changes.
 */
const MEALDB_REVALIDATE_SECONDS = 3600;

const upstreamFetch = async (
  url: string,
  signal?: AbortSignal,
): Promise<Response> => {
  try {
    return await fetch(url, {
      signal,
      next: { revalidate: MEALDB_REVALIDATE_SECONDS },
    });
  } catch (err) {
    // Any thrown error from fetch — network failure, aborted request,
    // DNS problem — becomes an UpstreamError. errorResponse in the
    // route layer maps that to HTTP 502, which is the right status
    // when we are a proxy and our upstream is unresponsive.
    const cause = err instanceof Error ? err.message : String(err);
    throw new UpstreamError(
      `TheMealDB request failed: ${cause}`,
      "mealdb_unreachable",
    );
  }
};

const parseUpstreamJson = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    throw new UpstreamError(
      `TheMealDB responded with HTTP ${res.status}`,
      "mealdb_bad_status",
    );
  }
  try {
    return (await res.json()) as T;
  } catch {
    throw new UpstreamError(
      "TheMealDB returned a malformed response body",
      "mealdb_bad_json",
    );
  }
};

/**
 * Searches TheMealDB by meal name (search.php?s=).
 *
 * @param name - The meal name to search for, e.g. "Carrot Cake".
 * @param signal - Optional AbortSignal to cancel the fetch (route
 *   handlers pass AbortSignal.timeout so slow upstreams do not hang
 *   a request).
 * @returns Every matching meal record. Empty array when TheMealDB
 *   has no matches — an empty search is not an error.
 * @throws {UpstreamError} If the request fails, times out, or the
 *   response is non-2xx / malformed JSON.
 */
export async function searchMealsByName(
  name: string,
  signal?: AbortSignal,
): Promise<MealDBMeal[]> {
  const res = await upstreamFetch(
    `${BASE_URL}/search.php?s=${encodeURIComponent(name)}`,
    signal,
  );
  const data = await parseUpstreamJson<MealDBSearchResponse>(res);
  return data.meals ?? [];
}

/**
 * Extracts the sparse ingredient/measure pairs from a TheMealDB meal.
 *
 * @param meal - A meal record from TheMealDB.
 * @returns Ingredients with `name` and `measure` (e.g. "1 tablespoon");
 *   empty array if the meal has none.
 * @throws {Error} If `meal` is null/undefined — callers should guard.
 *
 * Iterates all 20 ingredient slots because TheMealDB populates them
 * sparsely: a blank NAME marks an unused slot and is skipped, but a
 * present name with an empty MEASURE is still a real ingredient
 * (e.g. "salt to taste") and is kept with measure defaulted to "".
 */
export function extractIngredients(meal: MealDBMeal): MealDBIngredient[] {
  if (meal == null) {
    throw new Error("Meal could not be found");
  }

  const ingredients: MealDBIngredient[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (!name || !name.trim()) continue;
    ingredients.push({
      name: name.trim(),
      measure: (measure ?? "").trim(),
    });
  }
  return ingredients;
}

/**
 * Fetches the summary list of meals filtered by ingredient
 * (filter.php?i=).
 *
 * @param ingredient - Ingredient name to filter meals by, e.g.
 *   "chicken".
 * @param signal - Optional AbortSignal for timeout support.
 * @returns Meal summaries (id, name, thumbnail). filter.php
 *   intentionally omits ingredient lists — callers that need full
 *   details must follow up with {@link lookupMealById}. Empty array
 *   when TheMealDB has no matches.
 * @throws {UpstreamError} If the network request fails, times out,
 *   or the response is non-2xx / malformed JSON.
 */
export async function filterMealsByIngredient(
  ingredient: string,
  signal?: AbortSignal,
): Promise<MealDBMealSummary[]> {
  const res = await upstreamFetch(
    `${BASE_URL}/filter.php?i=${encodeURIComponent(ingredient)}`,
    signal,
  );
  const data = await parseUpstreamJson<MealDBFilterResponse>(res);
  return data.meals ?? [];
}

/**
 * Fetches a full meal record by TheMealDB id (lookup.php?i=).
 *
 * @param id - TheMealDB numeric id (idMeal), e.g. "52772".
 * @param signal - Optional AbortSignal for timeout support.
 * @returns The full meal record, or null when no meal exists for the
 *   given id.
 * @throws {UpstreamError} If the network request fails, times out,
 *   or the response is non-2xx / malformed JSON.
 */
export async function lookupMealById(
  id: string,
  signal?: AbortSignal,
): Promise<MealDBMeal | null> {
  const res = await upstreamFetch(
    `${BASE_URL}/lookup.php?i=${encodeURIComponent(id)}`,
    signal,
  );
  const data = await parseUpstreamJson<MealDBLookupResponse>(res);
  return data.meals?.[0] ?? null;
}

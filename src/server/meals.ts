import "server-only";

import { normaliseName } from "@/lib/ingredients";
import { parseMeasure } from "@/lib/parseMeasure";
import { deriveMealTags } from "@/lib/mealHeuristics";
import {
  extractIngredients,
  filterMealsByIngredient,
  lookupMealById,
  searchMealsByName,
} from "@/server/mealdb";
import type { MealDBMeal, MealDBMealSummary } from "@/types/mealdb";
import type { DietaryTag, Ingredient, Meal } from "@/types";

/**
 * Maps a TheMealDB record onto our internal Meal shape.
 *
 * @param mdbMeal - Raw MealDB record.
 * @returns A Meal safe to hand to a component. dietaryTags,
 *   isQuickMeal, and isHighProtein come from the heuristics in
 *   mealHeuristics.ts since TheMealDB does not provide them.
 *
 * Meal.id is set to strMeal (the canonical name) so
 * getIngredientsForMeal can round-trip through searchMealsByName,
 * which is the only lookup helper TheMealDB exposes by name.
 */
const mealFromMealDB = (mdbMeal: MealDBMeal): Meal => {
  const rawIngredients = extractIngredients(mdbMeal);
  const { dietaryTags, isQuickMeal, isHighProtein } = deriveMealTags(
    rawIngredients,
    mdbMeal.strCategory,
    mdbMeal.strInstructions,
  );

  return {
    id: mdbMeal.strMeal,
    name: mdbMeal.strMeal,
    description: mdbMeal.strInstructions ?? "",
    attribution: "TheMealDB",
    imageUrl: mdbMeal.strMealThumb ?? null,
    ingredients: rawIngredients.map((ingredient) => {
      const { quantity, unit } = parseMeasure(ingredient.measure);
      return { name: ingredient.name, quantity, unit };
    }),
    dietaryTags,
    isQuickMeal,
    isHighProtein,
  };
};

/**
 * Checks whether a meal's derived tags satisfy every requested
 * restriction.
 *
 * @param meal - Meal whose tags come from deriveMealTags.
 * @param restrictions - Dietary requirements the caller wants met.
 * @returns true if every restriction is satisfied. Empty restrictions
 *   trivially return true.
 *
 * "nut-allergy" is inverted: the tag means "meal contains nuts", so
 * a user with the nut-allergy restriction wants meals that DO NOT
 * carry it. The other tags mean "meal is <diet>", so a matching
 * restriction requires the tag to be present.
 */
const mealSatisfiesRestrictions = (
  meal: Meal,
  restrictions: DietaryTag[],
): boolean =>
  restrictions.every((restriction) =>
    restriction === "nut-allergy"
      ? !meal.dietaryTags.includes(restriction)
      : meal.dietaryTags.includes(restriction),
  );

/**
 * Looks up a meal by name from TheMealDB, filtered by dietary
 * restrictions.
 *
 * @param name - User-entered meal name.
 * @param restrictions - Dietary tags the returned meal must satisfy.
 *   Empty means no filtering.
 * @param signal - Optional AbortSignal for upstream timeout support.
 * @returns The first matching meal that satisfies every restriction,
 *   or null when TheMealDB returns no results or no candidate passes
 *   the filter.
 * @throws {UpstreamError} If the TheMealDB request fails or times out.
 */
export async function getMealByName(
  name: string,
  restrictions: DietaryTag[],
  signal?: AbortSignal,
): Promise<Meal | null> {
  const matches = await searchMealsByName(name, signal);
  for (const candidate of matches) {
    const meal = mealFromMealDB(candidate);
    if (mealSatisfiesRestrictions(meal, restrictions)) {
      return meal;
    }
  }
  return null;
}

/**
 * Maximum full-detail lookups per leftovers query. filter.php returns
 * only id/name/thumbnail, so ranked candidates need per-meal round
 * trips to reveal ingredients and heuristic tags. Capping bounds the
 * request count so a user with many pantry ingredients doesn't fan
 * out into dozens of parallel calls against TheMealDB.
 */
const LEFTOVERS_MAX_LOOKUPS = 8;

/**
 * Suggests meals that use ingredients the user already has, using
 * TheMealDB's filter + lookup endpoints.
 *
 * @param ingredients - User pantry ingredients (free text).
 * @param filters - Post-ranking filters applied against heuristic
 *   tags derived per meal.
 * @param signal - Optional AbortSignal for upstream timeout support;
 *   applied to every fan-out request.
 * @returns Meals ranked by how many pantry ingredients they use,
 *   capped at LEFTOVERS_MAX_LOOKUPS full-detail lookups and then
 *   filtered by quickMeal / highProtein.
 * @throws {UpstreamError} If any TheMealDB request fails or times out.
 *
 * Strategy: filter.php is called once per pantry ingredient in
 * parallel; results are unioned and ranked by hit count so a meal
 * appearing under multiple ingredients rises to the top. Only the
 * top LEFTOVERS_MAX_LOOKUPS candidates get full lookups (also in
 * parallel), because filter.php does not return ingredients or the
 * data needed by the heuristic tags.
 */
export async function getMealsFromIngredients(
  ingredients: string[],
  filters: { quickMeal: boolean; highProtein: boolean },
  signal?: AbortSignal,
): Promise<Meal[]> {
  if (ingredients.length === 0) return [];

  const shortlists = await Promise.all(
    ingredients.map((ingredient) =>
      filterMealsByIngredient(ingredient, signal),
    ),
  );

  const counts = new Map<
    string,
    { summary: MealDBMealSummary; count: number }
  >();
  for (const shortlist of shortlists) {
    for (const summary of shortlist) {
      const existing = counts.get(summary.idMeal);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(summary.idMeal, { summary, count: 1 });
      }
    }
  }

  const ranked = [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, LEFTOVERS_MAX_LOOKUPS);

  const detailed = await Promise.all(
    ranked.map(({ summary }) => lookupMealById(summary.idMeal, signal)),
  );

  return detailed
    .filter((mdbMeal): mdbMeal is MealDBMeal => mdbMeal !== null)
    .map(mealFromMealDB)
    .filter((meal) => {
      if (filters.quickMeal && !meal.isQuickMeal) return false;
      if (filters.highProtein && !meal.isHighProtein) return false;
      return true;
    });
}

/**
 * Fetches the ingredient list for a previously-selected meal.
 *
 * @param mealId - The Meal.id returned by getMealByName. Because
 *   TheMealDB is only searchable by name via searchMealsByName, we
 *   stored the meal's canonical name in Meal.id so this lookup can
 *   round-trip. Matched case-insensitively to survive normalisation.
 * @param signal - Optional AbortSignal for upstream timeout support.
 * @returns The meal's ingredients as {name, quantity, unit}. Quantity
 *   is null when the raw measure string is not a plain number. Empty
 *   array when no exact-name match is found.
 * @throws {UpstreamError} If the TheMealDB request fails or times out.
 */
export async function getIngredientsForMeal(
  mealId: string,
  signal?: AbortSignal,
): Promise<Ingredient[]> {
  const matches = await searchMealsByName(mealId, signal);
  const meal = matches.find(
    (candidate) => normaliseName(candidate.strMeal) === normaliseName(mealId),
  );
  if (!meal) return [];

  return extractIngredients(meal).map((ingredient) => {
    const { quantity, unit } = parseMeasure(ingredient.measure);
    return { name: ingredient.name, quantity, unit };
  });
}

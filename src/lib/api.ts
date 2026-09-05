/**
 * Backend integration point. Replace only these function bodies when the real
 * API is ready; callers should continue using the same shared domain types.
 */

import { storePricing, stores } from "@/lib/mockData";
import { haversineKm, USER_LOCATION } from "@/lib/geo";
import { formatIngredientName, normaliseName } from "@/lib/ingredients";
import {
  extractIngredients,
  filterMealsByIngredient,
  lookupMealById,
  searchMealsByName,
} from "@/lib/mealdb";
import { deriveMealTags } from "@/lib/mealHeuristics";
import type { MealDBMeal, MealDBMealSummary } from "@/types/mealdb";
import type {
  DietaryTag,
  GroceryItem,
  Ingredient,
  Meal,
  StoreOffer,
  StoreProduct,
} from "@/types";

const MOCK_DELAY_MS = 300;

const delay = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, MOCK_DELAY_MS);
  });

export const normaliseAmount = (quantity: number, unit: string) => {
  const normalisedUnit = unit.trim().toLowerCase();

  if (normalisedUnit === "kg") {
    return { quantity: quantity * 1000, unit: "g" };
  }
  if (normalisedUnit === "l") {
    return { quantity: quantity * 1000, unit: "ml" };
  }

  return { quantity, unit: normalisedUnit };
};

export const getPacksNeeded = (
  item: GroceryItem,
  priceEntry: StoreProduct,
) => {
  const requestedAmount = normaliseAmount(item.quantity, item.unit);
  const packageAmount = normaliseAmount(
    priceEntry.packageSize,
    priceEntry.packageUnit,
  );

  // Mismatched units are a data-quality issue, so do not calculate a price.
  if (
    requestedAmount.unit !== packageAmount.unit ||
    packageAmount.quantity <= 0
  ) {
    return null;
  }

  return Math.ceil(requestedAmount.quantity / packageAmount.quantity);
};

const createUnavailableProduct = (item: GroceryItem): StoreProduct => ({
  listItemName: normaliseName(item.name),
  displayName: formatIngredientName(item.name),
  packageSize: 0,
  packageUnit: item.unit,
  packagePrice: 0,
  packsNeeded: 0,
  lineTotal: 0,
  imageUrl: null,
  available: false,
});

export async function getStoreComparison(
  items: GroceryItem[],
): Promise<StoreOffer[]> {
  await delay();

  // The mock preserves the current fixed mapping: cheapest is Coles and
  // closest is Woolworths. Real ranking belongs in the backend.
  return stores.map((store) => {
    const catalogue = storePricing[store.id] ?? [];
    const distanceKm =
      store.latitude !== null && store.longitude !== null
        ? Math.round(
            haversineKm(USER_LOCATION, {
              latitude: store.latitude,
              longitude: store.longitude,
            }) * 10,
          ) / 10
        : null;
    const products = items.map((item) => {
      const priceEntry = catalogue.find(
        (product) =>
          normaliseName(product.listItemName) === normaliseName(item.name),
      );

      if (!priceEntry) return createUnavailableProduct(item);

      const packsNeeded = getPacksNeeded(item, priceEntry);
      if (packsNeeded === null) return createUnavailableProduct(item);

      return {
        ...priceEntry,
        listItemName: normaliseName(item.name),
        packsNeeded,
        lineTotal: priceEntry.packagePrice * packsNeeded,
        available: true,
      };
    });

    return {
      store: { ...store, distanceKm },
      products,
      total: products.reduce(
        (sum, product) => sum + (product.available ? product.lineTotal : 0),
        0,
      ),
      unavailableItems: products
        .filter((product) => !product.available)
        .map((product) => product.listItemName),
    };
  });
}

/**
 * Parses a TheMealDB measure string like "1 tablespoon", "200g",
 * "1/2 cup", or "1 1/2 tsp" into a numeric quantity and free-text unit.
 *
 * @param measure - Raw measure string from TheMealDB (may be blank).
 * @returns quantity: parsed number, or null when the string does not
 *          start with a plain numeric amount. unit: everything after
 *          the numeric part, trimmed; when no number is present, the
 *          original trimmed text becomes the unit so it can still be
 *          shown to the user (e.g. "to taste").
 *
 * Ambiguous inputs (ranges like "2-3", non-ASCII fractions, "a pinch")
 * return quantity: null rather than guess — a wrong number would flow
 * into unit conversion downstream and misprice a shopping list.
 */
export function parseMeasure(
  measure: string,
): { quantity: number | null; unit: string } {
  const trimmed = measure.trim();
  if (!trimmed) return { quantity: null, unit: "" };

  const mixed = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)(?:\s+(.+))?$/);
  if (mixed) {
    const [, whole, num, den, rest] = mixed;
    const denominator = Number(den);
    if (denominator > 0) {
      return {
        quantity: Number(whole) + Number(num) / denominator,
        unit: (rest ?? "").trim(),
      };
    }
  }

  const frac = trimmed.match(/^(\d+)\/(\d+)(?:\s+(.+))?$/);
  if (frac) {
    const [, num, den, rest] = frac;
    const denominator = Number(den);
    if (denominator > 0) {
      return {
        quantity: Number(num) / denominator,
        unit: (rest ?? "").trim(),
      };
    }
  }

  const scalar = trimmed.match(
    /^(\d+(?:\.\d+)?)\s*([a-zA-Z][a-zA-Z\s.-]*)?$/,
  );
  if (scalar) {
    return {
      quantity: Number(scalar[1]),
      unit: (scalar[2] ?? "").trim(),
    };
  }

  return { quantity: null, unit: trimmed };
}

/**
 * Maps a TheMealDB record onto our internal Meal shape.
 *
 * @param mdbMeal - Raw MealDB record.
 * @returns A Meal safe to hand to a component. dietaryTags,
 *          isQuickMeal, and isHighProtein come from the heuristics in
 *          mealHeuristics.ts since TheMealDB does not provide them.
 *
 * Meal.id is set to strMeal (the canonical name) so
 * getIngredientsForMeal can round-trip through searchMealsByName,
 * which is the only lookup helper exposed by mealdb.ts.
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
 *          trivially return true.
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
 * @returns The first matching meal that satisfies every restriction,
 *          or null when TheMealDB returns no results or no candidate
 *          passes the filter.
 * @throws When the network request to TheMealDB fails.
 */
export async function getMealByName(
  name: string,
  restrictions: DietaryTag[],
): Promise<Meal | null> {
  const matches = await searchMealsByName(name);
  for (const candidate of matches) {
    const meal = mealFromMealDB(candidate);
    if (mealSatisfiesRestrictions(meal, restrictions)) {
      return meal;
    }
  }
  return null;
}

// Maximum full-detail lookups per leftovers query. filter.php returns
// only id/name/thumbnail, so ranked candidates need per-meal round
// trips to reveal ingredients and heuristic tags. Capping bounds the
// request count so a user with many pantry ingredients doesn't fan
// out into dozens of parallel calls against TheMealDB.
const LEFTOVERS_MAX_LOOKUPS = 8;

/**
 * Suggests meals that use ingredients the user already has, using
 * TheMealDB's filter + lookup endpoints.
 *
 * @param ingredients - User pantry ingredients (free text).
 * @param filters - Post-ranking filters applied against heuristic
 *   tags derived per meal.
 * @returns Meals ranked by how many pantry ingredients they use,
 *          capped at LEFTOVERS_MAX_LOOKUPS full-detail lookups and
 *          then filtered by quickMeal / highProtein.
 * @throws When any TheMealDB request fails.
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
): Promise<Meal[]> {
  if (ingredients.length === 0) return [];

  const shortlists = await Promise.all(
    ingredients.map((ingredient) => filterMealsByIngredient(ingredient)),
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
    ranked.map(({ summary }) => lookupMealById(summary.idMeal)),
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
 * @returns The meal's ingredients as {name, quantity, unit}. Quantity
 *          is null when the raw measure string is not a plain number.
 *          Empty array when no exact-name match is found.
 * @throws When the network request to TheMealDB fails.
 */
export async function getIngredientsForMeal(
  mealId: string,
): Promise<Ingredient[]> {
  const matches = await searchMealsByName(mealId);
  const meal = matches.find(
    (candidate) => normaliseName(candidate.strMeal) === normaliseName(mealId),
  );
  if (!meal) return [];

  return extractIngredients(meal).map((ingredient) => {
    const { quantity, unit } = parseMeasure(ingredient.measure);
    return { name: ingredient.name, quantity, unit };
  });
}

/**
 * Backend integration point. Replace only these function bodies when the real
 * API is ready; callers should continue using the same shared domain types.
 */

import {
  mealPrepMeals,
  mealSuggestionCatalogue,
  storePricing,
  stores,
} from "@/lib/mockData";
import { haversineKm, USER_LOCATION } from "@/lib/geo";
import { formatIngredientName, normaliseName } from "@/lib/ingredients";
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

const normaliseAmount = (quantity: number, unit: string) => {
  const normalisedUnit = unit.trim().toLowerCase();

  if (normalisedUnit === "kg") {
    return { quantity: quantity * 1000, unit: "g" };
  }
  if (normalisedUnit === "l") {
    return { quantity: quantity * 1000, unit: "ml" };
  }

  return { quantity, unit: normalisedUnit };
};

const getPacksNeeded = (
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

export async function getMealByName(
  name: string,
  restrictions: DietaryTag[],
): Promise<Meal | null> {
  await delay();
  void restrictions;

  const meal = mealPrepMeals.find(
    (candidate) => normaliseName(candidate.name) === normaliseName(name),
  );

  return meal ? structuredClone(meal) : null;
}

export async function getMealsFromIngredients(
  ingredients: string[],
  filters: { quickMeal: boolean; highProtein: boolean },
): Promise<Meal[]> {
  await delay();

  const ingredientSet = new Set(ingredients.map(normaliseName));

  return mealSuggestionCatalogue
    .map((meal) => ({
      meal,
      matchCount: meal.ingredients.filter((ingredient) =>
        ingredientSet.has(normaliseName(ingredient.name)),
      ).length,
    }))
    .filter(({ meal, matchCount }) => {
      if (matchCount === 0) return false;
      if (filters.quickMeal && !meal.isQuickMeal) return false;
      if (filters.highProtein && !meal.isHighProtein) return false;
      return true;
    })
    .sort((first, second) => second.matchCount - first.matchCount)
    .map(({ meal }) => structuredClone(meal));
}

export async function getIngredientsForMeal(
  mealId: string,
): Promise<Ingredient[]> {
  await delay();

  const meal = [...mealPrepMeals, ...mealSuggestionCatalogue].find(
    (candidate) => candidate.id === mealId,
  );

  return meal ? structuredClone(meal.ingredients) : [];
}

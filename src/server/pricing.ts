import "server-only";

import { haversineKm, USER_LOCATION } from "@/lib/geo";
import { formatIngredientName, normaliseName } from "@/lib/ingredients";
import { storePricing, stores } from "@/lib/mockData";
import { convert } from "@/lib/units";
import type { GroceryItem, StoreOffer, StoreProduct } from "@/types";

/**
 * Computes how many packs of a store product the shopper needs to
 * buy to cover the requested quantity of a grocery item.
 *
 * @param item - Grocery item as it appears on the shopping list.
 * @param priceEntry - Store product entry matched to the item by name.
 * @returns Whole pack count, rounded up (you cannot buy 0.4 of a
 *   pack); or `null` when the units cannot be reconciled — an unknown
 *   unit, an incompatible count-vs-mass axis, or a zero-sized package
 *   that would divide by zero.
 *
 * Conversion delegates to {@link convert} in the units module so that
 * "1 cup" of flour now resolves against a "1 kg" flour bag instead of
 * silently returning null the way the previous kg/L-only normaliser
 * did. The ingredient name is forwarded so density-sensitive
 * conversions pick the right constant (butter vs oil vs milk all
 * differ enough to matter for pack maths).
 */
export function getPacksNeeded(
  item: GroceryItem,
  priceEntry: StoreProduct,
): number | null {
  if (priceEntry.packageSize <= 0) return null;

  const requestedInPackageUnit = convert(
    item.quantity,
    item.unit,
    priceEntry.packageUnit,
    item.name,
  );
  if (requestedInPackageUnit === null) return null;

  return Math.ceil(requestedInPackageUnit / priceEntry.packageSize);
}

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

/**
 * Builds a per-store comparison for a shopping list.
 *
 * @param items - Grocery items the shopper wants to price.
 * @returns One {@link StoreOffer} per store in {@link stores},
 *   including its distance from the fixed {@link USER_LOCATION},
 *   the priced-out product line, the running total, and the names of
 *   items the store could not fulfil (either not stocked or unit
 *   conversion failed).
 * @throws Never — errors in downstream helpers only produce
 *   unavailable products, not thrown exceptions.
 *
 * This is a mock: the store list and the catalogue both come from
 * {@link storePricing} in mockData. When a real backend replaces this
 * layer only the body should change — the return shape must stay
 * identical so `/api/compare` route and clients keep working.
 */
export function getStoreComparison(items: GroceryItem[]): StoreOffer[] {
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

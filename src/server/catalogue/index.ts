import "server-only";

import type { GeoPoint } from "@/lib/geo";
import type { Store, StoreProduct } from "@/types";

import { colesProvider } from "./coles";
import type { CatalogueProvider } from "./types";
import { woolworthsProvider } from "./woolworths";

/**
 * Registered catalogue providers. Order defines the display order
 * of stores on the compare page; add new stores here to have them
 * picked up automatically by both /api/stores and
 * /api/stores/compare.
 */
const providers: readonly CatalogueProvider[] = [
  woolworthsProvider,
  colesProvider,
];

/**
 * Returns the list of all stores across every provider, with each
 * store's distance from `location` filled in.
 *
 * @param location - User location for distance calculation.
 * @returns Flat Store list; order matches the {@link providers}
 *   registration order.
 */
export function getAllStores(location: GeoPoint): Store[] {
  return providers.flatMap((p) => p.getStores(location));
}

/**
 * Fetches products for a specific store, delegating to whichever
 * provider owns that storeId. Providers that don't recognise the
 * storeId return an empty map, so unregistered ids yield an empty
 * result without a special case here.
 *
 * @param storeId - Store to look up.
 * @param names - Ingredient names from the shopping list.
 * @returns Map keyed by the normalised ingredient name; value is the
 *   StoreProduct or null when the store doesn't stock the item.
 */
export function getProductsForStore(
  storeId: string,
  names: string[],
): Map<string, StoreProduct | null> {
  const merged = new Map<string, StoreProduct | null>();
  for (const provider of providers) {
    for (const [name, product] of provider.getProducts(storeId, names)) {
      merged.set(name, product);
    }
  }
  return merged;
}

export type { CatalogueProvider } from "./types";

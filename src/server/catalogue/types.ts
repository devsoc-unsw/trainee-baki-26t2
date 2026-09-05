import "server-only";

import type { GeoPoint } from "@/lib/geo";
import type { Store, StoreProduct } from "@/types";

/**
 * A catalogue provider owns a single store's product catalogue and
 * exposes it through a two-method interface. The pricing route calls
 * every registered provider through {@link src/server/catalogue!getAllStores}
 * and {@link src/server/catalogue!getProductsForStore} so the compare
 * pipeline never has to know whether a store is backed by scraped
 * data, a mock, or a future real vendor API.
 *
 * Each implementation returns exactly one store from getStores and
 * only returns products from getProducts when storeId matches its
 * own; that lets the aggregator combine providers without checking
 * ownership itself.
 */
export interface CatalogueProvider {
  /**
   * @param location - User location; providers compute distance
   *   between their store and this point via
   *   {@link src/lib/geo!haversineKm}.
   * @returns Exactly one Store entry (with distanceKm filled in) for
   *   the store this provider owns. Never empty.
   */
  getStores(location: GeoPoint): Store[];

  /**
   * @param storeId - The store id the caller wants products for. If
   *   it doesn't match this provider's store, returns an empty map.
   * @param names - Ingredient names from the shopping list.
   * @returns A map from normalised ingredient name to the best-match
   *   product (or null when the store does not stock it).
   */
  getProducts(
    storeId: string,
    names: string[],
  ): Map<string, StoreProduct | null>;
}

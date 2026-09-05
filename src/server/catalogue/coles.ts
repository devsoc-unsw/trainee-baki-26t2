import "server-only";

import { haversineKm } from "@/lib/geo";
import type { GeoPoint } from "@/lib/geo";
import { formatIngredientName, normaliseName } from "@/lib/ingredients";
import { storePricing, stores } from "@/lib/mockData";
import type { Store, StoreProduct } from "@/types";

import type { CatalogueProvider } from "./types";

const STORE_ID = "coles";

// The Coles catalogue in mockData.ts is a fabrication — it is NOT a
// scrape of Coles' real prices, unlike the Woolworths dataset. It
// only exists so the compare page has two stores to pick between
// (cheapest vs closest) while the real Coles integration is still a
// backlog item. Do not use these numbers to make actual purchase
// decisions.
const colesStore: Store | undefined = stores.find((s) => s.id === STORE_ID);

const buildProductIndex = () => {
  const index = new Map<string, StoreProduct>();
  for (const product of storePricing[STORE_ID] ?? []) {
    index.set(normaliseName(product.listItemName), product);
  }
  return index;
};

const productIndex = buildProductIndex();

/**
 * Provider for the fabricated Coles catalogue in mockData.ts.
 *
 * @throws Never — the mockData is fully in memory; misses return
 *   `null` in the map instead of throwing.
 */
export const colesProvider: CatalogueProvider = {
  getStores(location) {
    if (!colesStore) return [];
    return [{ ...colesStore, distanceKm: distanceKm(colesStore, location) }];
  },

  getProducts(storeId, names) {
    const results = new Map<string, StoreProduct | null>();
    if (storeId !== STORE_ID) return results;
    for (const name of names) {
      const key = normaliseName(name);
      const product = productIndex.get(key);
      results.set(
        key,
        product
          ? {
              ...product,
              listItemName: key,
              displayName:
                product.displayName || formatIngredientName(name),
            }
          : null,
      );
    }
    return results;
  },
};

const distanceKm = (store: Store, location: GeoPoint): number | null => {
  if (store.latitude === null || store.longitude === null) return null;
  return (
    Math.round(
      haversineKm(location, {
        latitude: store.latitude,
        longitude: store.longitude,
      }) * 10,
    ) / 10
  );
};

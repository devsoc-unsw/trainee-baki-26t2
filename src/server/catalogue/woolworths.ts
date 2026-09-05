import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { haversineKm } from "@/lib/geo";
import type { GeoPoint } from "@/lib/geo";
import { formatIngredientName, normaliseName } from "@/lib/ingredients";
import { stores } from "@/lib/mockData";
import { convert, lookupUnit } from "@/lib/units";
import type { Store, StoreProduct } from "@/types";

import type { CatalogueProvider } from "./types";

const STORE_ID = "woolworths";

const woolworthsStore: Store | undefined = stores.find(
  (s) => s.id === STORE_ID,
);

interface RawWoolworthsProduct {
  search_term?: string;
  stockcode?: number;
  name?: string;
  brand?: string;
  price?: number;
  cup_price?: string | null;
  package_size?: string | null;
  image_url?: string | null;
  url?: string | null;
}

interface IndexedProduct {
  name: string;
  price: number;
  cupPrice: string | null;
  packageSize: string | null;
  imageUrl: string | null;
  url: string | null;
  /**
   * Normalised cost of ONE canonical unit (per g / per ml / per
   * count) derived from cup_price. Infinity when cup_price is
   * missing or unparseable so those products sort behind the
   * parseable ones; absolute price is the tiebreaker so an
   * all-unparseable bucket still ranks cheapest-total first.
   */
  pricePerCanonicalUnit: number;
  packageQuantity: number;
  packageUnit: string;
}

// TODO(next commit): parse package_size through src/lib/units.ts
// and return null on failure instead of defaulting to (1, "x"),
// which silently misprices anything the regex misses.
const parsePackageSize = (
  raw: string | null | undefined,
): { quantity: number; unit: string } => {
  const match = raw?.match(/(\d+(?:\.\d+)?)\s*(kg|g|l|ml|x)\b/i);
  if (!match) return { quantity: 1, unit: "x" };
  return { quantity: Number(match[1]), unit: match[2].toLowerCase() };
};

/**
 * Parses a Woolworths cup_price string like "$9.00 / 1KG",
 * "$1.40 / 1EA" or "$2.00 / 100g" into cost per one canonical unit
 * (g, ml or count). Returns null when the string is missing or the
 * trailing unit is unrecognised — caller falls back to absolute
 * price in that case.
 *
 * Woolworths cup_price uses only these shapes in the current
 * dataset: 1kg, 100g, 10g, 100ml, 10ml, 1l, 1ea, 100ea. The regex
 * therefore assumes a numeric quantity + a single word unit.
 */
const parseCupPricePerCanonicalUnit = (
  raw: string | null | undefined,
): number | null => {
  if (!raw) return null;
  const match = raw
    .trim()
    .toLowerCase()
    .match(/^\$(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)?\s*([a-z]+)$/);
  if (!match) return null;
  const [, dollarsStr, quantityStr, unitStr] = match;
  const dollars = Number(dollarsStr);
  const quantity = quantityStr ? Number(quantityStr) : 1;
  if (quantity <= 0) return null;

  const def = lookupUnit(unitStr);
  if (!def || def.canonical === null) return null;
  const canonicalQuantity = convert(quantity, unitStr, def.canonical);
  if (canonicalQuantity === null || canonicalQuantity <= 0) return null;
  return dollars / canonicalQuantity;
};

const loadProducts = (): RawWoolworthsProduct[] => {
  const path = join(process.cwd(), "output", "products.json");
  const raw = readFileSync(path, "utf8");
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("output/products.json must be a JSON array");
  }
  return parsed as RawWoolworthsProduct[];
};

/**
 * Index built ONCE at module load. The old resolve route re-read,
 * re-parsed, and re-indexed a 3 MB file (7,842 records) inside every
 * request handler and marked itself `force-dynamic` — on serverless
 * that is per-invocation cost. Module scope is guaranteed to run
 * once per cold start and stay live for the container's lifetime,
 * so this is the right place to keep the index.
 */
const productsByIngredient: Map<string, IndexedProduct> = (() => {
  const groups = new Map<string, IndexedProduct[]>();
  for (const raw of loadProducts()) {
    if (!raw.search_term || !raw.name || raw.price === undefined) continue;
    const packageSize = parsePackageSize(raw.package_size);
    const pricePerCanonicalUnit = parseCupPricePerCanonicalUnit(raw.cup_price);
    const entry: IndexedProduct = {
      name: raw.name,
      price: raw.price,
      cupPrice: raw.cup_price ?? null,
      packageSize: raw.package_size ?? null,
      imageUrl: raw.image_url ?? null,
      url: raw.url ?? null,
      pricePerCanonicalUnit:
        pricePerCanonicalUnit ?? Number.POSITIVE_INFINITY,
      packageQuantity: packageSize.quantity,
      packageUnit: packageSize.unit,
    };
    const key = normaliseName(raw.search_term);
    const bucket = groups.get(key) ?? [];
    bucket.push(entry);
    groups.set(key, bucket);
  }

  const winners = new Map<string, IndexedProduct>();
  for (const [key, bucket] of groups) {
    bucket.sort((a, b) => {
      const unitDiff = a.pricePerCanonicalUnit - b.pricePerCanonicalUnit;
      if (unitDiff !== 0) return unitDiff;
      return a.price - b.price;
    });
    winners.set(key, bucket[0]);
  }
  return winners;
})();

const toStoreProduct = (
  requestedName: string,
  product: IndexedProduct,
): StoreProduct => ({
  listItemName: normaliseName(requestedName),
  displayName: product.name,
  packageSize: product.packageQuantity,
  packageUnit: product.packageUnit,
  packagePrice: product.price,
  packsNeeded: 0,
  lineTotal: 0,
  imageUrl: product.imageUrl,
  productUrl: product.url,
  available: true,
});

const unavailable = (requestedName: string): StoreProduct => ({
  listItemName: normaliseName(requestedName),
  displayName: formatIngredientName(requestedName),
  packageSize: 0,
  packageUnit: "x",
  packagePrice: 0,
  packsNeeded: 0,
  lineTotal: 0,
  imageUrl: null,
  productUrl: null,
  available: false,
});

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

/**
 * Provider backed by output/products.json — 7,842 real Woolworths
 * products across 992 MealDB ingredient search terms, scraped by
 * scripts/woolworths-scraper.py.
 *
 * The dataset and the scrape are Ricky's. This port migrates the
 * resolve-route logic into a module-scope index, which is defect #1
 * from the review: the original route was `force-dynamic` and re-read
 * / re-parsed / re-indexed the entire 3 MB file inside every request
 * handler. Two remaining defects — absolute-price ranking that
 * ignores pack size, and a private parsePackageSize duplicating the
 * units module — are addressed in follow-up commits so each fix is
 * visible on its own.
 */
export const woolworthsProvider: CatalogueProvider = {
  getStores(location) {
    if (!woolworthsStore) return [];
    return [
      { ...woolworthsStore, distanceKm: distanceKm(woolworthsStore, location) },
    ];
  },

  getProducts(storeId, names) {
    const results = new Map<string, StoreProduct | null>();
    if (storeId !== STORE_ID) return results;
    for (const name of names) {
      const key = normaliseName(name);
      const product = productsByIngredient.get(key);
      results.set(key, product ? toStoreProduct(name, product) : unavailable(name));
    }
    return results;
  },
};

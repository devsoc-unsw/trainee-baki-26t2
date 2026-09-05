/**
 * Canonical measurement axes. Every alias in {@link UNIT_ALIASES} is
 * mapped onto exactly one of these; conversions between two axes are
 * only possible for `g` <-> `ml` via a density lookup.
 *
 * This module lives in src/lib/ rather than src/server/ because the
 * conversion logic is pure computation with no secrets or side
 * effects, and the client-side shopping-list merge needs it (a merge
 * that cannot compare units silently corrupts totals — see
 * ShoppingListContext). server-only is reserved for modules that
 * must not ship to the browser (pricing, errors, future DB access).
 */
export type CanonicalUnit = "g" | "ml" | "count";

/**
 * Definition attached to every unit string we recognise.
 *
 * `factor` scales the aliased unit into its canonical unit — e.g.
 * `{ canonical: "g", factor: 1000 }` means "1 kg = 1000 g". A
 * definition with `canonical: null` marks an unconvertible unit
 * ("to taste", "handful") so callers can distinguish "we don't know
 * this unit" from "this unit deliberately has no numeric meaning".
 */
export type UnitDefinition =
  | { canonical: CanonicalUnit; factor: number }
  | { canonical: null };

/**
 * Alias -> definition table. Keys are lowercase, trimmed, with any
 * trailing period stripped (see {@link normaliseUnitKey}). Both
 * singular and plural / abbreviated forms are listed explicitly
 * rather than inferred, because cooking English is full of irregulars
 * (foot -> feet, tsp -> teaspoons) and a rule-based stripper produces
 * more false matches than the extra rows below cost to maintain.
 *
 * Volume conversions use metric-Australian references throughout the
 * codebase because the store data is Sydney-based (see mockData.ts):
 * cup = 250 ml, tbsp = 20 ml, tsp = 5 ml. If TheMealDB switched to
 * US-only recipes this table would need retargeting.
 */
const UNIT_ALIASES: Record<string, UnitDefinition> = {
  // --- Weight ---
  g: { canonical: "g", factor: 1 },
  gram: { canonical: "g", factor: 1 },
  grams: { canonical: "g", factor: 1 },
  gm: { canonical: "g", factor: 1 },
  gms: { canonical: "g", factor: 1 },
  kg: { canonical: "g", factor: 1000 },
  kgs: { canonical: "g", factor: 1000 },
  kilo: { canonical: "g", factor: 1000 },
  kilos: { canonical: "g", factor: 1000 },
  kilogram: { canonical: "g", factor: 1000 },
  kilograms: { canonical: "g", factor: 1000 },
  mg: { canonical: "g", factor: 0.001 },
  milligram: { canonical: "g", factor: 0.001 },
  milligrams: { canonical: "g", factor: 0.001 },
  oz: { canonical: "g", factor: 28.3495 },
  ounce: { canonical: "g", factor: 28.3495 },
  ounces: { canonical: "g", factor: 28.3495 },
  lb: { canonical: "g", factor: 453.592 },
  lbs: { canonical: "g", factor: 453.592 },
  pound: { canonical: "g", factor: 453.592 },
  pounds: { canonical: "g", factor: 453.592 },

  // --- Volume (metric AU: tsp 5 ml, tbsp 20 ml, cup 250 ml, pint 568 ml) ---
  ml: { canonical: "ml", factor: 1 },
  milliliter: { canonical: "ml", factor: 1 },
  millilitre: { canonical: "ml", factor: 1 },
  milliliters: { canonical: "ml", factor: 1 },
  millilitres: { canonical: "ml", factor: 1 },
  cl: { canonical: "ml", factor: 10 },
  centiliter: { canonical: "ml", factor: 10 },
  centilitre: { canonical: "ml", factor: 10 },
  dl: { canonical: "ml", factor: 100 },
  deciliter: { canonical: "ml", factor: 100 },
  decilitre: { canonical: "ml", factor: 100 },
  l: { canonical: "ml", factor: 1000 },
  liter: { canonical: "ml", factor: 1000 },
  litre: { canonical: "ml", factor: 1000 },
  liters: { canonical: "ml", factor: 1000 },
  litres: { canonical: "ml", factor: 1000 },
  tsp: { canonical: "ml", factor: 5 },
  teaspoon: { canonical: "ml", factor: 5 },
  teaspoons: { canonical: "ml", factor: 5 },
  tbsp: { canonical: "ml", factor: 20 },
  tbs: { canonical: "ml", factor: 20 },
  tbl: { canonical: "ml", factor: 20 },
  tablespoon: { canonical: "ml", factor: 20 },
  tablespoons: { canonical: "ml", factor: 20 },
  c: { canonical: "ml", factor: 250 },
  cup: { canonical: "ml", factor: 250 },
  cups: { canonical: "ml", factor: 250 },
  pt: { canonical: "ml", factor: 568 },
  pint: { canonical: "ml", factor: 568 },
  pints: { canonical: "ml", factor: 568 },
  quart: { canonical: "ml", factor: 1136 },
  quarts: { canonical: "ml", factor: 1136 },
  qt: { canonical: "ml", factor: 1136 },
  gallon: { canonical: "ml", factor: 4546 },
  gallons: { canonical: "ml", factor: 4546 },
  gal: { canonical: "ml", factor: 4546 },
  "fl oz": { canonical: "ml", factor: 28.4131 },
  "fluid ounce": { canonical: "ml", factor: 28.4131 },
  "fluid ounces": { canonical: "ml", factor: 28.4131 },

  // --- Count ---
  "": { canonical: "count", factor: 1 },
  x: { canonical: "count", factor: 1 },
  count: { canonical: "count", factor: 1 },
  each: { canonical: "count", factor: 1 },
  ea: { canonical: "count", factor: 1 },
  pc: { canonical: "count", factor: 1 },
  pcs: { canonical: "count", factor: 1 },
  piece: { canonical: "count", factor: 1 },
  pieces: { canonical: "count", factor: 1 },
  unit: { canonical: "count", factor: 1 },
  units: { canonical: "count", factor: 1 },
  clove: { canonical: "count", factor: 1 },
  cloves: { canonical: "count", factor: 1 },
  slice: { canonical: "count", factor: 1 },
  slices: { canonical: "count", factor: 1 },

  // --- Small kitchen quantities approximated to weight/volume ---
  // A pinch is idiomatically ~1/16 tsp of a dry seasoning. At the density
  // of table salt (~1.2 g/ml) that is ~0.36 g; we round to 0.36 for salt-
  // like ingredients and accept the error for anything else, since a
  // pinch on a shopping list is a rounding artefact regardless.
  pinch: { canonical: "g", factor: 0.36 },
  pinches: { canonical: "g", factor: 0.36 },
  // A dash is ~1/8 tsp of a liquid seasoning; 0.625 ml.
  dash: { canonical: "ml", factor: 0.625 },
  dashes: { canonical: "ml", factor: 0.625 },

  // --- Explicitly unconvertible ---
  // These are recipe hedges, not measurements. Returning null from
  // convert() rather than throwing lets callers keep the ingredient on
  // the shopping list as free text.
  "to taste": { canonical: null },
  handful: { canonical: null },
  handfuls: { canonical: null },
  splash: { canonical: null },
  splashes: { canonical: null },
  some: { canonical: null },
};

/**
 * Densities in **grams per millilitre** for the ingredients most
 * likely to appear in a recipe measured by volume. Sources are the
 * standard cooking references (King Arthur baker's tables, USDA
 * FoodData Central); numbers are rounded and should be treated as
 * approximations — real densities vary with brand, packing, moisture
 * content, and whether flour is sifted. If a caller needs precision
 * (nutrition tracking, pharmaceutical dosing) this table is the wrong
 * tool.
 *
 * Keys are matched against the ingredient name with the longest key
 * winning (so "vegetable oil" beats the generic "oil" for that
 * ingredient), see {@link getDensity}. Unknown ingredients fall back
 * to {@link FALLBACK_DENSITY} — see the constant's comment for why.
 */
const DENSITY_G_PER_ML: Record<string, number> = {
  water: 1.0, // reference; SI definition
  milk: 1.03, // whole milk; skim is closer to 1.035
  cream: 1.01, // pouring / single cream; heavy cream ~ 0.994
  yogurt: 1.03,
  yoghurt: 1.03,
  oil: 0.918, // generic; olive/canola/sunflower are all within 0.91-0.93
  "olive oil": 0.918,
  "vegetable oil": 0.918,
  "canola oil": 0.915,
  "sunflower oil": 0.919,
  "sesame oil": 0.921,
  butter: 0.911, // solid, unmelted; melted is essentially identical
  flour: 0.53, // plain / all-purpose, sifted; unsifted packs closer to 0.6
  "plain flour": 0.53,
  "all-purpose flour": 0.53,
  "bread flour": 0.55,
  "self-raising flour": 0.53,
  "wholemeal flour": 0.55,
  sugar: 0.85, // white granulated
  "granulated sugar": 0.85,
  "white sugar": 0.85,
  "caster sugar": 0.85,
  "brown sugar": 0.93, // packed; loose is ~ 0.82
  "icing sugar": 0.56, // powdered / confectioners
  honey: 1.42,
  syrup: 1.33, // maple / golden syrup; corn syrup ~ 1.38
  salt: 1.2, // table salt
  rice: 0.85, // uncooked long-grain
  oats: 0.41, // rolled oats
};

/**
 * Density used when the ingredient is unknown or unspecified. Water
 * is the closest approximation to milk, stock, juice, wine and most
 * other liquid recipe ingredients, all of which cluster around
 * 1 g/ml. It over-estimates weight for oil-heavy or aerated
 * ingredients but under-estimates for syrups; treating unknowns as
 * water is a documented compromise, not an oversight.
 */
const FALLBACK_DENSITY = 1.0;

const stripTrailingPeriods = (value: string): string =>
  value.replace(/\.+$/, "");

const normaliseUnitKey = (unit: string): string =>
  stripTrailingPeriods(unit.trim().toLowerCase()).replace(/\s+/g, " ");

const normaliseIngredientKey = (name: string): string =>
  name.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Density keys sorted longest-first so `getDensity("vegetable oil")`
 * matches the specific entry before the generic "oil" substring.
 */
const DENSITY_KEYS_LONGEST_FIRST = Object.keys(DENSITY_G_PER_ML).sort(
  (a, b) => b.length - a.length,
);

/**
 * Resolves an ingredient name to a density in g/ml.
 *
 * @param ingredientName - Free-text ingredient name from the recipe.
 *   Undefined or blank is treated as "unknown" and returns the
 *   fallback density.
 * @returns g/ml — never null, so `convert` can always attempt a
 *   volume<->weight conversion once both units are recognised.
 *
 * Matching is case-insensitive substring: "Vegetable Oil (extra
 * virgin)" resolves to the "vegetable oil" density. Longest key wins
 * to prevent "olive oil" from being shadowed by the shorter "oil".
 */
export function getDensity(ingredientName?: string): number {
  if (!ingredientName) return FALLBACK_DENSITY;

  const key = normaliseIngredientKey(ingredientName);
  if (!key) return FALLBACK_DENSITY;

  const direct = DENSITY_G_PER_ML[key];
  if (direct !== undefined) return direct;

  for (const candidate of DENSITY_KEYS_LONGEST_FIRST) {
    if (key.includes(candidate)) return DENSITY_G_PER_ML[candidate];
  }
  return FALLBACK_DENSITY;
}

/**
 * Looks a unit string up in the alias table.
 *
 * @param unit - Free-text unit string (e.g. "TBSP.", "  cup ", "kg").
 * @returns The matching {@link UnitDefinition}, or undefined when the
 *   unit is not recognised at all. A recognised-but-unconvertible
 *   unit (like "to taste") returns a definition with
 *   `canonical: null`.
 */
export function lookupUnit(unit: string): UnitDefinition | undefined {
  return UNIT_ALIASES[normaliseUnitKey(unit)];
}

/**
 * Converts a quantity between units, using ingredient density when a
 * volume<->weight crossover is required.
 *
 * @param quantity - Numeric amount in `fromUnit`.
 * @param fromUnit - Source unit (any alias in {@link UNIT_ALIASES}).
 * @param toUnit - Target unit (any alias in {@link UNIT_ALIASES}).
 * @param ingredientName - Optional ingredient name; used to pick a
 *   density from {@link DENSITY_G_PER_ML} when converting between
 *   weight and volume. Falls back to water density if omitted or
 *   unrecognised.
 * @returns Converted quantity, or `null` when the conversion is
 *   genuinely impossible: an unrecognised unit on either side, an
 *   explicitly unconvertible unit ("to taste"), or a `count` crossed
 *   with `g`/`ml` (we do not know the mass of one clove of an
 *   arbitrary ingredient).
 *
 * The function is total for the recognised-unit subset: two
 * recognised same-axis units always convert, and recognised
 * cross-axis g/ml conversions always succeed (worst case they use the
 * fallback density).
 */
export function convert(
  quantity: number,
  fromUnit: string,
  toUnit: string,
  ingredientName?: string,
): number | null {
  const from = lookupUnit(fromUnit);
  const to = lookupUnit(toUnit);
  if (!from || !to) return null;
  if (from.canonical === null || to.canonical === null) return null;

  const inFromCanonical = quantity * from.factor;

  if (from.canonical === to.canonical) {
    return inFromCanonical / to.factor;
  }

  // Count is uncrossable with mass/volume — we do not know how heavy
  // "one" of an arbitrary ingredient is, and guessing would silently
  // misprice a shopping list.
  if (from.canonical === "count" || to.canonical === "count") {
    return null;
  }

  const density = getDensity(ingredientName);
  const inMl =
    from.canonical === "ml" ? inFromCanonical : inFromCanonical / density;
  const inTargetCanonical = to.canonical === "ml" ? inMl : inMl * density;
  return inTargetCanonical / to.factor;
}

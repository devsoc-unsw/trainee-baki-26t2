/**
 * Parses a TheMealDB measure string like "1 tablespoon", "200g",
 * "1/2 cup", or "1 1/2 tsp" into a numeric quantity and free-text unit.
 *
 * @param measure - Raw measure string from TheMealDB (may be blank).
 * @returns quantity: parsed number, or null when the string does not
 *   start with a plain numeric amount. unit: everything after the
 *   numeric part, trimmed; when no number is present, the original
 *   trimmed text becomes the unit so it can still be shown to the
 *   user (e.g. "to taste").
 *
 * Ambiguous inputs (ranges like "2-3", non-ASCII fractions, "a pinch")
 * return quantity: null rather than guess — a wrong number would flow
 * into unit conversion downstream and misprice a shopping list.
 *
 * Pure function; kept in src/lib/ so it can be reused from both the
 * server-side meal-mapping in src/server/meals.ts and any client-side
 * code that ever needs to parse a raw measure locally.
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

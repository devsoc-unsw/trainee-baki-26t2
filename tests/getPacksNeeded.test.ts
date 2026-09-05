import { describe, expect, it } from "vitest";
import { getPacksNeeded } from "@/server/pricing";
import type { GroceryItem, StoreProduct } from "@/types";

// Post-rewrite assertions. The characterisation tests captured the
// old kg/L-only behaviour; these are the versions that survive
// swapping normaliseAmount out for convert(). The previously-null
// cases (mg vs g, cup vs g, tbsp vs g) now return actual pack
// counts, which is the whole point of the rewrite.

const item = (
  name: string,
  quantity: number,
  unit: string,
): GroceryItem => ({
  id: 1,
  name,
  quantity,
  unit,
});

const product = (packageSize: number, packageUnit: string): StoreProduct => ({
  listItemName: "flour",
  displayName: "Flour",
  packageSize,
  packageUnit,
  packagePrice: 3,
  packsNeeded: 0,
  lineTotal: 0,
  imageUrl: null,
  available: true,
});

describe("getPacksNeeded (post-rewrite)", () => {
  it("rounds up when the request exceeds one pack of the same unit", () => {
    expect(getPacksNeeded(item("flour", 1500, "g"), product(1000, "g"))).toBe(
      2,
    );
  });

  it("returns 1 pack when the request fits in a single pack", () => {
    expect(getPacksNeeded(item("flour", 200, "g"), product(1000, "g"))).toBe(
      1,
    );
  });

  it("converts kg on either side to g before dividing", () => {
    expect(getPacksNeeded(item("flour", 2, "kg"), product(1000, "g"))).toBe(2);
    expect(getPacksNeeded(item("flour", 500, "g"), product(1, "kg"))).toBe(1);
  });

  it("converts L on either side to ml before dividing", () => {
    expect(getPacksNeeded(item("milk", 2, "L"), product(500, "ml"))).toBe(4);
  });

  it("now handles mg vs g via the unit table", () => {
    // 500 mg = 0.5 g, fits in one 1000 g pack.
    expect(getPacksNeeded(item("salt", 500, "mg"), product(1000, "g"))).toBe(
      1,
    );
  });

  it("now converts cup of flour to grams using density", () => {
    // 1 cup = 250 ml; flour density 0.53 g/ml -> 132.5 g -> 1 pack of 1000 g.
    expect(getPacksNeeded(item("flour", 1, "cup"), product(1000, "g"))).toBe(
      1,
    );
    // 10 cups of flour = 1325 g -> 2 packs of 1000 g.
    expect(getPacksNeeded(item("flour", 10, "cup"), product(1000, "g"))).toBe(
      2,
    );
  });

  it("now converts tbsp of oil to ml", () => {
    // 30 tbsp = 600 ml -> 2 packs of 500 ml.
    expect(getPacksNeeded(item("olive oil", 30, "tbsp"), product(500, "ml"))).toBe(
      2,
    );
  });

  it("returns null when the package size is zero", () => {
    expect(getPacksNeeded(item("flour", 100, "g"), product(0, "g"))).toBeNull();
  });

  it("returns null for a truly incompatible axis (count vs weight)", () => {
    expect(getPacksNeeded(item("garlic", 3, "clove"), product(500, "g"))).toBeNull();
  });

  it("returns null for an unrecognised unit", () => {
    expect(
      getPacksNeeded(item("mystery", 1, "wibble"), product(500, "g")),
    ).toBeNull();
  });
});

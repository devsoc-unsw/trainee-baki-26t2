import { describe, expect, it } from "vitest";
import { mergeShoppingItems } from "@/context/ShoppingListContext";
import type { GroceryItem, Ingredient } from "@/types";

// Characterisation tests: these lock in what mergeShoppingItems does
// today so the rewrite in step 6 is visible in the diff. The current
// implementation compares only by name; when it finds a match it adds
// the quantities together WITHOUT looking at the units. That is how
// 200 g of butter + 2 cups of butter becomes "202 g" of butter. The
// tests below assert that broken behaviour intentionally; step 6
// updates them to reflect the fix (convert first; keep as separate
// entries when conversion is impossible).

const makeIdSource = (start: number) => {
  let current = start;
  return () => {
    const id = current;
    current += 1;
    return id;
  };
};

const existing: GroceryItem[] = [
  { id: 1, name: "butter", quantity: 200, unit: "g" },
  { id: 2, name: "milk", quantity: 500, unit: "ml" },
];

describe("mergeShoppingItems (current behaviour)", () => {
  it("adds a new ingredient with a fresh id when it does not match by name", () => {
    const additions: Ingredient[] = [
      { name: "flour", quantity: 300, unit: "g" },
    ];
    const merged = mergeShoppingItems(existing, additions, makeIdSource(10));
    expect(merged).toHaveLength(3);
    expect(merged[2]).toEqual({
      id: 10,
      name: "flour",
      quantity: 300,
      unit: "g",
    });
  });

  it("sums quantities when the ingredient name already exists (same unit)", () => {
    const additions: Ingredient[] = [
      { name: "butter", quantity: 50, unit: "g" },
    ];
    const merged = mergeShoppingItems(existing, additions, makeIdSource(10));
    expect(merged).toHaveLength(2);
    expect(merged[0]).toEqual({
      id: 1,
      name: "butter",
      quantity: 250,
      unit: "g",
    });
  });

  it("silently adds numbers across mismatched units — the bug we will fix", () => {
    const additions: Ingredient[] = [
      { name: "butter", quantity: 2, unit: "cup" },
    ];
    const merged = mergeShoppingItems(existing, additions, makeIdSource(10));
    expect(merged).toHaveLength(2);
    expect(merged[0]).toEqual({
      id: 1,
      name: "butter",
      quantity: 202,
      unit: "g",
    });
  });

  it("skips new items whose quantity is null (unparsed measure)", () => {
    const additions: Ingredient[] = [
      { name: "salt", quantity: null, unit: "to taste" },
    ];
    const merged = mergeShoppingItems(existing, additions, makeIdSource(10));
    expect(merged).toHaveLength(2);
  });

  it("normalises names when matching so 'Butter' merges with 'butter'", () => {
    const additions: Ingredient[] = [
      { name: "Butter", quantity: 100, unit: "g" },
    ];
    const merged = mergeShoppingItems(existing, additions, makeIdSource(10));
    expect(merged).toHaveLength(2);
    expect(merged[0].quantity).toBe(300);
  });

  it("processes multiple new items in a single call", () => {
    const additions: Ingredient[] = [
      { name: "butter", quantity: 25, unit: "g" },
      { name: "sugar", quantity: 100, unit: "g" },
    ];
    const merged = mergeShoppingItems(existing, additions, makeIdSource(10));
    expect(merged).toHaveLength(3);
    expect(merged[0].quantity).toBe(225);
    expect(merged[2]).toEqual({
      id: 10,
      name: "sugar",
      quantity: 100,
      unit: "g",
    });
  });
});

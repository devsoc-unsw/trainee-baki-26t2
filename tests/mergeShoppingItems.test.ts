import { describe, expect, it } from "vitest";
import { mergeShoppingItems } from "@/context/ShoppingListContext";
import type { GroceryItem, Ingredient } from "@/types";

// Post-rewrite assertions. The characterisation-test version of this
// file asserted the "202 g" bug intentionally; that assertion has
// been flipped to reflect the corrected behaviour. When the new
// ingredient's unit converts to the existing unit, the quantity is
// added AFTER conversion. When it does not convert (count vs weight,
// unknown unit), the new ingredient becomes a separate line entry
// rather than corrupting the running total.

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
  { id: 3, name: "garlic", quantity: 500, unit: "g" },
];

describe("mergeShoppingItems (post-rewrite)", () => {
  it("adds a new ingredient with a fresh id when it does not match by name", () => {
    const additions: Ingredient[] = [
      { name: "flour", quantity: 300, unit: "g" },
    ];
    const merged = mergeShoppingItems(existing, additions, makeIdSource(10));
    expect(merged).toHaveLength(4);
    expect(merged[3]).toEqual({
      id: 10,
      name: "flour",
      quantity: 300,
      unit: "g",
    });
  });

  it("sums quantities when the ingredient name and unit match", () => {
    const additions: Ingredient[] = [
      { name: "butter", quantity: 50, unit: "g" },
    ];
    const merged = mergeShoppingItems(existing, additions, makeIdSource(10));
    expect(merged).toHaveLength(3);
    expect(merged[0]).toEqual({
      id: 1,
      name: "butter",
      quantity: 250,
      unit: "g",
    });
  });

  it("converts compatible units before adding (kg into g)", () => {
    const additions: Ingredient[] = [
      { name: "butter", quantity: 1, unit: "kg" },
    ];
    const merged = mergeShoppingItems(existing, additions, makeIdSource(10));
    expect(merged[0]).toEqual({
      id: 1,
      name: "butter",
      quantity: 1200,
      unit: "g",
    });
  });

  it("converts volume to weight via density for butter (2 cups -> ~455 g)", () => {
    const additions: Ingredient[] = [
      { name: "butter", quantity: 2, unit: "cup" },
    ];
    const merged = mergeShoppingItems(existing, additions, makeIdSource(10));
    // 2 cups = 500 ml, butter density 0.911 g/ml -> 455.5 g, plus 200.
    expect(merged).toHaveLength(3);
    expect(merged[0].unit).toBe("g");
    expect(merged[0].quantity).toBeCloseTo(200 + 500 * 0.911, 2);
  });

  it("keeps the item as a separate line when units cannot convert", () => {
    const additions: Ingredient[] = [
      { name: "garlic", quantity: 3, unit: "clove" },
    ];
    const merged = mergeShoppingItems(existing, additions, makeIdSource(10));
    expect(merged).toHaveLength(4);
    // Original garlic entry stays untouched.
    expect(merged[2]).toEqual({
      id: 3,
      name: "garlic",
      quantity: 500,
      unit: "g",
    });
    // New entry appended with its own unit.
    expect(merged[3]).toEqual({
      id: 10,
      name: "garlic",
      quantity: 3,
      unit: "clove",
    });
  });

  it("skips new items whose quantity is null (unparsed measure)", () => {
    const additions: Ingredient[] = [
      { name: "salt", quantity: null, unit: "to taste" },
    ];
    const merged = mergeShoppingItems(existing, additions, makeIdSource(10));
    expect(merged).toHaveLength(3);
  });

  it("normalises names when matching so 'Butter' merges with 'butter'", () => {
    const additions: Ingredient[] = [
      { name: "Butter", quantity: 100, unit: "g" },
    ];
    const merged = mergeShoppingItems(existing, additions, makeIdSource(10));
    expect(merged).toHaveLength(3);
    expect(merged[0].quantity).toBe(300);
  });
});

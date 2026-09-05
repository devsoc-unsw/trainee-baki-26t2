import { describe, expect, it } from "vitest";
import { getPacksNeeded } from "@/lib/api";
import type { GroceryItem, StoreProduct } from "@/types";

// Characterisation tests: these lock in the CURRENT behaviour of
// getPacksNeeded, including the wrong bits. The upstream helper
// normaliseAmount only handles kg -> g and L -> ml, and getPacksNeeded
// requires the shopper's unit and the package unit to match exactly
// after that pass. Anything else — mg vs g, tbsp vs g, cup vs ml —
// returns null, which the compare page renders as "Not available".
// The rewrite in src/server/units.ts + the new getPacksNeeded will
// close these gaps; the assertions below will flip in step 5.

const item = (quantity: number, unit: string): GroceryItem => ({
  id: 1,
  name: "flour",
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

describe("getPacksNeeded (current behaviour)", () => {
  it("rounds up when the request exceeds one pack of the same unit", () => {
    expect(getPacksNeeded(item(1500, "g"), product(1000, "g"))).toBe(2);
  });

  it("returns 1 pack when the request fits in a single pack", () => {
    expect(getPacksNeeded(item(200, "g"), product(1000, "g"))).toBe(1);
  });

  it("converts kg on either side to g before dividing", () => {
    expect(getPacksNeeded(item(2, "kg"), product(1000, "g"))).toBe(2);
    expect(getPacksNeeded(item(500, "g"), product(1, "kg"))).toBe(1);
  });

  it("converts L on either side to ml before dividing", () => {
    expect(getPacksNeeded(item(2, "L"), product(500, "ml"))).toBe(4);
  });

  it("returns null for mg vs g — known gap, no mg support today", () => {
    expect(getPacksNeeded(item(500, "mg"), product(1000, "g"))).toBeNull();
  });

  it("returns null for tbsp vs g — known gap, volume-to-weight unsupported", () => {
    expect(getPacksNeeded(item(2, "tbsp"), product(500, "g"))).toBeNull();
  });

  it("returns null for cup vs ml — known gap, cup is free text today", () => {
    expect(getPacksNeeded(item(1, "cup"), product(1000, "ml"))).toBeNull();
  });

  it("returns null when the package size is zero", () => {
    expect(getPacksNeeded(item(100, "g"), product(0, "g"))).toBeNull();
  });

  it("returns null when units are simply different strings", () => {
    expect(getPacksNeeded(item(3, "x"), product(1, "g"))).toBeNull();
  });
});

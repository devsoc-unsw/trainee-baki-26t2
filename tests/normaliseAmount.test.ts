import { describe, expect, it } from "vitest";
import { normaliseAmount } from "@/lib/api";

// Characterisation tests: these lock in the CURRENT behaviour of
// normaliseAmount so the upcoming rewrite (src/server/units.ts) shows
// up as a visible diff. The function today only recognises kg and L;
// everything else — including obviously convertible units like mg,
// tbsp, cup — passes through untouched. Callers rely on the returned
// unit matching between the shopper's request and the store's package,
// which is why unrecognised units silently cause getPacksNeeded to
// bail with null downstream.

describe("normaliseAmount (current behaviour)", () => {
  it("converts kg to g", () => {
    expect(normaliseAmount(1.5, "kg")).toEqual({ quantity: 1500, unit: "g" });
  });

  it("converts L to ml", () => {
    expect(normaliseAmount(2, "L")).toEqual({ quantity: 2000, unit: "ml" });
  });

  it("normalises the unit to lowercase without conversion for g", () => {
    expect(normaliseAmount(250, "G")).toEqual({ quantity: 250, unit: "g" });
  });

  it("normalises the unit to lowercase without conversion for ml", () => {
    expect(normaliseAmount(500, "ML")).toEqual({ quantity: 500, unit: "ml" });
  });

  it("does not touch mg — a known bug we will fix in the rewrite", () => {
    expect(normaliseAmount(500, "mg")).toEqual({ quantity: 500, unit: "mg" });
  });

  it("does not touch cup — free text passes through unconverted", () => {
    expect(normaliseAmount(1, "cup")).toEqual({ quantity: 1, unit: "cup" });
  });

  it("does not touch tbsp — free text passes through unconverted", () => {
    expect(normaliseAmount(2, "tbsp")).toEqual({ quantity: 2, unit: "tbsp" });
  });

  it("trims whitespace off the unit", () => {
    expect(normaliseAmount(1, "  kg  ")).toEqual({ quantity: 1000, unit: "g" });
  });

  it("handles an empty unit by returning it as-is", () => {
    expect(normaliseAmount(3, "")).toEqual({ quantity: 3, unit: "" });
  });
});

import { describe, expect, it } from "vitest";
import { convert, getDensity, lookupUnit } from "@/lib/units";

describe("lookupUnit", () => {
  it("resolves plurals to the same definition as the singular", () => {
    expect(lookupUnit("cup")).toEqual(lookupUnit("cups"));
    expect(lookupUnit("teaspoon")).toEqual(lookupUnit("teaspoons"));
    expect(lookupUnit("clove")).toEqual(lookupUnit("cloves"));
  });

  it("ignores case, whitespace and trailing periods", () => {
    expect(lookupUnit("  TBSP.  ")).toEqual(lookupUnit("tbsp"));
    expect(lookupUnit("KG")).toEqual(lookupUnit("kg"));
  });

  it("returns undefined for unknown units", () => {
    expect(lookupUnit("wibble")).toBeUndefined();
  });

  it("returns a null-canonical definition for 'to taste'", () => {
    expect(lookupUnit("to taste")).toEqual({ canonical: null });
  });

  it("treats an empty unit as count", () => {
    expect(lookupUnit("")).toEqual({ canonical: "count", factor: 1 });
  });
});

describe("getDensity", () => {
  it("falls back to 1.0 (water) when the ingredient is unknown", () => {
    expect(getDensity("quokka jerky")).toBe(1);
    expect(getDensity()).toBe(1);
    expect(getDensity("")).toBe(1);
  });

  it("returns the specific density for a known ingredient", () => {
    expect(getDensity("flour")).toBeCloseTo(0.53, 3);
    expect(getDensity("butter")).toBeCloseTo(0.911, 3);
    expect(getDensity("honey")).toBeCloseTo(1.42, 3);
  });

  it("prefers the longest matching key over the shorter one", () => {
    // "olive oil" should NOT be shadowed by the generic "oil" entry.
    expect(getDensity("Extra virgin olive oil")).toBe(
      getDensity("olive oil"),
    );
  });
});

describe("convert (same-axis)", () => {
  it("scales kg -> g", () => {
    expect(convert(1.5, "kg", "g")).toBe(1500);
  });

  it("scales mg -> g", () => {
    expect(convert(500, "mg", "g")).toBeCloseTo(0.5, 6);
  });

  it("scales oz -> g", () => {
    expect(convert(1, "oz", "g")).toBeCloseTo(28.3495, 3);
  });

  it("scales lb -> kg", () => {
    expect(convert(1, "lb", "kg")).toBeCloseTo(0.453592, 4);
  });

  it("scales L -> ml", () => {
    expect(convert(2, "L", "ml")).toBe(2000);
  });

  it("scales tsp/tbsp/cup to ml using metric-AU references", () => {
    expect(convert(1, "tsp", "ml")).toBe(5);
    expect(convert(1, "tbsp", "ml")).toBe(20);
    expect(convert(1, "cup", "ml")).toBe(250);
  });
});

describe("convert (cross-axis, density-driven)", () => {
  it("converts 1 cup of flour to grams", () => {
    // 250 ml * 0.53 g/ml = 132.5 g
    expect(convert(1, "cup", "g", "flour")).toBeCloseTo(132.5, 2);
  });

  it("converts 1 cup of milk to grams using milk density", () => {
    // 250 ml * 1.03 g/ml = 257.5 g
    expect(convert(1, "cup", "g", "milk")).toBeCloseTo(257.5, 2);
  });

  it("converts 200 g of butter back to ml", () => {
    // 200 g / 0.911 g/ml
    expect(convert(200, "g", "ml", "butter")).toBeCloseTo(200 / 0.911, 2);
  });

  it("uses the water fallback density when the ingredient is unknown", () => {
    expect(convert(500, "ml", "g", "unknown-thing")).toBeCloseTo(500, 2);
    expect(convert(500, "ml", "g")).toBeCloseTo(500, 2);
  });
});

describe("convert (impossible)", () => {
  it("returns null for unrecognised units", () => {
    expect(convert(1, "wibble", "g")).toBeNull();
    expect(convert(1, "g", "wibble")).toBeNull();
  });

  it("returns null for 'to taste' on either side", () => {
    expect(convert(1, "to taste", "g")).toBeNull();
    expect(convert(1, "g", "to taste")).toBeNull();
  });

  it("returns null when count crosses g or ml", () => {
    expect(convert(3, "clove", "g", "garlic")).toBeNull();
    expect(convert(2, "slice", "ml", "bread")).toBeNull();
    expect(convert(200, "g", "clove", "garlic")).toBeNull();
  });

  it("still converts count -> count", () => {
    expect(convert(3, "clove", "x")).toBe(3);
  });
});

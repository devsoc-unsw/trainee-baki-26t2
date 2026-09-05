import { describe, expect, it } from "vitest";
import { normaliseAmount, parseMeasure } from "@/lib/api";

describe("parseMeasure", () => {
  it("parses a simple integer with unit", () => {
    expect(parseMeasure("1 tablespoon")).toEqual({
      quantity: 1,
      unit: "tablespoon",
    });
  });

  it("parses a number glued to its unit", () => {
    expect(parseMeasure("200g")).toEqual({ quantity: 200, unit: "g" });
  });

  it("parses a decimal", () => {
    expect(parseMeasure("1.5 cups")).toEqual({
      quantity: 1.5,
      unit: "cups",
    });
  });

  it("parses a bare fraction", () => {
    expect(parseMeasure("1/2 cup")).toEqual({
      quantity: 0.5,
      unit: "cup",
    });
  });

  it("parses a mixed number", () => {
    expect(parseMeasure("1 1/2 tsp")).toEqual({
      quantity: 1.5,
      unit: "tsp",
    });
  });

  it("returns quantity null for a blank string", () => {
    expect(parseMeasure("")).toEqual({ quantity: null, unit: "" });
  });

  it("returns quantity null for a non-numeric measure and preserves text", () => {
    expect(parseMeasure("to taste")).toEqual({
      quantity: null,
      unit: "to taste",
    });
  });

  it("returns quantity null for an ambiguous range", () => {
    expect(parseMeasure("2-3 cloves")).toEqual({
      quantity: null,
      unit: "2-3 cloves",
    });
  });

  it("returns quantity null for non-ASCII fractions", () => {
    expect(parseMeasure("½ cup")).toEqual({
      quantity: null,
      unit: "½ cup",
    });
  });

  it("handles a bare number with no unit", () => {
    expect(parseMeasure("3")).toEqual({ quantity: 3, unit: "" });
  });
});

describe("normaliseAmount", () => {
  it("converts an Australian half cup to millilitres", () => {
    expect(normaliseAmount(0.5, "cup")).toEqual({
      quantity: 125,
      unit: "ml",
    });
  });

  it("converts tablespoons and litres to millilitres", () => {
    expect(normaliseAmount(2, "tablespoons")).toEqual({
      quantity: 40,
      unit: "ml",
    });
    expect(normaliseAmount(1, "l")).toEqual({
      quantity: 1000,
      unit: "ml",
    });
  });

  it("treats onions and blank measures as countable items", () => {
    expect(normaliseAmount(2, "")).toEqual({ quantity: 2, unit: "x" });
    expect(normaliseAmount(2, "large onions")).toEqual({
      quantity: 2,
      unit: "x",
    });
    expect(normaliseAmount(2, "chopped onions")).toEqual({
      quantity: 2,
      unit: "x",
    });
  });
});

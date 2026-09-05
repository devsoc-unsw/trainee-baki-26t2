import { describe, expect, it } from "vitest";
import { deriveMealTags } from "@/lib/mealHeuristics";

describe("deriveMealTags", () => {
  it("tags a fully-vegan meal made of recognised ingredients", () => {
    const { dietaryTags } = deriveMealTags([
      { name: "rice", measure: "1 cup" },
      { name: "tomato", measure: "2" },
      { name: "olive oil", measure: "1 tbsp" },
    ]);
    expect(dietaryTags).toContain("vegan");
    expect(dietaryTags).toContain("vegetarian");
    expect(dietaryTags).toContain("halal");
    expect(dietaryTags).not.toContain("nut-allergy");
  });

  it("does NOT tag a meal as vegan when an ingredient is unrecognised", () => {
    const { dietaryTags } = deriveMealTags([
      { name: "rice", measure: "1 cup" },
      { name: "quokka jerky", measure: "50g" },
    ]);
    expect(dietaryTags).not.toContain("vegan");
    expect(dietaryTags).not.toContain("vegetarian");
    expect(dietaryTags).not.toContain("halal");
  });

  it("excludes vegan/vegetarian when meat is present but keeps halal off too", () => {
    const { dietaryTags } = deriveMealTags([
      { name: "chicken breast", measure: "500g" },
      { name: "rice", measure: "1 cup" },
    ]);
    expect(dietaryTags).not.toContain("vegan");
    expect(dietaryTags).not.toContain("vegetarian");
    expect(dietaryTags).toContain("halal");
  });

  it("blocks halal when pork or alcohol is present", () => {
    const pork = deriveMealTags([
      { name: "bacon", measure: "100g" },
      { name: "flour", measure: "200g" },
    ]);
    expect(pork.dietaryTags).not.toContain("halal");

    const wine = deriveMealTags([
      { name: "wine", measure: "1 cup" },
      { name: "onion", measure: "1" },
    ]);
    expect(wine.dietaryTags).not.toContain("halal");
  });

  it("adds nut-allergy tag when any nut ingredient is present", () => {
    const { dietaryTags } = deriveMealTags([
      { name: "flour", measure: "200g" },
      { name: "almonds", measure: "50g" },
    ]);
    expect(dietaryTags).toContain("nut-allergy");
  });

  it("does not falsely match 'chicken' inside 'chickpea' or 'egg' inside 'eggplant'", () => {
    const { dietaryTags } = deriveMealTags([
      { name: "chickpea", measure: "400g" },
      { name: "eggplant", measure: "1" },
      { name: "olive oil", measure: "1 tbsp" },
    ]);
    expect(dietaryTags).toContain("vegan");
    expect(dietaryTags).toContain("vegetarian");
  });

  it("flags high-protein when a protein source is present", () => {
    const { isHighProtein } = deriveMealTags([
      { name: "chicken", measure: "500g" },
      { name: "rice", measure: "1 cup" },
    ]);
    expect(isHighProtein).toBe(true);
  });

  it("does not flag high-protein without a protein source", () => {
    const { isHighProtein } = deriveMealTags([
      { name: "tomato", measure: "2" },
      { name: "olive oil", measure: "1 tbsp" },
    ]);
    expect(isHighProtein).toBe(false);
  });

  it("marks a short recipe as quickMeal", () => {
    const { isQuickMeal } = deriveMealTags([
      { name: "rice", measure: "1 cup" },
      { name: "butter", measure: "20g" },
    ]);
    expect(isQuickMeal).toBe(true);
  });

  it("does not mark a long recipe as quickMeal", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      name: `ingredient ${i}`,
      measure: "1",
    }));
    expect(deriveMealTags(many).isQuickMeal).toBe(false);
  });

  it("returns empty dietary tags for an empty ingredient list", () => {
    const { dietaryTags, isQuickMeal, isHighProtein } = deriveMealTags([]);
    expect(dietaryTags).toEqual([]);
    expect(isQuickMeal).toBe(false);
    expect(isHighProtein).toBe(false);
  });
});

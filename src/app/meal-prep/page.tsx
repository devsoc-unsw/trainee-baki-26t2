"use client";

import { useState } from "react";
import Header from "../../../components/Header";

type Meal = {
  description: string;
  attribution: string;
};

type DietaryRestriction = "Vegan" | "Vegetarian" | "Halal" | "Nut allergy";

const meals: Record<string, Meal> = {
  "japanese fluffy cheesecake": {
    description: "A light and fluffy cake for all your baking desires",
    attribution: "Recipe from: Wow Ricky is so good at baking",
  },
  "spaghetti bolognese": {
    description: "A rich tomato and beef pasta made for an easy dinner",
    attribution: "Recipe from: The LetHim Cook kitchen",
  },
  "vegetable curry": {
    description: "A warm and comforting curry packed with colourful vegetables",
    attribution: "Recipe from: The LetHim Cook kitchen",
  },
  "chicken teriyaki": {
    description: "Sweet and savoury glazed chicken served with steamed rice",
    attribution: "Recipe from: The LetHim Cook kitchen",
  },
};

const dietaryOptions: DietaryRestriction[] = [
  "Vegan",
  "Vegetarian",
  "Halal",
  "Nut allergy",
];

const normaliseMealName = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLowerCase();

export default function MealPrepPage() {
  const [mealInput, setMealInput] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<
    DietaryRestriction[]
  >([]);

  const normalisedInput = normaliseMealName(mealInput);
  const selectedMeal = meals[normalisedInput];

  const toggleRestriction = (restriction: DietaryRestriction) => {
    setDietaryRestrictions((currentRestrictions) =>
      currentRestrictions.includes(restriction)
        ? currentRestrictions.filter((item) => item !== restriction)
        : [...currentRestrictions, restriction],
    );
  };

  return (
    <>
      <Header />
      <main className="bg-white p-6 sm:p-8">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-10 lg:grid-cols-2">
          <section>
            <h1 className="font-island-moments text-3xl text-black">
              I want to prepare
            </h1>
            <input
              type="text"
              value={mealInput}
              onChange={(event) => setMealInput(event.target.value)}
              placeholder="Enter Meal Here"
              aria-label="Meal name"
              className="mt-3 w-full max-w-87.5 rounded-lg border border-black/20 bg-white px-4 py-3 font-indie-flower text-xl text-black outline-none placeholder:text-black/50 focus:ring-2 focus:ring-[#FFC518]"
            />

            <h2 className="mt-8 font-island-moments text-3xl text-black">
              Dietary Restrictions
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {dietaryOptions.map((restriction) => (
                <label
                  key={restriction}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-black/20 bg-white p-4 font-indie-flower text-xl text-black"
                >
                  <input
                    type="checkbox"
                    checked={dietaryRestrictions.includes(restriction)}
                    onChange={() => toggleRestriction(restriction)}
                    className="h-5 w-5 appearance-none rounded-full border border-black/30 bg-white checked:border-[#FFC518] checked:bg-[#FFC518]"
                  />
                  {restriction}
                </label>
              ))}
            </div>
          </section>

          {normalisedInput && (
            <section className="flex flex-col items-start">
              {selectedMeal ? (
                <>
                  <article className="w-full max-w-85 rounded-3xl bg-[#FFF2C0] p-4">
                    <div
                      className="h-45 w-full rounded-2xl bg-[#FFF9EE]"
                      aria-hidden="true"
                    />
                    <div className="mt-4 rounded-xl bg-white p-4 text-center text-black">
                      <p className="font-indie-flower text-base">
                        Description:
                      </p>
                      <p className="mt-2 font-indie-flower text-xl">
                        {selectedMeal.description}
                      </p>
                      <p className="mt-3 font-indie-flower text-xs">
                        {selectedMeal.attribution}
                      </p>
                    </div>
                  </article>
                  <button
                    type="button"
                    className="mt-4 rounded-xl border-0 bg-[#FFC518] px-6 py-3 font-indie-flower text-xl text-black"
                  >
                    Get Ingredients List
                  </button>
                </>
              ) : (
                <p className="font-indie-flower text-xl text-black">
                  We don&apos;t support that meal yet — try another!
                </p>
              )}
            </section>
          )}
        </div>
      </main>
    </>
  );
}

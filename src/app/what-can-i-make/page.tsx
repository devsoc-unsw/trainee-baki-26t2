"use client";

import { FormEvent, useState } from "react";
import Header from "../../../components/Header";

type Preference = "quickMeal" | "highProtein";

type Meal = {
  id: number;
  name: string;
  ingredients: string[];
  isQuickMeal: boolean;
  isHighProtein: boolean;
};

const startingIngredients = ["Eggs", "Milk", "Butter", "Rice", "Cheese"];

const meals: Meal[] = [
  {
    id: 1,
    name: "Cheesy Egg Fried Rice",
    ingredients: ["eggs", "rice", "cheese", "butter"],
    isQuickMeal: true,
    isHighProtein: true,
  },
  {
    id: 2,
    name: "Creamy Cheese Omelette",
    ingredients: ["eggs", "milk", "cheese", "butter"],
    isQuickMeal: true,
    isHighProtein: true,
  },
  {
    id: 3,
    name: "Buttery Rice Bowl",
    ingredients: ["rice", "butter"],
    isQuickMeal: true,
    isHighProtein: false,
  },
  {
    id: 4,
    name: "Homestyle Rice Pudding",
    ingredients: ["rice", "milk", "sugar"],
    isQuickMeal: false,
    isHighProtein: false,
  },
  {
    id: 5,
    name: "Protein Pancakes",
    ingredients: ["eggs", "milk", "oats"],
    isQuickMeal: true,
    isHighProtein: true,
  },
  {
    id: 6,
    name: "Slow Roasted Tomato Pasta",
    ingredients: ["tomato", "pasta", "garlic"],
    isQuickMeal: false,
    isHighProtein: false,
  },
];

const normaliseIngredient = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLowerCase();

const formatIngredient = (value: string) => {
  const trimmedValue = value.trim().replace(/\s+/g, " ");
  return trimmedValue.charAt(0).toUpperCase() + trimmedValue.slice(1);
};

const getMatchCount = (meal: Meal, ingredients: string[]) => {
  const ingredientSet = new Set(ingredients.map(normaliseIngredient));
  return meal.ingredients.filter((ingredient) =>
    ingredientSet.has(normaliseIngredient(ingredient)),
  ).length;
};

export default function WhatCanIMakePage() {
  const [ingredients, setIngredients] = useState(startingIngredients);
  const [ingredientInput, setIngredientInput] = useState("");
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [searchedIngredients, setSearchedIngredients] =
    useState(startingIngredients);
  const [searchedPreferences, setSearchedPreferences] = useState<Preference[]>(
    [],
  );

  const mealMatches = meals
    .map((meal) => ({
      meal,
      matchCount: getMatchCount(meal, searchedIngredients),
    }))
    .filter(({ meal, matchCount }) => {
      if (matchCount === 0) return false;
      if (
        searchedPreferences.includes("quickMeal") &&
        !meal.isQuickMeal
      ) {
        return false;
      }
      if (
        searchedPreferences.includes("highProtein") &&
        !meal.isHighProtein
      ) {
        return false;
      }
      return true;
    })
    .sort((first, second) => second.matchCount - first.matchCount);

  const addIngredient = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const ingredient = formatIngredient(ingredientInput);
    if (!ingredient) return;

    const alreadyAdded = ingredients.some(
      (currentIngredient) =>
        normaliseIngredient(currentIngredient) ===
        normaliseIngredient(ingredient),
    );

    if (!alreadyAdded) {
      setIngredients((currentIngredients) => [
        ...currentIngredients,
        ingredient,
      ]);
    }
    setIngredientInput("");
  };

  const removeIngredient = (ingredientToRemove: string) => {
    setIngredients((currentIngredients) =>
      currentIngredients.filter(
        (ingredient) => ingredient !== ingredientToRemove,
      ),
    );
  };

  const togglePreference = (preference: Preference) => {
    setPreferences((currentPreferences) =>
      currentPreferences.includes(preference)
        ? currentPreferences.filter((item) => item !== preference)
        : [...currentPreferences, preference],
    );
  };

  const findMeals = () => {
    setSearchedIngredients(ingredients);
    setSearchedPreferences(preferences);
  };

  return (
    <>
      <Header />
      <main className="bg-white p-6 sm:p-8">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 lg:grid-cols-11">
          <section className="rounded-3xl bg-[#FFF2C0] p-6 sm:p-8 lg:col-span-5">
            <h1 className="text-center font-island-moments text-4xl text-black">
              Ingrediants I have
            </h1>

            <form onSubmit={addIngredient} className="mt-6">
              <input
                type="text"
                value={ingredientInput}
                onChange={(event) => setIngredientInput(event.target.value)}
                placeholder="Enter ingredient here"
                aria-label="Ingredient name"
                className="w-full rounded-xl border-0 bg-[#FFF9EE] px-5 py-4 font-indie-flower text-2xl text-black outline-none placeholder:text-black/50 focus:ring-2 focus:ring-[#FFC518]"
              />
            </form>

            <div className="mt-6 flex flex-wrap gap-4">
              {ingredients.map((ingredient) => (
                <div
                  key={ingredient}
                  className="flex items-center gap-3 rounded-xl bg-[#FFE08A] px-5 py-3 font-indie-flower text-2xl text-black"
                >
                  <span>{ingredient}</span>
                  <button
                    type="button"
                    onClick={() => removeIngredient(ingredient)}
                    aria-label={`Remove ${ingredient}`}
                    className="rounded px-1 text-xl leading-none focus:ring-2 focus:ring-black focus:outline-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="my-6 h-px w-full bg-[#FFC518]" />

            <h2 className="font-island-moments text-3xl text-black">
              Preferences
            </h2>
            <div className="mt-4 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => togglePreference("quickMeal")}
                aria-pressed={preferences.includes("quickMeal")}
                className={`rounded-3xl border-2 border-black px-8 py-4 font-indie-flower text-2xl text-black focus:ring-2 focus:ring-[#FFC518] focus:ring-offset-2 focus:outline-none ${
                  preferences.includes("quickMeal")
                    ? "bg-[#FFC518]"
                    : "bg-white"
                }`}
              >
                Quick Meal
              </button>
              <button
                type="button"
                onClick={() => togglePreference("highProtein")}
                aria-pressed={preferences.includes("highProtein")}
                className={`rounded-3xl border-2 border-black px-8 py-4 font-indie-flower text-2xl text-black focus:ring-2 focus:ring-[#FFC518] focus:ring-offset-2 focus:outline-none ${
                  preferences.includes("highProtein")
                    ? "bg-[#FFC518]"
                    : "bg-white"
                }`}
              >
                High Protein
              </button>
            </div>

            <button
              type="button"
              onClick={findMeals}
              className="mx-auto mt-8 block rounded-xl border-0 bg-[#FFC518] px-8 py-4 font-indie-flower text-2xl text-black focus:ring-2 focus:ring-[#FFC518] focus:ring-offset-2 focus:outline-none"
            >
              Find Meals
            </button>
          </section>

          <section className="lg:col-span-6">
            <h2 className="font-island-moments text-4xl text-black">
              Meals you can make
            </h2>

            {searchedIngredients.length === 0 ? (
              <p className="mt-6 font-indie-flower text-2xl text-black">
                Add some ingredients to see what you can make!
              </p>
            ) : mealMatches.length === 0 ? (
              <p className="mt-6 font-indie-flower text-2xl text-black">
                No meals match — try removing a filter or adding more
                ingredients.
              </p>
            ) : (
              <div className="mt-6 space-y-6">
                {mealMatches.map(({ meal, matchCount }) => (
                  <article
                    key={meal.id}
                    className="flex flex-col gap-4 rounded-2xl border-2 border-[#FFE08A] bg-white p-4 sm:flex-row"
                  >
                    <div
                      className="h-45 w-full shrink-0 rounded-xl bg-[#FFF9EE] sm:w-50"
                      aria-hidden="true"
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <h3 className="font-special-elite text-3xl font-bold text-black">
                        {meal.name}
                      </h3>
                      <p className="mt-3 font-indie-flower text-xl text-black">
                        Uses {matchCount} of your ingredients
                      </p>
                      <button
                        type="button"
                        className="mt-6 self-end rounded-xl border-0 bg-[#FFC518] px-6 py-2.5 font-indie-flower text-xl text-black focus:ring-2 focus:ring-[#FFC518] focus:ring-offset-2 focus:outline-none sm:mt-auto"
                      >
                        View Recipe
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

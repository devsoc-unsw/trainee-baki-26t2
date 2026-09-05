"use client";

import { FormEvent, useEffect, useState } from "react";
import Header from "../../../components/Header";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { getMealsFromIngredients } from "../../lib/api";
import {
  formatIngredientName,
  normaliseName,
} from "../../lib/ingredients";
import { startingPantryIngredients } from "../../lib/mockData";
import type { Meal } from "../../types";

type Preference = "quickMeal" | "highProtein";

const getMatchCount = (meal: Meal, ingredients: string[]) => {
  const ingredientSet = new Set(ingredients.map(normaliseName));
  return meal.ingredients.filter((ingredient) =>
    ingredientSet.has(normaliseName(ingredient.name)),
  ).length;
};

export default function WhatCanIMakePage() {
  const [ingredients, setIngredients] = useState(startingPantryIngredients);
  const [ingredientInput, setIngredientInput] = useState("");
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [searchedIngredients, setSearchedIngredients] =
    useState(startingPantryIngredients);
  const [searchedPreferences, setSearchedPreferences] = useState<Preference[]>(
    [],
  );
  const requestKey = JSON.stringify([
    searchedIngredients,
    searchedPreferences,
  ]);
  const [response, setResponse] = useState<{
    requestKey: string;
    meals: Meal[];
  } | null>(null);
  const [errorRequestKey, setErrorRequestKey] = useState<string | null>(
    null,
  );
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    getMealsFromIngredients(searchedIngredients, {
      quickMeal: searchedPreferences.includes("quickMeal"),
      highProtein: searchedPreferences.includes("highProtein"),
    })
      .then((nextMeals) => {
        if (ignore) return;
        setResponse({ requestKey, meals: nextMeals });
      })
      .catch(() => {
        if (ignore) return;
        setErrorRequestKey(requestKey);
      });

    return () => {
      ignore = true;
    };
  }, [requestKey, searchedIngredients, searchedPreferences]);

  const meals =
    response?.requestKey === requestKey ? response.meals : [];
  const status =
    response?.requestKey === requestKey
      ? "success"
      : errorRequestKey === requestKey
        ? "error"
        : "loading";
  const mealMatches = meals.map((meal) => ({
    meal,
    matchCount: getMatchCount(meal, searchedIngredients),
  }));

  const addIngredient = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const ingredient = normaliseName(ingredientInput);
    if (!ingredient) return;

    const alreadyAdded = ingredients.includes(ingredient);

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
          <Card
            as="section"
            variant="panel"
            className="p-6 sm:p-8 lg:col-span-5"
          >
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
              {ingredients.map((ingredient) => {
                const displayName = formatIngredientName(ingredient);

                return (
                  <div
                    key={ingredient}
                    className="flex items-center gap-3 rounded-xl bg-[#FFE08A] px-5 py-3 font-indie-flower text-2xl text-black"
                  >
                    <span>{displayName}</span>
                    <Button
                      variant="remove"
                      onClick={() => removeIngredient(ingredient)}
                      aria-label={`Remove ${displayName}`}
                      className="px-1 text-xl"
                    >
                      ×
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="my-6 h-px w-full bg-[#FFC518]" />

            <h2 className="font-island-moments text-3xl text-black">
              Preferences
            </h2>
            <div className="mt-4 flex flex-wrap gap-4">
              <Button
                variant="toggle"
                active={preferences.includes("quickMeal")}
                onClick={() => togglePreference("quickMeal")}
                aria-pressed={preferences.includes("quickMeal")}
              >
                Quick Meal
              </Button>
              <Button
                variant="toggle"
                active={preferences.includes("highProtein")}
                onClick={() => togglePreference("highProtein")}
                aria-pressed={preferences.includes("highProtein")}
              >
                High Protein
              </Button>
            </div>

            <Button
              variant="primary"
              onClick={findMeals}
              className="mx-auto mt-8 block px-8 py-4 text-2xl"
            >
              Find Meals
            </Button>
          </Card>

          <section className="lg:col-span-6">
            <h2 className="font-island-moments text-4xl text-black">
              Meals you can make
            </h2>

            {status === "loading" ? (
              <p className="mt-6 font-indie-flower text-2xl text-black">
                Loading meals...
              </p>
            ) : status === "error" ? (
              <p className="mt-6 font-indie-flower text-2xl text-black">
                We couldn&apos;t load meals right now — please try again.
              </p>
            ) : searchedIngredients.length === 0 ? (
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
                  <Card
                    as="article"
                    variant="meal"
                    key={meal.id}
                    className="flex flex-col gap-4 p-4 sm:flex-row"
                  >
                    {meal.imageUrl ? (
                      <img
                        src={meal.imageUrl}
                        alt={meal.name}
                        className="h-45 w-full shrink-0 rounded-xl object-cover sm:w-50"
                      />
                    ) : (
                      <Card
                        variant="placeholder"
                        className="h-45 w-full shrink-0 sm:w-50"
                        aria-hidden="true"
                      />
                    )}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <h3 className="font-special-elite text-3xl font-bold text-black">
                        {meal.name}
                      </h3>
                      <p className="mt-3 font-indie-flower text-xl text-black">
                        Uses {matchCount} of your ingredients
                      </p>
                      <Button
                        variant="primary"
                        onClick={() =>
                          setExpandedMealId((currentId) =>
                            currentId === meal.id ? null : meal.id,
                          )
                        }
                        className="mt-6 self-end px-6 py-2.5 text-xl sm:mt-auto"
                      >
                        {expandedMealId === meal.id ? "Hide Recipe" : "View Recipe"}
                      </Button>
                      {expandedMealId === meal.id && (
                        <div className="mt-5 border-t border-[#FFC518] pt-4">
                          <h4 className="font-island-moments text-3xl text-black">
                            Steps
                          </h4>
                          <ol className="mt-2 list-decimal space-y-2 pl-5 font-indie-flower text-lg text-black">
                            {meal.description
                              .split(/\r?\n|(?<=[.!?])\s+(?=[A-Z0-9])/)
                              .map((step) => step.trim())
                              .filter(Boolean)
                              .map((step, index) => (
                                <li key={`${meal.id}-step-${index}`}>{step}</li>
                              ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

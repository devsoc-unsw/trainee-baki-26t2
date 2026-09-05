"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Header from "../../../components/Header";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { useShoppingList } from "../../context/ShoppingListContext";
import {
  getIngredientsForMeal,
  getMealByName,
} from "../../lib/api";
import { normaliseName } from "../../lib/ingredients";
import { dietaryOptions } from "../../lib/mockData";
import type { DietaryTag, Meal } from "../../types";

const MEAL_PREP_STATE_KEY = "let-him-cook:meal-prep-state";

export const getInstructionSteps = (instructions: string) => {
  const stepMarker = /Step\s+\d+\s*[:.)-]?\s*/gi;
  const markers = [...instructions.matchAll(stepMarker)];

  if (markers.length > 0) {
    return markers
      .map((marker, index) => {
        const contentStart = marker.index! + marker[0].length;
        const contentEnd = markers[index + 1]?.index ?? instructions.length;
        return instructions.slice(contentStart, contentEnd).trim();
      })
      .filter(Boolean);
  }

  return instructions
    .replace(/\r\n?/g, "\n")
    .split(/\n+/)
    .map((step) => step.trim())
    .filter(Boolean);
};

export default function MealPrepPage() {
  const router = useRouter();
  const { addItems } = useShoppingList();
  const [mealInput, setMealInput] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<
    DietaryTag[]
  >([]);
  const [response, setResponse] = useState<{
    requestKey: string;
    meal: Meal | null;
  } | null>(null);
  const [errorRequestKey, setErrorRequestKey] = useState<string | null>(
    null,
  );
  const [isAddingIngredients, setIsAddingIngredients] = useState(false);
  const [ingredientsError, setIngredientsError] = useState(false);

  const normalisedInput = normaliseName(mealInput);
  const requestKey = JSON.stringify([mealInput, dietaryRestrictions]);
  const selectedMeal =
    response?.requestKey === requestKey ? response.meal : null;
  const status = !normalisedInput
    ? "idle"
    : response?.requestKey === requestKey
      ? "success"
      : errorRequestKey === requestKey
        ? "error"
        : "loading";
  const unsuitableRestrictions = selectedMeal
    ? dietaryOptions.filter(({ tag }) => {
        if (!dietaryRestrictions.includes(tag)) return false;

        // This tag means the meal contains nuts, so the check is inverted.
        return tag === "nut-allergy"
          ? selectedMeal.dietaryTags.includes(tag)
          : !selectedMeal.dietaryTags.includes(tag);
      })
    : [];

  const instructionSteps = selectedMeal
    ? getInstructionSteps(selectedMeal.description)
    : [];

  useEffect(() => {
    const savedState = sessionStorage.getItem(MEAL_PREP_STATE_KEY);
    if (!savedState) return;

    try {
      const parsedState: unknown = JSON.parse(savedState);
      if (typeof parsedState !== "object" || parsedState === null) return;

      if (
        "mealInput" in parsedState &&
        typeof parsedState.mealInput === "string"
      ) {
        setMealInput(parsedState.mealInput);
      }
      if (
        "dietaryRestrictions" in parsedState &&
        Array.isArray(parsedState.dietaryRestrictions)
      ) {
        setDietaryRestrictions(
          parsedState.dietaryRestrictions.filter(
            (restriction): restriction is DietaryTag =>
              typeof restriction === "string" &&
              dietaryOptions.some(({ tag }) => tag === restriction),
          ),
        );
      }
    } catch {
      sessionStorage.removeItem(MEAL_PREP_STATE_KEY);
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(
      MEAL_PREP_STATE_KEY,
      JSON.stringify({ mealInput, dietaryRestrictions }),
    );
  }, [dietaryRestrictions, mealInput]);

  useEffect(() => {
    if (!normalisedInput) return;

    let ignore = false;

    getMealByName(mealInput, dietaryRestrictions)
      .then((meal) => {
        if (ignore) return;
        setResponse({ requestKey, meal });
      })
      .catch(() => {
        if (ignore) return;
        setErrorRequestKey(requestKey);
      });

    return () => {
      ignore = true;
    };
  }, [dietaryRestrictions, mealInput, normalisedInput, requestKey]);

  const toggleRestriction = (restriction: DietaryTag) => {
    setIngredientsError(false);
    setDietaryRestrictions((currentRestrictions) =>
      currentRestrictions.includes(restriction)
        ? currentRestrictions.filter((item) => item !== restriction)
        : [...currentRestrictions, restriction],
    );
  };

  const addMealIngredients = async () => {
    if (!selectedMeal || unsuitableRestrictions.length > 0) return;

    setIsAddingIngredients(true);
    setIngredientsError(false);

    try {
      const ingredients = await getIngredientsForMeal(selectedMeal.id);
      addItems(ingredients);
      router.push("/compare");
    } catch {
      setIngredientsError(true);
      setIsAddingIngredients(false);
    }
  };

  return (
    <>
      <Header />
      <main className="bg-white p-6 sm:p-8">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 lg:grid-cols-5">
          <section className="min-w-0 lg:col-span-2">
            <h1 className="font-island-moments text-3xl text-black">
              I want to prepare
            </h1>
            <input
              type="text"
              value={mealInput}
              onChange={(event) => {
                setMealInput(event.target.value);
                setIngredientsError(false);
              }}
              placeholder="Enter Meal Here"
              aria-label="Meal name"
              className="mt-3 w-full max-w-87.5 rounded-lg border border-black/20 bg-white px-4 py-3 font-indie-flower text-xl text-black outline-none placeholder:text-black/50 focus:ring-2 focus:ring-[#FFC518]"
            />

            <h2 className="mt-8 font-island-moments text-3xl text-black">
              Dietary Restrictions
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {dietaryOptions.map(({ label, tag }) => (
                <label
                  key={tag}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-black/20 bg-white p-4 font-indie-flower text-xl text-black"
                >
                  <span className="relative h-5 w-5 shrink-0">
                    <input
                      type="checkbox"
                      checked={dietaryRestrictions.includes(tag)}
                      onChange={() => toggleRestriction(tag)}
                      className="peer h-5 w-5 appearance-none rounded-full border border-black/30 bg-white checked:border-[#FFC518] checked:bg-[#FFC518] focus:ring-2 focus:ring-black focus:ring-offset-2 focus:outline-none"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm opacity-0 peer-checked:opacity-100"
                    >
                      ✓
                    </span>
                  </span>
                  {label}
                </label>
              ))}
            </div>
          </section>

          {normalisedInput && (
            <section className="flex min-w-0 w-full flex-col items-stretch lg:col-span-3">
              {status === "loading" ? (
                <p className="font-indie-flower text-xl text-black">
                  Loading meal...
                </p>
              ) : status === "error" ? (
                <p className="font-indie-flower text-xl text-black">
                  We couldn&apos;t load that meal right now — please try
                  again.
                </p>
              ) : !selectedMeal ? (
                <p className="font-indie-flower text-xl text-black">
                  We don&apos;t support that meal yet — try another!
                </p>
              ) : unsuitableRestrictions.length > 0 ? (
                <p className="font-indie-flower text-xl text-black">
                  {selectedMeal.name} isn&apos;t suitable for:{" "}
                  {unsuitableRestrictions
                    .map(({ label }) => label)
                    .join(", ")}
                </p>
              ) : (
                <Card
                  as="article"
                  variant="panel"
                  className="w-full max-w-none self-stretch p-4"
                >
                  {selectedMeal.imageUrl ? (
                    <Image
                      src={selectedMeal.imageUrl}
                      alt={selectedMeal.name}
                      width={900}
                      height={500}
                      className="h-64 w-full rounded-2xl object-cover sm:h-80"
                    />
                  ) : (
                    <Card
                      variant="placeholder"
                      className="h-45 w-full rounded-2xl!"
                      aria-hidden="true"
                    />
                  )}
                  <Card
                    variant="content"
                    className="w-full mt-4 p-4 text-black"
                  >
                    <h2 className="font-island-moments text-3xl">
                      {selectedMeal.name}
                    </h2>
                    <h3 className="mt-4 font-indie-flower text-base">
                      Steps
                    </h3>
                    <ol className="mt-2 list-decimal space-y-2 pl-5 font-indie-flower text-lg">
                      {instructionSteps.map((step, index) => (
                        <li key={`${step}-${index}`}>{step}</li>
                      ))}
                    </ol>
                    <p className="mt-4 font-indie-flower text-xs">
                      {selectedMeal.attribution}
                    </p>
                  </Card>
                </Card>
              )}
              <Button
                variant="primary"
                onClick={addMealIngredients}
                disabled={
                  status !== "success" ||
                  !selectedMeal ||
                  unsuitableRestrictions.length > 0 ||
                  isAddingIngredients
                }
                className="mt-4 w-1/2 self-center px-6 py-3 text-xl"
              >
                Get Ingredients List
              </Button>
              {ingredientsError && (
                <p className="mt-3 font-indie-flower text-xl text-black">
                  We couldn&apos;t add those ingredients — please try
                  again.
                </p>
              )}
            </section>
          )}
        </div>
      </main>
    </>
  );
}

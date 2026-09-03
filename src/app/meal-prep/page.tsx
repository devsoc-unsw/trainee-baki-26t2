"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../components/Header";
import {
  type ShoppingItemInput,
  useShoppingList,
} from "../../context/ShoppingListContext";

type Meal = {
  id: string;
  name: string;
  description: string;
  attribution: string;
  ingredients: ShoppingItemInput[];
  dietaryTags: DietaryTag[];
};

type DietaryTag = "vegan" | "vegetarian" | "halal" | "nut-allergy";

type DietaryRestriction = "Vegan" | "Vegetarian" | "Halal" | "Nut allergy";

const meals: Record<string, Meal> = {
  "japanese fluffy cheesecake": {
    id: "japanese-fluffy-cheesecake",
    name: "Japanese Fluffy Cheesecake",
    description: "A light and fluffy cake for all your baking desires",
    attribution: "Recipe from: Wow Ricky is so good at baking",
    ingredients: [
      { name: "Eggs", quantity: 4, unit: "x" },
      { name: "Butter", quantity: 50, unit: "g" },
      { name: "Milk", quantity: 100, unit: "ml" },
      { name: "Sugar", quantity: 100, unit: "g" },
      { name: "Flour", quantity: 80, unit: "g" },
    ],
    dietaryTags: ["vegetarian", "halal"],
  },
  "spaghetti bolognese": {
    id: "spaghetti-bolognese",
    name: "Spaghetti Bolognese",
    description: "A rich tomato and beef pasta made for an easy dinner",
    attribution: "Recipe from: The LetHim Cook kitchen",
    ingredients: [
      { name: "Pasta", quantity: 500, unit: "g" },
      { name: "Beef", quantity: 500, unit: "g" },
      { name: "Cheese", quantity: 100, unit: "g" },
    ],
    dietaryTags: [],
  },
  "vegetable curry": {
    id: "vegetable-curry",
    name: "Vegetable Curry",
    description: "A warm and comforting curry packed with colourful vegetables",
    attribution: "Recipe from: The LetHim Cook kitchen",
    ingredients: [
      { name: "Rice", quantity: 300, unit: "g" },
      { name: "Vegetables", quantity: 500, unit: "g" },
      { name: "Coconut Milk", quantity: 400, unit: "ml" },
    ],
    dietaryTags: ["vegan", "vegetarian", "halal"],
  },
  "chicken teriyaki": {
    id: "chicken-teriyaki",
    name: "Chicken Teriyaki",
    description: "Sweet and savoury glazed chicken served with steamed rice",
    attribution: "Recipe from: The LetHim Cook kitchen",
    ingredients: [
      { name: "Chicken", quantity: 500, unit: "g" },
      { name: "Rice", quantity: 300, unit: "g" },
      { name: "Sugar", quantity: 30, unit: "g" },
    ],
    dietaryTags: ["halal"],
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

const dietaryTagByRestriction: Record<DietaryRestriction, DietaryTag> = {
  Vegan: "vegan",
  Vegetarian: "vegetarian",
  Halal: "halal",
  "Nut allergy": "nut-allergy",
};

export default function MealPrepPage() {
  const router = useRouter();
  const { addItems } = useShoppingList();
  const [mealInput, setMealInput] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<
    DietaryRestriction[]
  >([]);

  const normalisedInput = normaliseMealName(mealInput);
  const selectedMeal = meals[normalisedInput];
  const unsuitableRestrictions = selectedMeal
    ? dietaryRestrictions.filter((restriction) => {
        const tag = dietaryTagByRestriction[restriction];

        // This tag means the meal contains nuts, so the check is inverted.
        return restriction === "Nut allergy"
          ? selectedMeal.dietaryTags.includes(tag)
          : !selectedMeal.dietaryTags.includes(tag);
      })
    : [];

  const toggleRestriction = (restriction: DietaryRestriction) => {
    setDietaryRestrictions((currentRestrictions) =>
      currentRestrictions.includes(restriction)
        ? currentRestrictions.filter((item) => item !== restriction)
        : [...currentRestrictions, restriction],
    );
  };

  const addMealIngredients = () => {
    if (!selectedMeal || unsuitableRestrictions.length > 0) return;

    addItems(selectedMeal.ingredients);
    router.push("/");
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
              {!selectedMeal ? (
                <p className="font-indie-flower text-xl text-black">
                  We don&apos;t support that meal yet — try another!
                </p>
              ) : unsuitableRestrictions.length > 0 ? (
                <p className="font-indie-flower text-xl text-black">
                  {selectedMeal.name} isn&apos;t suitable for:{" "}
                  {unsuitableRestrictions.join(", ")}
                </p>
              ) : (
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
              )}
              <button
                type="button"
                onClick={addMealIngredients}
                disabled={
                  !selectedMeal || unsuitableRestrictions.length > 0
                }
                className="mt-4 rounded-xl border-0 bg-[#FFC518] px-6 py-3 font-indie-flower text-xl text-black disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
              >
                Get Ingredients List
              </button>
            </section>
          )}
        </div>
      </main>
    </>
  );
}

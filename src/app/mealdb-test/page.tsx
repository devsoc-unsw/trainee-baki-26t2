import { searchMealsByName, extractIngredients } from "@/server/mealdb"
import { MealDBMeal } from "@/types/mealdb"

export default async function MealDBTest() {
  let results: MealDBMeal[] = [];
  let fetchError = false;

  try {
    results = await searchMealsByName("Spaghetti and Meatballs");
  } catch (err) {
    console.error("Failed to fetch meal:", err);
    fetchError = true;
  }

  const test_meal = results[0];

  if (fetchError) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
        <p className="text-gray-500">
          Something went wrong loading this recipe. Please try again shortly.
        </p>
      </main>
    );
  }

  if (!test_meal) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
        <p className="text-gray-500">No meal found for that search.</p>
      </main>
    );
  }

  const ingredients = extractIngredients(test_meal);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-semibold">Let Him Cook</h1>
        <p className="mt-2 text-gray-500">
          Testing TheMealDB API route
        </p>
      </div>

      <div className="w-full max-w-md">
        <h2 className="text-xl font-semibold mb-2">{test_meal.strMeal}</h2>
        <ul className="list-disc list-inside text-gray-700">
          {ingredients.map((item, i) => (
            <li key={i}>
              {item.name} {item.measure}
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
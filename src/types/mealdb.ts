// store all out object and interface definitions here

export interface MealDBIngredient {
  name: string,
  measure: string
}

export interface MealDBMeal {
  idMeal: string,
  strMeal: string,
  strInstructions: string,
  strMealThumb: string,
  [key: string]: string | undefined;
}

export interface MealDBSearchResponse {
  meals : MealDBMeal[] | null;
}

export interface MealDBMealSummary {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
}

export interface MealDBFilterResponse {
  meals: MealDBMealSummary[] | null;
}

export interface MealDBLookupResponse {
  meals: MealDBMeal[] | null;
}
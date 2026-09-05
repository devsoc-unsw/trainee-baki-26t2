export type DietaryTag =
  | "vegan"
  | "vegetarian"
  | "halal"
  | "nut-allergy";

export interface GroceryItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  productName?: string;
  productImageUrl?: string | null;
  productUrl?: string | null;
  productPackageSize?: number;
  productPackageUnit?: string;
  productPrice?: number;
}

export interface Ingredient {
  name: string;
  quantity: number | null;
  unit: string;
  productName?: string;
  productImageUrl?: string | null;
  productUrl?: string | null;
  productPackageSize?: number;
  productPackageUnit?: string;
  productPrice?: number;
}

export interface Store {
  id: string;
  name: string;
  distanceKm: number | null;
  latitude: number | null;
  longitude: number | null;
}

export interface StoreProduct {
  listItemName: string;
  displayName: string;
  packageSize: number;
  packageUnit: string;
  /** Price charged for one complete package, not a per-unit rate. */
  packagePrice: number;
  packsNeeded: number;
  lineTotal: number;
  imageUrl: string | null;
  available: boolean;
}

export interface StoreOffer {
  store: Store;
  products: StoreProduct[];
  total: number;
  unavailableItems: string[];
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  attribution: string;
  imageUrl: string | null;
  ingredients: Ingredient[];
  dietaryTags: DietaryTag[];
  isQuickMeal: boolean;
  isHighProtein: boolean;
}

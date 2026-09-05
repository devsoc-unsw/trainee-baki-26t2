"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { normaliseName } from "@/lib/ingredients";
import { startingGroceryItems } from "@/lib/mockData";
import { convert } from "@/lib/units";
import type { GroceryItem, Ingredient } from "@/types";

type ShoppingListContextValue = {
  items: GroceryItem[];
  addItem: (input: string) => GroceryItem | null;
  addItems: (items: Ingredient[]) => void;
  clearItems: () => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  updateUnit: (id: number, unit: string) => void;
};

const parseNewItem = (value: string) => {
  const unitMatch = value.match(
    /^(\d+(?:\.\d+)?)\s*(kg|mg|ml|g|l|x)\s+(.+)$/i,
  );

  if (unitMatch) {
    return {
      quantity: Number(unitMatch[1]),
      unit: unitMatch[2].toLowerCase(),
      name: normaliseName(unitMatch[3]),
    };
  }

  const quantityMatch = value.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
  if (quantityMatch) {
    return {
      quantity: Number(quantityMatch[1]),
      unit: "x",
      name: normaliseName(quantityMatch[2]),
    };
  }

  return {
    quantity: 1,
    unit: "x",
    name: normaliseName(value),
  };
};

/**
 * Merges new ingredients into an existing shopping list, matching by
 * normalised name and reconciling units via the shared converter.
 *
 * @param currentItems - The list as it stands.
 * @param newItems - Ingredients being added (e.g. from a meal's
 *   ingredient list, or a single item the user typed in). Entries
 *   with quantity === null are dropped: they represent "to taste"
 *   style measures that cannot be reasoned about numerically.
 * @param getNextId - Called once per NEW line entry to allocate a
 *   fresh id. Not called for merges into an existing entry.
 * @returns A new array (never mutates `currentItems`) with the
 *   merged shopping list.
 *
 * Merging rule: if the new item's unit is convertible to the
 * existing item's unit (potentially via density when the ingredient
 * name is known), the converted quantity is added and the existing
 * unit is preserved so the display stays stable. If conversion is
 * impossible (e.g. "2 cloves" being added to "500 g garlic"), the
 * item is added as a separate line entry rather than blindly summing
 * numbers across incompatible units — the latter is the bug this
 * function used to have, where 200 g butter + 2 cups butter silently
 * became "202 g butter".
 */
export const mergeShoppingItems = (
  currentItems: GroceryItem[],
  newItems: Ingredient[],
  getNextId: () => number,
) => {
  const mergedItems = [...currentItems];

  newItems.forEach((newItem) => {
    const quantity = newItem.quantity;
    if (quantity === null) return;

    const existingIndex = mergedItems.findIndex(
      (item) =>
        normaliseName(item.name) === normaliseName(newItem.name),
    );

    if (existingIndex >= 0) {
      const existingItem = mergedItems[existingIndex];
      const addedInExistingUnit = convert(
        quantity,
        newItem.unit,
        existingItem.unit,
        newItem.name,
      );
      if (addedInExistingUnit !== null) {
        mergedItems[existingIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + addedInExistingUnit,
        };
        return;
      }
      // Fall through: units are incompatible (count vs weight, or an
      // unknown unit on either side). Keep the addition as its own
      // line so the total stays truthful.
    }

    mergedItems.push({
      id: getNextId(),
      ...newItem,
      quantity,
    });
  });

  return mergedItems;
};

const ShoppingListContext = createContext<
  ShoppingListContextValue | undefined
>(undefined);

export function ShoppingListProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState(startingGroceryItems);
  const nextId = useRef(startingGroceryItems.length + 1);

  const addItem = (input: string) => {
    const value = input.trim();
    if (!value) return null;

    const parsedItem = parseNewItem(value);
    const existingItem = items.find(
      (item) =>
        normaliseName(item.name) === normaliseName(parsedItem.name),
    );
    const reservedId = nextId.current;
    const mergedItem = existingItem
      ? {
          ...existingItem,
          quantity: existingItem.quantity + parsedItem.quantity,
        }
      : { id: reservedId, ...parsedItem };

    if (!existingItem) {
      nextId.current += 1;
    }

    setItems((currentItems) =>
      mergeShoppingItems(currentItems, [parsedItem], () => reservedId),
    );
    return mergedItem;
  };

  const addItems = (newItems: Ingredient[]) => {
    setItems((currentItems) =>
      mergeShoppingItems(currentItems, newItems, () => {
        const id = nextId.current;
        nextId.current += 1;
        return id;
      }),
    );
  };

  const clearItems = () => {
    setItems([]);
    nextId.current = 1;
  };

  const removeItem = (id: number) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== id),
    );
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (!Number.isFinite(quantity) || quantity <= 0) return;

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, quantity } : item,
      ),
    );
  };

  const updateUnit = (id: number, unit: string) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, unit } : item,
      ),
    );
  };

  return (
    <ShoppingListContext.Provider
      value={{
        items,
        addItem,
        addItems,
        clearItems,
        removeItem,
        updateQuantity,
        updateUnit,
      }}
    >
      {children}
    </ShoppingListContext.Provider>
  );
}

export function useShoppingList() {
  const context = useContext(ShoppingListContext);

  if (!context) {
    throw new Error(
      "useShoppingList must be used inside a ShoppingListProvider",
    );
  }

  return context;
}

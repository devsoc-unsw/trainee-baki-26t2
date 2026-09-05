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
import type { GroceryItem, Ingredient } from "@/types";

type ShoppingListContextValue = {
  items: GroceryItem[];
  addItem: (input: string) => GroceryItem | null;
  addItems: (items: Ingredient[]) => void;
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

const mergeShoppingItems = (
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
      mergedItems[existingIndex] = {
        ...existingItem,
        quantity: existingItem.quantity + quantity,
      };
      return;
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

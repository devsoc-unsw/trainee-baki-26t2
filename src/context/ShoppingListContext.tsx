"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

export type ShoppingItem = {
  id: number;
  name: string;
  quantity: number;
  unit: string;
};

type ShoppingListContextValue = {
  items: ShoppingItem[];
  addItem: (input: string) => ShoppingItem | null;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  updateUnit: (id: number, unit: string) => void;
};

const startingItems: ShoppingItem[] = [
  { id: 1, name: "Eggs", quantity: 8, unit: "x" },
  { id: 2, name: "Butter", quantity: 150, unit: "g" },
  { id: 3, name: "Milk", quantity: 600, unit: "ml" },
  { id: 4, name: "Sugar", quantity: 200, unit: "g" },
];

const formatItemName = (name: string) =>
  name.charAt(0).toUpperCase() + name.slice(1);

const parseNewItem = (value: string) => {
  const unitMatch = value.match(
    /^(\d+(?:\.\d+)?)\s*(kg|mg|ml|g|l|x)\s+(.+)$/i,
  );

  if (unitMatch) {
    return {
      quantity: Number(unitMatch[1]),
      unit: unitMatch[2].toLowerCase(),
      name: formatItemName(unitMatch[3].trim()),
    };
  }

  const quantityMatch = value.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
  if (quantityMatch) {
    return {
      quantity: Number(quantityMatch[1]),
      unit: "x",
      name: formatItemName(quantityMatch[2].trim()),
    };
  }

  return {
    quantity: 1,
    unit: "x",
    name: formatItemName(value),
  };
};

const ShoppingListContext = createContext<
  ShoppingListContextValue | undefined
>(undefined);

export function ShoppingListProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState(startingItems);
  const nextId = useRef(startingItems.length + 1);

  const addItem = (input: string) => {
    const value = input.trim();
    if (!value) return null;

    const item = {
      id: nextId.current,
      ...parseNewItem(value),
    };

    nextId.current += 1;
    setItems((currentItems) => [...currentItems, item]);
    return item;
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
      value={{ items, addItem, removeItem, updateQuantity, updateUnit }}
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

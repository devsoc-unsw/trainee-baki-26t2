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

export type ShoppingItemInput = Omit<ShoppingItem, "id">;

type ShoppingListContextValue = {
  items: ShoppingItem[];
  addItem: (input: string) => ShoppingItem | null;
  addItems: (items: ShoppingItemInput[]) => void;
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

const normaliseItemName = (name: string) =>
  name.trim().replace(/\s+/g, " ").toLowerCase();

const mergeShoppingItems = (
  currentItems: ShoppingItem[],
  newItems: ShoppingItemInput[],
  getNextId: () => number,
) => {
  const mergedItems = [...currentItems];

  newItems.forEach((newItem) => {
    const existingIndex = mergedItems.findIndex(
      (item) =>
        normaliseItemName(item.name) === normaliseItemName(newItem.name),
    );

    if (existingIndex >= 0) {
      const existingItem = mergedItems[existingIndex];
      mergedItems[existingIndex] = {
        ...existingItem,
        quantity: existingItem.quantity + newItem.quantity,
      };
      return;
    }

    mergedItems.push({ id: getNextId(), ...newItem });
  });

  return mergedItems;
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

    const parsedItem = parseNewItem(value);
    const existingItem = items.find(
      (item) =>
        normaliseItemName(item.name) === normaliseItemName(parsedItem.name),
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

  const addItems = (newItems: ShoppingItemInput[]) => {
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

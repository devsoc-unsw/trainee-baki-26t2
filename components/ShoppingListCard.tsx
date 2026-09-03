"use client";

import { FormEvent, useState } from "react";

type ShoppingItem = {
  id: number;
  name: string;
  quantity: number;
  unit: string;
};

const startingItems: ShoppingItem[] = [
  { id: 1, name: "Eggs", quantity: 8, unit: "x" },
  { id: 2, name: "Butter", quantity: 150, unit: "g" },
  { id: 3, name: "Milk", quantity: 600, unit: "ml" },
  { id: 4, name: "Sugar", quantity: 200, unit: "g" },
];

export default function ShoppingListCard() {
  const [items, setItems] = useState(startingItems);
  const [newItemName, setNewItemName] = useState("");

  const removeItem = (id: number) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== id),
    );
  };

  const updateItem = (
    id: number,
    field: "quantity" | "unit",
    value: string,
  ) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: field === "quantity" ? Number(value) : value,
            }
          : item,
      ),
    );
  };

  const addItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = newItemName.trim();
    if (!name) return;

    const nextId = Math.max(0, ...items.map((item) => item.id)) + 1;
    setItems((currentItems) => [
      ...currentItems,
      { id: nextId, name, quantity: 1, unit: "x" },
    ]);
    setNewItemName("");
  };

  return (
    <section className="ml-0 w-full max-w-120 rounded-3xl bg-[#FFF2C0] p-6 sm:ml-4 lg:ml-8">
      <h2 className="mb-4 font-island-moments text-5xl leading-none text-black sm:text-6xl">
        Shopping List
      </h2>

      <div className="rounded-2xl bg-[#FFF9EE] p-6">
        <ul className="space-y-4 font-indie-flower text-3xl text-black">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={item.quantity}
                onChange={(event) =>
                  updateItem(item.id, "quantity", event.target.value)
                }
                aria-label={`${item.name} quantity`}
                className="w-16 rounded bg-transparent px-1 outline-none focus:ring-2 focus:ring-black"
              />
              <input
                type="text"
                value={item.unit}
                onChange={(event) =>
                  updateItem(item.id, "unit", event.target.value)
                }
                aria-label={`${item.name} unit`}
                className="w-12 rounded bg-transparent px-1 outline-none focus:ring-2 focus:ring-black"
              />
              <span className="flex-1">{item.name}</span>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label={`Remove ${item.name}`}
                className="rounded px-2 text-2xl leading-none hover:bg-black/10 focus:ring-2 focus:ring-black focus:outline-none"
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={addItem} className="mt-6 flex gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={(event) => setNewItemName(event.target.value)}
            placeholder="Add an item"
            aria-label="New item name"
            className="min-w-0 flex-1 rounded-xl border border-[#FFC518]/50 bg-[#FFF9EE] px-3 py-2 font-indie-flower text-xl text-black outline-none placeholder:text-black/50 focus:ring-2 focus:ring-[#FFC518]"
          />
          <button
            type="submit"
            className="rounded-xl bg-[#FFC518] px-4 py-2 font-special-elite text-sm text-black hover:bg-[#E5B016] focus:ring-2 focus:ring-[#FFC518] focus:ring-offset-2 focus:outline-none"
          >
            Add
          </button>
        </form>
      </div>
    </section>
  );
}

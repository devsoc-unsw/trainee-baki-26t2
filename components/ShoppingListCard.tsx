"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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

const isValidQuantity = (value: string) => {
  const quantity = Number(value);
  return value.trim() !== "" && Number.isFinite(quantity) && quantity > 0;
};

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

export default function ShoppingListCard() {
  const router = useRouter();
  const [items, setItems] = useState(startingItems);
  const [quantityDrafts, setQuantityDrafts] = useState<
    Record<number, string>
  >(() =>
    Object.fromEntries(
      startingItems.map((item) => [item.id, String(item.quantity)]),
    ),
  );
  const [newItemName, setNewItemName] = useState("");

  const removeItem = (id: number) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== id),
    );
    setQuantityDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };
      delete nextDrafts[id];
      return nextDrafts;
    });
  };

  const updateQuantity = (id: number, value: string) => {
    setQuantityDrafts((currentDrafts) => ({
      ...currentDrafts,
      [id]: value,
    }));

    if (!isValidQuantity(value)) return;

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, quantity: Number(value) } : item,
      ),
    );
  };

  const updateUnit = (id: number, value: string) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, unit: value } : item,
      ),
    );
  };

  const addItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input = newItemName.trim();
    if (!input) return;

    const newItem = parseNewItem(input);
    const nextId = Math.max(0, ...items.map((item) => item.id)) + 1;
    setItems((currentItems) => [
      ...currentItems,
      { id: nextId, ...newItem },
    ]);
    setQuantityDrafts((currentDrafts) => ({
      ...currentDrafts,
      [nextId]: String(newItem.quantity),
    }));
    setNewItemName("");
  };

  const compareStores = () => {
    const shoppingList = encodeURIComponent(JSON.stringify(items));
    router.push(`/compare?items=${shoppingList}`);
  };

  return (
    <section className="ml-0 w-full max-w-120 rounded-3xl bg-[#FFF2C0] p-6 sm:ml-4 lg:ml-8">
      <h2 className="mb-4 font-island-moments text-5xl leading-none text-black sm:text-6xl">
        Shopping List
      </h2>

      <div className="rounded-2xl bg-[#FFF9EE] p-6">
        {items.length === 0 ? (
          <p className="font-indie-flower text-2xl text-black/60">
            Your list is empty — add something below!
          </p>
        ) : (
          <ul className="space-y-4 font-indie-flower text-3xl text-black">
            {items.map((item) => {
              const quantityValue = quantityDrafts[item.id] ?? "";
              const hasQuantityError = !isValidQuantity(quantityValue);

              return (
                <li key={item.id}>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={quantityValue}
                      onChange={(event) =>
                        updateQuantity(item.id, event.target.value)
                      }
                      aria-label={`${item.name} quantity`}
                      aria-invalid={hasQuantityError}
                      className="w-16 rounded bg-transparent px-1 outline-none focus:ring-2 focus:ring-black"
                    />
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(event) =>
                        updateUnit(item.id, event.target.value)
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
                  </div>
                  {hasQuantityError && (
                    <p className="mt-1 text-base text-red-700">
                      Enter a valid quantity
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <form onSubmit={addItem} className="mt-6">
          <input
            type="text"
            value={newItemName}
            onChange={(event) => setNewItemName(event.target.value)}
            placeholder="Add an item"
            aria-label="New item name"
            className="w-full rounded-xl border border-[#FFC518]/50 bg-[#FFF9EE] px-3 py-2 font-indie-flower text-xl text-black outline-none placeholder:text-black/50 focus:ring-2 focus:ring-[#FFC518]"
          />
        </form>
      </div>

      <button
        type="button"
        onClick={compareStores}
        disabled={items.length === 0}
        className="mx-auto mt-4 block h-21.25 w-full max-w-56.25 rounded-[28px] border-0 bg-[#FFC518] font-indie-flower text-4xl text-black focus:ring-2 focus:ring-[#FFC518] focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
      >
        Get My Order
      </button>
    </section>
  );
}

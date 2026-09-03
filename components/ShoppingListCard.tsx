"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useShoppingList } from "../src/context/ShoppingListContext";
import { formatIngredientName } from "../src/lib/ingredients";

const isValidQuantity = (value: string) => {
  const quantity = Number(value);
  return value.trim() !== "" && Number.isFinite(quantity) && quantity > 0;
};

export default function ShoppingListCard() {
  const router = useRouter();
  const { items, addItem, removeItem, updateQuantity, updateUnit } =
    useShoppingList();
  const [quantityDrafts, setQuantityDrafts] = useState<
    Record<number, string>
  >(() =>
    Object.fromEntries(
      items.map((item) => [item.id, String(item.quantity)]),
    ),
  );
  const [newItemName, setNewItemName] = useState("");

  const handleRemoveItem = (id: number) => {
    removeItem(id);
    setQuantityDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };
      delete nextDrafts[id];
      return nextDrafts;
    });
  };

  const handleUpdateQuantity = (id: number, value: string) => {
    setQuantityDrafts((currentDrafts) => ({
      ...currentDrafts,
      [id]: value,
    }));

    if (!isValidQuantity(value)) return;

    updateQuantity(id, Number(value));
  };

  const handleAddItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newItem = addItem(newItemName);
    if (!newItem) return;

    setQuantityDrafts((currentDrafts) => ({
      ...currentDrafts,
      [newItem.id]: String(newItem.quantity),
    }));
    setNewItemName("");
  };

  const compareStores = () => {
    router.push("/compare");
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
              const displayName = formatIngredientName(item.name);

              return (
                <li key={item.id}>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={quantityValue}
                      onChange={(event) =>
                        handleUpdateQuantity(item.id, event.target.value)
                      }
                      aria-label={`${displayName} quantity`}
                      aria-invalid={hasQuantityError}
                      className="w-16 rounded bg-transparent px-1 outline-none focus:ring-2 focus:ring-black"
                    />
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(event) =>
                        updateUnit(item.id, event.target.value)
                      }
                      aria-label={`${displayName} unit`}
                      className="w-12 rounded bg-transparent px-1 outline-none focus:ring-2 focus:ring-black"
                    />
                    <span className="flex-1">{displayName}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label={`Remove ${displayName}`}
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

        <form onSubmit={handleAddItem} className="mt-6">
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

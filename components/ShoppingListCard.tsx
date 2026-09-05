"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useShoppingList } from "../src/context/ShoppingListContext";
import { formatIngredientName } from "../src/lib/ingredients";
import Button from "./ui/Button";
import Card from "./ui/Card";

const isValidQuantity = (value: string) => {
  const quantity = Number(value);
  return value.trim() !== "" && Number.isFinite(quantity) && quantity > 0;
};

export default function ShoppingListCard() {
  const router = useRouter();
  const {
    items,
    addItem,
    clearItems,
    removeItem,
    updateQuantity,
    updateUnit,
  } = useShoppingList();
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

  const handleClearItems = () => {
    clearItems();
    setQuantityDrafts({});
  };

  return (
    <Card
      as="section"
      variant="panel"
      className="ml-0 min-w-0 w-full max-w-120 overflow-hidden p-4 sm:ml-4 sm:p-6 lg:ml-8"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-island-moments text-4xl leading-none text-black sm:text-5xl">
          Shopping List
        </h2>
        <Button
          variant="secondary"
          onClick={handleClearItems}
          disabled={items.length === 0}
          className="shrink-0 px-3 py-2 text-lg sm:px-4 sm:py-2"
        >
          Clear
        </Button>
      </div>

      <Card variant="well" className="min-w-0 p-4 sm:p-6">
        {items.length === 0 ? (
          <p className="font-indie-flower text-xl text-black/60">
            Your list is empty — add something below!
          </p>
        ) : (
          <ul className="min-w-0 space-y-4 font-indie-flower text-xl text-black sm:text-2xl">
            {items.map((item) => {
              const quantityValue = quantityDrafts[item.id] ?? "";
              const hasQuantityError = !isValidQuantity(quantityValue);
              const displayName = formatIngredientName(item.name);

              return (
                <li key={item.id}>
                  <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
                    <div className="flex min-w-0 items-center gap-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={quantityValue}
                        onChange={(event) =>
                          handleUpdateQuantity(item.id, event.target.value)
                        }
                        aria-label={`${displayName} quantity`}
                        aria-invalid={hasQuantityError}
                        className="w-14 min-w-0 rounded bg-transparent px-1 outline-none focus:ring-2 focus:ring-black sm:w-16"
                      />
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(event) =>
                          updateUnit(item.id, event.target.value)
                        }
                        aria-label={`${displayName} unit`}
                        className="w-18 min-w-0 rounded bg-transparent px-1 text-sm outline-none focus:ring-2 focus:ring-black sm:w-20"
                      />
                    </div>
                    <span className="min-w-0 break-all">{displayName}</span>
                    <Button
                      variant="remove"
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label={`Remove ${displayName}`}
                      className="shrink-0 px-2 text-xl hover:bg-black/10"
                    >
                      ×
                    </Button>
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
            className="w-full rounded-xl border border-[#FFC518]/50 bg-[#FFF9EE] px-3 py-2 font-indie-flower text-lg text-black outline-none placeholder:text-black/50 focus:ring-2 focus:ring-[#FFC518]"
          />
        </form>
      </Card>

      <Button
        variant="primary"
        onClick={compareStores}
        disabled={items.length === 0}
        className="mx-auto mt-4 block h-17 w-full max-w-56.25 rounded-[28px]! text-2xl"
      >
        Get My Order
      </Button>
    </Card>
  );
}

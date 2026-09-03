"use client";

import { useState } from "react";
import Header from "../../../components/Header";
import ShoppingListCard from "../../../components/ShoppingListCard";
import { useShoppingList } from "../../context/ShoppingListContext";

type ComparisonView = "cheapest" | "location";

type PriceEntry = {
  name: string;
  packageSize: number;
  packageUnit: string;
  price: number;
  imageUrl: string | null;
};

type StorePricing = {
  name: string;
  prices: Partial<Record<string, PriceEntry>>;
};

const storePricing: Record<"coles" | "woolworths", StorePricing> = {
  coles: {
    name: "Coles",
    prices: {
      eggs: {
        name: "Coles Free Range Eggs x12",
        packageSize: 12,
        packageUnit: "x",
        price: 6.5,
        imageUrl: null,
      },
      butter: {
        name: "Coles Unsalted Butter 250g",
        packageSize: 250,
        packageUnit: "g",
        price: 4.8,
        imageUrl: null,
      },
      milk: {
        name: "Coles Full Cream Milk 2L",
        packageSize: 2,
        packageUnit: "L",
        price: 3.1,
        imageUrl: null,
      },
      sugar: {
        name: "Coles White Sugar 1kg",
        packageSize: 1,
        packageUnit: "kg",
        price: 2.2,
        imageUrl: null,
      },
      rice: {
        name: "Coles Long Grain Rice 1kg",
        packageSize: 1,
        packageUnit: "kg",
        price: 3,
        imageUrl: null,
      },
      cheese: {
        name: "Coles Tasty Cheese 500g",
        packageSize: 500,
        packageUnit: "g",
        price: 6.5,
        imageUrl: null,
      },
      flour: {
        name: "Coles Plain Flour 1kg",
        packageSize: 1,
        packageUnit: "kg",
        price: 2,
        imageUrl: null,
      },
      chicken: {
        name: "Coles RSPCA Approved Chicken Breast 1kg",
        packageSize: 1,
        packageUnit: "kg",
        price: 11,
        imageUrl: null,
      },
      bread: {
        name: "Coles White Sandwich Bread",
        packageSize: 1,
        packageUnit: "x",
        price: 3.5,
        imageUrl: null,
      },
      pasta: {
        name: "Coles Penne Pasta 500g",
        packageSize: 500,
        packageUnit: "g",
        price: 2,
        imageUrl: null,
      },
    },
  },
  woolworths: {
    name: "Woolworths",
    prices: {
      eggs: {
        name: "Woolworths Free Range Eggs x12",
        packageSize: 12,
        packageUnit: "x",
        price: 7,
        imageUrl: null,
      },
      butter: {
        name: "Woolworths Unsalted Butter 500g",
        packageSize: 500,
        packageUnit: "g",
        price: 7,
        imageUrl: null,
      },
      milk: {
        name: "Woolworths Full Cream Milk 2L",
        packageSize: 2,
        packageUnit: "L",
        price: 3.3,
        imageUrl: null,
      },
      sugar: {
        name: "Woolworths White Sugar 1kg",
        packageSize: 1,
        packageUnit: "kg",
        price: 2.4,
        imageUrl: null,
      },
      rice: {
        name: "Woolworths Long Grain Rice 1kg",
        packageSize: 1,
        packageUnit: "kg",
        price: 3.2,
        imageUrl: null,
      },
      cheese: {
        name: "Woolworths Tasty Cheese 500g",
        packageSize: 500,
        packageUnit: "g",
        price: 7.2,
        imageUrl: null,
      },
      flour: {
        name: "Woolworths Plain Flour 1kg",
        packageSize: 1,
        packageUnit: "kg",
        price: 2.2,
        imageUrl: null,
      },
      chicken: {
        name: "Woolworths Chicken Breast Fillets 1kg",
        packageSize: 1,
        packageUnit: "kg",
        price: 12.5,
        imageUrl: null,
      },
      bread: {
        name: "Woolworths Soft White Sandwich Bread",
        packageSize: 1,
        packageUnit: "x",
        price: 3.8,
        imageUrl: null,
      },
      pasta: {
        name: "Woolworths Penne Pasta 500g",
        packageSize: 500,
        packageUnit: "g",
        price: 2.3,
        imageUrl: null,
      },
    },
  },
};

const normaliseItemName = (name: string) =>
  name.trim().replace(/\s+/g, " ").toLowerCase();

const normaliseAmount = (quantity: number, unit: string) => {
  const normalisedUnit = unit.trim().toLowerCase();

  if (normalisedUnit === "kg") {
    return { quantity: quantity * 1000, unit: "g" };
  }
  if (normalisedUnit === "l") {
    return { quantity: quantity * 1000, unit: "ml" };
  }

  return { quantity, unit: normalisedUnit };
};

const getPacksNeeded = (
  requestedQuantity: number,
  requestedUnit: string,
  priceEntry: PriceEntry,
) => {
  const requestedAmount = normaliseAmount(
    requestedQuantity,
    requestedUnit,
  );
  const packageAmount = normaliseAmount(
    priceEntry.packageSize,
    priceEntry.packageUnit,
  );

  // Mismatched units are a data-quality issue, so do not calculate a price.
  if (
    requestedAmount.unit !== packageAmount.unit ||
    packageAmount.quantity <= 0
  ) {
    return null;
  }

  return Math.ceil(requestedAmount.quantity / packageAmount.quantity);
};

const formatPrice = (price: number) => `$${price.toFixed(2)}`;

export default function ComparePage() {
  const { items } = useShoppingList();
  const [activeView, setActiveView] =
    useState<ComparisonView>("cheapest");
  const activeStore =
    storePricing[activeView === "cheapest" ? "coles" : "woolworths"];
  const products = items.map((item) => {
    const priceEntry = activeStore.prices[normaliseItemName(item.name)];
    const packsNeeded = priceEntry
      ? getPacksNeeded(item.quantity, item.unit, priceEntry)
      : null;

    return { item, priceEntry, packsNeeded };
  });
  const total = products.reduce(
    (sum, { priceEntry, packsNeeded }) =>
      sum +
      (priceEntry && packsNeeded !== null
        ? priceEntry.price * packsNeeded
        : 0),
    0,
  );

  return (
    <>
      <Header />
      <main className="bg-white p-6 sm:p-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 lg:flex-row lg:items-start">
          <div className="w-full lg:w-2/5">
            <ShoppingListCard />
          </div>

          <section
            className="w-full lg:w-3/5"
            aria-label={`${activeStore.name} comparison`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveView("cheapest")}
                aria-pressed={activeView === "cheapest"}
                className={`rounded-xl px-8 py-4 font-indie-flower text-2xl text-black focus:ring-2 focus:ring-[#FFC518] focus:ring-offset-2 focus:outline-none ${
                  activeView === "cheapest"
                    ? "bg-[#FFC518]"
                    : "bg-[#FFF2C0]"
                }`}
              >
                Cheapest
              </button>
              <button
                type="button"
                onClick={() => setActiveView("location")}
                aria-pressed={activeView === "location"}
                className={`rounded-xl px-8 py-4 font-indie-flower text-2xl text-black focus:ring-2 focus:ring-[#FFC518] focus:ring-offset-2 focus:outline-none ${
                  activeView === "location"
                    ? "bg-[#FFC518]"
                    : "bg-[#FFF2C0]"
                }`}
              >
                Location
              </button>
              {activeView === "location" && (
                <button
                  type="button"
                  className="ml-auto rounded-xl bg-[#A5D8F3] px-8 py-4 font-indie-flower text-2xl text-black focus:ring-2 focus:ring-[#FFC518] focus:ring-offset-2 focus:outline-none"
                >
                  See Map
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <p className="mt-6 font-indie-flower text-2xl text-black">
                Your list is empty — add some items to compare stores.
              </p>
            ) : (
              <>
                <div className="mt-6 space-y-4">
                  {products.map(({ item, priceEntry, packsNeeded }) => (
                    <article
                      key={item.id}
                      className={`rounded-[20px] bg-[#FFF2C0] p-3 ${
                        priceEntry && packsNeeded !== null
                          ? ""
                          : "opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-4 rounded-2xl bg-white p-3">
                        <div
                          className="h-16 w-28 shrink-0 rounded-xl bg-[#FFF9EE] sm:h-20 sm:w-40"
                          aria-hidden="true"
                        />
                        <p className="font-indie-flower text-2xl text-black">
                          {priceEntry?.name ?? item.name}
                        </p>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-white p-3 font-indie-flower text-xl text-black">
                          Quantity: {packsNeeded ?? "—"}
                        </div>
                        <div className="rounded-xl bg-white p-3 font-indie-flower text-xl text-black">
                          {priceEntry && packsNeeded !== null
                            ? `Price: ${formatPrice(priceEntry.price * packsNeeded)}`
                            : `Not available at ${activeStore.name}`}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="rounded-xl bg-[#FFF2C0] px-6 py-4 font-indie-flower text-2xl text-black">
                    Total: {formatPrice(total)}
                  </div>
                  <button
                    type="button"
                    className="rounded-xl border-0 bg-[#FFC518] px-8 py-4 font-indie-flower text-2xl text-black focus:ring-2 focus:ring-[#FFC518] focus:ring-offset-2 focus:outline-none"
                  >
                    Add to Cart
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

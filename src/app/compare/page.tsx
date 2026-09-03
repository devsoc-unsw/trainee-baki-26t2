"use client";

import { useState } from "react";
import Header from "../../../components/Header";
import ShoppingListCard from "../../../components/ShoppingListCard";
import { useShoppingList } from "../../context/ShoppingListContext";

type ComparisonView = "cheapest" | "location";

type PriceEntry = {
  productName: string;
  unitPrice: number;
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
        productName: "Coles Free Range Eggs x12",
        unitPrice: 6.5,
        imageUrl: null,
      },
      butter: {
        productName: "Coles Unsalted Butter 250g",
        unitPrice: 4.8,
        imageUrl: null,
      },
      milk: {
        productName: "Coles Full Cream Milk 2L",
        unitPrice: 3.1,
        imageUrl: null,
      },
      sugar: {
        productName: "Coles White Sugar 1kg",
        unitPrice: 2.2,
        imageUrl: null,
      },
      rice: {
        productName: "Coles Long Grain Rice 1kg",
        unitPrice: 3,
        imageUrl: null,
      },
      cheese: {
        productName: "Coles Tasty Cheese 500g",
        unitPrice: 6.5,
        imageUrl: null,
      },
      flour: {
        productName: "Coles Plain Flour 1kg",
        unitPrice: 2,
        imageUrl: null,
      },
      chicken: {
        productName: "Coles RSPCA Approved Chicken Breast",
        unitPrice: 11,
        imageUrl: null,
      },
      bread: {
        productName: "Coles White Sandwich Bread",
        unitPrice: 3.5,
        imageUrl: null,
      },
      pasta: {
        productName: "Coles Penne Pasta 500g",
        unitPrice: 2,
        imageUrl: null,
      },
    },
  },
  woolworths: {
    name: "Woolworths",
    prices: {
      eggs: {
        productName: "Woolworths Free Range Eggs x12",
        unitPrice: 7,
        imageUrl: null,
      },
      butter: {
        productName: "Woolworths Unsalted Butter 500g",
        unitPrice: 7,
        imageUrl: null,
      },
      milk: {
        productName: "Woolworths Full Cream Milk 2L",
        unitPrice: 3.3,
        imageUrl: null,
      },
      sugar: {
        productName: "Woolworths White Sugar 1kg",
        unitPrice: 2.4,
        imageUrl: null,
      },
      cheese: {
        productName: "Woolworths Tasty Cheese 500g",
        unitPrice: 7.2,
        imageUrl: null,
      },
      chicken: {
        productName: "Woolworths Chicken Breast Fillets",
        unitPrice: 12.5,
        imageUrl: null,
      },
      bread: {
        productName: "Woolworths Soft White Sandwich Bread",
        unitPrice: 3.8,
        imageUrl: null,
      },
      pasta: {
        productName: "Woolworths Penne Pasta 500g",
        unitPrice: 2.3,
        imageUrl: null,
      },
    },
  },
};

const normaliseItemName = (name: string) =>
  name.trim().replace(/\s+/g, " ").toLowerCase();

const formatPrice = (price: number) => `$${price.toFixed(2)}`;

export default function ComparePage() {
  const { items } = useShoppingList();
  const [activeView, setActiveView] =
    useState<ComparisonView>("cheapest");
  const activeStore =
    storePricing[activeView === "cheapest" ? "coles" : "woolworths"];
  const products = items.map((item) => ({
    item,
    priceEntry: activeStore.prices[normaliseItemName(item.name)],
  }));
  const total = products.reduce(
    (sum, { item, priceEntry }) =>
      sum + (priceEntry?.unitPrice ?? 0) * item.quantity,
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
                className={`rounded-xl px-8 py-4 font-indie-flower text-2xl text-black ${
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
                className={`rounded-xl px-8 py-4 font-indie-flower text-2xl text-black ${
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
                  className="ml-auto rounded-xl bg-[#A5D8F3] px-8 py-4 font-indie-flower text-2xl text-black"
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
                  {products.map(({ item, priceEntry }) => (
                    <article
                      key={item.id}
                      className={`rounded-[20px] bg-[#FFF2C0] p-3 ${
                        priceEntry ? "" : "opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-4 rounded-2xl bg-white p-3">
                        <div
                          className="h-16 w-28 shrink-0 rounded-xl bg-[#FFF9EE] sm:h-20 sm:w-40"
                          aria-hidden="true"
                        />
                        <p className="font-indie-flower text-2xl text-black">
                          {priceEntry?.productName ?? item.name}
                        </p>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-white p-3 font-indie-flower text-xl text-black">
                          Quantity: {item.quantity}
                        </div>
                        <div className="rounded-xl bg-white p-3 font-indie-flower text-xl text-black">
                          {priceEntry
                            ? `Price: ${formatPrice(priceEntry.unitPrice)}`
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
                    className="rounded-xl border-0 bg-[#FFC518] px-8 py-4 font-indie-flower text-2xl text-black"
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

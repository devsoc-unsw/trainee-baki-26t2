"use client";

import { useState } from "react";
import Header from "../../../components/Header";
import ShoppingListCard from "../../../components/ShoppingListCard";

type ComparisonView = "cheapest" | "location";

type Product = {
  id: number;
  name: string;
  quantity: number;
  price: number;
};

type StoreOffer = {
  storeName: string;
  products: Product[];
};

const storeOffers: Record<ComparisonView, StoreOffer> = {
  cheapest: {
    storeName: "Coles",
    products: [
      {
        id: 1,
        name: "Coles Free Range Eggs x12",
        quantity: 1,
        price: 6.5,
      },
      {
        id: 2,
        name: "Coles Unsalted Butter 250g",
        quantity: 1,
        price: 4.8,
      },
      {
        id: 3,
        name: "Coles Full Cream Milk 2L",
        quantity: 1,
        price: 3.1,
      },
      {
        id: 4,
        name: "Coles White Sugar 1kg",
        quantity: 1,
        price: 2.2,
      },
    ],
  },
  location: {
    storeName: "Woolworths",
    products: [
      {
        id: 1,
        name: "Woolworths Free Range Eggs x12",
        quantity: 1,
        price: 7,
      },
      {
        id: 2,
        name: "Woolworths Unsalted Butter 500g",
        quantity: 1,
        price: 7,
      },
      {
        id: 3,
        name: "Woolworths Full Cream Milk 2L",
        quantity: 1,
        price: 3.3,
      },
      {
        id: 4,
        name: "Woolworths White Sugar 1kg",
        quantity: 1,
        price: 2.4,
      },
    ],
  },
};

const formatPrice = (price: number) => `$${price.toFixed(2)}`;

export default function ComparePage() {
  const [activeView, setActiveView] =
    useState<ComparisonView>("cheapest");
  const activeOffer = storeOffers[activeView];
  const total = activeOffer.products.reduce(
    (sum, product) => sum + product.price * product.quantity,
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
            aria-label={`${activeOffer.storeName} comparison`}
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

            <div className="mt-6 space-y-4">
              {activeOffer.products.map((product) => (
                <article
                  key={product.id}
                  className="rounded-[20px] bg-[#FFF2C0] p-3"
                >
                  <div className="flex items-center gap-4 rounded-2xl bg-white p-3">
                    <div
                      className="h-16 w-28 shrink-0 rounded-xl bg-[#FFF9EE] sm:h-20 sm:w-40"
                      aria-hidden="true"
                    />
                    <p className="font-indie-flower text-2xl text-black">
                      {product.name}
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white p-3 font-indie-flower text-xl text-black">
                      Quantity: {product.quantity}
                    </div>
                    <div className="rounded-xl bg-white p-3 font-indie-flower text-xl text-black">
                      Price: {formatPrice(product.price)}
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
          </section>
        </div>
      </main>
    </>
  );
}

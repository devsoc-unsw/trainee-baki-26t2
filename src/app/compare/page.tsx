"use client";

import { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ShoppingListCard from "../../../components/ShoppingListCard";
import { getStoreComparison } from "../../lib/api";
import { useShoppingList } from "../../context/ShoppingListContext";
import type { StoreOffer } from "../../types";

type ComparisonView = "cheapest" | "closest";

const storeIdByView: Record<ComparisonView, string> = {
  cheapest: "coles",
  closest: "woolworths",
};

const formatPrice = (price: number) => `$${price.toFixed(2)}`;

export default function ComparePage() {
  const { items } = useShoppingList();
  const [activeView, setActiveView] =
    useState<ComparisonView>("cheapest");
  const requestKey = JSON.stringify(items);
  const [response, setResponse] = useState<{
    requestKey: string;
    offers: StoreOffer[];
  } | null>(null);
  const [errorRequestKey, setErrorRequestKey] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let ignore = false;

    getStoreComparison(items)
      .then((nextOffers) => {
        if (ignore) return;
        setResponse({ requestKey, offers: nextOffers });
      })
      .catch(() => {
        if (ignore) return;
        setErrorRequestKey(requestKey);
      });

    return () => {
      ignore = true;
    };
  }, [items, requestKey]);

  const offers =
    response?.requestKey === requestKey ? response.offers : [];
  const status =
    response?.requestKey === requestKey
      ? "success"
      : errorRequestKey === requestKey
        ? "error"
        : "loading";
  const activeOffer = offers.find(
    (offer) => offer.store.id === storeIdByView[activeView],
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
            aria-label={
              activeOffer
                ? `${activeOffer.store.name} comparison`
                : "Store comparison"
            }
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
                onClick={() => setActiveView("closest")}
                aria-pressed={activeView === "closest"}
                className={`rounded-xl px-8 py-4 font-indie-flower text-2xl text-black focus:ring-2 focus:ring-[#FFC518] focus:ring-offset-2 focus:outline-none ${
                  activeView === "closest"
                    ? "bg-[#FFC518]"
                    : "bg-[#FFF2C0]"
                }`}
              >
                Location
              </button>
              {activeView === "closest" && (
                <button
                  type="button"
                  className="ml-auto rounded-xl bg-[#A5D8F3] px-8 py-4 font-indie-flower text-2xl text-black focus:ring-2 focus:ring-[#FFC518] focus:ring-offset-2 focus:outline-none"
                >
                  See Map
                </button>
              )}
            </div>

            {status === "loading" ? (
              <p className="mt-6 font-indie-flower text-2xl text-black">
                Loading store comparison...
              </p>
            ) : status === "error" || !activeOffer ? (
              <p className="mt-6 font-indie-flower text-2xl text-black">
                We couldn&apos;t compare stores right now — please try
                again.
              </p>
            ) : items.length === 0 ? (
              <p className="mt-6 font-indie-flower text-2xl text-black">
                Your list is empty — add some items to compare stores.
              </p>
            ) : (
              <>
                <div className="mt-6 space-y-4">
                  {activeOffer.products.map((product, index) => (
                    <article
                      key={items[index]?.id ?? `${product.listItemName}-${index}`}
                      className={`rounded-[20px] bg-[#FFF2C0] p-3 ${
                        product.available ? "" : "opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-4 rounded-2xl bg-white p-3">
                        <div
                          className="h-16 w-28 shrink-0 rounded-xl bg-[#FFF9EE] sm:h-20 sm:w-40"
                          aria-hidden="true"
                        />
                        <p className="font-indie-flower text-2xl text-black">
                          {product.displayName}
                        </p>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-white p-3 font-indie-flower text-xl text-black">
                          Quantity:{" "}
                          {product.available ? product.packsNeeded : "—"}
                        </div>
                        <div className="rounded-xl bg-white p-3 font-indie-flower text-xl text-black">
                          {product.available
                            ? `Price: ${formatPrice(product.lineTotal)}`
                            : `Not available at ${activeOffer.store.name}`}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="rounded-xl bg-[#FFF2C0] px-6 py-4 font-indie-flower text-2xl text-black">
                    Total: {formatPrice(activeOffer.total)}
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

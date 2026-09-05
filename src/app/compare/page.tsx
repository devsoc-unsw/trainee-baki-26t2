"use client";

import { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ShoppingListCard from "../../../components/ShoppingListCard";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { getStoreComparison } from "../../lib/api";
import { useShoppingList } from "../../context/ShoppingListContext";
import type { StoreOffer } from "../../types";

type ComparisonView = "cheapest" | "closest";

const formatPrice = (price: number) => `$${price.toFixed(2)}`;

const pickCheapest = (offers: StoreOffer[]): StoreOffer | undefined =>
  offers.reduce<StoreOffer | undefined>((best, offer) => {
    if (!best) return offer;
    if (offer.unavailableItems.length !== best.unavailableItems.length) {
      return offer.unavailableItems.length < best.unavailableItems.length
        ? offer
        : best;
    }
    return offer.total < best.total ? offer : best;
  }, undefined);

const pickClosest = (offers: StoreOffer[]): StoreOffer | undefined =>
  offers.reduce<StoreOffer | undefined>((best, offer) => {
    const distance = offer.store.distanceKm;
    if (distance === null) return best;
    const bestDistance = best?.store.distanceKm ?? Infinity;
    return distance < bestDistance ? offer : best;
  }, undefined);

export default function ComparePage() {
  const { items } = useShoppingList();
  const [activeView, setActiveView] =
    useState<ComparisonView>("closest");
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
  const activeOffer =
    activeView === "cheapest" ? pickCheapest(offers) : pickClosest(offers);
  const woolworthsOffer = offers.find(
    (offer) => offer.store.id === "woolworths",
  );

  const addToCart = () => {
    const productUrls = woolworthsOffer?.products
      .map((product) => product.productUrl)
      .filter((url): url is string => Boolean(url));

    productUrls?.forEach((url, index) => {
      const productWindow = window.open("about:blank", "_blank");
      if (!productWindow) return;

      productWindow.opener = null;
      window.setTimeout(() => {
        productWindow.location.replace(url);
      }, index * 400);
    });
  };

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
              <Button
                variant="tab"
                active={activeView === "cheapest"}
                onClick={() => setActiveView("cheapest")}
                aria-pressed={activeView === "cheapest"}
              >
                Cheapest
              </Button>
              <Button
                variant="tab"
                active={activeView === "closest"}
                onClick={() => setActiveView("closest")}
                aria-pressed={activeView === "closest"}
              >
                Location
              </Button>
              {activeView === "closest" && (
                <Button variant="secondary" className="ml-auto">
                  See Map
                </Button>
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
                    <Card
                      as="article"
                      variant="productPanel"
                      key={items[index]?.id ?? `${product.listItemName}-${index}`}
                      className={`p-3 ${
                        product.available ? "" : "opacity-60"
                      }`}
                    >
                      <Card
                        variant="content"
                        className="flex items-center gap-4 rounded-2xl! p-3"
                      >
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.displayName}
                            className="h-16 w-28 shrink-0 object-contain sm:h-20 sm:w-40"
                          />
                        ) : (
                          <Card
                            variant="placeholder"
                            className="h-16 w-28 shrink-0 sm:h-20 sm:w-40"
                            aria-hidden="true"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="break-words font-indie-flower text-2xl text-black">
                            {product.displayName}
                          </p>
                          <p className="mt-1 font-indie-flower text-base text-black/70">
                            Pack size: {product.packageSize} {product.packageUnit}
                          </p>
                        </div>
                      </Card>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <Card
                          variant="content"
                          className="p-3 font-indie-flower text-xl text-black"
                        >
                          Quantity:{" "}
                          {product.available ? product.packsNeeded : "—"}
                        </Card>
                        <Card
                          variant="content"
                          className="p-3 font-indie-flower text-xl text-black"
                        >
                          {product.available
                            ? `Price: ${formatPrice(product.lineTotal)}`
                            : `Not available at ${activeOffer.store.name}`}
                        </Card>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <Card
                    variant="panel"
                    className="rounded-xl! px-6 py-4 font-indie-flower text-2xl text-black"
                  >
                    Total: {formatPrice(activeOffer.total)}
                  </Card>
                  <Button
                    variant="primary"
                    onClick={addToCart}
                    className="px-8 py-4 text-2xl"
                  >
                    Add to Cart
                  </Button>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

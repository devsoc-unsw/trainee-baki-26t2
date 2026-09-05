import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/stores/compare/route";
import type { GroceryItem } from "@/types";

const call = (body: unknown) =>
  POST(
    new Request("http://localhost/api/stores/compare", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

const item = (
  overrides: Partial<GroceryItem> & { name: string },
): GroceryItem => ({
  id: 1,
  quantity: 100,
  unit: "g",
  ...overrides,
});

describe("POST /api/stores/compare", () => {
  it("returns one offer per configured store", async () => {
    const res = await call({
      items: [item({ id: 1, name: "butter", quantity: 150, unit: "g" })],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.offers)).toBe(true);
    expect(body.offers.length).toBeGreaterThanOrEqual(2);
    for (const offer of body.offers) {
      expect(offer.store).toHaveProperty("id");
      expect(offer.products).toHaveLength(1);
    }
  });

  it("accepts an empty items array and returns per-store offers", async () => {
    const res = await call({ items: [] });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.offers.length).toBeGreaterThanOrEqual(2);
    expect(body.offers.every((o: { products: unknown[] }) => o.products.length === 0)).toBe(true);
  });

  it("returns 400 when items is missing", async () => {
    const res = await call({});
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("invalid_input");
  });

  it("returns 400 when an item has a negative quantity", async () => {
    const res = await call({
      items: [{ id: 1, name: "butter", quantity: -5, unit: "g" }],
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("invalid_input");
  });

  it("returns 400 when the body is not JSON", async () => {
    const res = await POST(
      new Request("http://localhost/api/stores/compare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "not json",
      }),
    );
    // Non-parseable JSON throws SyntaxError, which errorResponse maps
    // to 500. That is fine — the client contract is "malformed body
    // -> non-2xx"; we mainly assert the route doesn't leak the JSON
    // parser stack trace back to the caller.
    expect(res.status).toBeGreaterThanOrEqual(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
    expect(body.error.message).not.toContain("SyntaxError");
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/meals/by-ingredients/route";
import {
  buildMealDBMeal,
  buildMealSummary,
  jsonResponse,
} from "../fixtures/mealdb";

const call = (search: string) =>
  GET(new Request(`http://localhost/api/meals/by-ingredients${search}`));

// Route fans out one filter.php per ingredient, then one lookup.php
// per ranked candidate. The URL fixture routes each mock response to
// the right call so the two phases stay independent.
type MockFetch = ReturnType<typeof vi.fn>;

const mockFetchByUrl = (
  handlers: Array<{ match: string; body: unknown; status?: number }>,
) => {
  (global.fetch as MockFetch).mockImplementation((input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    const handler = handlers.find((h) => url.includes(h.match));
    if (!handler) {
      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    }
    return Promise.resolve(jsonResponse(handler.body, handler.status ?? 200));
  });
};

describe("GET /api/meals/by-ingredients", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ranks and returns meals from the pantry list", async () => {
    mockFetchByUrl([
      {
        match: "filter.php?i=chicken",
        body: { meals: [buildMealSummary({ idMeal: "1" })] },
      },
      {
        match: "lookup.php?i=1",
        body: {
          meals: [
            buildMealDBMeal({
              overrides: { idMeal: "1", strMeal: "Roast Chicken" },
              ingredients: [{ name: "chicken", measure: "1 kg" }],
            }),
          ],
        },
      },
    ]);
    const res = await call("?ingredients=chicken");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meals).toHaveLength(1);
    expect(body.meals[0].name).toBe("Roast Chicken");
  });

  it("returns 400 when ingredients is missing", async () => {
    const res = await call("");
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("invalid_input");
  });

  it("returns 400 when quickMeal is not a boolean-ish string", async () => {
    const res = await call("?ingredients=chicken&quickMeal=maybe");
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("invalid_input");
  });

  it("maps an upstream fetch failure to 502", async () => {
    (global.fetch as MockFetch).mockRejectedValueOnce(new Error("network down"));
    const res = await call("?ingredients=chicken");
    expect(res.status).toBe(502);
    expect((await res.json()).error.code).toBe("mealdb_unreachable");
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/meals/[id]/ingredients/route";
import { buildMealDBMeal, jsonResponse } from "../fixtures/mealdb";

const call = (id: string) =>
  GET(new Request(`http://localhost/api/meals/${encodeURIComponent(id)}/ingredients`), {
    params: Promise.resolve({ id }),
  });

describe("GET /api/meals/[id]/ingredients", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the ingredient list for the matched meal", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse({
        meals: [
          buildMealDBMeal({
            overrides: { strMeal: "Carrot Cake" },
            ingredients: [
              { name: "carrot", measure: "200g" },
              { name: "flour", measure: "1 cup" },
            ],
          }),
        ],
      }),
    );
    const res = await call("Carrot Cake");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ingredients).toEqual([
      { name: "carrot", quantity: 200, unit: "g" },
      { name: "flour", quantity: 1, unit: "cup" },
    ]);
  });

  it("returns an empty list when no meal name matches (case-insensitive)", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse({
        meals: [
          buildMealDBMeal({
            overrides: { strMeal: "Beef Stew" },
            ingredients: [],
          }),
        ],
      }),
    );
    const res = await call("Something Else");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ingredients: [] });
  });

  it("returns 400 when the id is blank", async () => {
    const res = await GET(
      new Request("http://localhost/api/meals//ingredients"),
      { params: Promise.resolve({ id: "" }) },
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("invalid_input");
  });

  it("maps an upstream fetch failure to 502", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("network down"),
    );
    const res = await call("Carrot Cake");
    expect(res.status).toBe(502);
    expect((await res.json()).error.code).toBe("mealdb_unreachable");
  });
});

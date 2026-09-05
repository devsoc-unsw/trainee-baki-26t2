import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/meals/search/route";
import { buildMealDBMeal, jsonResponse } from "../fixtures/mealdb";

const call = (search: string) =>
  GET(new Request(`http://localhost/api/meals/search${search}`));

describe("GET /api/meals/search", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the first matching meal on the happy path", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse({
        meals: [
          buildMealDBMeal({
            strMeal: "Carrot Cake",
            ingredients: [{ name: "carrot", measure: "200g" }],
          }),
        ],
      }),
    );
    const res = await call("?name=Carrot%20Cake");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meal.name).toBe("Carrot Cake");
    expect(body.meal.ingredients).toEqual([
      { name: "carrot", quantity: 200, unit: "g" },
    ]);
  });

  it("returns { meal: null } when no candidate satisfies restrictions", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse({
        meals: [
          buildMealDBMeal({
            strMeal: "Beef Stew",
            ingredients: [{ name: "beef", measure: "500g" }],
          }),
        ],
      }),
    );
    const res = await call("?name=Beef%20Stew&restrictions=vegan");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ meal: null });
  });

  it("returns 400 when name is missing", async () => {
    const res = await call("");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("invalid_input");
  });

  it("returns 400 when restrictions contains an unknown tag", async () => {
    const res = await call("?name=Carrot%20Cake&restrictions=wibble");
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("invalid_input");
  });

  it("maps an upstream fetch failure to 502", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("network down"),
    );
    const res = await call("?name=Carrot%20Cake");
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error.code).toBe("mealdb_unreachable");
  });

  it("maps a non-2xx upstream response to 502", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse({ error: "boom" }, 503),
    );
    const res = await call("?name=Carrot%20Cake");
    expect(res.status).toBe(502);
    expect((await res.json()).error.code).toBe("mealdb_bad_status");
  });
});

import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/stores/route";

describe("GET /api/stores", () => {
  it("returns the mocked store list", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.stores)).toBe(true);
    expect(body.stores.length).toBeGreaterThan(0);
    expect(body.stores[0]).toHaveProperty("id");
    expect(body.stores[0]).toHaveProperty("name");
    expect(body.stores[0]).toHaveProperty("latitude");
    expect(body.stores[0]).toHaveProperty("longitude");
  });
});

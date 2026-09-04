import { describe, expect, it } from "vitest";
import { USER_LOCATION, haversineKm } from "@/lib/geo";

describe("haversineKm", () => {
  it("returns 0 for identical points", () => {
    expect(haversineKm(USER_LOCATION, USER_LOCATION)).toBe(0);
  });

  it("is symmetric", () => {
    const a = { latitude: -33.8688, longitude: 151.2093 };
    const b = { latitude: -37.8136, longitude: 144.9631 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 6);
  });

  it("approximates the great-circle distance Sydney to Melbourne", () => {
    const sydney = { latitude: -33.8688, longitude: 151.2093 };
    const melbourne = { latitude: -37.8136, longitude: 144.9631 };
    expect(haversineKm(sydney, melbourne)).toBeGreaterThan(700);
    expect(haversineKm(sydney, melbourne)).toBeLessThan(720);
  });

  it("returns half the earth's circumference for antipodal points", () => {
    const a = { latitude: 0, longitude: 0 };
    const b = { latitude: 0, longitude: 180 };
    expect(haversineKm(a, b)).toBeCloseTo(Math.PI * 6371, 3);
  });

  it("handles short distances within a city", () => {
    const a = { latitude: -33.8796, longitude: 151.2053 };
    const b = { latitude: -33.8659, longitude: 151.2073 };
    const distance = haversineKm(a, b);
    expect(distance).toBeGreaterThan(1);
    expect(distance).toBeLessThan(2);
  });
});

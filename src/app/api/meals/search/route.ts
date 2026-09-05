import { z } from "zod";

import { errorResponse } from "@/server/errors";
import { getMealByName } from "@/server/meals";
import type { DietaryTag } from "@/types";

// Ceiling on how long we'll wait for TheMealDB before treating the
// call as an upstream failure and returning 502. TheMealDB usually
// answers in well under a second; five seconds is generous enough to
// absorb a bad-network moment without letting a hung upstream pin a
// client request open.
const UPSTREAM_TIMEOUT_MS = 5000;

const DIETARY_TAGS = [
  "vegan",
  "vegetarian",
  "halal",
  "nut-allergy",
] as const satisfies readonly DietaryTag[];

const parseRestrictions = (raw: string | null): DietaryTag[] => {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0) as DietaryTag[];
};

const querySchema = z.object({
  name: z.string().trim().min(1, "must not be blank"),
  restrictions: z.array(z.enum(DIETARY_TAGS)).default([]),
});

/**
 * GET /api/meals/search?name=&restrictions=
 *
 * Returns the first meal whose name matches `name` in TheMealDB and
 * whose derived dietary tags satisfy every restriction. `restrictions`
 * is a comma-separated list of DietaryTag values; omit for no filter.
 *
 * Response: { meal: Meal | null } (null when no match).
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const parsed = querySchema.parse({
      name: url.searchParams.get("name"),
      restrictions: parseRestrictions(url.searchParams.get("restrictions")),
    });
    const meal = await getMealByName(
      parsed.name,
      parsed.restrictions,
      AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    );
    return Response.json({ meal });
  } catch (err) {
    return errorResponse(err);
  }
}

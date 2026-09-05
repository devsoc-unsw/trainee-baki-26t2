import { z } from "zod";

import { errorResponse } from "@/server/errors";
import { getMealsFromIngredients } from "@/server/meals";

// Ceiling on how long we'll wait for TheMealDB fan-out to finish
// before treating the whole request as an upstream failure. This
// route calls filter.php once per ingredient plus up to eight
// lookup.php follow-ups in parallel; a single shared AbortSignal
// cancels every outstanding fetch the moment the deadline hits so a
// slow shard cannot pin the entire request open.
const UPSTREAM_TIMEOUT_MS = 8000;

const booleanFlag = z
  .union([z.literal("true"), z.literal("false"), z.literal(""), z.null()])
  .transform((value) => value === "true");

const parseIngredients = (raw: string | null): string[] => {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

const querySchema = z.object({
  ingredients: z
    .array(z.string().min(1))
    .min(1, "must supply at least one ingredient")
    .max(20, "at most 20 ingredients per request"),
  quickMeal: booleanFlag,
  highProtein: booleanFlag,
});

/**
 * GET /api/meals/by-ingredients?ingredients=&quickMeal=&highProtein=
 *
 * Suggests meals matching a comma-separated pantry list. quickMeal
 * and highProtein are optional boolean filters applied after
 * heuristic tagging on the server.
 *
 * Response: { meals: Meal[] }.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const parsed = querySchema.parse({
      ingredients: parseIngredients(url.searchParams.get("ingredients")),
      quickMeal: url.searchParams.get("quickMeal"),
      highProtein: url.searchParams.get("highProtein"),
    });
    const meals = await getMealsFromIngredients(
      parsed.ingredients,
      { quickMeal: parsed.quickMeal, highProtein: parsed.highProtein },
      AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    );
    return Response.json({ meals });
  } catch (err) {
    return errorResponse(err);
  }
}

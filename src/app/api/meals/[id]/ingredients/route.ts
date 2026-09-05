import { z } from "zod";

import { errorResponse } from "@/server/errors";
import { getIngredientsForMeal } from "@/server/meals";

const UPSTREAM_TIMEOUT_MS = 5000;

const paramsSchema = z.object({
  id: z.string().trim().min(1, "must not be blank"),
});

/**
 * GET /api/meals/[id]/ingredients
 *
 * Returns the ingredient list for a previously-selected meal. The
 * [id] segment is the meal name (Meal.id in our domain model), URL
 * decoded from the path — TheMealDB is only searchable by name.
 *
 * Response: { ingredients: Ingredient[] }.
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const params = paramsSchema.parse(await ctx.params);
    const ingredients = await getIngredientsForMeal(
      params.id,
      AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    );
    return Response.json({ ingredients });
  } catch (err) {
    return errorResponse(err);
  }
}

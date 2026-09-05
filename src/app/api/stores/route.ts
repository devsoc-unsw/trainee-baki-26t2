import { USER_LOCATION } from "@/lib/geo";
import { errorResponse } from "@/server/errors";
import { getAllStores } from "@/server/catalogue";

/**
 * GET /api/stores
 *
 * Returns the list of stores the catalogue providers expose, with
 * each store's distance from {@link USER_LOCATION} filled in.
 * Pricing is not included here — clients that want prices should
 * call /api/stores/compare with a shopping list.
 *
 * Response: { stores: Store[] }.
 */
export function GET(): Response {
  try {
    return Response.json({ stores: getAllStores(USER_LOCATION) });
  } catch (err) {
    return errorResponse(err);
  }
}

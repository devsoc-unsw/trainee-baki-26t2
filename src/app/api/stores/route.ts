import { errorResponse } from "@/server/errors";
import { stores } from "@/lib/mockData";

/**
 * GET /api/stores
 *
 * Returns the list of stores the app knows about, without pricing.
 * Distances are omitted here — clients that want a distance for the
 * user's current location should call /api/stores/compare, which
 * needs a shopping list anyway to be useful.
 *
 * Response: { stores: Store[] }.
 */
export async function GET(): Promise<Response> {
  try {
    return Response.json({ stores });
  } catch (err) {
    return errorResponse(err);
  }
}

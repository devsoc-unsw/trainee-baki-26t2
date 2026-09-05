import { z } from "zod";

import { errorResponse } from "@/server/errors";
import { getStoreComparison } from "@/server/pricing";

const groceryItemSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  quantity: z.number().finite().nonnegative(),
  unit: z.string(),
});

const bodySchema = z.object({
  items: z.array(groceryItemSchema).max(200),
});

/**
 * POST /api/stores/compare
 *
 * Body: { items: GroceryItem[] }
 * Response: { offers: StoreOffer[] }
 *
 * Public by project design — no auth, no rate-limiting here.
 * Validation is defensive against malformed client payloads only.
 * Pricing is CPU-only (see src/server/pricing.ts), so there is no
 * upstream timeout — no external network calls happen in this route.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const raw = await request.json();
    const { items } = bodySchema.parse(raw);
    const offers = getStoreComparison(items);
    return Response.json({ offers });
  } catch (err) {
    return errorResponse(err);
  }
}

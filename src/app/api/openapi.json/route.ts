import { openApiSpec } from "@/server/openapi";

/**
 * GET /api/openapi.json
 *
 * Serves the hand-maintained OpenAPI 3.1 spec that describes every
 * public route. Consumed by the Swagger UI page at /api/docs and by
 * any external tooling (Postman, code generators) that wants a
 * schema.
 */
export function GET(): Response {
  return Response.json(openApiSpec);
}

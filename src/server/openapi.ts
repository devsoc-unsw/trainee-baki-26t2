import "server-only";

/**
 * Hand-maintained OpenAPI 3.1 specification for the public API.
 *
 * Kept in code rather than a static JSON file so schema definitions
 * can be reused across routes and edited alongside them. If a route
 * signature changes, this document must change too — CI does not
 * check the mapping.
 */
export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Let Him Cook API",
    version: "0.1.0",
    description:
      "Public HTTP API for the Let Him Cook shopping-list and recipe " +
      "app. **Every endpoint is public and requires no authentication.** " +
      "Credentials sent to any of these routes are ignored. There is no " +
      "rate limiting; treat the API as best-effort. Errors are returned " +
      "as `{ error: { code, message } }` with 400 for invalid input, 502 " +
      "when TheMealDB is unreachable, and 500 for unexpected failures.",
  },
  servers: [
    {
      url: "/",
      description: "Same-origin (relative) — deploy target agnostic.",
    },
  ],
  paths: {
    "/api/meals/search": {
      get: {
        summary: "Look up a meal by name",
        description:
          "Returns the first meal whose name matches `name` in " +
          "TheMealDB and whose derived dietary tags satisfy every " +
          "restriction. `restrictions` is a comma-separated list of " +
          "DietaryTag values; omit for no filter.",
        parameters: [
          {
            name: "name",
            in: "query",
            required: true,
            schema: { type: "string", minLength: 1 },
            example: "Carrot Cake",
          },
          {
            name: "restrictions",
            in: "query",
            required: false,
            schema: { type: "string" },
            description:
              "Comma-separated list of DietaryTag values, e.g. " +
              "`vegan,halal`. Blank means no restrictions.",
            example: "vegetarian",
          },
        ],
        responses: {
          "200": {
            description: "Search completed. Meal is null when nothing matches.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["meal"],
                  properties: {
                    meal: {
                      oneOf: [
                        { $ref: "#/components/schemas/Meal" },
                        { type: "null" },
                      ],
                    },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/api/meals/by-ingredients": {
      get: {
        summary: "Suggest meals from a pantry ingredient list",
        description:
          "Ranks meals by how many of the supplied ingredients they " +
          "use, then filters by `quickMeal` and `highProtein`.",
        parameters: [
          {
            name: "ingredients",
            in: "query",
            required: true,
            schema: { type: "string" },
            description:
              "Comma-separated list of ingredient names; must contain " +
              "at least one non-blank entry and no more than 20.",
            example: "eggs,milk,butter",
          },
          {
            name: "quickMeal",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["true", "false"] },
            example: "true",
          },
          {
            name: "highProtein",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["true", "false"] },
            example: "false",
          },
        ],
        responses: {
          "200": {
            description: "Ranked and filtered meal suggestions.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["meals"],
                  properties: {
                    meals: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Meal" },
                    },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/api/meals/{id}/ingredients": {
      get: {
        summary: "Ingredient list for a meal",
        description:
          "Returns the ingredient list for the meal whose id (the " +
          "meal name, in this app's domain model) matches `{id}`.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", minLength: 1 },
            example: "Carrot Cake",
          },
        ],
        responses: {
          "200": {
            description: "Ingredient list (empty when no match).",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ingredients"],
                  properties: {
                    ingredients: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Ingredient" },
                    },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/api/stores": {
      get: {
        summary: "List known stores",
        description:
          "Returns the stores the app knows about without pricing. " +
          "Distances are omitted here — call /api/stores/compare for a " +
          "per-store distance and price for a specific list.",
        responses: {
          "200": {
            description: "Store list.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["stores"],
                  properties: {
                    stores: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Store" },
                    },
                  },
                },
              },
            },
          },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/api/stores/compare": {
      post: {
        summary: "Compare stores for a shopping list",
        description:
          "Prices each item against every known store's catalogue and " +
          "returns one StoreOffer per store, including line totals, " +
          "unavailable items, and the store's distance from the fixed " +
          "user location.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["items"],
                properties: {
                  items: {
                    type: "array",
                    maxItems: 200,
                    items: { $ref: "#/components/schemas/GroceryItem" },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Per-store offers.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["offers"],
                  properties: {
                    offers: {
                      type: "array",
                      items: { $ref: "#/components/schemas/StoreOffer" },
                    },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
  },
  components: {
    schemas: {
      DietaryTag: {
        type: "string",
        enum: ["vegan", "vegetarian", "halal", "nut-allergy"],
      },
      Ingredient: {
        type: "object",
        required: ["name", "quantity", "unit"],
        properties: {
          name: { type: "string" },
          quantity: {
            oneOf: [{ type: "number" }, { type: "null" }],
            description:
              "null when the raw measure could not be parsed (e.g. " +
              "'to taste').",
          },
          unit: { type: "string" },
        },
      },
      Meal: {
        type: "object",
        required: [
          "id",
          "name",
          "description",
          "attribution",
          "imageUrl",
          "ingredients",
          "dietaryTags",
          "isQuickMeal",
          "isHighProtein",
        ],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          attribution: { type: "string" },
          imageUrl: { oneOf: [{ type: "string" }, { type: "null" }] },
          ingredients: {
            type: "array",
            items: { $ref: "#/components/schemas/Ingredient" },
          },
          dietaryTags: {
            type: "array",
            items: { $ref: "#/components/schemas/DietaryTag" },
          },
          isQuickMeal: { type: "boolean" },
          isHighProtein: { type: "boolean" },
        },
      },
      Store: {
        type: "object",
        required: ["id", "name", "distanceKm", "latitude", "longitude"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          distanceKm: { oneOf: [{ type: "number" }, { type: "null" }] },
          latitude: { oneOf: [{ type: "number" }, { type: "null" }] },
          longitude: { oneOf: [{ type: "number" }, { type: "null" }] },
        },
      },
      StoreProduct: {
        type: "object",
        required: [
          "listItemName",
          "displayName",
          "packageSize",
          "packageUnit",
          "packagePrice",
          "packsNeeded",
          "lineTotal",
          "imageUrl",
          "available",
        ],
        properties: {
          listItemName: { type: "string" },
          displayName: { type: "string" },
          packageSize: { type: "number" },
          packageUnit: { type: "string" },
          packagePrice: {
            type: "number",
            description: "Price for one complete package.",
          },
          packsNeeded: { type: "integer", minimum: 0 },
          lineTotal: { type: "number" },
          imageUrl: { oneOf: [{ type: "string" }, { type: "null" }] },
          available: { type: "boolean" },
        },
      },
      StoreOffer: {
        type: "object",
        required: ["store", "products", "total", "unavailableItems"],
        properties: {
          store: { $ref: "#/components/schemas/Store" },
          products: {
            type: "array",
            items: { $ref: "#/components/schemas/StoreProduct" },
          },
          total: { type: "number" },
          unavailableItems: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
      GroceryItem: {
        type: "object",
        required: ["id", "name", "quantity", "unit"],
        properties: {
          id: { type: "integer" },
          name: { type: "string", minLength: 1 },
          quantity: { type: "number", minimum: 0 },
          unit: { type: "string" },
        },
      },
      ErrorBody: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    responses: {
      BadRequest: {
        description: "Input failed validation.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorBody" },
            example: {
              error: {
                code: "invalid_input",
                message: "name: must not be blank",
              },
            },
          },
        },
      },
      UpstreamFailure: {
        description: "TheMealDB failed or timed out.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorBody" },
            example: {
              error: {
                code: "mealdb_unreachable",
                message: "TheMealDB request failed: fetch failed",
              },
            },
          },
        },
      },
      InternalError: {
        description: "Unexpected server error.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorBody" },
            example: {
              error: {
                code: "internal_error",
                message: "Unexpected server error",
              },
            },
          },
        },
      },
    },
  },
} as const;

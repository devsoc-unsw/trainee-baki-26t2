import "server-only";

import { ZodError } from "zod";

/**
 * Shape returned by every future route on failure. Kept intentionally
 * flat so a client can render `error.message` and use `error.code` for
 * programmatic decisions (retry, show a specific hint, etc.) without
 * having to introspect a nested payload.
 */
export interface ErrorBody {
  error: { code: string; message: string };
}

/**
 * Thrown when a caller-supplied value fails validation. Route
 * handlers should let this bubble up to {@link errorResponse}, which
 * maps it to HTTP 400.
 */
export class InvalidInputError extends Error {
  readonly code: string;

  /**
   * @param message - Human-readable explanation shown to the caller.
   * @param code - Machine-readable identifier for the specific
   *   validation failure. Defaults to a generic "invalid_input".
   */
  constructor(message: string, code = "invalid_input") {
    super(message);
    this.name = "InvalidInputError";
    this.code = code;
  }
}

/**
 * Thrown when an upstream dependency (TheMealDB, a store's price
 * feed, etc.) refuses or malforms a request. Route handlers should
 * let this bubble up to {@link errorResponse}, which maps it to HTTP
 * 502 — the correct status when *we* are the proxy and something we
 * depend on failed.
 */
export class UpstreamError extends Error {
  readonly code: string;

  /**
   * @param message - Human-readable explanation shown to the caller.
   *   Prefer stating which upstream failed rather than leaking raw
   *   response bodies.
   * @param code - Machine-readable identifier, e.g. "mealdb_failure".
   *   Defaults to a generic "upstream_failure".
   */
  constructor(message: string, code = "upstream_failure") {
    super(message);
    this.name = "UpstreamError";
    this.code = code;
  }
}

const jsonError = (status: number, code: string, message: string) =>
  Response.json({ error: { code, message } } satisfies ErrorBody, { status });

/**
 * Converts any thrown value into the standard error Response.
 *
 * @param err - The value caught in a route handler. Accepts `unknown`
 *   because `try/catch` in TypeScript surfaces it untyped.
 * @returns A `Response` whose body conforms to {@link ErrorBody} and
 *   whose status is 400 for validation failures, 502 for upstream
 *   failures, and 500 for anything else.
 *
 * Unrecognised errors are deliberately mapped to a generic 500 with a
 * fixed message rather than echoing `err.message` — otherwise an
 * internal stack trace or an ORM error string could leak to the
 * public. The original error is still `console.error`'d so operators
 * can see it in the server logs.
 */
export function errorResponse(err: unknown): Response {
  if (err instanceof InvalidInputError) {
    return jsonError(400, err.code, err.message);
  }
  if (err instanceof ZodError) {
    // Flatten the first issue: routes only need one clear reason for
    // rejecting a payload, and multi-issue reporting is a client-side
    // form concern rather than a public-API one.
    const issue = err.issues[0];
    const path = issue.path.length > 0 ? issue.path.join(".") : "input";
    return jsonError(400, "invalid_input", `${path}: ${issue.message}`);
  }
  if (err instanceof UpstreamError) {
    return jsonError(502, err.code, err.message);
  }

  console.error("Unhandled route error:", err);
  return jsonError(500, "internal_error", "Unexpected server error");
}

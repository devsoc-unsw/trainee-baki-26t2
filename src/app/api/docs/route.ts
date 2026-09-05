// Swagger UI is served via CDN rather than bundled as an npm dep;
// the UI is only used interactively by developers browsing the docs,
// so the extra ~1 MB of JS never needs to ship in the app's own
// client bundle. Version is pinned for reproducibility.
const SWAGGER_UI_VERSION = "5.17.14";

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Let Him Cook API — Docs</title>
    <link
      rel="stylesheet"
      href="https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.css"
    />
    <style>
      body { margin: 0; background: #fafafa; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js" crossorigin></script>
    <script>
      window.addEventListener("DOMContentLoaded", () => {
        window.ui = SwaggerUIBundle({
          url: "/api/openapi.json",
          dom_id: "#swagger-ui",
          deepLinking: true,
          docExpansion: "list",
          defaultModelsExpandDepth: 1,
        });
      });
    </script>
  </body>
</html>
`;

/**
 * GET /api/docs
 *
 * Serves an HTML page that loads Swagger UI from unpkg and points it
 * at /api/openapi.json. Intended for humans reading the docs; not
 * suitable for programmatic consumption (use /api/openapi.json for
 * that).
 */
export function GET(): Response {
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Cache aggressively; the HTML shell only changes when this
      // file changes. The spec itself is served by a separate route
      // and has its own cache posture.
      "cache-control": "public, max-age=3600",
    },
  });
}

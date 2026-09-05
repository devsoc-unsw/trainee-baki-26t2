// The real `server-only` package throws on import outside a React
// Server Component, which vitest is not. Aliased in vitest.config.ts
// so `import "server-only"` becomes this no-op during tests, while
// the production bundle still uses the real package (whose only job
// is to fail the client build if server code leaks into it).
export {};

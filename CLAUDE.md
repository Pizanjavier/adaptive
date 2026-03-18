# Adaptive Plugin — Claude Code Instructions

> Source of truth: `SPEC.md` (NEVER modify unless user explicitly says so)

## Project Overview

Adaptive is a Vite-native build intelligence tool for device-aware bundle optimization. It analyzes, splits, and serves optimized bundles based on device capabilities. Monorepo with packages: `core`, `vite-plugin`, `react`, `vue`, `svelte`, `next`, `nuxt`, `devtools`.

**Current phase:** Phase 3 (Meta-Frameworks) — `@adaptive-bundle/next` + `@adaptive-bundle/nuxt`

## Architecture Quick Reference

```
packages/
  core/          → Detection engine, scoring, tier resolution (~3KB gzipped, ZERO deps)
  vite-plugin/   → Build analysis, chunk splitting, CLI, reports (dev dep)
  react/         → adaptive() + Adaptive.High/Low + hooks (depends on core)
  vue/           → adaptive() + composables + AdaptiveHigh/Low (depends on core)
  svelte/        → adaptive() + stores + context (depends on core)
  next/          → withAdaptive() + Webpack plugin (depends on vite-plugin for analysis)
  nuxt/          → defineAdaptiveModule() + Nitro middleware (depends on vite-plugin)
```

**Stack:** TypeScript strict, pnpm workspaces + turborepo, tsup/unbuild, vitest, eslint, prettier

## Coding Rules (STRICT)

### File Size

- **MAX 200 lines per file.** No exceptions. Split into logical modules.
- If a file approaches 180 lines, proactively split before it grows.

### Performance

- `@adaptive-bundle/core` must stay under **3KB gzipped**. Every byte matters.
- Detection must complete in **<50ms** on any device.
- Zero runtime dependencies in core. None. Ever.
- No polyfills, no shims, no string tables, no lookup maps.
- Prefer direct property access over abstractions.
- Lazy-initialize expensive operations (WebGL context).

### Code Quality

- **KISS** — simplest solution that works. No premature abstractions.
- No unnecessary comments. Code should be self-documenting.
- No over-engineering. Three similar lines > one premature abstraction.
- TypeScript strict mode everywhere. Types are documentation.
- Explicit over implicit. Named exports over default exports (except component variants).

### Folder Structure

- **No folder with more than 8-10 files.** Subdivide into semantic subfolders.
- Folder names must be self-explanatory. No `utils/`, `helpers/`, `misc/`.
- Each package has: `src/`, `tests/`, `tsconfig.json`, `package.json`.

### Testing

- Vitest for all tests. Co-locate test files in `tests/` per package.
- Test behavior, not implementation.
- Size enforcement tests for core package from day one.

### Imports

- Relative imports within a package. Package imports across packages.
- No circular dependencies. Ever.
- Tree-shakeable exports only.

## Agent System

Use `.claude/agents/` for specialized tasks. Available agents:

| Agent                   | Purpose                                                                  |
| ----------------------- | ------------------------------------------------------------------------ |
| `architect.md`          | Orchestrates complex tasks, plans architecture, coordinates other agents |
| `core-engine.md`        | Detection, scoring, probes, tier resolution in `@adaptive-bundle/core`   |
| `build-intelligence.md` | Vite plugin, AST analysis, chunk splitting, CLI, reports                 |
| `react-adapter.md`      | React adapter, adaptive() API, hooks, Suspense integration               |
| `quality-guardian.md`   | Testing, size budgets, CI checks, linting, validation                    |

**When to use agents:** Multi-file changes, cross-package work, architectural decisions, complex debugging.

## Documentation Rules

- **Update this file** when discovering errors or patterns that should not be repeated.
- **Update `AI_CODING_FLOW.md`** after every user request with brief input/output summary.
- **Update `README.md`** when public API or setup changes.
- SPEC.md is READ-ONLY unless user explicitly requests changes.

## Known Errors & Patterns

- **Rollup hook timing:** `buildStart` fires before modules are loaded — use `buildEnd` for anything that reads the module graph (`getModuleIds`, `getModuleInfo`).
- **Scanner import paths are relative:** The scanner extracts relative paths (e.g., `./HeavyChart`) but Rollup module IDs are absolute. Always resolve relative paths against the boundary's `filePath` before looking up in the module graph.

## Project Conventions

- Monorepo managed by pnpm workspaces + turborepo
- Synchronized versioning across all packages
- ESM + CJS dual output via tsup
- All packages share: `tsconfig.base.json`, `.eslintrc`, `.prettierrc`
- Git: conventional commits, descriptive branch names

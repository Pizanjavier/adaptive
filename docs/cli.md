# CLI Reference

The `@adaptive/vite-plugin` ships a CLI for standalone analysis, scaffolding, and validation.

```bash
npx adaptive <command> [options]
```

---

## Commands

### `adaptive analyze`

Run bundle analysis on your source files without a full Vite build.

```bash
npx adaptive analyze
npx adaptive analyze --src=src/features
```

Scans all `.ts`, `.tsx`, `.js`, `.jsx` files for adaptive boundaries and reports their structure. Size data requires a full Vite build for accurate numbers.

| Flag    | Default | Description              |
| ------- | ------- | ------------------------ |
| `--src` | `src`   | Source directory to scan |

### `adaptive init <path>`

Scaffold an adaptive boundary for a heavy component. Creates a `.Lite` variant file and a `.adaptive` wrapper.

```bash
npx adaptive init src/components/MapView.tsx
```

Output:

```
Created:
  src/components/MapViewLite.tsx
  src/components/MapView.adaptive.tsx

Next: implement the lite variant in MapViewLite.tsx
```

The generated `.adaptive.tsx` file uses the two-variant pattern:

```tsx
import { adaptive } from '@adaptive/react';

const MapView = adaptive({
  high: () => import('./MapView'),
  low: () => import('./MapViewLite'),
  name: 'MapView',
});

export default MapView;
```

### `adaptive simulate <path>`

What-if analysis: shows what would happen if you wrapped a component in an adaptive boundary.

```bash
npx adaptive simulate src/components/HeavyChart.tsx
```

Lists external dependencies (potential high-variant exclusives) and local imports. Helps you estimate impact before committing to an adaptive boundary.

### `adaptive report`

Regenerate a report from cached build data. Requires a prior `vite build` with `report: true` and `reportFormat: 'json'`.

```bash
npx adaptive report
npx adaptive report --format=html --output=./reports
```

| Flag       | Default              | Description                              |
| ---------- | -------------------- | ---------------------------------------- |
| `--format` | `console`            | Output format: `console`, `html`, `json` |
| `--output` | `./adaptive-reports` | Output directory for HTML/JSON files     |

### `adaptive validate`

Check that all adaptive boundaries in your source are correctly configured (both variants present, import paths resolve).

```bash
npx adaptive validate
npx adaptive validate --src=src/features
```

Reports missing high/low variants, unresolved import paths, and other structural issues. Non-zero exit code on validation errors — suitable for CI.

---

## Global Options

| Flag              | Description                                |
| ----------------- | ------------------------------------------ |
| `--help`          | Show help message                          |
| `--src=<path>`    | Override source directory (default: `src`) |
| `--format=<fmt>`  | Report format: `console`, `html`, `json`   |
| `--output=<path>` | Output directory for reports               |

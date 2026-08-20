# Evidence Theme System

## Overview

Evidence's theme system provides hierarchical color customization with inheritance:

**Evidence Defaults → Organization → Project → Page → Component**

**Key Concepts**:

- **Sparse storage**: Only overrides stored, `null`/`undefined` = inherit
- **Server resolution**: Full theme resolved server-side for SEO and consistency
- **Client context**: `ThemeContext` provides reactive access to resolved theme
- **Auto-derivation**: UI tokens (foreground, borders, etc.) derived from base colors
- **Light/Dark**: All tokens have both variants, automatically switched

**User-Configurable Tokens**:

1. Background color (`colors.base`)
2. Up/down semantic colors (`colors.positive` / `colors.negative` — deltas, red-negatives, candlesticks)
   - Sidebar background (`colors.sidebarBackground` — published report sidebar; tracks the page background when unset) and sidebar nav font size (`sidebarFontSize` — follows the report size when unset)
3. Chart color palette (`colorPalettes.default`)
4. Color scale for heatmaps (`colorScales.default`)
5. Fonts (`fonts.heading` / `fonts.body` / `fonts.mono` — each `sans-serif | serif | mono`, mapped to the bundled Geist / Source Serif 4 / Geist Mono via `FONT_FAMILY_STACKS`)
6. Base font size (`baseFontSize` — scales the report type scale; 16px = identity)
7. Corner radius (`radius` — drives the `--radius` scale; a bare number is rem, e.g. `1` = `1rem`, or an explicit CSS length like `6px`)
8. Depth (`depth` — `flat | subtle | elevated` shadow on cards/inputs)
9. Density (`density` — `flush | compact | default | comfortable` report gap + card padding; flush = zero gutters. Flush groups tile edge-to-edge: Row measures each child's grid position into `data-flush-x/y`, base.css turns that into per-corner radius + border dedup vars consumed by tiles and nested input shells; per-tile shadows are suppressed, so flush groups render flat regardless of `depth`)
10. Chart defaults (`chart.gridlines`, `chart.baselines`, `chart.gridlineColor`, `chart.axisLabelColor`, `chart.baselineColor`, `chart.fontFamily`, `chart.barRadius`, `chart.smooth`, `chart.areaGradient`, `chart.animateIntro` — chart draw-in on first render, `chart.animateUpdates` — re-animate on data change)

Everything else is automatically derived or hardcoded.

**Style token plumbing**: config-level tokens are emitted by `generateThemeCSS` as
`--radius`, `--theme-font-*`, `--theme-font-scale`, `--theme-shadow-xs`,
`--theme-report-gap`, `--theme-card-padding`, and per-mode `--theme-positive` /
`--theme-negative`. `base.css` `@theme inline` keys (including the `--text-*` type
scale) reference these vars with the previous hardcoded values as fallbacks, so
unthemed surfaces render unchanged. Chart tokens flow through `buildThemes` onto each
mode's `Theme` and are consumed by `createTheme` in `echarts-themes.ts` (fallbacks:
border, mutedForeground, `fonts.body`). The `chart.animateIntro` / `chart.animateUpdates`
toggles drive ONLY ECharts animation (the `echarts` action zeroes the chart's hardcoded
`animationDuration` / `animationDurationUpdate` when a toggle is off); the theme never
touches CSS animations or transitions on the report surface.

**Editor**: the style tokens (fonts, sizing, radius, depth, density, chart,
up/down colors) are edited in `ThemeStyleTokensEditor`, rendered by `ThemeEditor`
alongside the color tokens at org / project / page level. Fonts offer the app's bundled
families (Geist, Source Serif 4, Geist Mono) plus system stacks, each previewed in its
own typeface.

## Default Theme

Evidence's built-in theme (before any customization):

```typescript
{
  colors.base: { light: '#ffffff', dark: '#09090b' },
  colorPalettes.default: {
    light: ['#154886', '#45a1bf', '#a5cdee', '#8dacbf', '#85c7c6',
            '#d2c6ac', '#f4b548', '#8f3d56', '#71b9f4', '#46a485'],
    dark: [same]
  },
  colorScales.default: {
    light: ['#3b82f6'],  // Expands to [white, blue]
    dark: ['#60a5fa']    // Expands to [dark, light blue]
  }
}
```

**Light/Dark Mode**: All tokens have both light and dark variants. The active variant is determined by the user's preference (system or manual toggle). Components consume `themeContext.activeTheme` which automatically returns the correct variant.

## Theme Tokens

### User-Configurable Tokens

Users can override these tokens at organization, project, or page level:

| Token                   | Config Key              | Structure                             | Purpose                | Used By                             |
| ----------------------- | ----------------------- | ------------------------------------- | ---------------------- | ----------------------------------- |
| **Background Color**    | `colors.base`           | `{ light: string, dark: string }`     | Primary app background | All UI, auto-derives surface colors |
| **Chart Color Palette** | `colorPalettes.default` | `{ light: string[], dark: string[] }` | Chart series colors    | Line, bar, area, scatter charts     |
| **Color Scale**         | `colorScales.default`   | `{ light: string[], dark: string[] }` | Gradient for heatmaps  | Calendar heatmap, table color viz   |

### Auto-Derived Tokens

All tokens are derived based on **luminance** of the base color (calculated per mode). The derivation logic is the same for both light and dark themes - it just depends on whether the base color itself is light or dark.

**Derivation in** `deriveUITokens()`:

| Token                | If base luminance ≥ 0.5 | If base luminance < 0.5 | Purpose                             |
| -------------------- | ----------------------- | ----------------------- | ----------------------------------- |
| `base-100`           | = base color            | = base color            | Page background                     |
| `base-200`           | base -5% lightness      | base +10% lightness     | Table row shading, sidebar hover    |
| `base-300`           | base -10% lightness     | base +20% lightness     | Borders, dividers, chart grid lines |
| `base-content`       | `#0f172a` (slate-900)   | `#f8fafc` (slate-50)    | Primary text                        |
| `base-content-muted` | `#64748b` (slate-500)   | `#cbd5e1` (slate-300)   | Labels, metadata, chart axis labels |
| `base-heading`       | `#020617` (slate-950)   | `#ffffff` (white)       | Headings                            |

**How it works**:

1. User sets `base.light` (e.g., `#ffffff`) and `base.dark` (e.g., `#0f172a`)
2. When building light theme: Calculate luminance of `base.light` → pick appropriate derivations
3. When building dark theme: Calculate luminance of `base.dark` → pick appropriate derivations
4. **Key insight**: If user sets `base.light = '#000000'` (black), the light theme would use luminance < 0.5 derivations (light text on dark bg)

### Card Colors (Theme-Configurable)

Cards support two configurable colors for card layout mode:

| Token                      | Config Key                    | Purpose                                                                                                                                                                                                           |
| -------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Card Color**             | `colors.card`                 | Background of individual cards                                                                                                                                                                                    |
| **Card Layout Background** | `colors.cardLayoutBackground` | Page background when cards are enabled                                                                                                                                                                            |
| **Input Surface**          | `colors.inputSurface`         | Fill for inputs (dropdowns, button groups, text inputs); auto-derived as a raised surface when unset, and re-derived from the card background inside cards. Emits `--input-surface` (utility `bg-input-surface`). |

**Default values:**

- **Light mode**: Card = white, Card Layout Bg = light grey
- **Dark mode**: Card = dark grey, Card Layout Bg = very dark

**Card Mode Behavior**:

- When cards **OFF**: Components render on page background (`base-100`)
- When cards **ON**: Page uses `cardLayoutBackground`, components render in cards with `card` background

### Runtime Adjustments

Some adjustments happen automatically during theme building or in components:

**Theme Building** (`buildThemes()` in `build-themes.ts`):

- **Color Scale Expansion**: Handled at component level, not during theme building
  - User provides 1 color: `colorScales.default.light = ['#3b82f6']`
  - Stored as-is: `['#3b82f6']`
  - Components expand to: `[background, '#3b82f6']` using `getBackgroundAdjustedColorScale()`
  - User provides 2+ colors: `['#dbeafe', '#1e40af']`
  - Stored and used as-is (no expansion or modification)

- **Card Mode Token Derivation**: When `cardLayoutBackground` or `card` colors are set, additional tokens are derived:
  - From `cardLayoutBackground`: `card-mode-content`, `card-mode-content-muted`, `card-mode-heading` (for text on card layout background)
  - From `card`: `card-bg-100`, `card-bg-200`, `card-bg-300`, `card-bg-content`, `card-bg-content-muted`, `card-bg-heading` (for components inside cards)
  - This ensures proper text contrast regardless of background luminance

**Component-Level**:

- **Table Color Contrast** (`table-viz.ts`): When cells have colored backgrounds, text color is auto-calculated using `chroma.js` to ensure readability (contrast ratio ≥ 4.5:1)

- **Card Context Propagation**: Components wrapped in cards (via `{% row card=true %}`, `{% stack card=true %}`, or page-level cards mode) set a card context that children can check. Charts and tables use this to select card-derived colors instead of page colors.

- **CSS Variable Redefinition**: Inside `.bg-card` elements, CSS variables (`--background`, `--foreground`, `--border`, `--accent`, etc.) are redefined to use card-derived colors. This allows all Tailwind utilities to automatically adapt without component-specific overrides.

## Where Theme Tokens Are Applied

### Token → CSS Variable Mappings

**Applied in**: `core/src/theme/theme-css-helper.ts` → `generateThemeCSS()` (per-mode vars via `generateThemeCSSVarsFromTheme()`, config-level via `generateConfigCSSVars()`)

| Theme Token             | CSS Variables Set                                                                                                                          | Used For                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `base-100`              | `--background`<br>`--sidebar`<br>`--sidebar-primary-foreground`                                                                            | Page background<br>Sidebar background<br>Sidebar active item foreground |
| `base-200`              | `--muted`<br>`--accent`<br>`--sidebar-accent`                                                                                              | Table row shading (hover/stripe)<br>Sidebar hover background            |
| `base-300`              | `--border`<br>`--sidebar-border`                                                                                                           | All borders and dividers<br>Sidebar border                              |
| `base-content`          | `--foreground`<br>`--sidebar-foreground`<br>`--sidebar-accent-foreground`<br>`--sidebar-primary` (fallback)<br>`--sidebar-ring` (fallback) | Primary text color<br>Sidebar text color<br>Sidebar hover text          |
| `base-content-muted`    | `--muted-foreground`                                                                                                                       | Secondary text, labels, metadata                                        |
| `base-heading`          | _(none - used directly in components)_                                                                                                     | Heading text                                                            |
| `card`                  | `--card` (base value)                                                                                                                      | Card background color                                                   |
| `cardLayoutBackground`  | `--card-mode-background`                                                                                                                   | Page background in card mode                                            |
| `card-mode-content`     | _(applied via CSS selectors)_                                                                                                              | Text on card layout background                                          |
| `card-bg-*` (derived)   | Redefined `--background`, `--foreground`, `--border`, `--accent` inside `.bg-card`                                                         | Components inside cards use card-derived colors                         |
| `colorPalettes.default` | `--palette-0` through `--palette-N`                                                                                                        | Chart series colors                                                     |
| `colorScales.default`   | `--scale-0` through `--scale-N`                                                                                                            | Heatmap/table color scales                                              |

### Direct Component Usage

Some theme tokens are read directly by components (not via CSS variables):

| Component                | Token Used                       | How                                                      |
| ------------------------ | -------------------------------- | -------------------------------------------------------- |
| **Charts** (ECharts)     | `colorPalettes.default`          | Passed to `createTheme()` in `echarts-themes.ts`         |
| **Charts** (axis, grids) | `base-content-muted`, `base-300` | Passed to `createTheme()` for axis colors, grid lines    |
| **Tables** (color viz)   | `colorScales.default`            | Used by `calculateColorStyles()` in `table-viz.ts`       |
| **Calendar Heatmap**     | `colorScales.default`            | Read from `themeContext.activeTheme.colorScales.default` |

**Non-theme UI elements** (hardcoded in `app.css`, not customizable via theme settings):

- **Modal backgrounds**: `--popover`
- **Tooltips**: Component-specific styling, uses neutral colors
- **Chart overlays**: Component-specific styling, uses neutral colors
- **Editor UI**: Sidebar, toolbar, panels (only preview pane uses theme)

## Theme in Different Contexts

| Context       | Route Pattern                                   | Theme Source         | Theme Resolution                   | Special Handling                                           |
| ------------- | ----------------------------------------------- | -------------------- | ---------------------------------- | ---------------------------------------------------------- |
| **Editor**    | `/{projectSlug}/{path}/edit`                    | Working page theme   | Defaults → Org → Project → Page    | CSS scoped to `.editor-preview-pane` only                  |
| **Preview**   | `/preview/working/{orgId}/{projectSlug}/{path}` | Working page theme   | Defaults → Org → Project → Page    | None                                                       |
| **Published** | `/{orgId}/{projectSlug}/{path}`                 | Published page theme | Defaults → Org → Project → Page    | None                                                       |
| **Embedded**  | `/emb/{orgId}/{projectSlug}/{path}`             | Published page theme | Defaults → Org → Project → Page    | None                                                       |
| **PDF**       | `/{orgId}/{projectSlug}/pdf/{path}`             | Working OR published | Defaults → Org → Project (no page) | **Light mode only**, **white backgrounds**, **no shadows** |

**Context-Specific Behavior**:

- **Editor**: Theme CSS scoped to preview pane only (editor UI uses default app theme)
- **Preview/Published/Embedded**: Standard theme application to entire page
- **PDF**: Print-optimized theme created via `createPDFTheme()`:
  - Forces all backgrounds to `#ffffff` (save printer ink)
  - Only generates light mode CSS (`lightModeOnly: true`)
  - Removes shadows via `isPrintMode` context
  - Chart colors, text colors, borders still respect theme settings

## Data Storage

| Level            | Stored as             | Type               | Notes                                  |
| ---------------- | --------------------- | ------------------ | -------------------------------------- |
| **Organization** | Org settings          | `ThemeOverrides?`  | One set of overrides per organization  |
| **Project**      | Project settings      | `ThemeOverrides?`  | One set of overrides per project       |
| **Page**         | Page settings         | `ThemeOverrides?`  | Shared by a page's working and published versions |
| **Component**    | N/A (props only)      | Inline in markdown | e.g., `color={[...]}`                  |

**ThemeOverrides**: Partial theme configuration where each token can be `null` (inherit from parent) or a value (override).

Persistence of the org/project/page levels is the consuming application's concern; core only defines the shape and the resolution rules.

## Helper Functions & Utilities

### Token Access Helpers

**When working with plain `Theme` objects** (utility functions):

```typescript
import { getThemeToken } from '@evidence/core/theme/get-theme-token';

const bgColor = getThemeToken(theme, 'background', useCardColors);
```

**When working with `ThemeContext`** (components):

```typescript
import { getThemeContext } from '@evidence/core/theme/theme.context.svelte';

const themeContext = getThemeContext();
const bgColor = themeContext.getToken('background', useCardColors);
```

**Available on `ThemeContext`**:

- `getBackgroundAdjustedColorScale(useCardBackground)` - Color scale with auto-background integration
- `activeTheme` - Current theme (automatically switches based on light/dark mode)
- `themes` - Both light and dark theme variants

**Single source of truth**: `getThemeToken()` contains the logic, `ThemeContext.getToken()` delegates to it.

### Print/PDF Optimization

**For print-friendly output** (white backgrounds, no shadows):

```typescript
import { createPDFTheme } from '@evidence/core/theme/pdf-theme';
import { setPrintModeContext } from '@evidence/core/print-mode.context';

// Create print-optimized theme (forces white backgrounds)
const pdfTheme = data.resolvedTheme ? createPDFTheme(data.resolvedTheme) : null;

// Generate only light mode CSS
const themeCSS = generateThemeCSS(pdfTheme, { lightModeOnly: true });

// Set print mode to remove shadows from cards
setPrintModeContext(true);
```

## Settings UI

Each level has the same interface for theme tokens:

| Level        | Path                             | Inherit Button Label                   |
| ------------ | -------------------------------- | -------------------------------------- |
| Organization | `/settings/theme`                | "Default" (inherits Evidence defaults) |
| Project      | `/{projectSlug}/settings`        | "Inherit" (inherits from organization) |
| Page         | `/{projectSlug}/{path}/settings` | "Inherit" (inherits from project)      |

**For each token** (background color, palette, color scale):

- Toggle: `[Inherit/Default]` or `[Custom/Select]`
- When inherit: Show parent value (greyed out, read-only)
- When custom: Enable color pickers + text inputs, pre-populated with parent value
  - Color pickers provide valid hex values
  - Text inputs sanitize hex values on input and auto-complete on blur
- Save: Store only customized tokens (sparse)

The "inherit vs custom" toggle exists per-token, not globally.

**Hex Input Sanitization**:

- As user types: Strip non-hex characters, enforce `#` prefix, limit to 8 chars
- On blur: Auto-complete incomplete hex codes (e.g., `#f0` → `#ff0000`)
- Prevents CSS injection by ensuring only valid hex colors are saved

**Unsaved Changes Protection**:

- Settings pages detect changes via superforms `$tainted` state
- `beforeNavigate` hook blocks navigation and shows confirmation dialog
- `beforeunload` event warns on page refresh/close
- `allowNavigation` flag prevents infinite popup loops after confirmation

## Example: Inheritance Flow

```typescript
// Organization sets green theme
org: {
  colors.base: { light: '#e0ffe0', dark: '#002200' },
  colorPalettes.default: { light: ['#00ff00', ...], dark: [...] },
  colorScales.default: { light: ['#00ff00'], dark: ['#00ff00'] }
}

// Project overrides base color only
project: {
  colors.base: { light: '#e0e0ff', dark: '#000022' },
  colorPalettes: null,  // inherit from org
  colorScales: null      // inherit from org
}

// Page overrides palette only
page: {
  colors: null,          // inherit from project (blue background)
  colorPalettes.default: { light: ['#ff0000', ...], dark: [...] },
  colorScales: null      // inherit from org (green scale)
}

// Final resolved theme for page
resolved: {
  colors.base: { light: '#e0e0ff', dark: '#000022' },      // from project
  colorPalettes.default: { light: ['#ff0000', ...], ... }, // from page
  colorScales.default: { light: ['#00ff00'], ... }         // from org
}
```

## Architecture: Data Flow

### Critical Rule: ThemeContext is ONLY Set in Routes That Render Themed Content

**Routes that set ThemeContext:**

- Editor page (scoped to preview pane)
- Preview page
- Published page
- Embedded page
- PDF layout (with PDF-optimized theme)

**Routes that DO NOT set ThemeContext:**

- Settings pages (org and project level)
  - Display theme editors but don't render themed content
  - Use `ThemePreview` component which creates its own isolated `ThemeContext` instance

### Resolution Flow by Route Type

**Standard Routes** (Preview, Published, Embedded):

1. **Server**: Load the org/project/page overrides and call `resolveTheme()` - Full hierarchy resolution
2. **Client**: `setThemeContext(data.resolvedPageTheme)` - One-time context setup
3. **Client**: `generateThemeCSS(data.resolvedPageTheme)` - Generate CSS for both modes
4. **Client**: Inject CSS via `<svelte:head>`

**Editor Route** (Special: Scoped CSS):

1. **Server**: Same as standard routes
2. **Client**: `setThemeContext(data.resolvedPageTheme)`
3. **Client**: `generateThemeCSS(data.resolvedPageTheme, { scopeSelector: '.editor-preview-pane' })`
4. **Client**: CSS only applies inside `.editor-preview-pane` container

**PDF Route** (Special: Print-Optimized):

1. **Server**: `resolveTheme(null, org, project, null)` - No page-level overrides
2. **Client**: `pdfTheme = createPDFTheme(data.resolvedTheme)` - Transform to white backgrounds
3. **Client**: `generateThemeCSS(pdfTheme, { lightModeOnly: true })` - Only light mode
4. **Client**: `setPrintModeContext(true)` - Remove shadows
5. **Client**: `$effect(() => setThemeContext(pdfTheme))` - Reactive setup

**Key Principles**:

- Routes receive fully resolved theme from server (no client-side resolution)
- Standard pattern: call `setThemeContext()` once at top level
- PDF is exception: uses `$effect()` because theme is transformed

### Implementation Steps

**1. Server: Resolution** (`resolveTheme()`)

```typescript
// Fetches org/project/page settings, merges hierarchy
resolveTheme(null, org.theme, project.theme, page.theme);
// Returns complete ThemeConfig
```

**2. Client: Context** (`setThemeContext()`)

```typescript
// Creates ThemeContext with resolved config
// Provides reactive access to theme tokens
```

**3. Client: CSS Generation** (`generateThemeCSS()`)

```typescript
// Builds light/dark Theme variants
// Derives all UI tokens from base colors
// Generates CSS custom properties
```

**4. Client: Injection** (`<svelte:head>`)

```typescript
// Injects CSS into page
// Makes theme available to all components
```

**5. Component: Consumption** (`getThemeContext()`)

```typescript
// Components read theme via context
// Automatic light/dark switching via mode-watcher
```

## Quick Reference: Common Patterns

### Standard Page Route

```typescript
// +page.server.ts
export const load = async ({ params }) => {
	// Load the org / project / page overrides, then merge them
	const resolvedPageTheme = resolveTheme(null, org.theme, project.theme, page.theme);
	return { resolvedPageTheme };
};
```

```svelte
<!-- +page.svelte -->
<script>
	import { setThemeContext } from '@evidence/core/theme/theme.context.svelte';
	import { generateThemeCSS } from '@evidence/core/theme/theme-css-helper';

	let { data } = $props();
	setThemeContext(data.resolvedPageTheme);
	const themeCSS = generateThemeCSS(data.resolvedPageTheme);
</script>

<svelte:head>{@html `<style>${themeCSS}</style>`}</svelte:head>
```

### PDF Route (Print-Optimized)

```svelte
<script>
	import { createPDFTheme } from '@evidence/core/theme/pdf-theme';
	import { setPrintModeContext } from '@evidence/core/print-mode.context';

	const pdfTheme = $derived(data.resolvedTheme ? createPDFTheme(data.resolvedTheme) : null);
	const themeCSS = $derived(pdfTheme ? generateThemeCSS(pdfTheme, { lightModeOnly: true }) : '');

	$effect(() => {
		if (pdfTheme) setThemeContext(pdfTheme);
	});

	setPrintModeContext(true); // Removes shadows from cards
</script>
```

### Settings Page

```svelte
<script>
	import ThemeEditor from './ThemeEditor.svelte'; // app-provided settings UI

	let themeOverrides = $state<ThemeOverrides>(data.form.data.theme ?? {});

	$effect(() => {
		$formData.theme = themeOverrides;
	});
	$effect(() => {
		themeOverrides = data.form.data.theme ?? {};
	});
</script>

<ThemeEditor bind:themeOverrides parentTheme={data.resolvedParentTheme} />
```

### Component Using Theme

```svelte
<script>
	import { getThemeContext } from '@evidence/core/theme/theme.context.svelte';
	import { getCardContext } from '@evidence/core/user-components/common/card-context.svelte';

	const themeContext = getThemeContext();
	const cardContext = getCardContext();
	const useCardColors = Boolean(cardContext?.insideCard);

	const bgColor = themeContext.getToken('background', useCardColors);
	const palette = themeContext.activeTheme.colorPalettes.default;
</script>
```

### CSS Scoping Patterns

**Standard Routes** (`:root` scope):

```typescript
generateThemeCSS(theme);
// → :root { --background: hsl(...); }
// → .dark { --background: hsl(...); }
```

**Editor Route** (`.editor-preview-pane` scope):

```typescript
generateThemeCSS(theme, { scopeSelector: '.editor-preview-pane' });
// → .editor-preview-pane { --background: hsl(...); }
// → .dark .editor-preview-pane { --background: hsl(...); }
```

**Why scoping works**: CSS variable inheritance. Tailwind utilities reference CSS variables, and elements inside `.editor-preview-pane` inherit the scoped variables, overriding `:root` values due to CSS specificity.

## Design Principles

### Why Sparse Storage?

Store only overrides, not full configs:

- ✅ Clear inheritance chain (know exactly what's customized)
- ✅ Database efficiency (most orgs/projects/pages use defaults)
- ✅ Migration-friendly (new tokens automatically inherited)

### Why Server-Side Resolution?

Resolve hierarchy on server, not client:

- ✅ SEO-friendly (themed HTML in initial render)
- ✅ Single source of truth (avoid client/server mismatch)
- ✅ Type-safe (Zod validation at database boundary)

### Why Separate `themeOverrides` State in Settings?

Superforms pattern with separate state:

- ✅ Color picker reactivity works correctly
- ✅ Bidirectional sync keeps form and UI in sync
- ✅ Avoids fighting with superforms proxy

### Why Two Token Access Methods?

`getThemeToken(theme, ...)` vs `themeContext.getToken(...)`:

- ✅ Utility functions need standalone helper (no context available)
- ✅ Components use `ThemeContext` method (cleaner, more features)
- ✅ Single source of truth (`ThemeContext` delegates to standalone)

### Why PDF Uses `$effect()`?

PDF theme is transformed (white backgrounds), not used directly:

- ✅ `$derived` creates the transformed theme
- ✅ `$effect` sets context when derived value changes
- ✅ Standard routes use theme directly, so no `$effect` needed

## Troubleshooting

### Dark Mode Flash on Page Load (FOUC)

**Symptom**: Brief flash of light mode when refreshing in dark mode  
**Cause**: `mode-watcher` runs client-side after page renders  
**Status**: Known limitation

### Color Pickers Not Working in Settings

**Symptom**: Color picker doesn't update or changes don't save  
**Cause**: Binding directly to `$formData.theme` instead of separate state  
**Fix**: Use the `themeOverrides` state pattern (see Settings Pages section)

### Infinite "Discard Changes" Popups

**Symptom**: Clicking "Discard" shows dialog again infinitely  
**Cause**: Missing `allowNavigation` flag bypass  
**Fix**: Add `allowNavigation` state and set to `true` in confirm handler

### Theme Not Applied in Component

**Symptom**: Component uses default colors instead of custom theme  
**Cause**: Component rendered outside ThemeContext scope  
**Fix**: Ensure route calls `setThemeContext()` before rendering components

## File Structure

```
core/src/theme/
├── THEMES.md                    # This file (architecture documentation)
├── theme.context.svelte.ts     # Theme context class and accessors
├── theme-css-helper.ts         # CSS generation from theme config (generateThemeCSS)
├── resolve-theme.ts            # Theme hierarchy resolution (resolve/diff)
├── build-themes.ts             # Build light/dark Theme from ThemeConfig
├── build-theme-yaml.ts         # Starter theme.yaml scaffold for new projects
├── derive-shadcn-tokens.ts     # Derive shadcn tokens from a background color
├── get-theme-token.ts          # Standalone helper for token access
└── pdf-theme.ts                # PDF-specific theme optimization

core/src/constants/
└── default-theme.ts            # Evidence's default theme config

core/src/types/
└── theme.ts                    # TypeScript types and Zod schemas
```

Server-side theme resolution and the settings UI for editing themes live in the
consuming application, not in core.

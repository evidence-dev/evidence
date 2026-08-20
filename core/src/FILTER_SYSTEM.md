# Filter System Architecture

Input components (dropdowns, sliders, toggles, calendars, etc.) let users filter data on a page. When a user selects "Electronics" in a dropdown, all charts and tables on the page re-query with that filter applied. The selected value is persisted in the URL search params so the filtered view is shareable/bookmarkable.

One Svelte behavior this document leans on: with the getter/setter syntax `bind:value={getter, setter}`, Svelte reads from the getter to display the value, and calls the setter when the user interacts. Critically, Svelte may also call the setter to sync when the getter returns a value different from what was last set — this creates an "echo" effect.

## Package structure

```
core/          ← shared library, no SvelteKit dependencies allowed
  src/Filter.svelte.ts  ← Filter class
  src/Filters.svelte.ts ← Filter collection
  src/page-filters-context.ts
  src/user-components/tags/  ← all input components (dropdown, slider, etc.)

studio/                 ← SvelteKit application
  src/routes/           ← editor, published, embedded, and preview routes
```

The Filter class and all input components live in `core`, which must not import SvelteKit APIs. The route-level `+page.svelte` files live in `studio` and can use SvelteKit APIs. This boundary is why URL reading/writing is injected via dependency injection.

## Rendering contexts

| Context | Purpose | Filter URL reads? | Filter URL writes? |
|---------|---------|-------------------|-------------------|
| Editor | Markdown editor with live preview | Yes | Yes — same as published/preview |
| Published | End-user views shared reports | Yes | Yes — URL reflects user's filter choices |
| Embedded | Same as published, in an iframe | Yes | Yes |
| Preview | Developer preview of unpublished pages | Yes | Yes |
| Server (SSR) | Server-side rendering for initial page load | Yes | No — no browser |

---

## Core Principles

1. **URL params reflect user intent only.** If the user never made a choice, the URL should not contain a param for that input. Programmatic defaults (auto-selected first option, computed slider minimum, default calendar preset) are internal state, not URL state.

2. **Filter class is decoupled from SvelteKit.** It lives in `core` and must not import `$app/navigation`, `$app/state`, or `$app/environment`. URL reading and writing behavior is injected by the caller via dependency injection.

3. **URL writes use `window.history.replaceState`.** See [Layout Constraint](#layout-constraint-key-jsonstringifypagedata) for why SvelteKit's `replaceState` from `$app/navigation` cannot be used.

4. **Two distinct methods exist for setting filter values:**
   - `filter.value = x` — for user interactions. Updates reactive state AND writes to URL.
   - `filter.setDefault(x)` — for programmatic defaults. Updates reactive state ONLY. Never writes to URL.

---

## Filter Class (`core/src/Filter.svelte.ts`)

### Full implementation (simplified)

```typescript
export abstract class Filter<Value = any> {
    #value: Value | undefined = $state(undefined);  // Svelte 5 reactive state
    #isInitializing = true;  // Guards URL writes during construction

    constructor(
        readonly id: string,
        readonly userComponentName: string,
        private readonly opts: FilterOpts<Value>,
        private readonly deps: FilterDeps
    ) {
        // Priority 1: URL param
        if (!opts.dontUseQueryParam) {
            const raw = extract(this.deps.url)?.searchParams.get(this.id);
            if (raw) {                          // ⚠️ Truthiness check — see "Falsy Values" section
                this.value = this.opts.deserialize(raw);
            } else if (opts.initialValue) {     // ⚠️ Truthiness check — drops false, 0, ""
                // Priority 2: hardcoded initial_value
                this.value = opts.initialValue;
            }
        } else if (opts.initialValue) {         // ⚠️ Same truthiness issue
            this.value = opts.initialValue;
        }
        // If neither, value stays undefined (Priority 4)

        this.#isInitializing = false;
    }

    get value() {
        return this.#value;
    }

    set value(newValue: Value | undefined) {
        this.#value = newValue;  // Step 1: update reactive state

        if (this.#isInitializing) return;              // Step 2: block during construction
        if (this.opts.dontUseQueryParam) return;       // Step 3: opt-out flag
        if (!this.deps.updateUrl) return;              // Step 4: no write capability (editor, server)

        const currentUrl = extract(this.deps.url);
        if (currentUrl) {
            const url = new URL(currentUrl);           // Step 5: copy (never mutate original)
            const serialized = this.opts.serialize(newValue);
            if (serialized) {                          // ⚠️ Truthiness check — see "Falsy Values"
                url.searchParams.set(this.id, serialized);  // Step 6: set param
            } else {
                url.searchParams.delete(this.id);
            }
            this.deps.updateUrl(url);                  // Step 7: write to browser URL
        }
    }

    setDefault(newValue: Value | undefined) {
        this.#value = newValue;  // Updates reactive state only. No URL write. Ever.
    }
}
```

### Dependencies (`FilterDeps`)

```typescript
export type FilterDeps = {
    url: MaybeGetter<URL> | undefined;
    updateUrl: ((url: URL) => void) | undefined;
    projectSettings: MaybeGetter<ProjectSettings> | undefined;
};
```

| Dependency | What it does | Who provides it |
|---|---|---|
| `url` | Getter function returning the current URL. Used to read search params on construction and when building updated URLs. | Route `+page.svelte` passes `() => browser ? new URL(window.location.href) : page.url` |
| `updateUrl` | Callback to update the browser URL bar. Called only by the setter, only after construction, only for user interactions. | Route `+page.svelte` passes a `window.history.replaceState` wrapper. `undefined` in server context only. |
| `projectSettings` | Access to project-level settings like default date range. | Context from parent layout. |

> **Critical invariant: reads and writes must use the same URL source.**
> `updateUrl` writes to the browser's native URL via `window.history.replaceState`. This does NOT update SvelteKit's `page.url`. Therefore `url` must read from `window.location.href` (the same source), not `page.url`. If `url` reads `page.url`, filters clobber each other's params — filter B reads a stale URL that doesn't contain filter A's param, and overwrites it.

---

## Value Priority

When a filter is initialized, values are resolved in this order:

| Priority | Source | Where set | Example | Writes to URL? |
|----------|--------|-----------|---------|----------------|
| 1 (highest) | URL search param | Filter constructor | `?category=Electronics` | No (during init) |
| 2 | `initial_value` prop | Filter constructor | `{% dropdown initial_value="Option 1" %}` | No (during init) |
| 3 | Data-driven default | Component `$effect` after data loads | `select_first` picks first query result | No (`setDefault`) |
| 4 (lowest) | `undefined` | Default state | No data, no prop, no URL | N/A |

A URL param always wins. If the URL has `?category=Electronics`, that value is used regardless of `initial_value` or `select_first`. This is by design — the URL represents a user's explicit choice (e.g., from a shared link).

---

## Route-Level Configuration

### Editor

```typescript
// Editor route
createPageFiltersContext({}, {
    url: () => (browser ? new URL(window.location.href) : page.url),
    updateUrl: (url) => window.history.replaceState(window.history.state, '', url.toString())
});
```

The editor uses the same URL sync pattern as published/preview/embedded. Filter values are persisted to the URL so that PDF generation (which reads filter params from the URL) can produce filtered output matching the editor's current state.

### Published / Preview / Embedded

```typescript
// Published route (and preview, embedded)
createPageFiltersContext(data.serializedFilters, {
    url: () => (browser ? new URL(window.location.href) : page.url),
    updateUrl: (url) => window.history.replaceState(window.history.state, '', url.toString())
});
```

These are end-user-facing routes where filter choices should be reflected in the URL for shareability. The `url` getter reads from `window.location.href` on the client (same source that `updateUrl` writes to) and falls back to `page.url` during SSR. The `updateUrl` callback uses the native browser history API.

### Server-side (SSR)

```typescript
// Published route — server load
new Filters({ url: urlGetter, updateUrl: undefined, projectSettings: ... }, serializedFilters);
```

On the server, filters read from the request URL to pre-render the correct state. No URL writing is possible or needed.

---

## Input Component Lifecycles

Each input component follows the same general pattern with variations. Below, every scenario is traced step-by-step.

### Pattern A: No default value

**Components**: TextInput

The simplest case. No programmatic default. Value starts as `undefined` and only gets set when the user types.

#### Scenario: Fresh page load, no URL param
```
1. Filter constructed → no URL param, no initialValue → value = undefined
2. Component renders empty input field
```

#### Scenario: User types "hello"
```
1. Svelte bind:value setter fires with "hello"
2. → filter.value = "hello"
3. → setter: #isInitializing=false, updateUrl exists → calls updateUrl
4. → URL becomes ?id=hello
```

#### Scenario: Page loads with URL param `?id=hello`
```
1. Filter constructed → reads "hello" from URL → deserializes → value = "hello"
2. Component renders with "hello" pre-filled
3. No $effect involved — everything handled in constructor
```

---

### Pattern B: Hardcoded default (`initial_value` prop)

**Components**: Toggle, DateGrainSelector, ComparisonSelector

The author specifies a default value in markup: `{% toggle id="show_details" initial_value=true %}`.

#### Scenario: Fresh page load, no URL param, `initial_value=true`
```
1. Filter constructed:
   - No URL param found
   - opts.initialValue = true → if (opts.initialValue) → truthy → this.value = true
   - Setter fires, but #isInitializing=true → no URL write
2. #isInitializing = false
3. $effect runs: filter.value = true (not undefined) → setDefault skipped
4. Component renders as "on"
5. URL has NO ?show_details= param
```

#### Scenario: Fresh page load, no URL param, `initial_value=false`
```
1. Filter constructed:
   - No URL param found
   - opts.initialValue = false → if (opts.initialValue) → FALSY → SKIPPED ⚠️
   - Value stays undefined
2. #isInitializing = false
3. $effect runs: filter.value === undefined → filter.setDefault(false)
4. → #value = false (no URL write)
5. Component renders as "off"
6. URL has NO param

Note: The constructor's truthiness check means initial_value=false takes a
different code path than initial_value=true. The end result is the same
(value = false) but it arrives via the $effect fallback rather than the
constructor. See "Falsy Values" section for implications.
```

#### Scenario: User clicks toggle to "off"
```
1. handleChange(false) called
2. → filter.value = false
3. → setter: serialize(false) → "false" (truthy string) → URL param set
4. → URL becomes ?show_details=false
```

#### Scenario: Page loads with URL param `?show_details=false`, `initial_value=true`
```
1. Filter constructed:
   - URL param "false" found → if (raw) → "false" is truthy ✓
   - deserialize("false") → raw === 'true' → false
   - value = false
   - initialValue=true is IGNORED because URL param has higher priority
2. Component renders as "off"
3. $effect: value is not undefined → setDefault skipped
```

#### Scenario: No `initial_value` provided, no URL param
```
1. Filter constructed → value = undefined
2. $effect runs: filter.value === undefined → filter.setDefault(false)
3. → #value = false (no URL write)
4. Component renders as "off"
```

The `$effect` acts as a safety net for when no initialValue is provided. It uses `setDefault` (not `filter.value =`) because this is a programmatic fallback, not a user choice.

---

### Pattern C: Data-driven default (`select_first`)

**Components**: Dropdown, ButtonGroup, InputTabs

These components can auto-select the first option from queried data. The key difference from Pattern B is that the default value is not known at construction time — it requires an async data fetch.

#### Scenario: Fresh page load, `select_first=true`, no URL param
```
1. Filter constructed → no URL param, no initialValue → value = undefined
2. Component mounts and fires data query for options
3. Options arrive: ["Electronics", "Clothing", "Home"]
4. $effect evaluates:
   - selectFirst = true ✓
   - filter exists ✓  
   - options.length > 0 ✓
   - !filter.value = true (undefined is falsy) ✓
   → filter.setDefault("Electronics")
5. → #value = "Electronics" (no URL write)
6. Component displays "Electronics" as selected
7. URL has NO ?category= param
```

#### Scenario: User selects "Clothing"
```
1. Dropdown's bind:value setter fires with "Clothing"
2. → filter.value = "Clothing"
3. → setter: updateUrl called
4. → URL becomes ?category=Clothing
```

#### Scenario: Page loads with URL param `?category=Home`, `select_first=true`
```
1. Filter constructed → reads "Home" from URL → value = "Home"
2. Options load: ["Electronics", "Clothing", "Home"]
3. $effect evaluates:
   - selectFirst = true ✓
   - !filter.value = false ("Home" is truthy) ✗
   → setDefault NOT called. URL param wins over select_first.
4. Component displays "Home"
```

#### Scenario: User clears dropdown when `select_first=true`
```
1. handleClear fires → filter.value = "" → setter: serializes to undefined → URL param deleted
2. $effect re-evaluates:
   - !filter.value = true (empty string is falsy) ✓
   → filter.setDefault("Electronics")
3. Component shows "Electronics" again
4. KNOWN ISSUE: user cannot clear to empty when select_first=true
   - The $effect guard uses !filter.value (truthiness), not filter.value === undefined
   - This means the "clear" intent is indistinguishable from "never set"
   - See "Clearing Behavior" section for discussionok
```

#### Scenario: `initial_value="Clothing"` AND `select_first=true`, no URL param
```
1. Filter constructed → no URL param → opts.initialValue = "Clothing" → value = "Clothing"
2. Options load
3. $effect: !filter.value = false ("Clothing" is truthy) → setDefault skipped
4. initial_value wins over select_first
```

#### InputTabs specificity
InputTabs is identical to Dropdown except `select_first` defaults to `true` (not `false`). This means InputTabs always auto-selects the first tab unless the user has a URL param or `initial_value` is set.

---

### Pattern D: Data-driven default (computed from query)

**Components**: Slider, RangeCalendar

These compute a default value from queried data — the slider needs min/max from a data column, the calendar determines available date presets.

#### Slider

##### Scenario: Fresh page load, `data="orders"` `value_column="total"`, no URL param
```
1. Filter constructed → value = undefined
2. Component mounts, fires query: SELECT MIN(total), MAX(total) FROM orders
3. loading = true
4. $effect: loading=true → returns early (does nothing)
5. Query completes → loading=false, min=150.9, max=5000.0
6. $effect runs:
   - filter.value === undefined ✓  (note: uses === not truthiness)
   → filter.setDefault(150.9)
   → #value = 150.9 (no URL write)
7. Slider UI renders at position 150.9
8. URL has NO ?slide= param
```

##### Scenario: User drags slider to 300
```
1. Slider UI fires bind:value setter with 300
2. Setter: clamped = max(150.9, min(5000, 300)) = 300
3. Guard: filter.value (150.9) !== clamped (300) → proceed
4. → filter.value = 300
5. → setter: updateUrl called
6. → URL becomes ?slide=300
```

##### Scenario: Page loads with URL param `?slide=250`
```
1. Filter constructed → reads "250" → deserializes → value = 250
2. Query completes → min=150.9, max=5000
3. $effect: filter.value=250, typeof=number, 250 >= 150.9 and 250 <= 5000 → no clamping
4. Slider renders at 250
```

##### Scenario: Page loads with out-of-range URL param `?slide=9999`
```
1. Filter constructed → value = 9999
2. Query completes → min=150.9, max=5000
3. $effect: 9999 > max → clamped = 5000
4. → filter.value = 5000  (this is an intentional correction, uses setter → writes URL)
5. URL corrected to ?slide=5000
```

##### Slider-specific concern: `bind:value` echo

The slider is the ONLY input that uses Svelte's `bind:value` with a getter/setter pair. All other inputs use explicit event handlers (`onclick`, `handleValueChange`, `handleTabClick`) that only fire on genuine user interaction.

With `bind:value={getter, setter}`, Svelte keeps the component's internal value in sync with the getter. When `setDefault(150.9)` changes `#value`, the getter returns `150.9`. Svelte detects this differs from the previous value (`undefined`) and may call the setter with `150.9` to establish sync. This setter call is NOT a user action — it's a framework sync mechanism.

Without a guard, this echo would call `filter.value = 150.9` → trigger `updateUrl` → write `?slide=150.9` to the URL for a value the user never chose.

**The fix is a guard in the setter:**

```typescript
(newValue: number) => {
    const clamped = Math.max(min, Math.min(max, newValue));
    if (filter.value === clamped) return;  // value unchanged → skip (prevents echo)
    filter.value = clamped;                // value changed → user dragged → write URL
}
```

This guard is safe because:
- For real user drags, the new value will differ from current → guard passes → URL writes ✅
- For the echo, the value matches current → guard blocks → no URL write ✅

#### RangeCalendar

##### Scenario: Fresh page load, no `default_range` specified, no URL param
```
1. Filter constructed → value = undefined
2. $effect determines default preset:
   - If "all time" is in the available presets → filter.setDefault({ range: 'all time' })
   - Else → filter.setDefault({ range: firstAvailablePreset })
3. → #value = { range: 'all time' } (no URL write)
4. Calendar renders showing "All Time"
5. URL has NO param
```

##### Scenario: Fresh page load, `default_range="last 30 days"`, no URL param
```
1. Filter constructed → value = undefined
2. $effect finds the "last 30 days" preset → filter.setDefault({ range: 'last 30 days' })
3. Calendar renders showing "Last 30 Days"
4. URL has NO param
```

##### Scenario: User selects "Last 7 Days" preset
```
1. handlePresetSelect fires → filter.value = { range: 'last 7 days' }
2. → setter: updateUrl called
3. → URL becomes ?date_range=<serialized>
```

##### Scenario: Page loads with URL param
```
1. Filter constructed → reads and deserializes URL param → value = { range: 'last 7 days' }
2. $effect: filter value exists → setDefault skipped. URL wins.
3. Calendar renders "Last 7 Days"
```

RangeCalendar does NOT have the bind:value echo problem — it uses explicit event handlers (`handlePresetSelect`, `onclick`).

---

## Falsy Values

There are three places where truthiness checks interact with values that can legitimately be falsy (`false`, `0`, `""`).

### 1. Constructor: `if (opts.initialValue)`

The constructor checks `if (opts.initialValue)` to decide whether to apply the `initial_value` prop. This is a truthiness check, not a nullish check.

**Impact**:

| Value type | `initial_value` | `if (opts.initialValue)` | Constructor sets it? | Where it gets set instead |
|---|---|---|---|---|
| Toggle | `true` | truthy ✓ | Yes, in constructor | — |
| Toggle | `false` | **falsy ✗** | **No** | $effect fallback: `setDefault(false)` |
| Slider | `0` | **falsy ✗** | **No** | $effect: `setDefault(min)` — may differ from 0! |
| Dropdown | `""` | **falsy ✗** | **No** | undefined (no $effect for empty string) |
| Dropdown | `"Option 1"` | truthy ✓ | Yes, in constructor | — |

For toggle, this is cosmetically wrong but functionally correct — the `$effect` sets the same value. For slider with `initial_value=0`, this is a real bug: the $effect would use `min` (computed from data) instead of `0`, potentially ignoring the author's explicit intent.

**Fix**: Replace `if (opts.initialValue)` with `if (opts.initialValue !== undefined)`. Not yet implemented.

### 2. Constructor: `if (raw)`

`raw` comes from `searchParams.get(id)` which returns `string | null`. The check `if (raw)` is a truthiness check. A URL param with an empty value (`?id=`) gives `raw = ""`, which is falsy and would be skipped.

**In practice this is correct**: `?id=` (empty value) should be treated as "no param." All meaningful URL params are non-empty strings. The string `"0"` and `"false"` are truthy and correctly handled.

### 3. Setter: `if (serialized)`

After `serialize(value)`, the result is checked with `if (serialized)`. The serialize functions for each component:

| Component | Value | Serialized output | Truthy? | Correct? |
|---|---|---|---|---|
| Toggle | `false` | `"false"` | ✓ truthy | ✅ written to URL |
| Toggle | `true` | `"true"` | ✓ truthy | ✅ written to URL |
| Slider | `0` | `"0"` | ✓ truthy | ✅ written to URL |
| Slider | `150.9` | `"150.9"` | ✓ truthy | ✅ written to URL |
| Dropdown | `""` | `undefined` | falsy | ✅ param deleted (correct: empty = cleared) |
| Dropdown | `"Option"` | `"Option"` | ✓ truthy | ✅ written to URL |

**Serialization round-trips are currently safe.** All serialize functions return either `undefined` (for "no value") or a non-empty string. The truthiness check on serialized output works correctly because no meaningful value serializes to the empty string `""`.

### 4. $effect guards: `!filter.value` vs `filter.value === undefined`

Different components use different guards for their data-driven defaults:

| Component | Guard | Would `0` or `false` trigger re-default? |
|---|---|---|
| Dropdown select_first | `!filter.value` | Yes — `!""` is true, `!"0"` is false |
| Slider | `filter.value === undefined \|\| filter.value === null` | No — `0` would not match |
| Toggle | `filter.value === undefined` | No — `false` would not match |

The dropdown's `!filter.value` guard is currently safe because dropdown values are always strings, and all valid option strings are non-empty. If dropdown options were ever numeric (value `0`), or if the component type changed, this could break.

---

## Clearing Behavior

"Clearing" a filter means the user explicitly removes their selection. The system must distinguish between "user actively cleared this" and "no value has been set yet." Currently, it cannot always make this distinction.

### What "clear" does per component

| Component | Clear mechanism | Value after clear | URL param | What happens next |
|---|---|---|---|---|
| Dropdown (single) | Clear button | `""` | Deleted | If `select_first=true`, $effect re-fires → snaps back to first option |
| Dropdown (multiple) | Clear button | `[]` | Deleted | If `select_first=true`, same snap-back via `!filter.value` (empty array is truthy, but `array.length === 0` check would be needed) |
| Slider | No clear UI | N/A | N/A | Cannot be cleared — always has a value after data loads |
| Toggle | Click | Toggles between true/false | Written | Cannot be "cleared" — only toggled |
| TextInput | Select all + delete | `""` | Deleted | Stays empty |
| RangeCalendar | No clear UI | N/A | N/A | Can only switch between presets, not clear |
| ButtonGroup | Clear button | `""` | Deleted | If `select_first=true`, same snap-back as dropdown |
| InputTabs | No clear UI | N/A | N/A | `select_first` defaults to true; no clear mechanism |

### The fundamental problem

When `select_first=true`, "clear" and "no value yet" are indistinguishable:
- User clears → `filter.value = ""` → falsy
- Filter just constructed, no data yet → `filter.value = undefined` → falsy
- Both pass the `!filter.value` guard → both trigger `setDefault`

**Behavioral consequence for shared URLs**: If a user shares a URL with `select_first` active and no explicit selection, the recipient sees the first option auto-selected (desired). If the user tries to share a "cleared" state, there's no URL param for "intentionally empty" → recipient also sees first option auto-selected (undesired, but currently unavoidable without a distinct "cleared" sentinel).

**Possible fix**: Add a `#userCleared` flag to Filter that `select_first` checks. Not yet implemented — this would be a behavioral change visible to end users.

---

## SSR and Hydration

### What the server renders

During SSR, the server constructs filters and renders the initial HTML. The server:
- **CAN** read URL params (from the request URL) and set filter values from them
- **CAN** apply `initial_value` props that pass the truthiness check
- **CANNOT** run `$effect`s (Svelte effects are client-only)
- **CANNOT** execute data queries (these run via client-side QueryService)

### Hydration timeline

This means data-driven defaults (select_first, slider min/max, calendar presets) are never available during SSR. The server renders the component in its "empty/loading" state, and the client fills in defaults after data queries complete.

| Step | Where | What renders |
|---|---|---|
| 1. SSR | Server | Filter value = `undefined` (for data-driven defaults). Component shows placeholder/skeleton. |
| 2. Hydration | Client | Svelte hydrates — same state as SSR. No mismatch. |
| 3. $effect runs | Client | Data queries fire. `loading = true`. Component shows loading state. |
| 4. Data arrives | Client | $effect → `setDefault(value)`. Component updates to show selected value. |

**Visual impact**: There is a visible transition from "empty/loading" → "populated" on every page load for data-driven defaults. This is inherent to the architecture — the data is not available during SSR.

For filters with `initial_value=true` (truthy values), the server renders the correct state immediately — no visual jump. For `initial_value=false` (falsy), the server renders `undefined` due to the constructor truthiness bug, then the client $effect sets `false`. The component may flash from "empty" to "off" even though the author specified a concrete default. This is a minor visual regression from the truthiness issue.

### True hydration mismatches

A Svelte hydration mismatch occurs when the server-rendered HTML structurally differs from what the client produces on first render. Our system avoids this because:
- Constructor output is deterministic given the same URL (server and client read the same URL)
- $effects don't run during SSR, so they can't create a divergence
- The initial render (pre-$effect) is the same on both sides

The visual "jump" from loading → populated is a **post-hydration update**, not a hydration mismatch. Svelte handles this correctly — it's just visible to the user on slow connections or slow queries.

---

## Layout Constraint: `{#key JSON.stringify(page.data)}`

### What it is

All three consumer layouts (published, preview, embedded) wrap their page children in:

```svelte
{#key JSON.stringify(page.data)}
    {@render children()}
{/key}
```

### What `{#key}` does

Svelte's `{#key expression}` block **destroys and recreates** its contents whenever the expression's value changes. This is intentional — when the user navigates between pages, `page.data` changes (new page content from the server), and all component contexts (filters, queries, metadata) need to be re-initialized from scratch.

### Why this matters for URL writes

SvelteKit's `page` object (from `$app/state`) is a reactive proxy. It exposes `.url`, `.data`, `.state`, `.route`, etc.

- **`window.history.replaceState(state, '', url)`**: Updates the browser URL bar. SvelteKit intercepts this to sync `page.url`, but does NOT trigger `page.data` to appear changed. The `{#key}` expression evaluates the same JSON string → no re-render.

- **SvelteKit's `replaceState(url, state)` from `$app/navigation`**: This is SvelteKit's "shallow routing" API, designed for features like modals that need their own URL + browser back button support. It updates `page.url` AND `page.state`, and in production builds, it triggers internal page state machinery that causes `page.data` to appear changed (even though the data is identical). The `{#key}` expression evaluates a different JSON string → **entire component tree is destroyed and recreated**.

### The production-only aspect

This distinction only manifests in **production builds**. In development mode, SvelteKit has additional guards and different internal handling that prevents the `{#key}` from re-firing. This means:

- Tests run against `pnpm run dev` will NOT catch this bug
- Only tests against `pnpm run build && pnpm run preview` (or deployed previews) will reproduce it
- A developer can work locally for days without seeing the issue

### Concrete impact

When the `{#key}` fires during a slider drag:
1. User starts dragging → setter fires → `replaceState` called → `{#key}` re-fires
2. Entire page component tree is destroyed (including the slider)
3. Page re-mounts from scratch: new Filter constructed, new query fired, slider back at default
4. User sees slider "snap back" and freeze — they can never successfully drag it

### Decision

`updateUrl` must use `window.history.replaceState`. This is the correct API for our use case: updating the URL bar to reflect client-side state without triggering navigation or page state changes.

---

## Cross-Page Filter Persistence

### What it solves

When a user selects "Electronics" in a dropdown on Page A and navigates to Page B, the URL param `?category_filter=Electronics` should carry over. Page B's dropdown (if it has the same `id`) picks it up from the URL and shows the same selection. This makes multi-page reports feel cohesive.

### Two mechanisms

Cross-page persistence is implemented via two complementary mechanisms:

#### 1. Content link onclick handlers (fast path)

For links rendered inside Markdoc content (markdown `[links](href)` and table dimension links), an `onclick` handler merges current URL params into the link's `href` **before** SvelteKit's router reads it. This is a single navigation cycle — no cancel/retry.

**Implementation**: `mergeCurrentSearchParams()` in `transform-internal-link.ts`, called from `Link.svelte` and `Table.svelte` onclick handlers.

| Component | What it does | File |
|---|---|---|
| `mergeCurrentSearchParams()` | Merges current URL params into target href | `transform-internal-link.ts` |
| `Link.svelte` onclick | Calls merge before SvelteKit's router navigates | `Link.svelte` |
| `Table.svelte` dimension onclick | Same for dimension link `<a>` tags | `Table.svelte` |
| `Table.svelte` handleRowClick | Merges params before `window.open()` | `Table.svelte` |

#### 2. `beforeNavigate` hook (catch-all)

For navigation that does NOT go through Markdoc content links — sidebar clicks, programmatic `goto()`, browser forward — a `beforeNavigate` hook in each route's `+page.svelte` intercepts the navigation, cancels it, and re-navigates to the merged URL via `goto()`.

```typescript
// In preview, published, and embedded +page.svelte files
let lastMergedUrl: string | null = null;
beforeNavigate((navigation) => {
    if (!navigation.to?.url || !navigation.to?.route) return;

    // Skip the second beforeNavigate call from our own goto (prevents double side effects)
    const target = navigation.to.url.pathname + navigation.to.url.search;
    if (target === lastMergedUrl) { lastMergedUrl = null; return; }

    // Only carry params within the same route group (same project pages)
    if (navigation.to.route.id !== navigation.from?.route?.id) return;

    const currentParams = new URLSearchParams(window.location.search);
    if (currentParams.size === 0) return;

    const targetUrl = new URL(navigation.to.url);
    let changed = false;
    for (const [key, value] of currentParams) {
        if (key === 'linkPreviewPath') continue;
        if (!targetUrl.searchParams.has(key)) {
            targetUrl.searchParams.set(key, value);
            changed = true;
        }
    }

    if (changed) {
        const merged = targetUrl.pathname + targetUrl.search;
        lastMergedUrl = merged;
        navigation.cancel();
        goto(merged);
    }
});
```

**Routes with this hook**: preview, published, embedded. The editor route writes filter values to the URL but does not have this `beforeNavigate` hook (cross-page navigation is not applicable in the editor context).

### Why two mechanisms?

The onclick handler is a performance optimization for content links — it avoids the cancel/goto double navigation by modifying the `<a>` href in-place. The `beforeNavigate` hook is necessary for sidebar links, `goto()`, and any navigation that doesn't pass through a Markdoc-rendered `<a>` tag.

When both are active, there is no conflict: the onclick handler merges params into the href → SvelteKit starts navigation to the merged URL → `beforeNavigate` fires → sees all params already present → `changed = false` → navigation proceeds normally (single cycle).

### The `beforeNavigate` cancel + goto pattern

SvelteKit's `beforeNavigate` does not allow modifying the destination URL — you can only let the navigation proceed or cancel it. To redirect to a URL with merged params, we must cancel the original navigation and start a new one via `goto()`. This creates two navigation cycles.

**Why this is safe:**
- `goto()` fires synchronously after `cancel()`, before any DOM update — no visible flicker
- The cancelled navigation has not started fetching page data — no wasted server request
- The page component from the cancelled navigation never mounts — no wasted render
- The second `beforeNavigate` invocation sees params already merged → `changed = false` → no infinite loop
- No other `beforeNavigate` hooks exist in preview/published/embedded routes — no side effect concerns

**Alternative considered and rejected — `afterNavigate`:**
Using `afterNavigate` to merge params after arrival would be a single navigation cycle. However, the target page's Filter constructors run **before** `afterNavigate`. Filters would read from the URL and find no params → initialize with `undefined` → fire queries with missing values → produce malformed SQL. This is the exact bug class that caused the original production incident. The cancel + goto pattern guarantees params are in the URL **before** the target page's components initialize.

### Same-route guard

The `beforeNavigate` hook only carries params when `navigation.to.route.id === navigation.from.route.id`. This prevents filter params from leaking to unrelated routes:

| Navigation | Same route? | Params carried? |
|---|---|---|
| Preview page A → Preview page B | ✅ Same | ✅ Yes |
| Published page A → Published page B | ✅ Same | ✅ Yes |
| Preview page → Settings | ❌ Different | ❌ No |
| Published page → Sign-in | ❌ Different | ❌ No |

### Merge rules

1. **Target URL's explicit params take precedence** — if a dimension link includes `?category_filter=Electronics`, that value wins over any `category_filter` in the current URL
2. **Current page params fill gaps** — params in the current URL that aren't in the target are added (e.g., `?date=2024-01-01` carries over)
3. **Internal params excluded** — `linkPreviewPath` (editor-internal) is never carried
4. **Click-time reads** — `window.location.search` is read at click time / navigation time, not render time, so the latest filter values are always included

### Example flows

**Sidebar navigation:**
```
Page A: /preview/.../home?category=Electronics&date=2024-01-01
User clicks sidebar link to "metrics" page
  beforeNavigate fires:
    currentParams: category=Electronics, date=2024-01-01
    targetUrl: /preview/.../metrics (no params)
    → cancel + goto /preview/.../metrics?category=Electronics&date=2024-01-01
```

**Dimension link (content link):**
```
Page A: /home?category=Electronics&date=2024-01-01
User clicks dimension link to "detail?category_filter=Clothing"
  onclick handler merges:
    href becomes: /detail?category_filter=Clothing&category=Electronics&date=2024-01-01
  SvelteKit navigates to merged URL (single cycle)
  beforeNavigate: changed=false (params already merged) → no cancel
```

### Orphan params

Params from the source page that have no matching filter on the target page remain in the URL harmlessly. They are preserved by the filter system's read-modify-write pattern (reads from `window.location.href`, modifies the relevant param, writes back). This means:

- **Round-trip preservation**: A → B → A keeps all params intact
- **URL accumulation**: Visiting many pages with different filters grows the URL. There is no cleanup mechanism — all params persist until the user manually clears them or navigates to a different route group.

### Scoping: page-local filters

Filters are **page-local**: each page's filters are independent instances. A dropdown on Page A and a dropdown with the same `id` on Page B are separate Filter objects. Carrying `?category=Electronics` from A to B pre-fills B's dropdown IF it has a filter with `id="category"`.

**Report-global filters** (a single filter bar across all pages) are not supported. That would require a different mechanism with explicit opt-in.

### Why click-time (not render-time)

`window.location.search` is not tracked by Svelte's reactivity system. If we merged at render time, dimension link hrefs would be stale after filter changes (e.g., user changes date → clicks a link → stale date is carried). Click-time ensures the latest values.

The onclick handler modifies `e.currentTarget.href` before SvelteKit's delegated document-level click handler reads it, preserving client-side navigation.

---

## Complete Code Path Summary

| Trigger | Code path | Writes URL? | Why / why not |
|---------|-----------|-------------|---------------|
| Page loads, URL has `?id=value` | Constructor: `this.value = deserialize(raw)` | No | `#isInitializing = true` blocks setter |
| Page loads, markup has `initial_value="x"` | Constructor: `this.value = opts.initialValue` | No | `#isInitializing = true` blocks setter |
| Page loads, markup has `initial_value=false` | Constructor: **skipped** (truthiness) → $effect fallback | No | `setDefault` never writes to URL |
| Data loads, `select_first` sets first option | `$effect` → `filter.setDefault(options[0])` | No | `setDefault` never writes to URL |
| Data loads, slider computes min | `$effect` → `filter.setDefault(min)` | No | `setDefault` never writes to URL |
| Data loads, calendar picks default preset | `$effect` → `filter.setDefault({ range })` | No | `setDefault` never writes to URL |
| Slider bind:value echoes default back | Setter fires, but `filter.value === clamped` | No | Guard prevents write for unchanged value |
| User selects dropdown option | Event handler → `filter.value = "Option 2"` | Yes | User intent → URL should reflect choice |
| User drags slider | bind:value setter → `filter.value = 300` | Yes | User intent |
| User selects calendar preset | Event handler → `filter.value = { range }` | Yes | User intent |
| User toggles switch | Event handler → `filter.value = true` | Yes | User intent |
| User types in text input | bind:value setter → `filter.value = "text"` | Yes | User intent |
| User clears dropdown | Event handler → `filter.value = ""` | Yes (deletes param) | User intent |
| User clears dropdown (select_first=true) | Same as above, then $effect re-fires setDefault | Net: No | setDefault replaces cleared value |
| Clamping out-of-range URL param | `$effect` → `filter.value = clamped` | Yes | Correcting invalid state from URL |

---

## Known Issues

### Functional

1. **select_first + clear**: User cannot clear to empty because `""` is falsy, causing the `$effect`'s `!filter.value` guard to pass and `setDefault` to re-fire. See [Clearing Behavior](#clearing-behavior). Needs a distinct "user explicitly cleared" signal to distinguish from "not yet set."

2. **Constructor truthiness for `initialValue`**: `if (opts.initialValue)` drops `false` and `0`. These values still work via `$effect` fallback for toggle (which always defaults to `false`), but for slider with `initial_value=0`, the intended value would be silently replaced by `min`. Fix: use `!== undefined` instead of truthiness.

3. **Inline query undefined interpolation**: When filter values are still `undefined` (before data-driven defaults load), inline queries interpolate them as empty strings, producing malformed SQL like `WHERE category = AND date =`. The interpolation system reports 0 errors for this, so the malformed SQL is sent to the server and fails with a syntax error. Needs either a "waiting for filters" gate or validation that rejects undefined substitutions.

4. **URL param accumulation**: Cross-page persistence carries ALL current URL params to the next page. Params from filters that don't exist on the target page remain in the URL harmlessly but are never cleaned up. Visiting many pages with different filters gradually grows the URL. No cleanup mechanism exists — params persist until the user navigates to a different route group or manually clears the URL.

### Architectural

5. **Dev vs production behavior gap**: The `{#key}` destruction issue only occurs in production builds. There is currently no automated test that runs against a production build to catch regressions. E2E tests should run against `pnpm run build && pnpm run preview` for accurate coverage.

6. **Double navigation for sidebar/programmatic navigation**: The `beforeNavigate` hook cancels the original navigation and starts a new one via `goto()` with merged params. A `lastMergedUrl` guard ensures the second `beforeNavigate` invocation is a no-op, so other hooks or side effects (analytics, spinners) won't fire twice. The guard is reset immediately after matching, so it has no effect on subsequent navigations.

7. **Future constraint — debounced filter writes**: Cross-page param merging reads from `window.location.search` at navigation time. If filter URL writes are ever debounced or throttled (e.g., for slider drag performance), a pending write could be missed by the merge. If debouncing is introduced, pending writes must be flushed synchronously before navigation, or the merge must read from an in-memory canonical params store instead of `window.location.search`.

### Cosmetic

8. **Dev-mode SvelteKit warning**: SvelteKit logs a warning when `window.history.replaceState` is called directly: "Avoid using history.replaceState(...) as these will conflict with SvelteKit's router." This is cosmetic — the operation works correctly. The warning exists because SvelteKit wants developers to use its own `replaceState`, but as documented above, that API is unsuitable for our use case.

9. **SSR → client visual jump**: Data-driven defaults (select_first, slider, calendar) always show a loading → populated transition because data queries only run on the client. This is inherent to the current architecture. The `initial_value=false` truthiness issue makes this slightly worse for toggle — the server could render "off" immediately if the constructor handled falsy values correctly.

10. **UserComponentModel.spec.ts pre-existing failures**: 11 tests fail with `effect_orphan` errors from Svelte runtime. These are pre-existing and unrelated to the filter system. They should be addressed in a separate effort.

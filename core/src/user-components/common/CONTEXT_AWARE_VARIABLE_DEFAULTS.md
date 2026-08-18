# Context-Aware Variable Defaults

## Overview

Variables in the app can now automatically use different default properties based on whether they're used in SQL or text contexts. This eliminates the need for users to always specify `.selected`, `.literal`, etc.

### Variable Types

Variables can be created:

- In frontmatter - `$var` (markdoc variable)
- In input components like dropdown (filter variable)

Variables can be referenced:

- In bare markdown (headers, lists, paragraphs)
- In inline SQL fences
- In component props (SQL props and string props)

These usage contexts fall into **3 buckets**: **text**, **SQL**, and **column**.

---

## How It Works

### Context Detection

The system automatically determines context based on **where the variable is used**:

#### Text Context

Uses `.literal` (or custom text default)

**Examples:**

- Markdown content: `# Title: {{myinput}}`
- Component display props: `title="{{myinput}}"`, `subtitle="{{myinput}}"`, `info="{{myinput}}"`
- Display attributes: `title`, `subtitle`, `info`, `text`, `label`, `date_grain`, `compare_vs`

#### SQL Context

Uses `.selected` (or custom SQL default) — **adds quotes around values**

**Examples:**

- SQL clauses: `where="{{myinput}}"`, `having="{{myinput}}"`, `order="{{myinput}}"`
- SQL fences: ` ```sql\nSELECT * FROM table WHERE column = {{myinput}}\n``` `
- SQL attributes: `where`, `having`, `order`, `qualify`

#### Column Context

Uses `.literal` (or custom column default) — **no quotes, already inside quoted attribute**

**Examples:**

- Column expressions: `x="{{myinput}}"`, `y="{{myinput}}"`, `value="{{myinput}}"`
- Column attributes: `x`, `y`, `value`, `theta`, `series`, `category`, `size`

**Why separate from SQL?**

Column attributes like `x="category"` are already wrapped in quotes in the markup. Using the `sql` context would produce `x="'category'"` (double quotes + SQL quotes), which is incorrect. The `column` context uses `.literal` to get the unquoted value.

### Implementation

Components explicitly pass the context type (`'sql'`, `'text'`, or `'column'`) when processing variables:

**Model classes:**

```typescript
readonly resolvedTitle = $derived(this.processVariables(this.attributes.title, 'text'));
// → text context → .literal (no quotes)

readonly resolvedWhere = $derived(this.processVariables(this.attributes.where, 'sql'));
// → SQL context → .selected (with quotes)

readonly resolvedX = $derived(this.processVariables(this.attributes.x, 'column'));
// → column context → .literal (no quotes, already in quoted attribute)
```

**Svelte components:**

```typescript
const title = $derived(processVariables(props.title || '', variableProcessor, 'text'));
const where = $derived(processVariables(rawWhere, variableProcessor, 'sql'));
const x = $derived(processVariables(props.x || '', variableProcessor, 'column'));
```

**Context selection guide:**

| Context    | Use for                                  | Default property |
| ---------- | ---------------------------------------- | ---------------- |
| `'sql'`    | WHERE, HAVING, ORDER BY clauses          | `.selected`      |
| `'text'`   | Display text (title, subtitle, info)     | `.literal`       |
| `'column'` | Column expressions (x, y, value, series) | `.literal`       |

---

## Filter Reference

Each filter component defines which properties users can access (via `templateValues` getter) and which property to use by default (via `static defaultProperty`).

### Base Default

**Filter.svelte.ts**:

```typescript
static defaultProperty = { sql: 'selected', text: 'literal', column: 'literal' };
```

Most filters inherit this default and only need to define their `templateValues`.

---

### Dropdown (`DropdownFilter`)

**Inherits base defaults** ✅

**Available Properties:**

- `.selected` - Value with quotes: `'Electronics'` or `('A', 'B')`
- `.literal` - Raw value: `Electronics` or `A, B`
- `.filter` - Complete WHERE clause: `category='Electronics'` or `category IN ('A', 'B')`
- `.label` - Label text from option: `Electronics & Appliances` (falls back to value if no label)
- `.fmt` - Format string from option: `usd` (returns undefined if no fmt defined)

**Defaults:**

- **SQL context** → `.selected` (with quotes)
- **Text context** → `.literal` (no quotes)
- **Column context** → `.literal` (no quotes)

**Example:**

````markdown
# Category: {{categoryFilter}}

<!-- Result: "Category: Electronics" -->

# Selected: {{categoryFilter.label}}

<!-- Result: "Selected: Electronics & Appliances" (if label is defined) -->

```sql
SELECT * FROM products WHERE category = {{categoryFilter}}
```

<!-- Result: "SELECT * FROM products WHERE category = 'Electronics'" -->

{% dropdown id="metric" %}
{% option value="revenue" label="Revenue" fmt="usd" /%}
{% option value="growth" label="Growth Rate" fmt="pct1" /%}
{% /dropdown %}

{% big_value data={data} value=amount fmt={{metric.fmt}} /%}

<!-- Dynamically updates chart format based on selected metric -->
````

---

### Date Grain Selector (`DateGrainSelectorFilter`)

**Inherits base defaults** ✅

**Available Properties:**

- `.selected` - Value with quotes: `'day'`
- `.literal` - Raw value: `day`

**Defaults:**

- **SQL context** → `.selected`
- **Text context** → `.literal`
- **Column context** → `.literal`

**Example:**

```markdown
Showing data by {{grain}}

<!-- Result: "Showing data by day" -->
```

---

### Comparison Selector (`ComparisonSelectorFilter`)

**Inherits base defaults** ✅

**Available Properties:**

- `.selected` - Value with quotes: `'prior year'`
- `.literal` - Raw value: `prior year`

**Defaults:**

- **SQL context** → `.selected`
- **Text context** → `.literal`
- **Column context** → `.literal`

**Example:**

```markdown
Comparing to {{comparison}}

<!-- Result: "Comparing to prior year" -->
```

---

### Range Calendar (`RangeCalendarFilter`)

**Overrides defaults** ⚠️

```typescript
static override defaultProperty = { sql: 'between', text: 'range', column: 'range' };
```

**Available Properties:**

- `.start` - Start date with quotes: `'2024-01-01'`
- `.end` - End date with quotes: `'2024-12-31'`
- `.between` - Complete SQL condition: `date BETWEEN '2024-01-01' AND '2024-12-31'`
- `.range` - Human readable: `last 30 days`

**Defaults:**

- **SQL context** → `.between` (complete WHERE clause)
- **Text context** → `.range` (readable label)
- **Column context** → `.range` (readable label)

**Example:**

````markdown
# Report for {{daterange}}

<!-- Result: "Report for last 30 days" -->

```sql
SELECT * FROM orders WHERE {{daterange}}
```

<!-- Result: "SELECT * FROM orders WHERE date BETWEEN '2024-01-01' AND '2024-12-31'" -->
````

**Why Override?**

- `.selected` doesn't exist for range calendar
- `.between` is the most useful SQL property (complete WHERE clause)
- `.range` is the most useful text property (readable label)

---

### Table Filter (`TableFilterFilter`)

**Overrides defaults** ⚠️

```typescript
static override defaultProperty = { sql: 'filter', text: 'filter', column: 'filter' };
```

**Available Properties:**

- `.filter` - Complete SQL condition: `status='active' AND type='premium'`

**Defaults:**

- **SQL context** → `.filter`
- **Text context** → `.filter` (same, only property available)
- **Column context** → `.filter` (same, only property available)

**Example:**

```sql
SELECT * FROM users WHERE {{userfilter}}
<!-- Result: WHERE status='active' AND type='premium' -->
```

**Why Override?**

- Only has one property: `.filter`
- `.selected` and `.literal` don't exist for table filters

---

### Summary Table

| Filter Component    | SQL Default    | Text Default  | Column Default | Properties Available                            |
| ------------------- | -------------- | ------------- | -------------- | ----------------------------------------------- |
| Dropdown            | `.selected`    | `.literal`    | `.literal`     | `selected`, `literal`, `filter`, `label`, `fmt` |
| Button Group        | `.selected`    | `.literal`    | `.literal`     | `selected`, `literal`, `filter`, `label`, `fmt` |
| Input Tabs          | `.selected`    | `.literal`    | `.literal`     | `selected`, `literal`, `filter`, `label`, `fmt` |
| Date Grain Selector | `.selected`    | `.literal`    | `.literal`     | `selected`, `literal`                           |
| Comparison Selector | `.selected`    | `.literal`    | `.literal`     | `selected`, `literal`                           |
| Toggle              | `.value`       | `.value`      | `.value`       | `value`                                         |
| Text Input          | `.value`       | `.value`      | `.value`       | `value`                                         |
| Slider              | `.value`       | `.value`      | `.value`       | `value`                                         |
| **Range Calendar**  | **`.between`** | **`.range`**  | **`.range`**   | `start`, `end`, `between`, `range`              |
| **Table Filter**    | **`.filter`**  | **`.filter`** | **`.filter`**  | `filter`                                        |

---

## Autocomplete Behavior

When typing variables in `{{ }}` syntax:

1. **Filter ID suggestions** - No longer include the dot automatically

   - Type `{{my` → suggests `myinput` (without dot)
   - Accepting completes as `{{myinput}}` - uses context-aware default

2. **Property access** - Still available when user types dot explicitly
   - Type `{{myinput.` → shows property suggestions (`.selected`, `.literal`, `.filter`)
   - Accepting completes as `{{myinput.selected}}`

This provides the best of both worlds:

- Quick completion with smart defaults for most use cases
- Explicit control when user needs a specific property

---

## Implementation Details

### Key Files Modified

1. **`Filter.svelte.ts`** - Added `static defaultProperty` to base class
2. **`interpolate-query-strings.ts`** - Added `VariableContext` type and context parameter throughout
3. **`VariableProcessor.ts`** - Threads context through processing pipeline
4. **`process-variables.ts`** - Accepts explicit context parameter
5. **`ReactiveVariable.svelte`** - Uses 'text' context for markdown rendering
6. **Filter implementations** - Override defaults where needed (RangeCalendar, TableFilter)
7. **All component models** - Explicitly pass context ('sql' or 'text') when calling `processVariables`

### Backward Compatibility

- Explicit property access still works: `{{myinput.selected}}`, `{{myinput.literal}}`
- Default context is 'text' when not specified
- All existing code continues to work without changes

### Performance

- ✅ **No runtime overhead**: Context determined once during processing
- ✅ **No schema lookups**: Uses explicit context passing
- ✅ **Compile-time safe**: TypeScript ensures filter classes define defaults
- ✅ **Reactive**: Automatic reactivity through filter.templateValues access

---

## Adding New Filter Components

When creating a new filter component:

1. **Define `templateValues` getter** - Specify what properties users can access
2. **Use base defaults if possible** - Most filters fit the `.selected` / `.literal` pattern
3. **Override defaults only if needed**:
   ```typescript
   static override defaultProperty = { sql: 'customSqlProp', text: 'customTextProp', column: 'customColumnProp' };
   ```
4. **Document the properties** in the schema's `filterProperties` array

### Decision Guide

**Use base defaults** (`.selected` / `.literal`) if your filter:

- Has a simple value (string, number)
- Needs SQL-safe quoted version for queries
- Needs unquoted version for display

**Override defaults** if your filter:

- Has specialized properties (like `.between`, `.filter`)
- Doesn't have `.selected` or `.literal`
- Has a better default than the base (like `.range` for display)

### Example: New Filter

```typescript
// Uses base defaults - no override needed
export class MyNewFilter extends Filter<string> {
	get templateValues() {
		return {
			selected: `'${this.value}'`, // With quotes for SQL
			literal: this.value // Without quotes for display
		};
	}
}
```

```typescript
// Custom defaults - needs override
export class CustomFilter extends Filter<ComplexValue> {
	static override defaultProperty = { sql: 'query', text: 'display', column: 'display' };

	get templateValues() {
		return {
			query: `column = '${this.value}'`, // SQL clause
			display: this.value.label, // Display text
			raw: JSON.stringify(this.value) // Additional property
		};
	}
}
```

---

## Robustness

The current approach (explicit context passing) is **highly robust** because:

1. **Explicit and traceable** - Every call site clearly shows whether it's SQL or text
2. **Type-safe** - TypeScript enforces the `VariableContext` type
3. **Centrally updated** - All components were updated using automated scripts
4. **No runtime inference** - No stack traces, no attribute name pattern matching
5. **Aligns with schema** - Mirrors the existing `suggestionType` concept
6. **Easy to debug** - Clear to see which context is being used
7. **Performance** - Zero runtime overhead for context detection

The explicit approach trades a small amount of repetition at call sites for significantly improved clarity, maintainability, and reliability.

# Component System Architecture

> **Living document** — This document will be built up over time as we document more of the component system. For now, it focuses on the data acceptance pattern, which is critical for all data-driven components.

## Related Documentation

- [Variable Processing](common/VARIABLE_PROCESSING.md) — How filter variables (`{{filter.property}}`) are resolved in component attributes.
- [Context-Aware Variable Defaults](common/CONTEXT_AWARE_VARIABLE_DEFAULTS.md) — How variables use different defaults based on SQL vs text context.
- [Date System Architecture](common/README.md) — How date ranges, comparisons, and date grains work across components.
- [Comparison System](common/COMPARISON_SYSTEM.md) — How period-over-period comparisons are generated.
- [Filter System Architecture](../FILTER_SYSTEM.md) — How input components manage filter state, URL persistence, and cross-page behavior.
- [UserComponentModel](UserComponentModel/README.md) — Base class for components with model layers.
- Readiness system (`core/src/readiness.ts`, `core/src/readiness.svelte.ts`, `core/src/page-render-tracker.context.svelte.ts`) — How components signal that they have finished rendering.

---

## Data Acceptance: How Components Receive and Query Data

Every data-driven component accepts a `data` attribute specifying the data source. Users can provide data in three ways:

### 1. Direct Table Reference

The `data` attribute names a table deployed to ClickHouse:

```markdoc
{% bar_chart data="orders" x="order_date" y="sum(sales)" /%}
```

### 2. Inline Query Reference

The `data` attribute references an inline SQL query defined in a Markdown code fence:

````markdoc
```sql filtered_orders
select * from demo.daily_orders where category = 'Electronics'
```

{% bar_chart data="filtered_orders" x="date" y="sum(total_sales)" /%}
````

### 3. Variable-Interpolated Reference

The `data` attribute uses a variable that resolves to a table or inline query name:

```markdoc
{% dropdown id="source" %}
  {% option value="demo.daily_orders" label="Daily Orders" /%}
  {% option value="demo_monthly_orders" label="Monthly Orders" /%}
{% /dropdown %}

{% bar_chart data="{{source}}" x="date" y="sum(total_sales)" /%}
```

### Resolution Pipeline

For all three scenarios, the component must resolve `data` through a two-stage pipeline:

```
data="{{source}}"  →  resolveText()  →  "filtered_orders"  →  getInterpolated()  →  "(SELECT * FROM ...)"
                       Stage 1:                                  Stage 2:
                       Variable                                  Inline Query
                       Interpolation                             Resolution
```

**Stage 1 — Variable Interpolation**: `resolveText(props.data)` replaces `{{variables}}` with their current values. This produces a plain string — either a table name or an inline query name.

**Stage 2 — Inline Query Resolution**: `inlineQueries.getInterpolated(name)` checks if the resolved name matches a registered inline query or SQL file. If it does, it returns the SQL wrapped in parentheses (e.g., `(SELECT * FROM orders WHERE ...)`). If it doesn't match, it returns `undefined`, meaning the name is a direct table reference and should be used as-is.

---

### Three Implementation Patterns

Components implement this pipeline using one of three patterns, depending on whether they use `generateSQLQuery`, build SQL manually, or need early resolution before passing to `SQLQueryConfig`.

#### Pattern A: `SQLQueryConfig` + `generateSQLQuery` (Preferred)

**When to use**: When the component's SQL needs are expressible as a `SQLQueryConfig` object (columns, filters, where, order, limit, etc.) and the component does not need to manipulate the resolved table expression before query execution.

**How it works**: The component performs only Stage 1 (variable interpolation), then passes the result as `tableExpressionName` in an `SQLQueryConfig`. The `Query` class calls `generateSQLQuery`, which internally performs Stage 2 (inline query resolution).

**Example** (Dropdown):

```typescript
// Stage 1: Variable interpolation only
const table = $derived(resolveText(props.data));

// Build config — pass variable-resolved name, NOT inline-resolved
const queryConfig = $derived({
    tableExpressionName: table ?? '',
    columns: [...],
    where: whereClause,
});

// Query class + generateSQLQuery handles Stage 2 internally
const query = new Query(() => queryConfig, {
    connection,
    filterContexts: [repeatFilters, pageFilters],
    inlineQueries,    // ← generateSQLQuery uses this for Stage 2
    projectSettings,
    defaultRefreshInterval: undefined,
});
```

**Components using this pattern**: Combo Chart, Bar Chart, Line Chart, Area Chart, Scatter Chart, Bubble Chart, Dropdown, Big Value, Button Group, Input Tabs, Pie Chart, Polar Chart, Sankey Chart, Sparkline, Progress Bars, Heatmap, Calendar Heatmap, Candlestick, Slider, Download, Value, Delta, Heat Grid, Funnel Chart, Repeat, If/Else If, Area Layer.

#### Pattern B: Manual SQL Construction

**When to use**: When the component builds custom SQL that cannot be expressed as a `SQLQueryConfig` (e.g., CTEs, window functions, UNION ALL, custom aggregation patterns).

**How it works**: The component performs both Stage 1 and Stage 2 before building SQL, then passes a raw SQL string to `Query`. Since `generateSQLQuery` is not used, the component is responsible for calling `getInterpolated()` itself.

**Example** (Dimension Grid):

```typescript
// Stage 1: Variable interpolation
const table = $derived(resolveText(props.data));

// Stage 2: Inline query resolution
const tableExpression = $derived.by(() => {
    if (!table) return '';
    if (inlineQueries) {
        try {
            return inlineQueries.getInterpolated(table) ?? table;
        } catch {
            return table;
        }
    }
    return table;
});

// Build SQL manually using the fully-resolved table expression
function buildQuery(): string | undefined {
    if (!tableExpression) return undefined;
    return `
        WITH ranked AS (
            SELECT dimension, count(*) AS metric
            FROM ${tableExpression}
            WHERE ${whereClause}
            GROUP BY dimension
        )
        SELECT * FROM ranked WHERE rn <= ${limit}
    `;
}

// Pass raw SQL string to Query
const query = new Query(() => buildQuery(), {
    connection,
    filterContexts: [repeatFilters, pageFilters],
    inlineQueries,
    projectSettings,
    defaultRefreshInterval: undefined,
});
```

**Components using this pattern**: Dimension Grid, Histogram.

#### Pattern C: Early Resolution + `SQLQueryConfig` (Hybrid)

**When to use**: When the component uses `SQLQueryConfig` for query execution but needs the resolved table expression earlier — for example, to wrap it in additional SQL before passing it to the config.

**How it works**: The component performs both Stage 1 and Stage 2 early, then passes the already-resolved expression as `tableExpressionName` in an `SQLQueryConfig`. The `generateSQLQuery` call on the already-resolved value is effectively a no-op for inline query resolution (since `getInterpolated` returns `undefined` for raw SQL that isn't a registered query name).

**Example** (Table):

```typescript
// Stage 1: Variable interpolation
readonly resolvedData = $derived(this.resolveText(this.attributes.data));

// Stage 2: Inline query resolution (early, for subtotal wrapping)
readonly resolvedTableExpression: string = $derived.by(() => {
    const dataValue = this.resolvedData;
    if (!dataValue) return '';
    if (this.deps?.inlineQueries) {
        try {
            const interpolated = this.deps.inlineQueries.getInterpolated(dataValue);
            return interpolated ?? dataValue;
        } catch (error) {
            return dataValue;
        }
    }
    return dataValue;
});

// Wrap with additional SQL if needed (e.g., subtotals)
readonly finalTableExpression: string = $derived.by(() => {
    if (!this.attributes.subtotals) return this.resolvedTableExpression;
    return `(SELECT *, ${complexExpressions} FROM ${this.resolvedTableExpression})`;
});

// Pass to SQLQueryConfig — already resolved, so generateSQLQuery's
// getInterpolated() call is a no-op
readonly queryConfig = $derived({
    tableExpressionName: this.finalTableExpression,
    columns: this.processedColumnsForQuery,
    // ...
});
```

**Components using this pattern**: Table.

---

### Component Audit

| Pattern | Components |
|---------|------------|
| **A** (variable interpolation → SQLQueryConfig → generateSQLQuery) | Big Value, Value, Delta, Dropdown, Button Group, Input Tabs, Slider, Repeat, Combo Chart (Bar/Line/Area/Scatter/Bubble), Candlestick, Calendar Heatmap, Sparkline, Sankey Chart, Pie Chart, Polar Chart, Heatmap, Funnel Chart, Progress Bars, Heat Grid, Download, If/Else If, Area Layer |
| **B** (variable interpolation + getInterpolated → raw SQL string) | Dimension Grid, Histogram |
| **C** (variable interpolation + early getInterpolated → SQLQueryConfig) | Table |

#### Known issues

These components have incomplete implementations of the data acceptance pipeline:

- **Horizontal Bar Chart**: Uses `props.data` directly for `tableExpressionName` without `resolveText()` — variable interpolation in `data` will not work.
- **Point Layer, Heatmap Layer**: Same issue — `props.data` passed directly to model without `resolveText()`.
- **Table Filter's internal Histogram** (`table_filter/Histogram.svelte`): Uses `FROM ${data}` in raw SQL without calling `getInterpolated()` — inline query references will fail. This is the same class of bug as the original dimension_grid issue.

### Critical Rules

1. **Always perform Stage 1** (`resolveText` on `data`). Every component must do this for variable support.

2. **Always perform Stage 2** (inline query resolution). Either via `generateSQLQuery` (Pattern A) or `getInterpolated` (Pattern B). **Skipping this breaks inline query references.**

3. **Never use the raw `data` prop in SQL**. Always use the resolved result. Using `FROM ${props.data}` directly will fail for inline queries.

4. **Handle `getInterpolated` errors gracefully** (Pattern B). During editing, the user may type partial variable syntax that causes parse errors. Catch and fall back to the raw table name:

   ```typescript
   try {
       return inlineQueries.getInterpolated(table) ?? table;
   } catch {
       return table;
   }
   ```

5. **Prefer Pattern A** when possible. It's simpler and ensures consistent behavior with the rest of the system. Use Pattern B only when `SQLQueryConfig` cannot express your SQL needs. Use Pattern C only when you need to manipulate the resolved table expression before passing it to `SQLQueryConfig` (e.g., wrapping with subtotal logic).

6. **Always register with the readiness system** if the component loads data. This is required for PDF generation — without it, PDFs will be captured before the component finishes rendering. The helpers live in `core/src/readiness.svelte.ts` (`setupRenderReadiness`, `setupContainerReadiness`) and `core/src/readiness.ts` (`createRenderTask`).

   **Leaf component** (loads data, renders it):

   ```typescript
   import { setupRenderReadiness } from '../../readiness.svelte';
   setupRenderReadiness('my_component', () => !loading);
   ```

   **Container component** (controls child rendering, e.g. conditionals/loops):

   ```typescript
   import { setupContainerReadiness } from '../../readiness.svelte';
   setupContainerReadiness('my_container', () => !loading);
   ```

   Static/layout components that render synchronously without data don't need this.

### Schema Configuration for `data`

The `data` attribute in the component's `schema.ts` should always include:

```typescript
data: {
    type: String,
    description: 'Name of the table to query',
    required: true,
    suggested: true,
    suggestionType: 'table',    // Enables table/inline query autocomplete
    affectsQuery: true,
    supportsVariables: true,
    variableContext: 'text',    // Always 'text' — data is a name, not SQL
},
```

### Metadata Resolution

Components that auto-detect columns from metadata (e.g., dimension_grid auto-detecting string columns) should check both metadata contexts:

```typescript
const tableMetadata = metadata?.getTable(table) ?? inlineQueryMetadata?.getTable(table);
```

Use the **variable-resolved name** (`table`), not the inline-query-resolved expression (`tableExpression`), for metadata lookups. Metadata is keyed by the original name, not the SQL subquery.

### Validation

The `tableExists` validator in `schema.ts` already handles both regular tables and inline query names. No special validation is needed — just use:

```typescript
validate: and(
    tableExists('data'),
    // ... other validators
),
```

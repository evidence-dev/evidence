# Comparison System Architecture

## Overview

This document explains how the comparison system works in Evidence, from user-facing markdown to SQL generation. This is essential reading for anyone working on comparison optimization or debugging comparison-related issues.

---

## Complete Flow

### 1. Component Level (User writes markdown)

```markdown
<Value data="orders" value="sum(revenue)" comparison={compare_vs: "prior year"} />
<Delta data="orders" value="avg(price)" comparison={compare_vs: "prior period"} />

<Table data="orders">
  <Measure value="sum(revenue)" comparison={compare_vs: "prior year"} />
  <Measure value="count(*)" comparison={compare_vs: "prior year"} />
</Table>
```

**Key Files:**

- Component schemas define what props are accepted
- Each component (Value, Delta, BigValue, Table) can have comparisons

---

### 2. Model Creation (Svelte 5 $derived)

Each component has a corresponding Model class that processes its attributes into a queryable format.

#### Single-Value Components (Value, Delta, BigValue)

**File:** `src/lib/ui/user-components/tags/value/ValueModel.svelte.ts` (similar for Delta, BigValue)

```typescript
// Step 1: Resolve variables in comparison props
readonly resolvedComparison = $derived.by(() => {
  if (!this.attributes.comparison) return undefined;
  return {
    ...this.attributes.comparison,
    compare_vs: this.processVariables(this.attributes.comparison.compare_vs)
  };
});

// Step 2: Build comparison config
readonly comparisonConfig = $derived.by(() => {
  return buildComparisonQueryConfig(
    this.resolvedComparison,
    this.valueProcessed,
    this.resolvedDateRange
  );
});
// Returns: ComparisonQueryConfig | null

// Step 3: Include in query config
readonly queryConfig: SQLQueryConfig = $derived.by(() => ({
  tableExpressionName: this.attributes.data,
  columns: [this.valueProcessed],
  comparisons: this.comparisonConfig ? [this.comparisonConfig] : [],
  // ... other SQL options
}));
```

#### Table Component (Multiple Comparisons)

**File:** `src/lib/ui/user-components/tags/table/TableModel.svelte.ts`

```typescript
readonly queryConfig: SQLQueryConfig = $derived.by(() => {
  // Generate comparison configs from ALL measures with comparisons
  const comparisonQueryConfigs = generateTableComparisonQueryConfig(
    this.allUnifiedColumns,  // Includes all dimensions, pivots, measures
    this.resolvedDateRange
  );
  // Returns: ComparisonQueryConfig[]

  return {
    tableExpressionName: this.finalTableExpression,
    columns: this.processedColumnsForQuery,
    comparisons: comparisonQueryConfigs.length > 0 ? comparisonQueryConfigs : undefined,
    dateDimensionExpression: this.mostGranularDateDimensionInfo?.expression,
    dateDimensionGrain: this.mostGranularDateDimensionInfo?.grain,
    // ... other SQL options
  };
});
```

**File:** `src/lib/ui/user-components/tags/table/table-comparisons.ts`

The table has special logic to:

- Collect comparisons from all measure columns
- Deduplicate identical comparison configs (lines 74-95)
- Determine most granular date dimension for dynamic comparisons

---

### 3. Query Config Assembly

At this point, each Model produces a `SQLQueryConfig` object:

```typescript
interface SQLQueryConfig {
	tableExpressionName: string;
	columns: ProcessedColumnExpression[];
	comparisons?: ComparisonQueryConfig[]; // ← Array of comparison configs

	// Context needed for comparisons:
	filterIds?: unknown[];
	filterSql?: string;
	where?: string;
	date_range?: DateRangeObject;
	having?: string;
	order?: string;
	limit?: number;
	subtotals?: boolean;
	groupingSets?: string;
	dateDimensionExpression?: string; // For dynamic comparisons
	dateDimensionGrain?: string;
	// ... other SQL options
}
```

**Key Point:** The `comparisons` array can contain multiple configs, especially from Table components with multiple measures.

---

### 4. Query Class (Query Execution Layer)

**File:** `src/lib/ui/Query.svelte.ts`

The Query class wraps the SQLQueryConfig and uses Svelte's `resource()` to manage async query execution:

```typescript
export class Query {
  constructor(
    private readonly queryGetter: () => string | SQLQueryConfig | undefined,
    private readonly deps: QueryDependencies,
    // ...
  ) {
    // Creates multiple reactive resources that trigger SQL generation:
    this.dataResource = resource([...], async () => {
      // Calls generateSQLQuery when dependencies change
    });

    this.countResource = resource([...], async () => {
      // Separate query for counts
    });
  }

  get dataQuery() {
    if (typeof this.query === 'string') return this.query;
    const { sql, error } = generateSQLQuery(
      this.query,
      this.deps.filterContexts,
      this.deps.inlineQueries
    );
    return sql;
  }
}
```

**Key Point:** `generateSQLQuery` is called every time reactive dependencies change.

---

### 5. SQL Generation Entry Point

**File:** `src/lib/ui/user-components/common/sql-options.ts`

```typescript
export function generateSQLQuery(
	config: SQLQueryConfig,
	filterContexts: (Filters | undefined)[] | undefined,
	inlineQueries: InlineQueries | undefined
): SQLQueryResult {
	// Build all SQL components (WHERE, GROUP BY, HAVING, etc.)
	// ...

	// Process comparisons (line 441-457)
	if (config.comparisons && config.comparisons.length > 0) {
		const comparisonContext: ComparisonContext = {
			tableExpression: resolvedTableExpression,
			whereClause,
			groupByClause,
			filterSql: effectiveFilterSql,
			processedColumns: config.columns,
			userWhere: config.where,
			dateFilterSql,
			dateDimensionExpression: config.dateDimensionExpression,
			dateDimensionGrain: config.dateDimensionGrain,
			subtotalsEnabled: !!config.subtotals
		};

		const comparisonResult = buildComparisons(
			config.comparisons, // ← Raw array of ComparisonQueryConfig
			comparisonContext
		);

		allInlineColumns.push(...comparisonResult.inlineColumns);
		allFragments.push(...comparisonResult.fragments);
	}

	// Build final query with fragments
	// ...
}
```

**Key Point:** This is where we transition from config → SQL generation.

---

### 6. Comparison Building (🎯 OPTIMIZATION POINT)

**File:** `src/lib/ui/user-components/common/build-comparisons.ts`

This is where the magic happens (or should happen):

```typescript
export function buildComparisons(
  comparisons: ComparisonQueryConfig[],
  context?: ComparisonContext
): QueryExtension {
  // Returns: { inlineColumns: string[], fragments: Fragment[] }

  // Current implementation (UNOPTIMIZED):
  for (const comparison of comparisons) {
    if (comparison.compare_vs === 'target') {
      // Inline comparison (no CTE needed)
      inlineColumns.push(...buildTargetInlineColumns(comparison, context));
    } else {
      // Temporal comparison (needs CTE + JOIN)
      const dateInfo = processTemporalDateInfo(comparison, context);
      const cteSql = buildTemporalCTE(...);
      const joinSql = buildTemporalJoin(...);
      const calculationColumns = buildCalculationColumns(...);

      fragments.push({ cteSql, joinSql, calculationColumns, alias });
    }
  }

  // PROBLEM: Creates one fragment per temporal comparison
  // With 8 comparisons → 8 CTEs + 8 JOINs
}
```

#### What Information Is Available Here?

**From `ComparisonContext`:**

- ✅ `tableExpression` - The table/source being queried
- ✅ `whereClause` - Combined WHERE from main query
- ✅ `groupByClause` - GROUP BY clause from main query
- ✅ `filterSql` - Combined filter SQL from page filters
- ✅ `userWhere` - User's custom WHERE clause
- ✅ `dateFilterSql` - Date range filter from main query
- ✅ `processedColumns` - All dimensions, measures, pivots with full metadata
- ✅ `dateDimensionExpression` - The date dimension SQL (e.g., "toStartOfMonth(date)")
- ✅ `dateDimensionGrain` - The grain (e.g., "month", "year")
- ✅ `subtotalsEnabled` - Whether subtotals are being computed

**From Each `ComparisonQueryConfig`:**

- ✅ `id` - Unique comparison identifier
- ✅ `compare_vs` - "prior year" | "prior period" | "target"
- ✅ `valueColumn` - The SQL expression to compare (e.g., "sum(revenue)")
- ✅ `valueColumnAlias` - The column alias in main query
- ✅ `date_range` - Date range for this comparison
- ✅ `dateGrain` - Date grain for this comparison

**From `processTemporalDateInfo(comparison, context)`:**

- ✅ `whereClause` - **The actual temporal WHERE clause** (e.g., "date >= '2022-01-01' AND date <= '2022-12-31'")
- ✅ `offsetGrain` - The grain for date shifting (e.g., "year", "month")
- ✅ `offsetAmount` - The amount to shift (e.g., -1, -6)
- ✅ `currentStartDate`, `currentEndDate` - Current period bounds
- ✅ `priorStartDate`, `priorEndDate` - Prior period bounds

#### Can We Confidently Group Comparisons?

**YES!** We have everything needed to determine if comparisons can share a fragment:

**Comparisons can be grouped if they share:**

1. ✅ Same `tableExpression` (from context)
2. ✅ Same dimensions (from `context.processedColumns`)
3. ✅ Same base filters (from `context.userWhere`, `context.filterSql`)
4. ✅ Same `groupByClause` (from context)
5. ✅ Same `subtotalsEnabled` (from context)
6. ✅ Same temporal `whereClause` (from dateInfo) - **This is the key!**
7. ✅ Same `offsetGrain` and `offsetAmount` (from dateInfo) - **Needed for correct joins**

**Example:**

```typescript
// These can be grouped (all query prior year data):
comparison1: sum(revenue), compare_vs: "prior year"
  → whereClause: "order_date >= '2023-01-01' AND order_date <= '2023-12-31'"
  → offset: -1 year

comparison2: avg(price), compare_vs: "prior year"
  → whereClause: "order_date >= '2023-01-01' AND order_date <= '2023-12-31'"
  → offset: -1 year

comparison3: count(*), compare_vs: "prior year"
  → whereClause: "order_date >= '2023-01-01' AND order_date <= '2023-12-31'"
  → offset: -1 year

// Combined into ONE CTE:
WITH comparison_fragment AS (
  SELECT
    category, region,  -- dimensions
    sum(revenue) as comp1,
    avg(price) as comp2,
    count(*) as comp3
  FROM orders
  WHERE order_date >= '2023-01-01' AND order_date <= '2023-12-31'
  GROUP BY category, region
)
```

---

### 7. Fragment Assembly

**File:** `src/lib/ui/user-components/common/sql-options.ts`

```typescript
function buildFragmentQuery(
	mainQuerySql: string,
	fragments: Fragment[],
	mainQueryColumns?: ProcessedColumnExpression[],
	hasSubtotals?: boolean,
	inlineColumns?: string[]
): string {
	// Build WITH clause with all fragment CTEs
	const ctes = fragments.map((fragment) => `${fragment.alias} AS (${fragment.cteSql})`).join(',\n');

	// Collect all JOINs
	const joins = fragments.map((fragment) => fragment.joinSql).join('\n');

	// Collect all calculation columns
	const allCalculationColumns = fragments.flatMap((f) => f.calculationColumns);

	// Assemble final query:
	return `
    WITH 
      ${ctes},
      main_query AS (${mainQuerySql})
    SELECT 
      main_query.*,
      ${allCalculationColumns.join(', ')}
    FROM main_query
    ${joins}
  `;
}
```

**Current Output (8 comparisons, UNOPTIMIZED):**

```sql
WITH
  comparison_1_fragment AS (SELECT category, sum(revenue) ... WHERE prior_year_dates),
  comparison_2_fragment AS (SELECT category, avg(price) ... WHERE prior_year_dates),
  comparison_3_fragment AS (SELECT category, count(*) ... WHERE prior_year_dates),
  comparison_4_fragment AS (SELECT category, max(quantity) ... WHERE prior_year_dates),
  comparison_5_fragment AS (SELECT category, sum(revenue) ... WHERE 2_years_ago_dates),
  comparison_6_fragment AS (SELECT category, avg(price) ... WHERE 2_years_ago_dates),
  comparison_7_fragment AS (SELECT category, count(*) ... WHERE 2_years_ago_dates),
  comparison_8_fragment AS (SELECT category, max(quantity) ... WHERE 2_years_ago_dates),
  main_query AS (...)
SELECT ...
FROM main_query
LEFT JOIN comparison_1_fragment ON ...
LEFT JOIN comparison_2_fragment ON ...
LEFT JOIN comparison_3_fragment ON ...
LEFT JOIN comparison_4_fragment ON ...
LEFT JOIN comparison_5_fragment ON ...
LEFT JOIN comparison_6_fragment ON ...
LEFT JOIN comparison_7_fragment ON ...
LEFT JOIN comparison_8_fragment ON ...
```

**Optimized Output (after grouping):**

```sql
WITH
  comparison_1_fragment AS (
    SELECT
      category,
      sum(revenue) as comp1,
      avg(price) as comp2,
      count(*) as comp3,
      max(quantity) as comp4
    FROM orders
    WHERE prior_year_dates
    GROUP BY category
  ),
  comparison_2_fragment AS (
    SELECT
      category,
      sum(revenue) as comp5,
      avg(price) as comp6,
      count(*) as comp7,
      max(quantity) as comp8
    FROM orders
    WHERE 2_years_ago_dates
    GROUP BY category
  ),
  main_query AS (...)
SELECT ...
FROM main_query
LEFT JOIN comparison_1_fragment ON ...
LEFT JOIN comparison_2_fragment ON ...
```

**Performance Impact:**

- ❌ Before: 8 table scans, 8 GROUP BYs, 8 JOINs
- ✅ After: 2 table scans, 2 GROUP BYs, 2 JOINs
- **~4x faster** on this example

---

## Optimization Strategy

### Where to Intervene

**Target:** Step 6 - `buildComparisons()` in `build-comparisons.ts`

**Why this is the right place:**

1. ✅ All comparison configs are already assembled (no upstream changes needed)
2. ✅ Full context available (all information needed for grouping decisions)
3. ✅ Natural boundary (transforms configs → SQL fragments)
4. ✅ Single responsibility (keeps optimization logic contained)
5. ✅ No API changes (transparent to models and components)

### Proposed Implementation

```typescript
export function buildComparisons(
	comparisons: ComparisonQueryConfig[],
	context?: ComparisonContext
): QueryExtension {
	const inlineColumns: string[] = [];
	const fragments: Fragment[] = [];

	// 1. Separate target and temporal comparisons
	const targetComparisons = comparisons.filter((c) => c.compare_vs === 'target');
	const temporalComparisons = comparisons.filter((c) => c.compare_vs !== 'target');

	// 2. Process target comparisons (always inline)
	for (const comparison of targetComparisons) {
		inlineColumns.push(...buildTargetInlineColumns(comparison, context));
	}

	// 3. Process temporal comparisons ONCE and group
	const processedComparisons = temporalComparisons.map((comparison) => ({
		config: comparison,
		dateInfo: processTemporalDateInfo(comparison, context),
		fragmentId: generateFragmentGroupId(comparison, context)
	}));

	// 4. Group by fragment ID
	const fragmentGroups = groupBy(processedComparisons, 'fragmentId');

	// 5. Build one fragment per group
	for (const [fragmentId, group] of Object.entries(fragmentGroups)) {
		const fragmentAlias = `comparison_${fragmentId}_fragment`;

		// All comparisons in group share same date range, so we can select all measures at once
		const cteSql = buildCombinedTemporalCTE(group, dimensionColumns, context);
		const joinSql = buildTemporalJoin(context, group[0].dateInfo, fragmentAlias);

		// Build calculation columns for all comparisons in this group
		const calculationColumns = group.flatMap((item) =>
			buildCalculationColumns(item.config, fragmentAlias, context)
		);

		// Add date display columns for each comparison
		for (const item of group) {
			inlineColumns.push(...buildDateRangeDisplayColumns(item.config, item.dateInfo, context));
		}

		fragments.push({ cteSql, joinSql, calculationColumns, alias: fragmentAlias });
	}

	return { inlineColumns, fragments };
}

function generateFragmentGroupId(
	comparison: ComparisonQueryConfig,
	context: ComparisonContext
): string {
	const dateInfo = processTemporalDateInfo(comparison, context);

	// Create a stable hash of properties that must match for grouping
	return hash({
		tableExpression: context.tableExpression,
		userWhere: context.userWhere,
		filterSql: context.filterSql,
		groupByClause: context.groupByClause,
		subtotalsEnabled: context.subtotalsEnabled,
		dimensions: context.processedColumns
			.filter((col) => col.type === 'dimension' || col.type === 'pivot')
			.map((col) => col.alias)
			.sort(),
		temporalWhereClause: dateInfo.whereClause, // The actual date filter
		offsetGrain: dateInfo.offsetGrain, // Needed for join logic
		offsetAmount: dateInfo.offsetAmount
	});
}

function buildCombinedTemporalCTE(
	group: ProcessedComparison[],
	dimensionColumns: ProcessedColumnExpression[],
	context: ComparisonContext
): string {
	const selectParts = [];

	// Add dimensions
	selectParts.push(...dimensionColumns.map((col) => col.sqlWithAlias));

	// Add all comparison measures (one per comparison in group)
	for (const item of group) {
		selectParts.push(`${item.config.valueColumn} as "${item.config.id}"`);
	}

	// All comparisons share the same WHERE clause (by design of grouping)
	const temporalWhereClause = group[0].dateInfo.whereClause;

	return `
    SELECT ${selectParts.join(', ')}
    FROM ${context.tableExpression}
    WHERE (${context.filterSql}) AND (${context.userWhere}) AND (${temporalWhereClause})
    ${context.groupByClause}
  `;
}
```

### Key Design Decisions

1. **Process each comparison exactly once** - Compute `dateInfo` once per comparison, reuse for grouping and SQL generation
2. **Group by complete signature** - Include all properties that affect SQL generation
3. **Stable fragment IDs** - Use deterministic hashing so same groups get same IDs
4. **Preserve all metadata** - Each comparison still gets its own calculation columns and display columns
5. **Safe grouping criteria** - Only group when we're 100% certain the results will be identical

---

## Testing Considerations

### Unit Tests Needed

1. **Grouping logic:**

   - Same temporal period → grouped
   - Different temporal periods → separate fragments
   - Different base filters → separate fragments
   - Mix of target and temporal → target inline, temporal grouped

2. **SQL correctness:**

   - Verify combined CTEs produce same results as separate CTEs
   - Verify JOIN logic works correctly with grouped fragments
   - Verify calculation columns reference correct fragment columns

3. **Edge cases:**
   - Single comparison (no grouping needed)
   - All comparisons identical (all grouped)
   - No comparisons (no-op)
   - Only target comparisons (no fragments)

### Integration Tests Needed

1. **Table with multiple measure comparisons**
2. **Value/Delta with single comparison**
3. **Mixed comparison types (prior year + prior period)**
4. **Comparisons with subtotals enabled**
5. **Comparisons with pivots**

---

## Performance Expectations

### Best Case (All Comparisons Grouped)

- 8 comparisons all looking at same period
- Before: 8 CTEs + 8 JOINs
- After: 1 CTE + 1 JOIN
- **Expected: ~8x faster**

### Typical Case (Mixed Periods)

- 4 comparisons to prior year + 4 to 2 years ago
- Before: 8 CTEs + 8 JOINs
- After: 2 CTEs + 2 JOINs
- **Expected: ~4x faster**

### Worst Case (All Different)

- 8 comparisons all with different periods/filters
- Before: 8 CTEs + 8 JOINs
- After: 8 CTEs + 8 JOINs
- **Expected: Same performance (no regression)**

---

## Related Files

### Core Comparison Logic

- `src/lib/ui/user-components/common/build-comparisons.ts` - Main comparison building logic
- `src/lib/ui/user-components/common/date-options.ts` - Date range processing
- `src/lib/ui/user-components/common/sql-options.ts` - SQL generation entry point

### Component Models

- `src/lib/ui/user-components/tags/value/ValueModel.svelte.ts`
- `src/lib/ui/user-components/tags/delta/DeltaModel.svelte.ts`
- `src/lib/ui/user-components/tags/bigvalue/BigValueModel.svelte.ts`
- `src/lib/ui/user-components/tags/table/TableModel.svelte.ts`

### Table-Specific

- `src/lib/ui/user-components/tags/table/table-comparisons.ts` - Table comparison config generation
- `src/lib/ui/user-components/tags/table/measure/MeasureModel.svelte.ts` - Measure-level comparison props

### Query Execution

- `src/lib/ui/Query.svelte.ts` - Query execution wrapper
- `src/lib/services/QueryService/QueryService.ts` - Actual query execution

---

## Debugging Tips

### How to See Generated SQL

1. Check browser console - queries are logged in development
2. Use `{@debug query.dataQuery}` in components
3. Set breakpoint in `generateSQLQuery()` and inspect `sql` variable

### Common Issues

**Issue:** Comparisons not grouping when they should

- **Check:** Fragment ID generation - ensure hash includes all relevant properties
- **Check:** `processTemporalDateInfo` returns consistent `whereClause` for same inputs

**Issue:** Wrong results after grouping

- **Check:** All comparisons in group truly share same temporal WHERE clause
- **Check:** Calculation columns reference correct fragment alias
- **Check:** JOIN conditions use correct offset parameters

**Issue:** Performance worse after optimization

- **Check:** Are we creating fewer fragments? Log fragment count before/after
- **Check:** ClickHouse query plan (use EXPLAIN) - verify fewer table scans
- **Check:** Are we calling `processTemporalDateInfo` multiple times per comparison?

---

## Future Improvements

1. **Smarter grouping:** Could group comparisons with slightly different WHERE clauses using SQL CASE statements
2. **Caching:** Cache `processTemporalDateInfo` results by comparison ID
3. **Fragment reuse:** Share fragments across multiple queries if they use same data source
4. **Metrics:** Track fragment count and query performance to measure optimization impact

---

## Questions?

If you're working on this code and have questions, look for:

- Recent PRs that modified `build-comparisons.ts`
- Tests in `tests/` directory (search for "comparison")
- Examples in `docs/components/` for comparison usage patterns

Good luck! 🚀

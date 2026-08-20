# Common Utilities

This directory contains shared utility functions used across user components.

## Date System Architecture

### The Problem We Solved

When building a data visualization platform, dates are everywhere but behave differently depending on context. Users want to:

- Filter data by date ranges ("Show me last 30 days")
- Compare time periods ("How does this month compare to last month?")
- Group data by time periods ("Monthly sales trends")

The challenge: **date logic was scattered across components with inconsistent behavior**. Some components parsed "Last 30 days" differently, comparison tooltips showed placeholder dates, and we had duplicate parsing logic everywhere.

### Our Solution: Three Clear Use Cases

We identified that all date operations fall into three distinct patterns, each requiring different technical approaches:

#### 1. Explicit Date Filtering ("Show me sales from last month")

**The Use Case**: User wants to see data from a specific time period. They select "Last 30 days" from a dropdown, and we filter the entire dataset.

**Why This Exists**: Most basic date filtering - users want to slice data by time ranges. Common in dashboards where you want to focus on recent data.

**How It Works**: We convert "Last 30 days" into SQL like `WHERE date >= '2024-01-01' AND date <= '2024-01-31'`

**For Comparisons**: We shift the date boundaries - if current period is "last month", comparison period becomes "two months ago"

#### 2. Time-Series Analysis ("Monthly sales trends with comparisons")

**The Use Case**: User wants to see data grouped by time periods (daily, monthly, yearly) and compare each period to its predecessor. A table showing "Monthly Revenue" where each row is a month, and they want to see how each month compares to the previous month.

**Why This Exists**: Time-series analysis is core to business intelligence. Users don't just want to see monthly totals - they want to see "Is this month better than last month?" for every month.

**How It Works**: Instead of filtering dates, we group by time periods using `date_grain="month"`. For comparisons, we shift the date expressions themselves: `toStartOfMonth(date - INTERVAL 1 MONTH)`.

**The Tricky Part**: Each row represents a different time period, so the comparison logic needs to be applied per-row, not per-query.

#### 3. Dashboard-Wide Date Controls ("Apply this date range to everything")

**The Use Case**: User sets a date range at the dashboard level and wants it applied to all components. Common in executive dashboards where you want to see "Q3 performance" across all metrics.

**Why This Exists**: Consistency - users want to change one date filter and have it affect multiple charts/tables simultaneously.

**How It Works**: Similar to explicit filtering but propagated across multiple components. The date range logic is reused but applied at a higher level.

### Key Technical Decisions

#### MIN/MAX Aggregates for GROUPING SETS

**Problem**: Comparison tooltips showed "Jan 1/70" (ClickHouse null date placeholders) for total rows.

**Solution**: Wrap date expressions in MIN/MAX aggregates:

```sql
-- Before
formatDateTime(toStartOfMonth(date), '%b %e/%y')

-- After
formatDateTime(MIN(toStartOfMonth(date)), '%b %e/%y')
```

**Why**: GROUPING SETS automatically calculates correct date ranges for both individual rows and totals without manual conditional logic.

#### Centralized Date Parsing

**Problem**: Duplicate parsing logic across multiple files.

**Solution**: Single `parseDateRange()` function in `date-options.ts` handles all patterns:

- "Last X days/months/years"
- "MTD/WTD/YTD"
- Case insensitive matching
- Singular/plural forms

#### Structured Return Values

**Problem**: Functions returned SQL strings that were then parsed with regex.

**Solution**: Return structured objects:

```typescript
{ whereClause: string; startDate: string } | undefined
```

### Functions Overview

#### `processDateRange(date_range)`

- Converts date range objects to SQL WHERE clauses
- Returns both SQL and parsed start date
- Handles all supported date range patterns
- Uses date column from the DateRangeObject

#### `calculateComparisonDateRange(dateRange, offset)`

- Calculates comparison date ranges
- Handles both range-based and dimension-based shifting
- Uses centralized parsing logic

#### `parseDateRange(dateRange)`

- Central parsing for all date range strings
- Returns structured `ParsedDateRange` object
- Includes ClickHouse-specific fields

### Common Patterns

#### Date Range Patterns

- `"Last 30 days"` → 30 days ago to today
- `"Last month"` → Previous calendar month
- `"MTD"` → Month to date
- `"YTD"` → Year to date

#### Comparison Calculations

- **Range-based**: Shift boundaries by offset periods
- **Dimension-based**: Shift expressions by adding/subtracting intervals

### When to Use What

**Use Normal Range when:**

- Adding explicit date filters to components (`date_range="Last 30 days"`)
- User selects a date range from a dropdown
- You want to filter the entire dataset

**Use Dynamic Range when:**

- Component has `date_grain` and you want period-over-period comparisons
- Data is already grouped by time periods
- Each row represents a different time period

**Use Table Range when:**

- Applying dashboard-wide date filters
- Multiple components need the same date range

### Common Gotchas

1. **"Jan 1/70" in tooltips** → Use MIN/MAX aggregates around date expressions
2. **Comparison dates off by one** → Check if you need the +1 day adjustment in `processDateRange`
3. **Case sensitivity** → All parsing is case-insensitive, but double-check your strings
4. **MTD/YTD not working** → Ensure you're using the `startDateFunction` from `parseDateRange`

### Migration Notes

- Eliminated `generateDateSql` wrapper function
- Consolidated `calculatedateDimensionComparisonDateRange` into main function
- Removed string parsing in favor of structured returns
- No backwards compatibility maintained (as requested)

## Other Utilities

- `comparisons.ts` - Comparison query generation
- `sql-options.ts` - SQL expression utilities
- `format-options.ts` - Value formatting helpers

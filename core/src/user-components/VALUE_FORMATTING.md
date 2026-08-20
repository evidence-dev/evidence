# Value Formatting Architecture

## Overview

The formatting system consists of two functions that together handle all user-facing text derived from data:

- **`formatValue`** — Formats raw data values (numbers, dates, currencies, percentages) into display strings. Used for axis labels, cell values, tooltips, and data labels.
- **`formatTitle`** — Converts technical column identifiers (`sum(revenue)`, `toDayOfWeek(date)`) into readable labels ("Sum of Revenue", "Day of Week"). Used for axis titles, column headers, component labels, and legend text.

Both live in `core/src/user-components/` and are the **single sources of truth** for their respective concerns. No component should implement its own value formatting or title generation.

---

## Data Flow

```
ClickHouse (SQL query)
    │
    ▼
JSON response ── dates arrive as strings ("2024-01-15")
    │              numbers arrive as numbers (42)
    │              column metadata: { name, clickhouseType, jsType }
    │
    ▼
Query result (query.result)
    │
    ├── .rows[]        ── actual data values
    └── .columns[]     ── { name: "col", clickhouseType: "Date", jsType: "date" }
    │
    ▼
Component (Table, Value, BigValue, Chart, Heatmap, ...)
    │
    ├── Looks up column jsType from query.result.columns
    ├── Determines format code (from user's `fmt` prop or date grain default)
    └── Calls formatValue(value, formatCode, fallback, range, columnType, firstDayOfWeek)
    │
    ▼
formatValue()
    │
    ├── 1. Date part conversion (convertDatePartToDate)
    │      Numeric 1-7 → day names, 1-12 → month Date objects
    │
    ├── 2. Type conversion (string → Date or Number)
    │      Uses columnType if available, otherwise isDateFormat() heuristic
    │
    ├── 3. Format code resolution (presets → SSF format strings)
    │
    └── 4. SSF formatting (spreadsheet-style format engine)
           Returns formatted string
```

### Why dates arrive as strings

ClickHouse returns JSON, which has no `Date` type. A `Date` column value like `2024-01-15` arrives as the string `"2024-01-15"`. The query result metadata tells us it's a date via `jsType: "date"`, but the value itself is a string. This is why `formatValue` needs type information to convert strings to `Date` objects before SSF can format them.

---

## formatValue Signature

```typescript
formatValue(
  value: unknown,                              // The raw value to format
  formatCode: string | null | undefined,       // Format code (preset name or SSF format string)
  fallbackValue: string,                       // Returned if formatting fails
  range?: { min: number; max: number },        // For auto-scaling (num → num0k, num1m, etc.)
  columnType?: string,                         // Column jsType from query metadata
  firstDayOfWeek?: 'sunday' | 'monday',        // For day-of-week interpretation
  decimalSeparator?: '.' | ','                 // European number formatting
): string
```

---

## Type Conversion Paths

When `formatValue` receives a string value, it needs to determine whether to treat it as a date or a number. There are two paths:

### Path 1: columnType provided (preferred)

When components pass `columnType` (the column's `jsType` from query metadata), conversion is deterministic:

```
columnType includes "date" or "time"  →  new Date(standardizeDateString(value))
columnType includes "int/decimal/..."  →  Number(value)
```

**Components using this path:** Table, Value, BigValue, Heatmap, XAxisModel, HorizontalBarChart

### Path 2: No columnType (fallback)

When `columnType` is unavailable, `formatValue` uses heuristics:

```
isDateFormat(formatCode) && Date.parse(value) is valid  →  new Date(...)
!isDateFormat(formatCode) && Number(value) is valid     →  Number(value)
```

`isDateFormat()` checks for date/time specifiers (`yyyy`, `mmm`, `dd`, `hh`, etc.) using regex.

**Components using this path:** SparklineDisplay tooltips, comparison tooltips, DeltaDisplay

### Rule: Always pass columnType when available

Every component that has access to `query.result.columns` **must** look up the column's `jsType` and pass it to `formatValue`. This eliminates guessing and prevents misclassification.

```typescript
// Pattern for looking up columnType:
const columnType = query.result?.columns?.find(c => c.name === columnAlias)?.jsType;
formatValue(value, fmt, fallback, range, columnType, firstDayOfWeek);
```

---

## Date Part Conversion

The `convertDatePartToDate` function handles numeric outputs from SQL date-part functions (e.g., `toDayOfWeek()`, `toMonth()`). It runs **before** type conversion and SSF formatting.

### Day of week (ddd / dddd)

ClickHouse `toDayOfWeek(date, mode)` returns integers 1-7. The meaning depends on the mode:

| Mode | Setting | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|------|---------|---|---|---|---|---|---|---|
| 3 | `firstDayOfWeek='sunday'` | Sun | Mon | Tue | Wed | Thu | Fri | Sat |
| 0 | `firstDayOfWeek='monday'` | Mon | Tue | Wed | Thu | Fri | Sat | Sun |

`convertDatePartToDate` returns the day name **as a string** (e.g., `"Mon"`, `"Wednesday"`). When this happens, `formatValue` returns the string directly — it must **never** be passed to SSF, because SSF would interpret any non-numeric string as `0` via bitwise OR (`"Mon"|0 === 0`), which maps to January 1, 1970 (a Thursday).

### Month (mmm / mmmm)

Numeric values 1-12 are converted to `Date` objects (e.g., `new Date(2024, 0, 1)` for January). These Date objects are then formatted by SSF normally.

### Hour (h / hh)

Numeric values 0-23 are converted to `Date` objects with the specified hour.

### Year (yyyy)

Numeric values 1900-2100 are converted to `Date` objects (January 1st of that year).

---

## Format Presets

`FORMAT_PRESETS` maps friendly names to SSF format strings:

| Preset | SSF Format | Example Output |
|--------|-----------|----------------|
| `date` | `yyyy-mm-dd` | 2024-01-15 |
| `ddd` | `ddd` | Mon |
| `dddd` | `dddd` | Monday |
| `mmm` | `mmm` | Jan |
| `mmmm` | `mmmm` | January |
| `mmm-yy` | `mmm-yy` | Jan-24 |
| `yyyy` | `yyyy` | 2024 |
| `shortdate` | `mmm d/yy` | Jan 15/24 |
| `longdate` | `mmmm d, yyyy` | January 15, 2024 |
| `fulldate` | `dddd mmmm d, yyyy` | Monday January 15, 2024 |
| `mdy` | `m/d/y` | 1/15/24 |
| `dmy` | `d/m/y` | 15/1/24 |
| `hms` | `H:MM:SS AM/PM` | 2:30:00 PM |
| `num0` to `num4` | `#,##0` variants | 1,234 |
| Percentage presets | Percentage variants | 12.34 percent |
| `usd`, `eur`, `gbp`, ... | Currency variants | $1,234 |

### Auto-scaling formats

Base format names without a digit suffix (`num`, `usd`, `pct`, etc.) trigger auto-scaling based on the data range. For example, `num` on a value of 1,500,000 → `num1m` → `"1.5M"`.

### Custom format codes

Users can provide arbitrary SSF format strings (e.g., `mmm/yy`, `yyyy-mmm`, `dd-mmm-yyyy`). These are passed directly to SSF after quote conversion.

### Single-quote conversion

SSF uses double quotes to wrap literal text in format codes (e.g., `0"th"` → "5th", `"Q"0` → "Q3"). But markdoc attributes already use double quotes as their delimiter (`fmt="..."`), so users can't write double quotes inside the format code.

The `convertSingleQuotesToDouble` function solves this by converting single quotes to double quotes before passing to SSF. Users write `fmt="'Q'0"` and it becomes `"Q"0` for SSF.

**Important for format specifier detection:** Any code that inspects format strings for specifiers (e.g., checking for `h` to detect hour formats) must strip **both** single and double quoted segments first. The single quotes are still present during `convertDatePartToDate` — the conversion to double quotes happens later, just before SSF formatting.

---

## SSF and the date1970 Patch

[SSF](https://github.com/SheetJS/ssf) is a spreadsheet-style number/date formatting library. We use a patched version (`patches/ssf.patch`) that adds a `date1970` option.

### Why the patch exists

SSF's default date epoch is December 31, 1899 (Excel's epoch). Some timezones had sub-minute UTC offset changes around 1900 that cause formatting errors. The `date1970` option shifts the epoch to January 1, 1970, avoiding these timezone edge cases.

### How it works

- **Date objects**: `datenum_local(date, false, true)` converts using 1970 epoch
- **Numbers**: `parse_date_code(n, { date1970: true })` adds 25569 (days between 1899-12-31 and 1970-01-01)

### Critical: Never pass non-numeric strings to SSF with date formats

SSF's `parse_date_code` does `var date = (v|0)` which converts any non-numeric string to `0`. With `date1970: true`, `0` becomes January 1, 1970 — a **Thursday**. This is why `convertDatePartToDate` returns day name strings that must be intercepted before reaching SSF.

---

## formatTitle

`formatTitle` converts SQL column expressions and internal aliases into human-readable labels. It lives in `core/src/user-components/formatTitle.ts`.

### What it does

```
"sum(total_revenue)"     →  "Sum of Total Revenue"
"toDayOfWeek(date)"      →  "Day of Week"
"toStartOfMonth(date)"   →  "Month"
"order_count"            →  "Order Count"
Internal comparison alias  →  "Revenue YoY"
```

Key behaviors:
- Replaces underscores with spaces, parentheses with "of"
- Applies title case with acronym preservation (GDP, ROI, MRR, YoY, etc.)
- Detects ClickHouse date functions and generates semantic titles
- Handles comparison column aliases (prior year, prior period, target, benchmark)
- Handles FILTER WHERE date range patterns ("Last 12 Months", "Year to Date")
- Preserves user-provided aliases (via `AS`) without transformation

### Where it's used

`formatTitle` is used in `sql-expression-utils.ts` to generate `displayAlias` for every column expression. This `displayAlias` flows into components as axis titles, headers, and labels. Components also call `formatTitle` directly for fallback labels.

---

## Component Usage Map

This table shows exactly what each component formats with each function. When modifying either function, check all affected categories.

### formatValue usage by component

| Component | Axis labels | Tooltips | Data labels | Cell values |
|-----------|:-----------:|:--------:|:-----------:|:-----------:|
| **Combo chart** (XAxisModel) | x-axis ticks | | | |
| **Combo chart** (YAxisModel) | y-axis ticks | | | |
| **Combo chart** (SeriesModel) | | y-values, percentages | on chart elements | |
| **Combo chart** (ReferenceLineModel) | | | line/point labels | |
| **Horizontal bar chart** | x-axis (value), y-axis (category) | category + value | on bars | |
| **Heatmap** | x-axis, y-axis categories | x, y, and value | cell labels | |
| **Table** | | | | cell content |
| **Table** (pivot headers) | | | | header labels |
| **BigValue** | | | | main + comparison |
| **Value** | | | | displayed value |
| **DeltaDisplay** | | | | delta value |
| **Pie chart** | | value, percentage | | |
| **Sankey chart** | | values | node + edge labels | |
| **Funnel chart** | | values | labels | |
| **Histogram** | bin axis ticks | bin range | | |
| **Polar chart** | | values | | |
| **Calendar heatmap** | | values | cell labels | |
| **Heat grid** | | | | metric + thresholds |
| **Progress bars** | | | | numerator/denominator |
| **Sparkline** (tooltip) | | x + y values | | |
| **Map** (tooltip + legend) | | field values | | min/max labels |
| **Slider** | | | | range display |

### formatTitle usage by component

| Component | What it generates | Category |
|-----------|-------------------|----------|
| **sql-expression-utils** | `displayAlias` for all columns | Feeds into axis titles, headers |
| **XAxisModel** (combo chart) | x-axis title ("Date →") | Axis title |
| **TableHeader** | Column header text | Column header |
| **TableFilter / FilterChips** | Column labels in filter UI | Column header |
| **Dropdown** | Placeholder + label fallback | Component label |
| **ButtonGroup / Toggle / Slider / TextInput** | Label fallback | Component label |
| **RangeCalendar** | Calendar label fallback | Component label |
| **ComparisonSelector / EnumSelector** | Option labels | Legend label |
| **DimensionCut** | Dimension title | Component label |
| **MapLegend** | Legend + size labels | Legend label |
| **map/tooltip-utils** | Field labels in tooltip | Column header |
| **data-export** | Excel column headers, sheet names | Column header |

---

## Component Integration

### How components should call formatValue

Every component that displays formatted values must:

1. **Look up columnType** from `query.result.columns` for the relevant column
2. **Pass firstDayOfWeek** from `projectSettings.first_day_of_week` when formatting date-related values
3. **Use the correct format code** — from user's `fmt` prop, or `getDefaultFormatForDateGrain()` for date grain dimensions

```typescript
// Full example with all parameters:
formatValue(
  value,                                    // from query result row
  fmt,                                      // user's format code or date grain default
  String(value),                            // fallback
  range,                                    // { min, max } for auto-scaling (optional)
  query.result?.columns?.find(              // column type from metadata
    c => c.name === columnAlias
  )?.jsType,
  projectSettings.first_day_of_week         // for day-of-week interpretation
);
```

### Component status

| Component | Passes columnType | Passes firstDayOfWeek | Notes |
|-----------|:-:|:-:|-------|
| **Table** | ✅ | ✅ | Via `cellColumnMeta?.type` from pivot column metadata |
| **Value** | ✅ | ❌ | Day-of-week unlikely in Value component |
| **BigValue** | ✅ | ❌ | Day-of-week unlikely in BigValue |
| **Heatmap** | ✅ | ✅ | For both x and y axes and tooltips |
| **XAxisModel** (combo/line/area/bar) | ✅ | ✅ | For x-axis labels |
| **HorizontalBarChart** | ✅ | ✅ | For y-axis categories and tooltips |
| **Pivot headers** | ✅ | ✅ | Via `config.firstDayOfWeek` in PivotConfig |
| **SparklineDisplay** | ❌ | ❌ | No access to query metadata (receives chartData only) |
| **DeltaDisplay** | ❌ | ❌ | Receives value only, no query context |
| **Comparison tooltips** | ❌ | ❌ | Uses fallback heuristic |

Components marked ❌ rely on the `isDateFormat()` heuristic fallback. This is acceptable for components that primarily format numeric values, but should be addressed if they start formatting date values.

---

## firstDayOfWeek System

The `firstDayOfWeek` setting flows from project settings through to SQL generation and formatting:

```
Project Settings (first_day_of_week: 'sunday' | 'monday')
    │
    ├── SQL: toDayOfWeek(col, mode)
    │     mode 3 (sunday-first): Sunday=1, ..., Saturday=7
    │     mode 0 (monday-first): Monday=1, ..., Sunday=7
    │
    └── formatValue: convertDatePartToDate(value, fmt, firstDayOfWeek)
          Interprets numeric 1-7 based on the same mode
```

The SQL mode and `formatValue` interpretation must match. Both are driven by the same `projectSettings.first_day_of_week` value, ensuring consistency.

---

## Adding a New Component

When creating a component that displays formatted values:

1. **Import formatValue:**
   ```typescript
   import { formatValue } from '../../formatValue';
   ```

2. **Get project settings** (for `firstDayOfWeek`):
   ```typescript
   const projectSettings = getProjectSettingsContext();
   ```

3. **Look up column type** from query metadata:
   ```typescript
   const columnType = query.result?.columns?.find(c => c.name === alias)?.jsType;
   ```

4. **Call formatValue** with all relevant parameters:
   ```typescript
   formatValue(value, fmt, String(value), range, columnType, projectSettings.first_day_of_week);
   ```

5. **For date grains**, use `getDefaultFormatForDateGrain()` if the user doesn't provide a format:
   ```typescript
   import { getDefaultFormatForDateGrain } from '../../common/date-options';
   const effectiveFmt = userFmt ?? getDefaultFormatForDateGrain(dateGrain);
   ```

---

## Test Coverage

### Unit test location

`core/src/user-components/formatValue.test.ts`

### What must be tested

#### Format presets on date strings (no columnType)
Every preset date format must produce the correct output when given a date string and no columnType. This validates the `isDateFormat()` fallback path.

#### Format presets on date strings (with columnType)
Same formats with `columnType='date'` — validates the primary columnType path.

#### Day-of-week regression
- Numeric values 1-7 must produce 7 distinct day names (not all "Thursday")
- Both `firstDayOfWeek` modes must be tested
- Both `ddd` (short) and `dddd` (long) formats
- String numeric values ("1"-"7") must produce same results as number values

#### Month formatting
- Numeric values 1-12 with `mmm` and `mmmm` must produce correct month names
- Must produce 12 distinct results

#### Cross-component consistency
- Same input must produce same output regardless of which call pattern is used (with/without range, with/without columnType)
- Numeric and string inputs must produce identical results

#### Custom format codes
- Custom date formats like `mmm/yy`, `yyyy-mmm`, `dd-mmm-yyyy` must work on date string values
- Must NOT return the raw ISO date string

#### Auto-scaling
- Base formats (`num`, `usd`, `pct`) must auto-scale based on range
- Zero values must not show units

#### Decimal separator
- Comma separator must swap `.` and `,` for numeric values
- Must NOT modify date format commas

### What should NOT be tested here

- Component-level rendering (that's for E2E tests)
- SQL generation (tested in date-options.spec.ts)
- Query execution (tested separately)

---

## Key Files

| File | Purpose |
|------|---------|
| `core/src/user-components/formatValue.ts` | Core value formatting function, presets, date part conversion |
| `core/src/user-components/formatTitle.ts` | Column name → readable title conversion |
| `core/src/user-components/common/date-options.ts` | Date grain definitions, SQL functions, default formats |
| `core/src/user-components/common/sql-expression-utils.ts` | Column processing, generates `displayAlias` via formatTitle |
| `core/src/user-components/common/pivot-utils.ts` | Pivot header formatting (uses formatValue with PivotConfig.firstDayOfWeek) |
| `core/src/user-components/formatValue.test.ts` | Unit tests for formatValue |
| `core/src/user-components/formatTitle.test.ts` | Unit tests for formatTitle |
| `core/src/user-components/common/pivot-utils.format.test.ts` | Tests for date formatting with columnType |
| `patches/ssf.patch` | SSF date1970 epoch patch |

---

## Historical Context

| Date | PR | What changed | Impact |
|------|-----|-------------|--------|
| Jul 2025 | #495 | Introduced `convertDatePartToDate`, returned Date objects | Day-of-week formatting worked |
| Sep 2025 | #987 | Removed custom date format regex fallback | Custom format codes (e.g., `mmm/yy`) stopped working on string values without columnType |
| Jan 2026 | #113 | Changed `convertDatePartToDate` to return strings, added `firstDayOfWeek` | Day-of-week always showed "Thursday" (SSF re-interpreted strings as 0) |
| Mar 2026 | #631 | Fixed: early return for day name strings, added `isDateFormat()` fallback, passed columnType from all components | Both issues resolved |

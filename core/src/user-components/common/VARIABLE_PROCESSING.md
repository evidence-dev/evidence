# Variable Processing System

This document describes how to handle filter variables (`{{filter.property}}`) in component attributes.

## Overview

The variable system allows users to pass dynamic values into component attributes:

```markdoc
{% dropdown id="metric" %}
  {% option value="sum(total_sales)" label="Sales" /%}
  {% option value="sum(transactions)" label="Transactions" /%}
{% /dropdown %}

{% pie_chart data="demo.daily_orders" category="category" value="{{metric}}" /%}
```

---

## The Five Resolver Functions

All variable processing uses these five functions:

| Function                | Use Case                              | Example Props                                        |
| ----------------------- | ------------------------------------- | ---------------------------------------------------- |
| `resolveText(value)`    | Text/strings, nested objects          | `title`, `info`, `label`, `url`, `fmt`, `date_range` |
| `resolveColumn(value)`  | SQL column expressions (unquoted)     | `value`, `x`, `y`, `category`, `series`              |
| `resolveSql(value)`     | SQL clauses (quoted)                  | `where`, `having`, `order`, `qualify`                |
| `resolveBoolean(value)` | Top-level booleans with auto-coercion | `hide`, `legend`, `borders`                          |
| `resolveNumber(value)`  | Top-level numbers with auto-coercion  | `bin_count`, `bin_width`, `limit`                    |

## Coercion Helpers for Nested Objects

For boolean/number properties **inside nested objects** (Zod schemas), use these helpers when consuming the values:

| Function               | Use Case                  | Example                                         |
| ---------------------- | ------------------------- | ----------------------------------------------- |
| `coerceBoolean(value)` | Nested boolean properties | `axisOptions?.fit_to_data`, `comparison?.delta` |
| `coerceNumber(value)`  | Nested number properties  | `axisOptions?.min`, `axisOptions?.max`          |

```typescript
import { coerceBoolean, coerceNumber } from '../common/process-variables';

// Coerce and provide default
const fitToData = coerceBoolean(options?.fit_to_data) ?? false;
const showDelta = coerceBoolean(comparison?.delta) ?? true;

// Coerce without default (undefined if not valid)
const min = coerceNumber(options?.min);
const max = coerceNumber(options?.max);
```

---

## Model Components

Model classes extend `UserComponentModel` and have resolver methods built-in:

```typescript
export class MeasureModel extends UserComponentModel<MeasureModelGenerics> {
	// Text
	readonly resolvedTitle = $derived(this.resolveText(this.attributes.title));
	readonly resolvedFmt = $derived(this.resolveText(this.attributes.fmt));

	// Column expressions
	readonly resolvedValue = $derived(this.resolveColumn(this.attributes.value));

	// SQL clauses
	readonly resolvedWhere = $derived(this.resolveSql(this.attributes.where));

	// Booleans (auto-coerces "true"/"false" strings)
	readonly resolvedHide = $derived(this.resolveBoolean(this.attributes.hide));

	// Nested objects (use resolveText for recursive processing)
	readonly resolvedDateRange = $derived(this.resolveText(this.attributes.date_range));
}
```

---

## Svelte Components (Without Models)

Use `createResolvers()` to get the same resolver functions:

```svelte
<script lang="ts">
	import { VariableProcessor } from '@evidence/core/filter-variables/VariableProcessor';
	import { createResolvers } from '../common/use-variable-processing';
	import { getPageFiltersContext } from '@evidence/core/page-filters-context';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getInlineQueriesContext } from '../common/inline-queries';

	let { ...props } = $props();

	const pageFilters = getPageFiltersContext();
	const repeatFilters = getRepeatContext()?.filters;
	const inlineQueries = getInlineQueriesContext();

	// 1. Create VariableProcessor
	const variableProcessor = $derived.by(() => {
		const filterContexts = [repeatFilters, pageFilters].filter((ctx) => ctx !== undefined);
		if (filterContexts.length === 0 || !inlineQueries) return null;
		return new VariableProcessor(filterContexts, inlineQueries);
	});

	// 2. Create resolvers (same API as Model classes)
	const { resolveText, resolveColumn, resolveSql, resolveBoolean, resolveNumber } = $derived(
		createResolvers(variableProcessor)
	);

	// 3. Use resolvers
	const title = $derived(resolveText(props.title));
	const value = $derived(resolveColumn(props.value));
	const where = $derived(resolveSql(props.where));
	const legend = $derived(resolveBoolean(props.legend));
	const limit = $derived(resolveNumber(props.limit));
</script>
```

---

## Schema Configuration

### Required Schema Attributes

```typescript
const attributes = {
	// Text attribute
	title: {
		type: String,
		supportsVariables: true,
		variableContext: 'text'
	},

	// Column expression
	value: {
		type: String,
		required: true,
		suggestionType: 'sql',
		supportsVariables: true,
		variableContext: 'column'
	},

	// SQL clause
	where: {
		type: String,
		suggestionType: 'sql',
		supportsVariables: true,
		variableContext: 'sql'
	},

	// Boolean with variable support
	hide: {
		type: BooleanVariable,
		supportsVariables: true,
		variableContext: 'text'
	},

	// Number with variable support
	bin_count: {
		type: NumberVariable,
		supportsVariables: true,
		variableContext: 'text'
	}
} as const;
```

### Variable Context Types

| Context    | Description                           | Use For                       |
| ---------- | ------------------------------------- | ----------------------------- |
| `'text'`   | Plain text, unquoted                  | Titles, labels, URLs, formats |
| `'column'` | SQL column expression, unquoted       | x, y, value, category, series |
| `'sql'`    | SQL clause, values are quoted/escaped | where, having, order, qualify |

**Always set `variableContext` explicitly.**

---

## Special Types

### BooleanVariable

Accepts `true`, `false`, or `"{{filter}}"`:

```typescript
import { BooleanVariable } from '@evidence/core/user-components/common/zod-attribute';

hide: {
  type: BooleanVariable,
  supportsVariables: true,
  variableContext: 'text'
}
```

```markdoc
{% toggle id="show_col" initial_value=true /%}
{% measure value="sum(sales)" hide="{{show_col}}" /%}
```

### NumberVariable

Accepts numbers or `"{{filter}}"`:

```typescript
import { NumberVariable } from '@evidence/core/user-components/common/zod-attribute';

bin_count: {
  type: NumberVariable,
  supportsVariables: true,
  variableContext: 'text'
}
```

```markdoc
{% slider id="bins" min=5 max=50 initial_value=20 /%}
{% histogram data="orders" value="total" bin_count="{{bins}}" /%}
```

---

## Nested Objects (Zod Schemas)

For nested objects like `date_range`, `comparison`, `x_axis_options`, or `sparkline`, use `resolveText` - it processes all string properties recursively:

```typescript
// Model
readonly resolvedDateRange = $derived(this.resolveText(this.attributes.date_range));
readonly resolvedAxisOptions = $derived(this.resolveText(this.attributes.y_axis_options));

// Svelte component
const dateRange = $derived(resolveText(props.date_range));
const axisOptions = $derived(resolveText(props.y_axis_options));
```

### Coercing Boolean/Number Properties in Nested Objects

**Important:** When accessing boolean or number properties from resolved nested objects, you must explicitly coerce them. Variable interpolation returns strings (`"true"`, `"42"`), which need to be converted to their proper types.

```typescript
import { coerceBoolean, coerceNumber } from '../common/process-variables';

// After resolving the nested object
const axisOptions = $derived(resolveText(props.y_axis_options));

// Coerce boolean properties when consuming them
const fitToData = $derived(coerceBoolean(axisOptions?.fit_to_data) ?? false);

// Coerce number properties when consuming them
const min = $derived(coerceNumber(axisOptions?.min));
const max = $derived(coerceNumber(axisOptions?.max));
```

**Why is this needed?**

- `resolveText` processes strings recursively but doesn't know which properties should be booleans or numbers
- When `fit_to_data="{{toggle}}"` resolves to `"true"`, it's still a string
- `coerceBoolean("true")` → `true` (boolean)
- Without coercion, `"false"` would be truthy (non-empty string)!

### Zod Schema Types for Nested Objects

When defining nested object schemas with Zod, use these special schemas for boolean/number fields that support variables:

```typescript
import { booleanVariableSchema, numberVariableSchema } from '@evidence/core/user-components/common/zod-attribute';
import { setZodMetadata } from '../../../../zod-metadata';

const myOptionsSchema = z.object({
	// Boolean field with variable support
	fit_to_data: setZodMetadata(booleanVariableSchema.optional().default(false), {
		supportsVariables: true
	}),

	// Number field with variable support
	min: setZodMetadata(numberVariableSchema.optional(), {
		supportsVariables: true
	}),

	// String field (regular z.string() works fine)
	title: setZodMetadata(z.string().optional(), { supportsVariables: true }),

	// Enum field with variable support - use union with variable pattern
	type: setZodMetadata(
		z
			.union([
				z.enum(['line', 'area', 'bar']),
				z.string().refine((val) => /\{\{[^}]+\}\}/.test(val), {
					message: "Must be 'line', 'area', 'bar', or a variable like {{var}}"
				})
			])
			.optional()
			.default('line'),
		{ supportsVariables: true }
	)
});
```

**Key difference from top-level attributes:**

- Top-level attributes use `type: BooleanVariable` or `type: NumberVariable` with `resolveBoolean`/`resolveNumber`
- Zod schema fields use `booleanVariableSchema` or `numberVariableSchema` with `coerceBoolean`/`coerceNumber`

---

## Validation

Validators should skip validation when a value contains variable syntax:

```typescript
import { containsVariableSyntax } from '../validators/types';

function validateColumn(value: string) {
	if (containsVariableSyntax(value)) return []; // Skip - value unknown until runtime
	// Normal validation...
}
```

The `validateSqlExpression` validator handles this automatically.

---

## Quick Reference

### Adding Variable Support to a Prop

1. **Schema**: Add `supportsVariables: true` and `variableContext`
2. **For booleans**: Use `type: BooleanVariable`
3. **For numbers**: Use `type: NumberVariable`
4. **Component**: Use the appropriate resolver (`resolveText`, `resolveColumn`, etc.)
5. **Validators**: Skip validation when value contains variable syntax

### Adding Variable Support to a Zod Schema Field (Nested Objects)

1. **Schema**: Use `setZodMetadata(schema, { supportsVariables: true })`
2. **For booleans**: Use `booleanVariableSchema` instead of `z.boolean()`
3. **For numbers**: Use `numberVariableSchema` instead of `z.number()`
4. **For enums**: Use `z.union([z.enum([...]), z.string().refine(...)])` pattern
5. **Component**: Use `resolveText(props.nested_object)` for recursive processing
6. **Consumption**: Use `coerceBoolean()`/`coerceNumber()` when accessing boolean/number properties

### Checklist

- [ ] Schema has `supportsVariables: true`
- [ ] Schema has explicit `variableContext` (for top-level attributes)
- [ ] For top-level booleans: using `BooleanVariable` type + `resolveBoolean()`
- [ ] For top-level numbers: using `NumberVariable` type + `resolveNumber()`
- [ ] For Zod schema booleans: using `booleanVariableSchema` + `coerceBoolean()` when consuming
- [ ] For Zod schema numbers: using `numberVariableSchema` + `coerceNumber()` when consuming
- [ ] For Zod schema enums: using union with variable string pattern
- [ ] Component uses resolved value, not raw prop/attribute
- [ ] Validators skip validation when `containsVariableSyntax()` returns true

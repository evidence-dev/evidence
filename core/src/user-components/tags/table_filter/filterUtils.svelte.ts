import { getContext, setContext } from 'svelte';
import type { FilterCondition, FilterState, ColumnFilter, StringOperator } from './types';
import { createEmptyFilterState } from './types';
import { defaultDialect, type SqlDialect } from '../../../sql-dialect';

// Generate a context key for a specific table
function getContextKey(tableId?: string): string {
	return tableId ? `table-filter-state-${tableId}` : 'table-filter-state';
}

// Initialize and set the filter context
export function setFilterContext(tableId?: string): FilterState {
	const filterState = $state<FilterState>(createEmptyFilterState());
	const contextKey = getContextKey(tableId);
	setContext(contextKey, { filterState });
	return filterState;
}

// Get the filter context
export function getFilterContext(tableId?: string): { filterState: FilterState } | undefined {
	const contextKey = getContextKey(tableId);
	return getContext<{ filterState: FilterState }>(contextKey);
}

const POSITIVE_STRING_OPERATORS: Partial<Record<StringOperator, StringOperator>> = {
	not_in: 'in',
	is_not: 'is',
	not_contains: 'contains',
	not_starts_with: 'starts_with',
	not_ends_with: 'ends_with'
};

// URL state can carry a negation the chip locks out on a constrained column, leaving no way to undo it
export function constrainFilters(
	filters: ColumnFilter[],
	{
		allowsMultiple,
		requiresSelection
	}: {
		allowsMultiple: (columnId: string) => boolean;
		requiresSelection: (columnId: string) => boolean;
	}
): ColumnFilter[] {
	return filters.map((filter) => {
		const singleSelect = !allowsMultiple(filter.columnId);
		if (!singleSelect && !requiresSelection(filter.columnId)) return filter;

		const conditions = filter.conditions.map((condition) => {
			if (condition.type !== 'string') return condition;

			const operator = POSITIVE_STRING_OPERATORS[condition.operator] ?? condition.operator;
			const value =
				singleSelect && Array.isArray(condition.value) && condition.value.length > 1
					? condition.value.slice(0, 1)
					: condition.value;

			if (operator === condition.operator && value === condition.value) return condition;
			return { ...condition, operator, value };
		});
		return { ...filter, conditions };
	});
}

// Helper functions for managing filter state
export function addFilter(state: FilterState, columnFilter: ColumnFilter): void {
	// Remove any existing filter for this column
	const existingIndex = state.filters.findIndex((f) => f.columnId === columnFilter.columnId);
	if (existingIndex >= 0) {
		state.filters.splice(existingIndex, 1);
	}

	// Add the new filter
	state.filters.push(columnFilter);
	// Make sure to set active to true when adding a valid filter
	state.active = columnFilter.conditions.length > 0;
}

export function removeFilter(state: FilterState, columnId: string): void {
	state.filters = state.filters.filter((f) => f.columnId !== columnId);
	// Only set active state to true if there are actually filters
	state.active = state.filters.length > 0;
}

export function clearAllFilters(state: FilterState): void {
	state.filters = [];
	state.active = false;
}

export function toggleConjunction(state: FilterState): void {
	state.conjunction = state.conjunction === 'AND' ? 'OR' : 'AND';
}

export function addCondition(filter: ColumnFilter, condition: FilterCondition): void {
	filter.conditions.push(condition);
}

export function removeCondition(filter: ColumnFilter, index: number): void {
	filter.conditions.splice(index, 1);
}

export function updateCondition(
	filter: ColumnFilter,
	index: number,
	condition: FilterCondition
): void {
	filter.conditions[index] = condition;
}

// Generate SQL for different condition types
export function generateConditionSQL(
	columnId: string,
	condition: FilterCondition,
	dialect: SqlDialect = defaultDialect
): string {
	let stringValue: string | string[];
	let boolValue: string;
	let dateValue: string;
	let formatDate: (date: Date) => string;
	const quotedColumnId = dialect.quoteIdentifierIfNeeded(columnId);

	switch (condition.type) {
		case 'string':
			switch (condition.operator) {
				case 'is':
					stringValue = condition.value as string;
					return `${quotedColumnId} = '${dialect.escapeStringLiteral(stringValue)}'`;
				case 'is_not':
					stringValue = condition.value as string;
					return `${quotedColumnId} != '${dialect.escapeStringLiteral(stringValue)}'`;
				case 'contains':
					stringValue = condition.value as string;
					return `${quotedColumnId} LIKE '%${dialect.escapeStringLiteral(stringValue)}%'`;
				case 'not_contains':
					stringValue = condition.value as string;
					return `${quotedColumnId} NOT LIKE '%${dialect.escapeStringLiteral(stringValue)}%'`;
				case 'starts_with':
					stringValue = condition.value as string;
					return `${quotedColumnId} LIKE '${dialect.escapeStringLiteral(stringValue)}%'`;
				case 'not_starts_with':
					stringValue = condition.value as string;
					return `${quotedColumnId} NOT LIKE '${dialect.escapeStringLiteral(stringValue)}%'`;
				case 'ends_with':
					stringValue = condition.value as string;
					return `${quotedColumnId} LIKE '%${dialect.escapeStringLiteral(stringValue)}'`;
				case 'not_ends_with':
					stringValue = condition.value as string;
					return `${quotedColumnId} NOT LIKE '%${dialect.escapeStringLiteral(stringValue)}'`;
				case 'in':
					stringValue = condition.value as string[];
					if (Array.isArray(stringValue)) {
						if (stringValue.length === 0) return '';
						return `${quotedColumnId} IN (${stringValue.map((v) => `'${dialect.escapeStringLiteral(v)}'`).join(', ')})`;
					}
					return '';
				case 'not_in':
					stringValue = condition.value as string[];
					if (Array.isArray(stringValue)) {
						if (stringValue.length === 0) return '';
						return `${quotedColumnId} NOT IN (${stringValue.map((v) => `'${dialect.escapeStringLiteral(v)}'`).join(', ')})`;
					}
					return '';
				default:
					return unhandledOperator(condition);
			}
		case 'number':
			switch (condition.operator) {
				case 'equals':
					return `${quotedColumnId} = ${condition.value}`;
				case 'not_equals':
					return `${quotedColumnId} != ${condition.value}`;
				case 'greater_than':
					return `${quotedColumnId} > ${condition.value}`;
				case 'less_than':
					return `${quotedColumnId} < ${condition.value}`;
				case 'between':
					return condition.maxValue !== undefined
						? `${quotedColumnId} BETWEEN ${condition.value} AND ${condition.maxValue}`
						: `${quotedColumnId} = ${condition.value}`;
				case 'not_between':
					return condition.maxValue !== undefined
						? `${quotedColumnId} NOT BETWEEN ${condition.value} AND ${condition.maxValue}`
						: `${quotedColumnId} != ${condition.value}`;
				default:
					return unhandledOperator(condition);
			}
		case 'boolean':
			boolValue = condition.value ? 'TRUE' : 'FALSE';
			return condition.operator === 'is'
				? `${quotedColumnId} = ${boolValue}`
				: `${quotedColumnId} != ${boolValue}`;
		case 'date':
			// Format dates as ISO strings for SQL compatibility
			formatDate = (date: Date) => date.toISOString().split('T')[0];
			dateValue = formatDate(condition.value);

			switch (condition.operator) {
				case 'equals':
					return `${quotedColumnId} = '${dateValue}'`;
				case 'not_equals':
					return `${quotedColumnId} != '${dateValue}'`;
				case 'before':
					return `${quotedColumnId} < '${dateValue}'`;
				case 'after':
					return `${quotedColumnId} > '${dateValue}'`;
				case 'between':
					return condition.maxValue !== undefined
						? `${quotedColumnId} BETWEEN '${dateValue}' AND '${formatDate(condition.maxValue)}'`
						: `${quotedColumnId} = '${dateValue}'`;
				case 'not_between':
					return condition.maxValue !== undefined
						? `${quotedColumnId} NOT BETWEEN '${dateValue}' AND '${formatDate(condition.maxValue)}'`
						: `${quotedColumnId} != '${dateValue}'`;
				default:
					return unhandledOperator(condition);
			}
		default:
			return '';
	}
}

// Compile-time proof that every operator in the union is handled — an operator the chip UI
// can toggle to but that has no case renders a chip that silently stops filtering.
function unhandledOperator(_condition: never): string {
	return '';
}

// Generate SQL for a single column filter (which may have multiple conditions)
export function generateColumnFilterSQL(
	filter: ColumnFilter,
	dialect: SqlDialect = defaultDialect
): string {
	if (filter.conditions.length === 0) return '';

	const conditionSQLs = filter.conditions
		.map((cond) => generateConditionSQL(filter.columnId, cond, dialect))
		.filter((sql) => sql !== '');

	if (conditionSQLs.length === 0) return '';
	if (conditionSQLs.length === 1) return conditionSQLs[0];

	return `(${conditionSQLs.join(' AND ')})`;
}

// Generate the complete SQL fragment for all filters
export function generateFilterSQL(
	state: FilterState,
	dialect: SqlDialect = defaultDialect
): string {
	if (!state.active || state.filters.length === 0) return '';

	const filterSQLs = state.filters
		.map((filter) => generateColumnFilterSQL(filter, dialect))
		.filter((sql) => sql !== '');

	if (filterSQLs.length === 0) return '';
	if (filterSQLs.length === 1) return filterSQLs[0];

	// Parenthesised because callers AND this fragment together with other filters — an
	// unbracketed OR would otherwise escape its scope and neutralise them
	return `(${filterSQLs.join(` ${state.conjunction} `)})`;
}

// Order by the column/aggregate, never the `value`/`count` aliases — Snowflake folds a bare `ORDER BY value` to `VALUE`.
export function buildValueQueryOrder(columnName: string, minimumRecords: number | null): string {
	return minimumRecords !== null ? `COUNT(*) DESC, ${columnName}` : columnName;
}

export type ColumnType = 'string' | 'number' | 'boolean' | 'date';

// The chip UI, the SQL generator and the URL-state validator all derive from these, so they
// cannot drift apart and silently drop state a user actually produced.

/** String operators taking a single value. */
export const STRING_VALUE_OPERATORS = [
	'is',
	'is_not',
	'contains',
	'not_contains',
	'starts_with',
	'not_starts_with',
	'ends_with',
	'not_ends_with'
] as const;

/** String operators taking a list of values. */
export const STRING_LIST_OPERATORS = ['in', 'not_in'] as const;

export const STRING_OPERATORS = [...STRING_VALUE_OPERATORS, ...STRING_LIST_OPERATORS] as const;

export const NUMBER_OPERATORS = [
	'equals',
	'not_equals',
	'greater_than',
	'less_than',
	'between',
	'not_between'
] as const;

export const BOOLEAN_OPERATORS = ['is', 'is_not'] as const;

export const DATE_OPERATORS = [
	'equals',
	'not_equals',
	'before',
	'after',
	'between',
	'not_between'
] as const;

export type StringOperator = (typeof STRING_OPERATORS)[number];
export type NumberOperator = (typeof NUMBER_OPERATORS)[number];
export type BooleanOperator = (typeof BOOLEAN_OPERATORS)[number];
export type DateOperator = (typeof DATE_OPERATORS)[number];

// String filter conditions
export type StringFilterCondition = {
	type: 'string';
	operator: StringOperator;
	value: string | string[];
};

// Number filter conditions
export type NumberFilterCondition = {
	type: 'number';
	operator: NumberOperator;
	value: number;
	maxValue?: number; // Used for 'between' and 'not_between' operators
};

// Boolean filter conditions
export type BooleanFilterCondition = {
	type: 'boolean';
	operator: BooleanOperator;
	value: boolean;
};

// Date filter conditions
export type DateFilterCondition = {
	type: 'date';
	operator: DateOperator;
	value: Date;
	maxValue?: Date; // Used for 'between' and 'not_between' operators
};

// Union type of all possible filter conditions
export type FilterCondition =
	| StringFilterCondition
	| NumberFilterCondition
	| BooleanFilterCondition
	| DateFilterCondition;

// Represents all filters for a column
export type ColumnFilter = {
	columnId: string;
	conditions: FilterCondition[];
};

// The main filter state object
export type FilterState = {
	filters: ColumnFilter[];
	conjunction: 'AND' | 'OR'; // How different column filters are combined
	active: boolean; // Whether filtering is active
};

// Default empty filter state
export const createEmptyFilterState = (): FilterState => ({
	filters: [],
	conjunction: 'AND',
	active: false
});

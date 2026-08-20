import { describe, it, expect } from 'vitest';
import { process } from '../../Renderer/MarkdocProcessor/process-markdoc';
import { schema } from './schema';
import { generateConditionSQL, generateFilterSQL, constrainFilters } from './filterUtils.svelte';
import type { ColumnFilter, FilterCondition, FilterState } from './types';
import {
	BOOLEAN_OPERATORS,
	DATE_OPERATORS,
	NUMBER_OPERATORS,
	STRING_LIST_OPERATORS,
	STRING_OPERATORS,
	STRING_VALUE_OPERATORS
} from './types';
import { dialectFor, type WarehouseType } from '../../../sql-dialect';
import { deserializeFilterState, TableFilterFilter } from './TableFilterFilter.svelte';

// Driven off the shared operator lists so a newly added operator is covered automatically
const everyOperatorCondition: FilterCondition[] = [
	...STRING_VALUE_OPERATORS.map((operator) => ({
		type: 'string' as const,
		operator,
		value: 'Electronics'
	})),
	...STRING_LIST_OPERATORS.map((operator) => ({
		type: 'string' as const,
		operator,
		value: ['Electronics', 'Home']
	})),
	...NUMBER_OPERATORS.map((operator) => ({
		type: 'number' as const,
		operator,
		value: 100,
		maxValue: 200
	})),
	...BOOLEAN_OPERATORS.map((operator) => ({ type: 'boolean' as const, operator, value: true })),
	...DATE_OPERATORS.map((operator) => ({
		type: 'date' as const,
		operator,
		value: new Date('2026-01-01T00:00:00.000Z'),
		maxValue: new Date('2026-01-31T00:00:00.000Z')
	}))
];

describe('table_filter markdoc integration', () => {
	it('accepts single_select and multi_select column overrides', () => {
		const markdown = `
{% table_filter
    id="my_filter"
    data="demo.daily_orders"
    single_select=["category"]
    multi_select=["item"]
/%}
`;
		const { validationErrors } = process(markdown);
		expect(validationErrors).toHaveLength(0);
	});

	it('warns when a column is listed in both single_select and multi_select', () => {
		const markdown = `
{% table_filter
    id="my_filter"
    data="demo.daily_orders"
    single_select=["category", "item"]
    multi_select=["item"]
/%}
`;
		const { validationErrors } = process(markdown);
		const overlap = validationErrors.filter((e) => e.error.id === 'select-mode-overlap');
		expect(overlap).toHaveLength(1);
		expect(overlap[0]!.error.level).toBe('warning');
		expect(overlap[0]!.error.message).toContain('item');
		expect(overlap[0]!.error.message).not.toContain('category');
	});

	it('does not warn when single_select and multi_select are disjoint', () => {
		const markdown = `
{% table_filter
    id="my_filter"
    data="demo.daily_orders"
    multiple=false
    multi_select=["item"]
/%}
`;
		const { validationErrors } = process(markdown);
		expect(validationErrors.map((e) => e.error.id)).not.toContain('select-mode-overlap');
	});
});

// Guards the URL-initialization path against states the constrained UI can never produce
describe('constrainFilters', () => {
	const inFilter = (columnId: string, values: string[]): ColumnFilter => ({
		columnId,
		conditions: [{ type: 'string', operator: 'in', value: values }]
	});
	const never = () => false;
	const singleOnly = {
		allowsMultiple: (columnId: string) => columnId !== 'client',
		requiresSelection: never
	};

	it('clamps a multi-value in condition on a single-select column to its first value', () => {
		const result = constrainFilters([inFilter('client', ['A', 'B', 'C'])], singleOnly);
		expect(result[0]!.conditions[0]!.value).toEqual(['A']);
	});

	it('clamps not_in conditions and flips them back to in', () => {
		const filters: ColumnFilter[] = [
			{
				columnId: 'client',
				conditions: [{ type: 'string', operator: 'not_in', value: ['A', 'B'] }]
			}
		];
		const result = constrainFilters(filters, singleOnly);
		expect(result[0]!.conditions[0]!.operator).toBe('in');
		expect(result[0]!.conditions[0]!.value).toEqual(['A']);
	});

	it('flips is_not to is on a single-select column', () => {
		const filters: ColumnFilter[] = [
			{
				columnId: 'client',
				conditions: [{ type: 'string', operator: 'is_not', value: 'A' }]
			}
		];
		const result = constrainFilters(filters, singleOnly);
		expect(result[0]!.conditions[0]!.operator).toBe('is');
		expect(result[0]!.conditions[0]!.value).toBe('A');
	});

	it('flips not_in to in on a require_selection column without clamping its values', () => {
		const filters: ColumnFilter[] = [
			{
				columnId: 'organization_name',
				conditions: [{ type: 'string', operator: 'not_in', value: ['org 1', 'org 2'] }]
			}
		];
		const result = constrainFilters(filters, {
			allowsMultiple: () => true,
			requiresSelection: (columnId) => columnId === 'organization_name'
		});
		expect(result[0]!.conditions[0]!.operator).toBe('in');
		expect(result[0]!.conditions[0]!.value).toEqual(['org 1', 'org 2']);
	});

	it('flips every negated string operator on a constrained column', () => {
		const filters: ColumnFilter[] = [
			{
				columnId: 'client',
				conditions: [
					{ type: 'string', operator: 'not_contains', value: 'A' },
					{ type: 'string', operator: 'not_starts_with', value: 'A' },
					{ type: 'string', operator: 'not_ends_with', value: 'A' }
				]
			}
		];
		const result = constrainFilters(filters, singleOnly);
		expect(result[0]!.conditions.map((condition) => condition.operator)).toEqual([
			'contains',
			'starts_with',
			'ends_with'
		]);
	});

	it('leaves negated operators on unconstrained columns untouched', () => {
		const filters: ColumnFilter[] = [
			{
				columnId: 'region',
				conditions: [{ type: 'string', operator: 'not_in', value: ['East', 'West'] }]
			}
		];
		const result = constrainFilters(filters, {
			allowsMultiple: () => true,
			requiresSelection: never
		});
		expect(result[0]).toBe(filters[0]);
	});

	it('leaves multi-select columns and single-value selections untouched', () => {
		const filters = [inFilter('region', ['East', 'West']), inFilter('client', ['A'])];
		const result = constrainFilters(filters, singleOnly);
		expect(result[0]).toBe(filters[0]);
		expect(result[1]!.conditions[0]!.value).toEqual(['A']);
	});

	it('leaves non-string conditions on a constrained column untouched', () => {
		const filters: ColumnFilter[] = [
			{
				columnId: 'client',
				conditions: [
					{
						type: 'date',
						operator: 'between',
						value: new Date('2026-01-01'),
						maxValue: new Date('2026-02-01')
					}
				]
			}
		];
		const result = constrainFilters(filters, singleOnly);
		expect(result[0]!.conditions[0]).toEqual(filters[0]!.conditions[0]);
	});
});

describe('table filter URL state', () => {
	it('deserializes valid condition values to their runtime types', () => {
		const state = deserializeFilterState(
			JSON.stringify({
				active: true,
				conjunction: 'AND',
				filters: [
					{
						columnId: 'category',
						conditions: [
							{ type: 'string', operator: 'is', value: 'Electronics' },
							{ type: 'string', operator: 'in', value: ['Electronics', 'Home'] },
							{ type: 'number', operator: 'greater_than', value: 100 },
							{ type: 'boolean', operator: 'is', value: true },
							{
								type: 'date',
								operator: 'between',
								value: '2026-01-01T00:00:00.000Z',
								maxValue: '2026-01-31T00:00:00.000Z'
							}
						]
					}
				]
			})
		);

		expect(state).toEqual({
			active: true,
			conjunction: 'AND',
			filters: [
				{
					columnId: 'category',
					conditions: [
						{ type: 'string', operator: 'is', value: 'Electronics' },
						{ type: 'string', operator: 'in', value: ['Electronics', 'Home'] },
						{ type: 'number', operator: 'greater_than', value: 100 },
						{ type: 'boolean', operator: 'is', value: true },
						{
							type: 'date',
							operator: 'between',
							value: new Date('2026-01-01T00:00:00.000Z'),
							maxValue: new Date('2026-01-31T00:00:00.000Z')
						}
					]
				}
			]
		});
	});

	it.each([
		['malformed JSON', '{'],
		[
			'a non-numeric value in a number condition',
			JSON.stringify({
				active: true,
				conjunction: 'AND',
				filters: [
					{
						columnId: 'total_sales',
						conditions: [{ type: 'number', operator: 'equals', value: '0 OR 1=1' }]
					}
				]
			})
		],
		[
			'an operator/value mismatch',
			JSON.stringify({
				active: true,
				conjunction: 'AND',
				filters: [
					{
						columnId: 'category',
						conditions: [{ type: 'string', operator: 'is', value: ['Electronics'] }]
					}
				]
			})
		]
	])('rejects %s', (_, raw) => {
		expect(deserializeFilterState(raw)).toBeUndefined();
	});

	it('round-trips every operator the filter UI can emit', () => {
		const state: FilterState = {
			active: true,
			conjunction: 'AND',
			filters: [{ columnId: 'category', conditions: everyOperatorCondition }]
		};

		expect(deserializeFilterState(JSON.stringify(state))).toEqual(state);
	});

	it('emits SQL for every operator the filter UI can emit', () => {
		const silent = everyOperatorCondition.filter(
			(condition) => generateConditionSQL('category', condition) === ''
		);

		expect(silent).toEqual([]);
	});

	it('keeps the whole state when a numeric condition is toggled to not_between', () => {
		const state: FilterState = {
			active: true,
			conjunction: 'AND',
			filters: [
				{ columnId: 'category', conditions: [{ type: 'string', operator: 'in', value: ['Home'] }] },
				{
					columnId: 'total_sales',
					conditions: [{ type: 'number', operator: 'not_between', value: 100, maxValue: 200 }]
				},
				{
					columnId: 'order_date',
					conditions: [
						{
							type: 'date',
							operator: 'between',
							value: new Date('2025-08-01T00:00:00.000Z'),
							maxValue: new Date('2026-07-31T00:00:00.000Z')
						}
					]
				}
			]
		};

		expect(deserializeFilterState(JSON.stringify(state))).toEqual(state);
	});

	it('drops only the invalid condition, keeping the rest of the state', () => {
		const state = deserializeFilterState(
			JSON.stringify({
				active: true,
				conjunction: 'AND',
				filters: [
					{
						columnId: 'total_sales',
						conditions: [{ type: 'number', operator: 'equals', value: '0 OR 1=1' }]
					},
					{
						columnId: 'category',
						conditions: [{ type: 'string', operator: 'is', value: 'Electronics' }]
					}
				]
			})
		);

		expect(state).toEqual({
			active: true,
			conjunction: 'AND',
			filters: [
				{
					columnId: 'category',
					conditions: [{ type: 'string', operator: 'is', value: 'Electronics' }]
				}
			]
		});
	});

	// Hand-written JSON: an out-of-range literal survives JSON.parse as Infinity, which would
	// interpolate as the bare token `Infinity`
	it.each(['1e400', '-1e400'])('rejects the out-of-range number %s', (literal) => {
		const raw = `{"active":true,"conjunction":"AND","filters":[{"columnId":"total_sales","conditions":[{"type":"number","operator":"equals","value":${literal}}]}]}`;

		expect(Number.isFinite(JSON.parse(raw).filters[0].conditions[0].value)).toBe(false);
		expect(deserializeFilterState(raw)).toBeUndefined();
	});
});

describe('table filter initial values', () => {
	it('creates SSR filter state while honoring per-column selection modes', () => {
		const filter = new TableFilterFilter(
			{
				id: 'orders',
				userComponentName: 'table_filter',
				attributes: {
					data: 'demo.daily_orders',
					initial_values: {
						category: ['Groceries', 'Home'],
						region: 'West',
						invalid: 42,
						empty: []
					},
					multiple: false,
					single_select: ['category'],
					multi_select: ['region']
				}
			} as unknown as ConstructorParameters<typeof TableFilterFilter>[0],
			{ url: undefined, updateUrl: undefined, projectSettings: undefined, dialect: undefined }
		);

		expect(filter.value).toEqual({
			active: true,
			conjunction: 'AND',
			filters: [
				{
					columnId: 'category',
					conditions: [{ type: 'string', operator: 'in', value: ['Groceries'] }]
				},
				{
					columnId: 'region',
					conditions: [{ type: 'string', operator: 'in', value: ['West'] }]
				}
			]
		});
	});

	it('keeps URL state ahead of initial_values', () => {
		const urlState: FilterState = {
			active: true,
			conjunction: 'AND',
			filters: [
				{
					columnId: 'category',
					conditions: [{ type: 'string', operator: 'in', value: ['Sports'] }]
				}
			]
		};
		const url = new URL('https://example.com');
		url.searchParams.set('orders', JSON.stringify(urlState));

		const filter = new TableFilterFilter(
			{
				id: 'orders',
				userComponentName: 'table_filter',
				attributes: {
					data: 'demo.daily_orders',
					initial_values: { category: 'Groceries' }
				}
			} as unknown as ConstructorParameters<typeof TableFilterFilter>[0],
			{ url, updateUrl: undefined, projectSettings: undefined, dialect: undefined }
		);

		expect(filter.value).toEqual(urlState);
	});
});

describe('table filter string literal escaping', () => {
	// Doubling the quote alone is not enough where a backslash escapes it: `\''` closes the
	// literal one quote early and the rest of the value becomes SQL
	const backslashPayload = "zzz\\' OR 1=1 --";

	const escapedPayload: Record<WarehouseType, string> = {
		clickhouse: "category = 'zzz\\\\\\' OR 1=1 --'",
		snowflake: "\"category\" = 'zzz\\\\\\' OR 1=1 --'",
		bigquery: "category = 'zzz\\\\\\' OR 1=1 --'",
		databricks: "category = 'zzz\\\\\\' OR 1=1 --'",
		fabric: "category = 'zzz\\'' OR 1=1 --'",
		postgres: "category = 'zzz\\'' OR 1=1 --'",
		cube: "category = 'zzz\\'' OR 1=1 --'",
		motherduck: "category = 'zzz\\'' OR 1=1 --'"
	};

	it.each(Object.entries(escapedPayload))(
		'cannot terminate a string literal on %s',
		(type, sql) => {
			expect(
				generateConditionSQL(
					'category',
					{ type: 'string', operator: 'is', value: backslashPayload },
					dialectFor(type as WarehouseType)
				)
			).toBe(sql);
		}
	);

	// Every operator builds its own literal, so one that skipped the escaper would be silent
	const v = "zzz\\\\\\' OR 1=1 --";
	const escapedPerOperator: Record<(typeof STRING_OPERATORS)[number], string> = {
		is: `category = '${v}'`,
		is_not: `category != '${v}'`,
		contains: `category LIKE '%${v}%'`,
		not_contains: `category NOT LIKE '%${v}%'`,
		starts_with: `category LIKE '${v}%'`,
		not_starts_with: `category NOT LIKE '${v}%'`,
		ends_with: `category LIKE '%${v}'`,
		not_ends_with: `category NOT LIKE '%${v}'`,
		in: `category IN ('${v}')`,
		not_in: `category NOT IN ('${v}')`
	};

	it.each(Object.entries(escapedPerOperator))('escapes the value for %s', (operator, sql) => {
		const isList = (STRING_LIST_OPERATORS as readonly string[]).includes(operator);
		expect(
			generateConditionSQL(
				'category',
				{
					type: 'string',
					operator: operator as (typeof STRING_OPERATORS)[number],
					value: isList ? [backslashPayload] : backslashPayload
				} as FilterCondition,
				dialectFor('clickhouse')
			)
		).toBe(sql);
	});

	it('leaves a backslash untouched where it is an ordinary character', () => {
		expect(
			generateConditionSQL(
				'path',
				{ type: 'string', operator: 'is', value: 'C:\\temp' },
				dialectFor('postgres')
			)
		).toBe("path = 'C:\\temp'");
	});
});

describe('table filter SQL fragment composition', () => {
	const twoFilters = (conjunction: 'AND' | 'OR'): FilterState => ({
		active: true,
		conjunction,
		filters: [
			{ columnId: 'a', conditions: [{ type: 'number', operator: 'greater_than', value: 1 }] },
			{ columnId: 'b', conditions: [{ type: 'number', operator: 'less_than', value: 2 }] }
		]
	});

	// Callers AND this fragment with sibling filters, so a bare OR would neutralise them
	it('brackets a multi-filter fragment', () => {
		expect(generateFilterSQL(twoFilters('OR'))).toBe('(a > 1 OR b < 2)');
		expect(generateFilterSQL(twoFilters('AND'))).toBe('(a > 1 AND b < 2)');
	});

	// `processFilterIds` joins fragments with ' AND ' and only skips undefined, so an empty
	// string would render `WHERE  AND …` and fail the whole query
	it.each([
		[
			'an inactive state',
			{
				active: false,
				conjunction: 'AND',
				filters: [
					{ columnId: 'category', conditions: [{ type: 'string', operator: 'is', value: 'Home' }] }
				]
			}
		],
		[
			'conditions that produce no predicate',
			{
				active: true,
				conjunction: 'AND',
				filters: [
					{ columnId: 'category', conditions: [{ type: 'string', operator: 'in', value: [] }] }
				]
			}
		]
	])('reports no sql at all for %s', (_, value) => {
		const filter = new TableFilterFilter(
			{
				id: 'my_filter',
				userComponentName: 'table_filter',
				attributes: { data: 'demo.orders' }
			} as unknown as ConstructorParameters<typeof TableFilterFilter>[0],
			{ url: undefined, updateUrl: undefined, projectSettings: undefined, dialect: undefined }
		);

		filter.value = value as FilterState;

		expect(filter.sql).toBeUndefined();
		expect(filter.templateValues.filter).toBe('true');
	});

	it('falls back to a plain comparison when a range operator has no upper bound', () => {
		expect(
			generateConditionSQL('total_sales', { type: 'number', operator: 'not_between', value: 100 })
		).toBe('total_sales != 100');
		expect(
			generateConditionSQL('total_sales', { type: 'number', operator: 'between', value: 100 })
		).toBe('total_sales = 100');
	});
});

describe('table filter identifier quoting', () => {
	const condition: FilterCondition = { type: 'number', operator: 'equals', value: 100 };

	// Exhaustive by construction: a new warehouse type fails to compile until listed
	const spacedIdentifier: Record<WarehouseType, string> = {
		clickhouse: '"Total Sales" = 100',
		snowflake: '"Total Sales" = 100',
		bigquery: '`Total Sales` = 100',
		databricks: '`Total Sales` = 100',
		fabric: '"Total Sales" = 100',
		postgres: '"Total Sales" = 100',
		cube: '"Total Sales" = 100',
		motherduck: '"Total Sales" = 100'
	};

	const injectedIdentifier: Record<WarehouseType, string> = {
		clickhouse: '"total_sales"" OR 1=1 --" = 100',
		snowflake: '"total_sales"" OR 1=1 --" = 100',
		bigquery: '`total_sales" OR 1=1 --` = 100',
		databricks: '`total_sales" OR 1=1 --` = 100',
		fabric: '"total_sales"" OR 1=1 --" = 100',
		postgres: '"total_sales"" OR 1=1 --" = 100',
		cube: '"total_sales"" OR 1=1 --" = 100',
		motherduck: '"total_sales"" OR 1=1 --" = 100'
	};

	it.each(Object.entries(spacedIdentifier))('quotes a spaced identifier for %s', (type, sql) => {
		expect(generateConditionSQL('Total Sales', condition, dialectFor(type as WarehouseType))).toBe(
			sql
		);
	});

	it.each(Object.entries(injectedIdentifier))(
		'contains a manipulated identifier for %s',
		(type, sql) => {
			expect(
				generateConditionSQL('total_sales" OR 1=1 --', condition, dialectFor(type as WarehouseType))
			).toBe(sql);
		}
	);

	it.each(['bigquery', 'databricks'] as const)(
		'cannot be escaped with a backtick on %s',
		(type) => {
			expect(generateConditionSQL('total_sales` OR 1=1 --', condition, dialectFor(type))).toBe(
				'`total_sales OR 1=1 --` = 100'
			);
		}
	);

	it('folds identifier case per dialect rather than always using ClickHouse rules', () => {
		expect(generateConditionSQL('revenue', condition, dialectFor('snowflake'))).toBe(
			'"revenue" = 100'
		);
		expect(generateConditionSQL('revenue', condition, dialectFor('clickhouse'))).toBe(
			'revenue = 100'
		);
	});
});

describe('schema examples', () => {
	it('schema examples parse without errors', () => {
		for (const { example } of schema.examples) {
			const { validationErrors } = process(example);
			expect(validationErrors, example).toHaveLength(0);
		}
	});
});

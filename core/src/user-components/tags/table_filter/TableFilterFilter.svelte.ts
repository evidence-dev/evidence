import { Filter, type FilterDeps, type FilterInit } from '../../../Filter.svelte';
import type { SqlDialect } from '../../../sql-dialect';
import { format as formatDate } from 'date-fns';
import formatTitle from '../../formatTitle';
import type { UserComponentProps } from '../../types';
import { generateFilterSQL } from './filterUtils.svelte';
import type { schema } from './schema';
import type { ColumnFilter, FilterCondition, FilterState } from './types';
import {
	BOOLEAN_OPERATORS,
	DATE_OPERATORS,
	NUMBER_OPERATORS,
	STRING_LIST_OPERATORS,
	STRING_VALUE_OPERATORS
} from './types';
import { logger } from '../../../shims/logger';
import { z } from 'zod';

type TableFilterAttributes = UserComponentProps<typeof schema>;

function getInitialFilterState(
	attributes: Omit<TableFilterAttributes, 'id'>
): FilterState | undefined {
	const filters: ColumnFilter[] = [];
	for (const [column, value] of Object.entries(attributes.initial_values ?? {})) {
		const values =
			typeof value === 'string'
				? [value]
				: Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string')
					? value
					: undefined;
		if (!values) continue;

		const allowsMultiple = attributes.single_select?.includes(column)
			? false
			: attributes.multi_select?.includes(column)
				? true
				: (attributes.multiple ?? true);
		filters.push({
			columnId: column,
			conditions: [
				{
					type: 'string',
					operator: 'in',
					value: allowsMultiple ? values : values.slice(0, 1)
				}
			]
		});
	}

	return filters.length > 0 ? { filters, conjunction: 'AND', active: true } : undefined;
}

const isoDate = z
	.string()
	.datetime()
	.transform((value) => new Date(value));

// Operators come from the shared lists in ./types so this can never reject state the chip
// UI is able to produce; values stay strictly typed so nothing but data reaches the SQL.
const conditionSchema = z.union([
	z
		.object({
			type: z.literal('string'),
			operator: z.enum(STRING_VALUE_OPERATORS),
			value: z.string()
		})
		.strict(),
	z
		.object({
			type: z.literal('string'),
			operator: z.enum(STRING_LIST_OPERATORS),
			value: z.array(z.string())
		})
		.strict(),
	z
		.object({
			type: z.literal('number'),
			operator: z.enum(NUMBER_OPERATORS),
			// finite: JSON.parse('1e400') is Infinity, which would interpolate as a bare token
			value: z.number().finite(),
			maxValue: z.number().finite().optional()
		})
		.strict(),
	z
		.object({
			type: z.literal('boolean'),
			operator: z.enum(BOOLEAN_OPERATORS),
			value: z.boolean()
		})
		.strict(),
	z
		.object({
			type: z.literal('date'),
			operator: z.enum(DATE_OPERATORS),
			value: isoDate,
			maxValue: isoDate.optional()
		})
		.strict()
]);

const filterStateSchema = z
	.object({
		// An entry that fails validation becomes null and is dropped below rather than
		// discarding every other filter the user has applied
		filters: z.array(
			z
				.object({
					columnId: z.string().min(1),
					conditions: z.array(conditionSchema.nullable().catch(null))
				})
				.strict()
				.nullable()
				.catch(null)
		),
		conjunction: z.enum(['AND', 'OR']),
		active: z.boolean()
	})
	.strict();

export function deserializeFilterState(raw: string): FilterState | undefined {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return undefined;
	}

	const result = filterStateSchema.safeParse(parsed);
	if (!result.success) return undefined;

	let dropped = 0;
	const filters: ColumnFilter[] = [];
	for (const filter of result.data.filters) {
		if (!filter) {
			dropped++;
			continue;
		}
		const conditions: FilterCondition[] = [];
		for (const condition of filter.conditions) {
			if (condition === null) dropped++;
			else conditions.push(condition);
		}
		if (conditions.length > 0) filters.push({ columnId: filter.columnId, conditions });
	}

	if (dropped > 0) {
		logger.warn({ dropped }, 'Discarded invalid table_filter conditions from URL state');
	}

	if (filters.length === 0) return undefined;

	return { filters, conjunction: result.data.conjunction, active: result.data.active };
}

function formatConditionValue(condition: FilterCondition): string {
	const format = (value: string | number | boolean | Date) =>
		value instanceof Date ? formatDate(value, 'yyyy-MM-dd') : summaryValue(value);

	if (Array.isArray(condition.value)) return condition.value.map(format).join(', ');
	if (
		(condition.operator === 'between' || condition.operator === 'not_between') &&
		condition.maxValue !== undefined
	) {
		return `${format(condition.value)} – ${format(condition.maxValue)}`;
	}
	return format(condition.value);
}

const andList = new Intl.ListFormat('en', { type: 'conjunction' });
const orList = new Intl.ListFormat('en', { type: 'disjunction' });
const summaryDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' });

const summaryOperators = {
	is: 'is',
	is_not: 'is not',
	in: 'is',
	not_in: 'is not',
	contains: 'contains',
	not_contains: 'does not contain',
	starts_with: 'starts with',
	not_starts_with: 'does not start with',
	ends_with: 'ends with',
	not_ends_with: 'does not end with',
	equals: 'is',
	not_equals: 'is not',
	greater_than: 'is greater than',
	less_than: 'is less than',
	between: 'is between',
	not_between: 'is not between',
	before: 'is before',
	after: 'is after'
} satisfies Record<FilterCondition['operator'], string>;

function summaryValue(value: string | number | boolean | Date): string {
	if (value instanceof Date) return summaryDate.format(value);
	return value === '' ? '“”' : String(value);
}

function summarizeCondition(label: string, condition: FilterCondition): string {
	const { operator, value } = condition;
	if (Array.isArray(value)) {
		if (!value.length) return '';
		if (operator === 'not_in' && value.length > 1) {
			return `${label} is not one of ${andList.format(value.map(summaryValue))}`;
		}
		return `${label} ${summaryOperators[operator]} ${orList.format(value.map(summaryValue))}`;
	}
	if (operator === 'between' || operator === 'not_between') {
		if (condition.maxValue === undefined) {
			return `${label} ${operator === 'between' ? 'is' : 'is not'} ${summaryValue(value)}`;
		}
		return `${label} ${summaryOperators[operator]} ${summaryValue(value)} and ${summaryValue(condition.maxValue)}`;
	}
	return `${label} ${summaryOperators[operator]} ${summaryValue(value)}`;
}

function summarizeFilter(state: FilterState, attributes: Omit<TableFilterAttributes, 'id'>): string {
	const groups = state.filters.map(({ columnId, conditions }) => {
		const index = attributes.columns?.findIndex(
			(column) => typeof column === 'string' && column.toLowerCase() === columnId.toLowerCase()
		);
		const customLabel = index != null ? attributes.labels?.[index] : undefined;
		const label = typeof customLabel === 'string' && customLabel ? customLabel : formatTitle(columnId);
		const clauses = conditions
			.map((condition) => summarizeCondition(label, condition))
			.filter(Boolean);
		const group = andList.format(clauses);
		return state.conjunction === 'OR' && clauses.length > 1 ? `(${group})` : group;
	});
	return (state.conjunction === 'OR' ? orList : andList).format(groups.filter(Boolean));
}

export class TableFilterFilter extends Filter<FilterState> {
	// Override defaults: filter for all contexts
	static override defaultProperty = { sql: 'filter', text: 'filter', column: 'filter' };

	attributes: Omit<TableFilterAttributes, 'id'>;

	predicateSql(dialect?: SqlDialect): string | undefined {
		if (!this.value) return undefined;
		// Normalise an inactive filter's '' to undefined so it isn't AND-ed into a WHERE.
		return generateFilterSQL(this.value, dialect) || undefined;
	}

	get templateValues() {
		const state = this.value;
		return {
			filter: (state && generateFilterSQL(state, this.dialect)) || 'true',
			summary: state?.active ? summarizeFilter(state, this.attributes) : '',
			literal: state?.active
				? state.filters
						.flatMap(({ conditions }) => conditions.map(formatConditionValue))
						.filter(Boolean)
						.join(', ')
				: ''
		};
	}

	constructor(init: FilterInit<'table_filter', TableFilterAttributes>, deps: FilterDeps) {
		super(
			init.id,
			init.userComponentName,
			{
				initialValue: getInitialFilterState(init.attributes),
				// TODO this puts some pretty ugly JSON in the URL. Would look nicer if we had some smarter serialize/deserialize, or maybe just use Base64 for this filter?
				serialize: (value) => JSON.stringify(value),
				deserialize: deserializeFilterState
			},
			deps
		);
		this.attributes = $state(init.attributes);
	}
}

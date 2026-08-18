import { Filter, type FilterDeps, type FilterInit } from '../../../Filter.svelte';
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

export class TableFilterFilter extends Filter<FilterState> {
	// Override defaults: filter for all contexts (only property available)
	static override defaultProperty = { sql: 'filter', text: 'filter', column: 'filter' };

	attributes: Omit<UserComponentProps<typeof schema>, 'id'>;

	// Callers join filter fragments with ' AND ', so an empty string would emit `WHERE  AND …`
	get sql() {
		if (!this.value) return undefined;
		return generateFilterSQL(this.value, this.dialect) || undefined;
	}

	get templateValues() {
		// Generate template values for table filter
		const templateValues: Record<string, unknown> = {};

		templateValues.filter = (this.value && generateFilterSQL(this.value, this.dialect)) || 'true';

		return templateValues;
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

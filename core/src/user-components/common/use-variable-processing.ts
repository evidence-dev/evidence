/**
 * Variable processing utilities for Svelte components.
 *
 * Use `createResolvers()` to get resolver functions that match the Model class API.
 * See VARIABLE_PROCESSING.md for documentation.
 */

import type { VariableProcessor } from '../../filter-variables/VariableProcessor';
import type { VariableContext } from '../../interpolate-query-strings';
import type { Filters } from '../../Filters.svelte';
import type { InlineQueries } from './inline-queries';
import type { UserComponentSchema, UserComponentAttribute } from '../types';
import { VariableProcessor as VariableProcessorClass } from '../../filter-variables/VariableProcessor';
import { processVariables } from './process-variables';
import { NumberVariable, BooleanVariable } from './zod-attribute';

// ============================================================================
// RESOLVERS - The primary API for Svelte components
// ============================================================================

/**
 * Resolver functions for variable processing.
 * Same API as UserComponentModel methods.
 */
export interface Resolvers {
	/** Resolve text values (titles, labels, URLs, formats) */
	resolveText: <T>(value: T) => T;
	/** Resolve column expressions (x, y, value, category, series) */
	resolveColumn: <T>(value: T) => T;
	/** Resolve SQL clauses (where, having, order, qualify) */
	resolveSql: <T>(value: T) => T;
	/** Resolve booleans with auto-coercion ("true"/"false" → true/false) */
	resolveBoolean: (value: boolean | string | undefined) => boolean | undefined;
	/** Resolve numbers with auto-coercion (numeric strings → numbers) */
	resolveNumber: (value: number | string | undefined) => number | undefined;
}

/**
 * Create resolver functions for variable processing.
 *
 * Returns the same API as UserComponentModel methods, making Svelte components
 * consistent with Model-based components.
 *
 * @example
 * ```typescript
 * // In a Svelte component
 * const variableProcessor = $derived.by(() => {
 *   const filterContexts = [repeatFilters, pageFilters].filter(ctx => ctx !== undefined);
 *   if (filterContexts.length === 0 || !inlineQueries) return null;
 *   return new VariableProcessor(filterContexts, inlineQueries);
 * });
 *
 * const { resolveText, resolveColumn, resolveSql, resolveBoolean, resolveNumber } =
 *   $derived(createResolvers(variableProcessor));
 *
 * const title = $derived(resolveText(props.title));
 * const value = $derived(resolveColumn(props.value));
 * const where = $derived(resolveSql(props.where));
 * const legend = $derived(resolveBoolean(props.legend));
 * ```
 */
export function createResolvers(processor: VariableProcessor | null | undefined): Resolvers {
	return {
		resolveText: <T>(value: T): T => processVariables(value, processor, 'text'),

		resolveColumn: <T>(value: T): T => processVariables(value, processor, 'column'),

		resolveSql: <T>(value: T): T => processVariables(value, processor, 'sql'),

		resolveBoolean: (value: boolean | string | undefined): boolean | undefined => {
			const result = processVariables(value, processor, 'text', { coerce: 'boolean' });
			return result as boolean | undefined;
		},

		resolveNumber: (value: number | string | undefined): number | undefined => {
			const result = processVariables(value, processor, 'text', { coerce: 'number' });
			return result as number | undefined;
		}
	};
}

// ============================================================================
// TITLE PROPS HELPER - Convenience for the common title/subtitle/info pattern
// ============================================================================

/**
 * Process title-related props in one call.
 * Convenience helper for the common title/subtitle/info/info_link/info_link_title pattern.
 *
 * @example
 * ```typescript
 * const { title, subtitle, info, info_link, info_link_title } =
 *   $derived(processTitleProps(props, variableProcessor));
 * ```
 */
export function processTitleProps<
	T extends {
		title?: string;
		subtitle?: string;
		info?: string;
		info_link?: string;
		info_link_title?: string;
	}
>(
	props: T,
	processor: VariableProcessor | null | undefined
): {
	title: string;
	subtitle: string;
	info: string;
	info_link: string;
	info_link_title: string;
} {
	return {
		title: processVariables(props.title || '', processor, 'text'),
		subtitle: processVariables(props.subtitle || '', processor, 'text'),
		info: processVariables(props.info || '', processor, 'text'),
		info_link: processVariables(props.info_link || '', processor, 'text'),
		info_link_title: processVariables(props.info_link_title || '', processor, 'text')
	};
}

// ============================================================================
// LEGACY FUNCTIONS - Kept for backward compatibility during migration
// These will be removed after all components migrate to createResolvers()
// ============================================================================

/**
 * Dependencies needed to create a variable processor
 * @deprecated Use `new VariableProcessor()` directly with createResolvers()
 */
export interface VariableProcessorDeps {
	filterContexts?: (Filters | undefined)[];
	inlineQueries?: InlineQueries;
	frontmatterVariables?: Record<string, unknown>;
}

/**
 * @deprecated Use `new VariableProcessor()` directly with createResolvers()
 */
export function createVariableProcessor(
	filterContextsOrDeps: (Filters | undefined)[] | VariableProcessorDeps,
	inlineQueriesArg?: InlineQueries,
	frontmatterVariablesArg?: Record<string, unknown>
): VariableProcessor | null {
	let filterContexts: (Filters | undefined)[] | undefined;
	let inlineQueries: InlineQueries | undefined;
	let frontmatterVariables: Record<string, unknown> | undefined;

	if (Array.isArray(filterContextsOrDeps)) {
		filterContexts = filterContextsOrDeps;
		inlineQueries = inlineQueriesArg;
		frontmatterVariables = frontmatterVariablesArg;
	} else {
		filterContexts = filterContextsOrDeps.filterContexts;
		inlineQueries = filterContextsOrDeps.inlineQueries;
		frontmatterVariables = filterContextsOrDeps.frontmatterVariables;
	}

	if (!inlineQueries) return null;
	const validFilterContexts = filterContexts?.filter((ctx): ctx is Filters => ctx !== undefined);
	if (!validFilterContexts || validFilterContexts.length === 0) return null;

	return new VariableProcessorClass(validFilterContexts, inlineQueries, frontmatterVariables);
}

/**
 * @deprecated Use createResolvers() instead
 */
export function processProp<T>(
	value: T,
	processor: VariableProcessor | null | undefined,
	context: VariableContext
): T {
	return processVariables(value, processor, context);
}

const SQL_CLAUSE_ATTRIBUTES = new Set(['where', 'having', 'order', 'qualify']);

function getContextFromAttribute(attr: UserComponentAttribute, attrName: string): VariableContext {
	if (attr.variableContext) {
		return attr.variableContext;
	}
	if (SQL_CLAUSE_ATTRIBUTES.has(attrName)) {
		return 'sql';
	}
	switch (attr.suggestionType) {
		case 'sql':
		case 'column':
		case 'dateColumn':
			return 'column';
		default:
			return 'text';
	}
}

function isNumberVariable(type: UserComponentAttribute['type']): boolean {
	if (Array.isArray(type)) {
		return type.some(isNumberVariable);
	}
	return type === NumberVariable;
}

function isBooleanVariable(type: UserComponentAttribute['type']): boolean {
	if (Array.isArray(type)) {
		return type.some(isBooleanVariable);
	}
	return type === BooleanVariable;
}

/**
 * Type for date range objects
 */
export interface DateRangeObject {
	range?: string;
	date?: string;
}

/**
 * @deprecated Use createResolvers() instead
 */
export function processStandardProps<
	T extends {
		data?: string;
		title?: string;
		subtitle?: string;
		info?: string;
		info_link?: string;
		info_link_title?: string;
		where?: string;
		having?: string;
		order?: string;
		qualify?: string;
		date_range?: DateRangeObject;
		date_grain?: string;
	}
>(
	props: T,
	processor: VariableProcessor | null | undefined
): {
	data: string | undefined;
	title: string;
	subtitle: string;
	info: string;
	info_link: string;
	info_link_title: string;
	where: string | undefined;
	having: string | undefined;
	order: string | undefined;
	qualify: string | undefined;
	date_range: DateRangeObject | undefined;
	date_grain: string | undefined;
} {
	return {
		data: props.data ? processVariables(props.data, processor, 'text') : undefined,
		title: processVariables(props.title || '', processor, 'text'),
		subtitle: processVariables(props.subtitle || '', processor, 'text'),
		info: processVariables(props.info || '', processor, 'text'),
		info_link: processVariables(props.info_link || '', processor, 'text'),
		info_link_title: processVariables(props.info_link_title || '', processor, 'text'),
		where: props.where ? processVariables(props.where, processor, 'sql') : undefined,
		having: props.having ? processVariables(props.having, processor, 'sql') : undefined,
		order: props.order ? processVariables(props.order, processor, 'sql') : undefined,
		qualify: props.qualify ? processVariables(props.qualify, processor, 'sql') : undefined,
		date_range: processVariables(props.date_range, processor, 'text'),
		date_grain: props.date_grain ? processVariables(props.date_grain, processor, 'text') : undefined
	};
}

/**
 * @deprecated Use createResolvers() instead
 */
export function processPropsFromSchema<T extends object>(
	props: T,
	schema: UserComponentSchema,
	processor: VariableProcessor | null | undefined
): T {
	if (!processor) {
		return props;
	}

	const propsRecord = props as Record<string, unknown>;
	const result = { ...propsRecord };
	const attributes = schema.attributes;

	for (const [key, attr] of Object.entries(attributes)) {
		if (!attr.supportsVariables) continue;
		if (!(key in propsRecord)) continue;

		const value = propsRecord[key];
		const context = getContextFromAttribute(attr, key);

		let coerce: 'number' | 'boolean' | undefined;
		if (isNumberVariable(attr.type)) {
			coerce = 'number';
		} else if (isBooleanVariable(attr.type)) {
			coerce = 'boolean';
		}

		result[key] = processVariables(value, processor, context, coerce ? { coerce } : undefined);
	}

	return result as T;
}

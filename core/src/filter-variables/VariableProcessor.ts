import type { ValidationError, Location } from '@markdoc/markdoc';
import type { Filters } from '../Filters.svelte';
import type { InlineQueries } from '../user-components/common/inline-queries';
import { interpolateQueryStrings, type VariableContext } from '../interpolate-query-strings';
import {
	createFrontmatterVariablePattern,
	resolveVariablePath,
	stripOneQuotePair
} from './frontmatter-variable';
import { logger } from '../shims/logger';

/**
 * Centralized variable processor that handles validation, preprocessing, and runtime processing
 * Supports frontmatter variables ({{ $var }}), filter variables ({{ filter.prop }}), and query references
 * Provides a single source of truth for all variable processing behavior
 */
export class VariableProcessor {
	constructor(
		private filters: Filters | Filters[] | undefined,
		private inlineQueries: InlineQueries | undefined,
		private frontmatterVariables?: Record<string, unknown>
	) {}

	/**
	 * Validate filter variables in a string value
	 * Returns validation errors using the same logic as SQL queries
	 */
	validateString(
		value: string,
		context: { location?: Location; variableContext?: VariableContext } = {}
	): ValidationError[] {
		if (!this.filters || !this.inlineQueries) return [];
		if (!/\{\{(?!\s*\$)/.test(value)) return [];

		const filterContexts = Array.isArray(this.filters) ? this.filters : [this.filters];

		const result = interpolateQueryStrings(
			value,
			filterContexts,
			this.inlineQueries,
			context.variableContext || 'sql'
		);

		return result.errors.map((errorMessage) => ({
			id: 'invalid-filter-variable',
			level: 'error' as const,
			message: errorMessage,
			location: context.location
		}));
	}

	/**
	 * Process filter variables in a string for runtime
	 */
	processString(value: string, variableContext: VariableContext = 'sql'): string {
		let processedValue = value;

		// Step 1: Process frontmatter variables ({{ $var }}) if available
		if (this.frontmatterVariables && /\{\{\s*\$/.test(processedValue)) {
			processedValue = this.interpolateFrontmatterVariables(processedValue);
		}

		// Step 2: Process filter variables ({{ filter.property }}) if available
		if (this.filters && this.inlineQueries && /\{\{(?!\s*\$)/.test(processedValue)) {
			try {
				const filterContexts = Array.isArray(this.filters) ? this.filters : [this.filters];
				const result = interpolateQueryStrings(
					processedValue,
					filterContexts,
					this.inlineQueries,
					variableContext
				);
				processedValue = result.sql;
			} catch (error) {
				logger.warn(error, 'Filter variable processing failed');
			}
		}

		return processedValue;
	}

	/**
	 * Process frontmatter variables ({{ $var }}) in a string
	 */
	private interpolateFrontmatterVariables(value: string): string {
		return interpolateFrontmatterVariables(value, this.frontmatterVariables ?? {});
	}
}

/**
 * Standalone function to interpolate frontmatter variables ({{ $var }}) in a string,
 * with optional fallback support ({{ $var | fallback }}).
 * Used by register-filters.ts to resolve variables in filter attributes.
 */
export function interpolateFrontmatterVariables(
	value: string,
	variables: Record<string, unknown>
): string {
	return value.replace(
		createFrontmatterVariablePattern(),
		(match, varPath: string, fallbackRaw: string | undefined) => {
			const { resolved, value: resolvedValue } = resolveVariablePath(variables, varPath.trim());

			if (!resolved) {
				// Path unresolved: use the fallback if one was written, else leave the
				// literal in place. The missing variable is still surfaced by validation
				// (DECISION 1), matching @hughess/markdoc interpolateString.
				return fallbackRaw !== undefined ? stripOneQuotePair(fallbackRaw) : match;
			}

			// Variable exists but is null/undefined -> empty string; the fallback does NOT
			// apply here (DECISION 2), matching the fork.
			if (resolvedValue === null || resolvedValue === undefined) return '';
			return String(resolvedValue);
		}
	);
}

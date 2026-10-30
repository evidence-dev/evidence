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
import type { SqlDialect } from '../sql-dialect';
import { applyTranslationSqlEscapes } from '../translations/translation-value';

/**
 * Centralized variable processor that handles validation, preprocessing, and runtime processing
 * Supports frontmatter variables ({{ $var }}), filter variables ({{ filter.prop }}), and query references
 * Provides a single source of truth for all variable processing behavior
 */
export class VariableProcessor {
	constructor(
		private filters: Filters | Filters[] | undefined,
		private inlineQueries: InlineQueries | undefined,
		private frontmatterVariables?: Record<string, unknown>,
		// Passing dialect enables dialect-correct translation `.sql` escapes.
		private dialect?: Pick<SqlDialect, 'escapeStringLiteral'>,
		/**
		 * QEv3: unknown bare `{{name}}` placeholders pass through verbatim —
		 * they're engine attributes, bound per viewer by the engine.
		 */
		private passThroughUnknown = false,
		/**
		 * QEv3 TEXT contexts only: the viewer's resolved attribute values
		 * ({ name → value }, bind order already applied). SQL contexts never
		 * resolve here — the engine binds `{{attr}}` at query time.
		 */
		private engineAttributeValues?: Record<string, unknown>
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
			context.variableContext || 'sql',
			new Set<string>(),
			this.dialect,
			this.passThroughUnknown
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

		// QEv3 TEXT contexts: `{{attr}}` prints the viewer's own value (the
		// same token is a bound parameter in SQL — there the engine resolves
		// it, here WE must). Attributes resolve before filters so an unknown
		// bare token doesn't error as "Missing filter ID" first.
		if (this.engineAttributeValues && variableContext !== 'sql') {
			processedValue = processedValue.replace(
				/\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g,
				(match, name: string) => {
					if (!(name in this.engineAttributeValues!)) return match;
					const value = this.engineAttributeValues![name];
					return value === null || value === undefined ? '' : String(value);
				}
			);
		}

		// Step 2: Process filter variables ({{ filter.property }}) if available
		if (this.filters && this.inlineQueries && /\{\{(?!\s*\$)/.test(processedValue)) {
			try {
				const filterContexts = Array.isArray(this.filters) ? this.filters : [this.filters];
				const result = interpolateQueryStrings(
					processedValue,
					filterContexts,
					this.inlineQueries,
					variableContext,
					new Set<string>(),
					this.dialect,
					this.passThroughUnknown
				);
				processedValue = result.sql;
			} catch (error) {
				logger.warn(error, 'Filter variable processing failed');
			}
		}

		// Frontmatter-only paths still need translation `.sql` sentinels resolved.
		if (variableContext === 'sql') {
			processedValue = applyTranslationSqlEscapes(processedValue, this.dialect);
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

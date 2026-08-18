import type { Filters } from './Filters.svelte';
import type { InlineQueries } from './user-components/common/inline-queries';
import { findClosestMatch } from './utils/findClosestMatch';
import { browser } from './shims/env';
import { logger } from './shims/logger';
// posthog is only initialized in Evidence Studio; these captures no-op in the CLI.
import posthog from 'posthog-js';

/**
 * Zero-width characters that have no legitimate use inside SQL or template
 * syntax but can sneak into pasted content from chat apps, AI assistants,
 * or rich-text editors. Even one of these between `{` and `{` makes the
 * literal `{{` substring no longer match, producing a confusing
 * "Unbalanced template brackets" error on what looks like valid input.
 *
 * Stripped at parse time only — storage is left untouched so we do not
 * mangle legitimate uses elsewhere on the page (emoji ZWJ in titles,
 * ZWNJ in Persian/Hindi prose, etc.).
 *
 * - U+200B Zero Width Space
 * - U+200C Zero Width Non-Joiner
 * - U+200D Zero Width Joiner
 * - U+FEFF Byte Order Mark / Zero Width No-Break Space
 *
 * Known limitation: this strips matches anywhere in the string, including
 * inside SQL string literals. A query like `WHERE title LIKE '%\u200C%'`
 * intended to literally search for ZWNJ in user data would have its
 * semantics altered. This is considered acceptable — the strip is scoped
 * to template-aware functions in this file (interpolation + dependency
 * extraction), and intentional ZW-char SQL literals are vanishingly rare
 * compared to paste artifacts breaking template syntax.
 */
const ZERO_WIDTH_CHARS = /[\u200B\u200C\u200D\uFEFF]/g;

/**
 * Strip zero-width characters from a query string. Logs (and reports to
 * PostHog in browser contexts) when characters were actually stripped, so
 * we have telemetry on how often this paste-artifact path fires in the
 * wild. The strip itself is silent to the user.
 */
function stripZeroWidthChars(query: string): string {
	const cleaned = query.replace(ZERO_WIDTH_CHARS, '');
	if (cleaned.length !== query.length) {
		const stripped = query.length - cleaned.length;
		logger.warn(
			{ stripped, queryPreview: query.slice(0, 80) },
			'[interpolateQueryStrings] Stripped zero-width characters from query'
		);
		if (browser) {
			posthog.capture('interpolate-zero-width-chars-stripped', { stripped });
		}
	}
	return cleaned;
}

/**
 * Replace SQL comment bodies with opaque placeholder tokens so template
 * (`{{ ... }}`) and conditional (`[[ ... ]]`) interpolation ignores anything
 * inside them. A token written in a comment is documentation, not a live
 * reference: interpolating it rewrites comment prose, can emit invalid SQL,
 * and — when the token names the query's own inline-query — sends the
 * interpolator into infinite recursion (a self-reference the author never
 * intended, e.g. `-- see {{this_query}}` written inside `this_query`).
 *
 * The scanner is string-literal / quoted-identifier aware, so a `--` or
 * inside a literal (`WHERE note LIKE '%--%'`) is not mistaken for a comment.
 * Comments are restored verbatim by restoreSqlComments once interpolation is
 * done, so this is invisible in the final SQL.
 */
export function maskSqlComments(sql: string): { masked: string; comments: string[] } {
	const comments: string[] = [];
	let out = '';
	let i = 0;
	const n = sql.length;

	const pushComment = (text: string): string => {
		const token = `\u0000c${comments.length}\u0000`;
		comments.push(text);
		return token;
	};

	while (i < n) {
		const c = sql[i];

		// String literal or quoted identifier — copy verbatim through its close.
		if (c === "'" || c === '"' || c === '`') {
			const quote = c;
			out += c;
			i++;
			while (i < n) {
				out += sql[i];
				if (sql[i] === quote) {
					// A doubled quote is an escaped quote and stays inside the literal.
					if (sql[i + 1] === quote) {
						out += sql[i + 1];
						i += 2;
						continue;
					}
					i++;
					break;
				}
				i++;
			}
			continue;
		}

		// Line comment: `--` to end of line (the newline stays outside the mask).
		if (c === '-' && sql[i + 1] === '-') {
			let j = i;
			while (j < n && sql[j] !== '\n') j++;
			out += pushComment(sql.slice(i, j));
			i = j;
			continue;
		}

		// Block comment: `/* ... */` (non-nested).
		if (c === '/' && sql[i + 1] === '*') {
			let j = i + 2;
			while (j < n && !(sql[j] === '*' && sql[j + 1] === '/')) j++;
			j = Math.min(j + 2, n);
			out += pushComment(sql.slice(i, j));
			i = j;
			continue;
		}

		out += c;
		i++;
	}

	return { masked: out, comments };
}

function restoreSqlComments(sql: string, comments: string[]): string {
	let out = sql;
	for (let k = 0; k < comments.length; k++) {
		// Function replacement so `$`-sequences in the comment (e.g. `$1`) are
		// treated literally, not as regex replacement patterns.
		out = out.replace(`\u0000c${k}\u0000`, () => comments[k]);
	}
	return out;
}

/**
 * Context for variable interpolation - determines which default property to use
 * - 'sql': Raw SQL expressions (where, having, order) - uses .selected (quoted values)
 * - 'text': Display text (title, subtitle, info) - uses .literal (unquoted values)
 * - 'column': Column expressions already in quoted attributes (x, y, value) - uses .literal (unquoted)
 */
export type VariableContext = 'sql' | 'text' | 'column';

/**
 * Extract filter IDs from template variables in a query string
 * Returns only filter IDs (not inline queries or frontmatter vars)
 */
export function extractFilterIds(query: string): string[] {
	// Mask comments so a token mentioned only in a comment isn't tracked as a
	// dependency (consistent with interpolation ignoring comment tokens).
	const cleanedQuery = maskSqlComments(stripZeroWidthChars(query)).masked;
	const templateRegex = /\{\{([^}]+)\}\}/g;
	const filterIds: string[] = [];
	let match;

	while ((match = templateRegex.exec(cleanedQuery)) !== null) {
		const templateContent = match[1].trim();
		const pipeIndex = findFallbackPipeIndex(templateContent);
		const templatePart =
			pipeIndex === -1 ? templateContent.trim() : templateContent.substring(0, pipeIndex).trim();

		// Skip frontmatter variables
		if (templatePart.startsWith('$')) continue;

		// Extract filter ID (before first dot)
		const dotIndex = templatePart.indexOf('.');
		const filterId = dotIndex === -1 ? templatePart : templatePart.substring(0, dotIndex);

		if (filterId.length > 0) {
			filterIds.push(filterId);
		}
	}

	return filterIds;
}

/**
 * Check if a query string contains template variables or conditional blocks
 */
export function hasTemplating(query: string): boolean {
	// Mask comments so a token that appears only in a comment doesn't force the
	// query through the interpolation path.
	const cleanedQuery = maskSqlComments(stripZeroWidthChars(query)).masked;

	// Check for template variables like {{filter.value}}
	if (cleanedQuery.includes('{{') && cleanedQuery.includes('}}')) {
		return true;
	}

	// Check for conditional blocks like [[where condition]]
	if (cleanedQuery.includes('[[') && cleanedQuery.includes(']]')) {
		return true;
	}

	return false;
}

/**
 * Interpolate template variables and conditional blocks in query strings
 */
export function interpolateQueryStrings(
	query: string,
	filtersArray: Filters[],
	inlineQueries: InlineQueries,
	context: VariableContext = 'sql',
	/**
	 * Names of inline queries currently being resolved on this recursion path.
	 * Threaded through the recursion so a self- or mutually-referential inline
	 * query surfaces a graceful "Circular inline query reference" error instead
	 * of recursing until the JS call stack overflows (a `RangeError` that took
	 * down the entire page render, not a per-query error).
	 */
	visitedQueries: ReadonlySet<string> = new Set<string>()
): { sql: string; errors: string[] } {
	const errors: string[] = [];
	let sql = stripZeroWidthChars(query);

	// Hide comment bodies before interpolating so `{{...}}` / `[[...]]` written
	// inside a comment is never treated as a live reference — it's prose, not a
	// dependency. Restored verbatim at the end. This also stops an unbalanced
	// bracket in a comment from tripping the checks below. See maskSqlComments.
	const { masked, comments } = maskSqlComments(sql);
	sql = masked;

	// Check for unbalanced brackets first
	if (!areBracketsBalanced(sql, '{{', '}}')) {
		errors.push('Unbalanced template brackets');
	}
	if (!areBracketsBalanced(sql, '[[', ']]')) {
		errors.push('Unbalanced conditional brackets');
	}

	// Process conditional blocks first (they can contain templates)
	sql = processConditionalBlocks(sql, filtersArray, inlineQueries, errors, context, visitedQueries);

	// Then process remaining template variables
	sql = processTemplateVariables(sql, filtersArray, inlineQueries, errors, context, visitedQueries);

	// Restore comment bodies now that interpolation is complete.
	sql = restoreSqlComments(sql, comments);

	// Deduplicate errors
	const uniqueErrors = Array.from(new Set(errors));

	return { sql, errors: uniqueErrors };
}

/**
 * Check if brackets are balanced in the query
 */
function areBracketsBalanced(query: string, open: string, close: string): boolean {
	let count = 0;
	let i = 0;

	while (i < query.length) {
		if (query.substring(i, i + open.length) === open) {
			count++;
			i += open.length;
		} else if (query.substring(i, i + close.length) === close) {
			count--;
			if (count < 0) return false;
			i += close.length;
		} else {
			i++;
		}
	}

	return count === 0;
}

/**
 * Process conditional blocks [[...]]
 */
function processConditionalBlocks(
	sql: string,
	filtersArray: Filters[],
	inlineQueries: InlineQueries,
	errors: string[],
	context: VariableContext,
	visitedQueries: ReadonlySet<string>
): string {
	// Find and process conditional blocks from innermost to outermost
	let result = sql;
	let changed = true;

	while (changed) {
		changed = false;
		const blockRegex = /\[\[([^[\]]*)\]\]/g;
		let match;

		while ((match = blockRegex.exec(result)) !== null) {
			const fullMatch = match[0];
			const blockContent = match[1];

			// Check if any template variables in this block have values
			const shouldInclude = shouldIncludeConditionalBlock(
				blockContent,
				filtersArray,
				inlineQueries,
				errors,
				context,
				visitedQueries
			);

			// Replace the block with its content or empty string
			const replacement = shouldInclude ? blockContent : '';
			result = result.replace(fullMatch, replacement);
			changed = true;
			break; // Start over since string changed
		}
	}

	return result;
}

/**
 * Check if a conditional block should be included
 */
function shouldIncludeConditionalBlock(
	blockContent: string,
	filtersArray: Filters[],
	inlineQueries: InlineQueries,
	errors: string[],
	context: VariableContext,
	visitedQueries: ReadonlySet<string>
): boolean {
	// Find all template variables in the block
	const templateRegex = /\{\{([^}]+)\}\}/g;
	let match;

	while ((match = templateRegex.exec(blockContent)) !== null) {
		const templateContent = match[1].trim();
		const { hasValue } = evaluateTemplate(
			templateContent,
			filtersArray,
			inlineQueries,
			errors,
			context,
			visitedQueries
		);

		// If any template has a value (including fallback), include the block
		if (hasValue) {
			return true;
		}
	}

	return false;
}

/**
 * Process template variables {{...}}
 */
function processTemplateVariables(
	sql: string,
	filtersArray: Filters[],
	inlineQueries: InlineQueries,
	errors: string[],
	context: VariableContext,
	visitedQueries: ReadonlySet<string>
): string {
	const templateRegex = /\{\{([^}]+)\}\}/g;

	return sql.replace(templateRegex, (match, templateContent) => {
		const { value } = evaluateTemplate(
			templateContent.trim(),
			filtersArray,
			inlineQueries,
			errors,
			context,
			visitedQueries
		);
		return value;
	});
}

/**
 * Evaluate a template expression like "filterId.property" or "filterId.property | fallback"
 */
function evaluateTemplate(
	templateContent: string,
	filtersArray: Filters[],
	inlineQueries: InlineQueries,
	errors: string[],
	context: VariableContext,
	visitedQueries: ReadonlySet<string>
): { value: string; hasValue: boolean } {
	// Split on | to separate template from fallback, but be careful with complex filter IDs
	const pipeIndex = findFallbackPipeIndex(templateContent);
	let templatePart =
		pipeIndex === -1 ? templateContent.trim() : templateContent.substring(0, pipeIndex).trim();
	const fallbackPart =
		pipeIndex === -1 ? undefined : templateContent.substring(pipeIndex + 1).trim();

	// The docs show sql-file references in quoted form — `{{ "/queries/foo" }}`
	// (docs/features/sql-files). Strip a matching quote pair so that form
	// classifies as a sql-file/query reference instead of falling through to
	// the filter branch and erroring "Missing filter ID". Filters and inline
	// queries can't legally contain quotes in their names, so unquoting is
	// safe for every branch below.
	const quoteMatch = templatePart.match(/^(['"])(.*)\1$/);
	if (quoteMatch) templatePart = quoteMatch[2].trim();

	// Skip frontmatter variables (those starting with $) - they should be processed by variable processor step 1
	if (templatePart.startsWith('$')) {
		// This is a frontmatter variable, not a filter - leave it unchanged
		return { value: `{{${templateContent}}}`, hasValue: true };
	}

	// Parse the template part (e.g., "filterId.property")
	// Find the LAST dot to handle complex filter IDs with dots
	const dotIndex = templatePart.lastIndexOf('.');

	const validFilterIds = filtersArray.flatMap((filters) => filters.filterIds);

	if (dotIndex === -1) {
		// No property specified - could be inline query reference, SQL file reference, or filter ID without property
		// First check if it's a SQL file reference (no variable interpolation)
		if (inlineQueries.isSqlFile(templatePart)) {
			const sqlContent = inlineQueries.getRaw(templatePart);
			if (sqlContent) {
				// SQL files don't support variable interpolation - return as-is wrapped in parentheses
				return { value: `(${sqlContent})`, hasValue: true };
			}
		}

		// Then check if it's an inline query reference
		const rawInlineQuery = inlineQueries.getRaw(templatePart);
		if (rawInlineQuery) {
			// Cycle guard: if this query is already being resolved further up the
			// stack, resolving it again would recurse forever (a self- or mutually-
			// referential inline query). Surface a graceful error instead of
			// overflowing the JS stack and crashing the whole page render.
			if (visitedQueries.has(templatePart)) {
				errors.push(`Circular inline query reference: \`${templatePart}\``);
				return { value: '', hasValue: false };
			}
			// Recursively process the inline query (inline queries support variable interpolation)
			const processedQuery = interpolateQueryStrings(
				rawInlineQuery,
				filtersArray,
				inlineQueries,
				context,
				new Set(visitedQueries).add(templatePart)
			);
			// Add any errors from the nested query
			errors.push(...processedQuery.errors);
			// Return the processed query wrapped in parentheses
			return { value: `(${processedQuery.sql})`, hasValue: true };
		}

		// Check if it's a valid filter ID
		let filter = undefined;
		for (const filters of filtersArray) {
			filter = filters.get(templatePart);
			if (filter) break;
		}

		if (!filter) {
			// Not a filter — but before reporting that, check whether the author
			// meant a SQL FILE. A bare `{{ name }}` resolves relative to the page
			// (`pages/<name>`), so `{{ daily_orders_recent }}` misses
			// `queries/daily_orders_recent` and lands here; without this hint the
			// error reads "missing filter" and sends the author (or the AI agent)
			// down a dead end. Mirrors the tableExists suggester for `data=` refs.
			const referenceableNames =
				typeof inlineQueries.getPublicNames === 'function'
					? inlineQueries.getPublicNames()
					: inlineQueries.getAllNames();
			const sqlFileMatches = [
				...new Set(
					referenceableNames
						.filter((n) => n.includes('/'))
						.map((n) => n.replace(/^\/+/, ''))
						.filter((n) => n.split('/').pop() === templatePart)
				)
			];

			let message: string;
			if (sqlFileMatches.length === 1) {
				message = `\`${templatePart}\` is not a filter. A SQL file exists at \`${sqlFileMatches[0]}\` — reference it as \`{{ /${sqlFileMatches[0]} }}\` (leading slash = from the project root).`;
			} else if (sqlFileMatches.length > 1) {
				const suggestions = sqlFileMatches
					.slice(0, 5)
					.map((n) => `\`{{ /${n} }}\``)
					.join(', ');
				message = `\`${templatePart}\` is not a filter. Multiple SQL files match — reference one by absolute path: ${suggestions}.`;
			} else {
				message = `Missing filter ID: \`${templatePart}\``;
				const bestMatch = findClosestMatch(templatePart, validFilterIds);
				if (bestMatch) {
					message = `${message}. Did you mean \`${bestMatch}\`?`;
				}
			}
			errors.push(message);

			if (fallbackPart !== undefined) {
				return { value: String(fallbackPart || ''), hasValue: true };
			}

			return { value: '', hasValue: false };
		} else {
			// Filter exists but no property specified - use context-aware default
			const filterClass = filter.constructor as typeof import('./Filter.svelte').Filter;
			const defaultProperty = filterClass.defaultProperty?.[context] || 'selected';

			// Get the property value using the default
			const templateValues = filter.templateValues || {};
			const propertyValue = templateValues[defaultProperty];

			// Check if the default property exists in templateValues
			const propertyExists = defaultProperty in templateValues;

			if (!propertyExists) {
				// Default property doesn't exist (shouldn't happen with proper filter setup)
				if (fallbackPart !== undefined) {
					errors.push(
						'Missing filter property (e.g. ' +
							templatePart +
							'.selected, ' +
							templatePart +
							'.filter)'
					);
					return { value: String(fallbackPart || ''), hasValue: true };
				}
				errors.push(
					'Missing filter property (e.g. ' +
						templatePart +
						'.selected, ' +
						templatePart +
						'.filter)'
				);
				return { value: '', hasValue: false };
			}

			if (propertyValue === undefined || propertyValue === '' || propertyValue === null) {
				// Property exists but has no value - use fallback without error
				if (fallbackPart !== undefined) {
					return { value: String(fallbackPart || ''), hasValue: true };
				}
				return { value: '', hasValue: false };
			}

			// Don't use || fallback for property value - it would convert false/0 to empty string
			return { value: formatTemplateValue(propertyValue, context), hasValue: true };
		}
	}

	const filterId = templatePart.substring(0, dotIndex);
	const property = templatePart.substring(dotIndex + 1);

	// Find the filter across all filter contexts
	let filter = undefined;
	for (const filters of filtersArray) {
		filter = filters.get(filterId);
		if (filter) break;
	}

	if (!filter) {
		// Report error but still use fallback if available
		let message = `Missing filter ID \`${filterId}\``;
		const bestMatch = findClosestMatch(filterId, validFilterIds);
		if (bestMatch) {
			message = `${message}. Did you mean \`${bestMatch}\`?`;
		}
		errors.push(message);

		if (fallbackPart !== undefined) {
			return { value: String(fallbackPart || ''), hasValue: true };
		}
		return { value: '', hasValue: false };
	}

	// Get the property value from template values
	const templateValues = filter.templateValues || {};
	const propertyValue = templateValues[property];

	// Check if property exists in templateValues (even if undefined)
	const propertyExists = property in templateValues;

	if (!propertyExists) {
		// Property doesn't exist - report error and use fallback if available
		if (fallbackPart !== undefined) {
			errors.push(
				'Missing filter property (e.g. ' + filterId + '.selected, ' + filterId + '.filter)'
			);
			return { value: String(fallbackPart || ''), hasValue: true };
		}
		errors.push(
			'Missing filter property (e.g. ' + filterId + '.selected, ' + filterId + '.filter)'
		);
		return { value: '', hasValue: false };
	}

	if (propertyValue === undefined || propertyValue === '' || propertyValue === null) {
		// Property exists but has no value - use fallback without error
		if (fallbackPart !== undefined) {
			return { value: String(fallbackPart || ''), hasValue: true };
		}
		return { value: '', hasValue: false };
	}

	// Don't use || fallback for property value - it would convert false/0 to empty string
	return { value: formatTemplateValue(propertyValue, context), hasValue: true };
}

function formatTemplateValue(value: unknown, context: VariableContext): string {
	if (typeof value === 'boolean' && context === 'sql') {
		return value ? 'true' : 'false';
	}

	return String(value);
}

/**
 * Find the pipe index for fallback, being careful not to split on pipes within filter IDs
 */
function findFallbackPipeIndex(templateContent: string): number {
	// Look for the last pipe that's not part of a filter ID
	// We assume filter IDs can contain pipes, but fallback is always at the end
	const lastPipeIndex = templateContent.lastIndexOf('|');
	if (lastPipeIndex === -1) return -1;

	// Check if this looks like a fallback (has some whitespace around it or quotes)
	const afterPipe = templateContent.substring(lastPipeIndex + 1).trim();

	// If the part after the pipe looks like a fallback value, it's probably a fallback
	// Be more permissive but still handle edge cases with pipes in filter IDs
	if (
		afterPipe.startsWith("'") || // quoted with single quotes
		afterPipe.startsWith('"') || // quoted with double quotes
		afterPipe.includes(' ') || // contains whitespace
		!isNaN(Number(afterPipe)) || // is a number
		/^[a-zA-Z][a-zA-Z0-9_]*$/.test(afterPipe) // simple word (letters/numbers/underscore)
	) {
		return lastPipeIndex;
	}

	return -1;
}

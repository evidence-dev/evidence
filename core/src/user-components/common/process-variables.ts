import type { VariableProcessor } from '../../filter-variables/VariableProcessor';
import type { VariableContext } from '../../interpolate-query-strings';

/**
 * Options for processVariables
 */
export interface ProcessVariablesOptions {
	/**
	 * Expected type for coercion after variable interpolation.
	 * - 'boolean': coerces "true"/"false" strings to boolean
	 * - 'number': coerces numeric strings to number
	 * - 'string': no coercion (default)
	 * - 'auto': attempts to detect and coerce booleans and numbers
	 */
	coerce?: 'boolean' | 'number' | 'string' | 'auto';
}

/**
 * Coerce a string value to the expected type
 */
function coerceValue(value: string, coerce: ProcessVariablesOptions['coerce']): unknown {
	if (!coerce || coerce === 'string') {
		return value;
	}

	if (coerce === 'boolean') {
		if (value === 'true') return true;
		if (value === 'false') return false;
		return value; // Return as-is if not a boolean string
	}

	if (coerce === 'number') {
		const num = Number(value);
		if (!isNaN(num) && value.trim() !== '') return num;
		return value; // Return as-is if not a valid number
	}

	if (coerce === 'auto') {
		// Try boolean first
		if (value === 'true') return true;
		if (value === 'false') return false;
		// Then try number
		const num = Number(value);
		if (!isNaN(num) && value.trim() !== '') return num;
		// Return as string
		return value;
	}

	return value;
}

/**
 * Utility function to process variables in an attribute value.
 * Interpolates variable syntax ({{ filter.property }}) in strings, objects, and arrays.
 *
 * Recursively processes nested objects and arrays to handle deeply nested variable references.
 *
 * Reactivity is established automatically when processString() accesses filter.templateValues,
 * which reads reactive filter state. No explicit filter tracking is needed.
 *
 * Context determines which default property to use:
 * - 'sql' context (for SQL attributes like where, having, order) uses .selected (with quotes)
 * - 'text' context (for display attributes like title, subtitle, info) uses .literal (no quotes)
 * - 'column' context (for column expressions like x, y, value) uses .literal (no quotes)
 *
 * This is a standalone function that can be used in both UserComponentModel subclasses
 * and regular Svelte components.
 *
 * @param value The attribute value to process (string, object, array, or other)
 * @param variableProcessor The VariableProcessor instance to use for interpolation
 * @param context Variable context: 'sql', 'text', or 'column'. Defaults to 'text' if not specified.
 * @param options Optional settings for type coercion
 * @returns The value with variables interpolated
 *
 * @example
 * // In a regular Svelte component
 * const resolvedWhere = $derived(processVariables(where, variableProcessor, 'sql'));
 * const resolvedTitle = $derived(processVariables(title, variableProcessor, 'text'));
 *
 * // With type coercion for booleans
 * const showLegend = $derived(processVariables(props.legend, variableProcessor, 'text', { coerce: 'boolean' }));
 *
 * // Nested objects are processed recursively
 * const comparison = $derived(processVariables(props.comparison, variableProcessor, 'text'));
 * // { text: "{{filter}}", value: "{{filter.value}}" } becomes { text: "resolved", value: "42" }
 */
export function processVariables<V>(
	value: V,
	variableProcessor: VariableProcessor | null | undefined,
	context: VariableContext = 'text',
	options?: ProcessVariablesOptions
): V {
	// If no variable processor available, return raw value
	if (!variableProcessor) {
		return value;
	}

	// Process strings directly
	if (typeof value === 'string') {
		const processed = variableProcessor.processString(value, context);
		if (options?.coerce) {
			return coerceValue(processed, options.coerce) as V;
		}
		return processed as V;
	}

	// Process arrays recursively
	if (Array.isArray(value)) {
		return value.map((item) => processVariables(item, variableProcessor, context, options)) as V;
	}

	// Process objects recursively (handles deeply nested objects)
	if (typeof value === 'object' && value !== null) {
		const resolved: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(value)) {
			resolved[key] = processVariables(val, variableProcessor, context, options);
		}
		return resolved as V;
	}

	// Return other types unchanged (numbers, booleans, null, undefined)
	return value;
}

// ============================================================================
// COERCION HELPERS
// ============================================================================

/**
 * Coerce a value to boolean.
 *
 * Use this for nested object properties that use booleanVariableSchema,
 * where the resolved value may be a string "true"/"false" from variable interpolation.
 *
 * @example
 * ```typescript
 * const fitToData = coerceBoolean(axisOptions?.fit_to_data) ?? false;
 * const showDelta = coerceBoolean(comparison?.delta) ?? true;
 * ```
 */
export function coerceBoolean(value: unknown): boolean | undefined {
	if (value === true || value === 'true') return true;
	if (value === false || value === 'false') return false;
	return undefined;
}

/**
 * Coerce a value to number.
 *
 * Use this for nested object properties that use numberVariableSchema,
 * where the resolved value may be a numeric string from variable interpolation.
 *
 * @example
 * ```typescript
 * const min = coerceNumber(axisOptions?.min);
 * const max = coerceNumber(axisOptions?.max);
 * ```
 */
export function coerceNumber(value: unknown): number | undefined {
	if (typeof value === 'number') return value;
	if (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value))) {
		return Number(value);
	}
	return undefined;
}

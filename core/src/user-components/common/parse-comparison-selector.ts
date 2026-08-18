import type { ComparisonSelectorOutput } from '../tags/comparison_selector/types';
import type { ResolvedComparison } from './comparison-schema';

/**
 * Attempts to parse a compare_vs value that might contain a JSON config from a comparison_selector.
 *
 * When a user writes compare_vs="{{comp}}", the selector returns a JSON string
 * containing the full comparison configuration. This function detects and parses that.
 *
 * @param compareVs The raw compare_vs value (could be a simple string like "prior year" or a JSON config)
 * @returns The parsed config if it was JSON, or null if it's a simple string
 */
export function parseComparisonSelectorConfig(
	compareVs: string | undefined
): ComparisonSelectorOutput | null {
	if (!compareVs) return null;

	// Check if it looks like JSON (starts with {)
	const trimmed = compareVs.trim();
	if (!trimmed.startsWith('{')) return null;

	try {
		const parsed = JSON.parse(trimmed);

		// Validate it has the required compare_vs field
		if (parsed && typeof parsed === 'object' && 'compare_vs' in parsed) {
			// Parse within array if it was stringified
			if (typeof parsed.within === 'string' && parsed.within.startsWith('[')) {
				try {
					parsed.within = JSON.parse(parsed.within);
				} catch {
					// Keep as string if parsing fails
				}
			}

			// Convert boolean strings back to booleans
			if (parsed.exclude_self === 'true') parsed.exclude_self = true;
			if (parsed.exclude_self === 'false') parsed.exclude_self = false;
			if (parsed.down_is_good === 'true') parsed.down_is_good = true;
			if (parsed.down_is_good === 'false') parsed.down_is_good = false;

			return parsed as ComparisonSelectorOutput;
		}
	} catch {
		// Not valid JSON, that's fine - it's probably just a string value
	}

	return null;
}

/**
 * Merges a comparison selector config with component-level comparison properties.
 * Component properties override selector properties.
 *
 * @param selectorConfig The parsed config from the selector
 * @param componentComparison The comparison object from the component
 * @returns A merged comparison config
 */
export function mergeComparisonConfig(
	selectorConfig: ComparisonSelectorOutput,
	componentComparison: Record<string, unknown>
): Record<string, unknown> {
	const merged: Record<string, unknown> = {
		compare_vs: selectorConfig.compare_vs,
		name: selectorConfig.name // Custom comparison name for display text
	};

	// Add selector's benchmark properties if it's a benchmark comparison
	if (selectorConfig.compare_vs === 'benchmark') {
		merged.benchmark = {
			agg: selectorConfig.agg,
			subject: selectorConfig.subject,
			value: selectorConfig.value,
			where: selectorConfig.where,
			within: selectorConfig.within,
			exclude_self: selectorConfig.exclude_self
		};
	}

	// Add selector's target if it's a target comparison
	if (selectorConfig.compare_vs === 'target' && selectorConfig.target) {
		merged.target = selectorConfig.target;
	}

	// Add selector's display properties
	if (selectorConfig.display_type) merged.display_type = selectorConfig.display_type;
	if (selectorConfig.text) merged.text = selectorConfig.text;
	if (selectorConfig.pct_fmt) merged.pct_fmt = selectorConfig.pct_fmt;
	if (selectorConfig.abs_fmt) merged.abs_fmt = selectorConfig.abs_fmt;
	if (selectorConfig.down_is_good !== undefined) merged.down_is_good = selectorConfig.down_is_good;

	// Now apply component overrides
	for (const [key, value] of Object.entries(componentComparison)) {
		if (key === 'compare_vs') continue; // Don't override compare_vs
		if (value === undefined || value === '') continue; // Skip empty values

		if (key === 'benchmark' && typeof value === 'object' && value !== null) {
			// Deep merge benchmark
			merged.benchmark = {
				...((merged.benchmark as Record<string, unknown>) || {}),
				...value
			};
		} else {
			merged[key] = value;
		}
	}

	return merged;
}

/**
 * Resolves a comparison attribute, handling both simple strings and selector configs.
 *
 * @param comparison The raw comparison attribute from the component
 * @returns A resolved comparison config with properly typed properties
 */
export function resolveComparisonFromSelector(
	comparison: Record<string, unknown> | undefined
): ResolvedComparison | undefined {
	if (!comparison) return undefined;

	const compareVs = comparison.compare_vs;
	if (typeof compareVs !== 'string') return comparison as unknown as ResolvedComparison;

	// Try to parse as selector config
	const selectorConfig = parseComparisonSelectorConfig(compareVs);

	if (selectorConfig) {
		// Merge selector config with component properties
		return mergeComparisonConfig(selectorConfig, comparison) as unknown as ResolvedComparison;
	}

	// Not a selector config, return as-is
	return comparison as unknown as ResolvedComparison;
}

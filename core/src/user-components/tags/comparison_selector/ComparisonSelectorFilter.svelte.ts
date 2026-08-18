import { Filter, type FilterDeps, type FilterInit } from '../../../Filter.svelte';
import { escapeSqlValue } from '../../../sql-dialect';
import type { UserComponentProps } from '../../types';
import type { schema } from './schema';
import type {
	BenchmarkComparisonOption,
	TargetComparisonOption,
	ComparisonSelectorOutput
} from './types';
import { COMPARISON_VALUES } from '../../common/comparison-schema';

type CustomComparisonOption = BenchmarkComparisonOption | TargetComparisonOption;

type ComparisonSelectorAttributes = Omit<UserComponentProps<typeof schema>, 'id'> & {
	// Runtime data passed from component
	_customOptions?: CustomComparisonOption[];
};

export class ComparisonSelectorFilter extends Filter<string> {
	// Override default: return the full JSON comparison for both contexts
	// This allows compare_vs="{{comp}}" to work directly
	static override defaultProperty = { sql: 'comparison', text: 'comparison', column: 'comparison' };

	attributes: ComparisonSelectorAttributes;

	get sql() {
		// Comparison selectors typically don't generate SQL WHERE clauses
		return undefined;
	}

	/**
	 * Get the full comparison config object for the currently selected option
	 */
	private getSelectedConfig(): ComparisonSelectorOutput | null {
		if (!this.value) return null;

		// Check if it's a custom option first
		const customOptions = this.attributes._customOptions ?? [];
		const customOption = customOptions.find((opt) => opt.name === this.value);

		if (customOption) {
			// Return the full config from the custom option
			if (customOption.compare_vs === 'benchmark') {
				const benchmark = customOption as BenchmarkComparisonOption;
				return {
					compare_vs: 'benchmark',
					name: benchmark.name,
					agg: benchmark.agg,
					subject: benchmark.subject,
					value: benchmark.value,
					where: benchmark.where,
					within: benchmark.within,
					exclude_self: benchmark.exclude_self,
					display_type: benchmark.display_type,
					text: benchmark.text,
					pct_fmt: benchmark.pct_fmt,
					abs_fmt: benchmark.abs_fmt,
					down_is_good: benchmark.down_is_good
				};
			} else {
				const target = customOption as TargetComparisonOption;
				return {
					compare_vs: 'target',
					name: target.name,
					target: target.target,
					display_type: target.display_type,
					text: target.text,
					pct_fmt: target.pct_fmt,
					abs_fmt: target.abs_fmt,
					down_is_good: target.down_is_good
				};
			}
		}

		// Built-in option
		if (COMPARISON_VALUES.includes(this.value as (typeof COMPARISON_VALUES)[number])) {
			return {
				compare_vs: this.value as ComparisonSelectorOutput['compare_vs'],
				name: this.value
			};
		}

		return null;
	}

	get templateValues(): Record<string, unknown> {
		const config = this.getSelectedConfig();

		// Build template values with all properties
		// When {{comp}} is used directly, it returns the JSON config string
		// Individual properties can be accessed via {{comp.compare_vs}}, {{comp.agg}}, etc.
		// The value is a URL param, so only a name the selector actually resolved may reach
		// SQL — `literal` is emitted unquoted, where escaping would not help.
		const name = config?.name;

		return {
			// Legacy/compatibility
			selected: name ? `'${escapeSqlValue(name, this.dialect)}'` : '',
			literal: name ?? '',

			// Full JSON comparison - always present (default property)
			// Returns empty string if no selection, JSON object string otherwise
			comparison: config ? JSON.stringify(config) : '',

			// Individual properties (only present when config exists)
			...(config
				? {
						// Core identification
						compare_vs: config.compare_vs,
						name: config.name,

						// Benchmark properties
						agg: config.agg ?? '',
						subject: config.subject ?? '',
						value: config.value ?? '',
						where: config.where ?? '',
						within: config.within ? JSON.stringify(config.within) : '',
						exclude_self: config.exclude_self ? 'true' : 'false',

						// Target properties
						target: config.target ?? '',

						// Display properties
						display_type: config.display_type ?? '',
						text: config.text ?? '',
						pct_fmt: config.pct_fmt ?? '',
						abs_fmt: config.abs_fmt ?? '',
						down_is_good: config.down_is_good ? 'true' : 'false'
					}
				: {})
		};
	}

	constructor(
		init: FilterInit<'comparison_selector', ComparisonSelectorAttributes>,
		deps: FilterDeps
	) {
		const processedInitialValue = init.attributes.default_value;

		super(
			init.id,
			init.userComponentName,
			{
				initialValue: processedInitialValue,
				serialize: (value) => value,
				deserialize: (raw) => raw
			},
			deps
		);

		this.attributes = $state(init.attributes);
	}
}

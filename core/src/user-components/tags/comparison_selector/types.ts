/**
 * Types for custom comparison options defined as children of comparison_selector
 */

// Base properties shared by all comparison types
interface BaseComparisonOption {
	id: string;
	name: string;
	// Display properties (optional, can be overridden by component)
	display_type?: 'pct' | 'abs' | 'compared_value';
	text?: string;
	pct_fmt?: string;
	abs_fmt?: string;
	down_is_good?: boolean;
}

// Benchmark comparison option
export interface BenchmarkComparisonOption extends BaseComparisonOption {
	compare_vs: 'benchmark';
	agg: 'avg' | 'median' | 'min' | 'max' | 'sum' | 'count' | 'count_distinct';
	subject: string;
	value?: string;
	where?: string;
	within?: string[];
	exclude_self?: boolean;
}

// Target comparison option
export interface TargetComparisonOption extends BaseComparisonOption {
	compare_vs: 'target';
	target: string;
}

// Built-in comparison option (prior year, prior period, etc.)
export interface BuiltinComparisonOption {
	id: string;
	name: string;
	compare_vs: 'prior year' | 'prior period' | 'target' | 'benchmark';
}

// Union type for any comparison option
export type ComparisonOption =
	| BenchmarkComparisonOption
	| TargetComparisonOption
	| BuiltinComparisonOption;

// Type for what the selector outputs when a custom comparison is selected
export interface ComparisonSelectorOutput {
	compare_vs: 'prior year' | 'prior period' | 'target' | 'benchmark';
	name: string;
	// Benchmark properties
	agg?: 'avg' | 'median' | 'min' | 'max' | 'sum' | 'count' | 'count_distinct';
	subject?: string;
	value?: string;
	where?: string;
	within?: string[];
	exclude_self?: boolean;
	// Target properties
	target?: string;
	// Display properties
	display_type?: 'pct' | 'abs' | 'compared_value';
	text?: string;
	pct_fmt?: string;
	abs_fmt?: string;
	down_is_good?: boolean;
}

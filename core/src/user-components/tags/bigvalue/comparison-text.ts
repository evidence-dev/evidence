import type { Translate } from '../../../locale/messages';

type ComparisonLabelSource = { text?: string; name?: string; compare_vs?: string } | undefined;

const DEFAULT_TEXT = {
	'prior year': 'bigvalue.vs_last_year',
	'prior period': 'bigvalue.vs_last_period',
	target: 'bigvalue.vs_target',
	benchmark: 'bigvalue.vs_benchmark'
} as const;

const SELECTOR_BUILT_IN_NAME = {
	'prior year': 'bigvalue.selected_prior_year',
	'prior period': 'bigvalue.selected_prior_period',
	target: 'bigvalue.selected_target',
	benchmark: 'bigvalue.selected_benchmark'
} as const;

type BuiltIn = keyof typeof DEFAULT_TEXT;
const isBuiltIn = (value: string | undefined): value is BuiltIn =>
	value !== undefined && Object.hasOwn(DEFAULT_TEXT, value);

/**
 * Label next to a big_value delta: explicit `text`, then a custom comparison's `name`
 * (e.g. "vs. Franchisees"), then the default for its `compare_vs`.
 */
export function bigValueComparisonText(comparison: ComparisonLabelSource, t: Translate): string {
	if (comparison?.text) return comparison.text;
	const { name, compare_vs } = comparison ?? {};
	// A comparison_selector's built-in option echoes its raw value as `name`; it must follow the page language.
	if (name && name === compare_vs && isBuiltIn(name)) return t(SELECTOR_BUILT_IN_NAME[name]);
	if (name) return name;
	return isBuiltIn(compare_vs) ? t(DEFAULT_TEXT[compare_vs]) : '';
}

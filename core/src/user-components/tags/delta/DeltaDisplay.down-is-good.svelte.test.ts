// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Markdoc, { type Config } from '@markdoc/markdoc';
import { PAGE_SETTINGS_CONTEXT_KEY } from '../../../page-settings.context';
import type { PageSettings } from '../../interfaces/project-settings';
import { mergeComparisonConfig } from '../../common/parse-comparison-selector';
import type { ComparisonSelectorOutput } from '../comparison_selector/types';
import { schema as deltaSchema } from './schema';
import { schema as bigValueSchema } from '../bigvalue/schema';
import { schema as measureSchema } from '../table/measure/schema';
import { schema as benchmarkSchema } from '../benchmark_comparison/schema';
import { schema as targetSchema } from '../target_comparison/schema';
import DeltaDisplay from './DeltaDisplay.svelte';

const POSITIVE = 'text-(--theme-positive)';
const NEGATIVE = 'text-(--theme-negative)';

let mounted: ReturnType<typeof mount> | undefined;
let target: HTMLElement | undefined;

afterEach(() => {
	if (mounted) unmount(mounted);
	target?.remove();
	mounted = undefined;
	target = undefined;
});

function renderDelta(props: { value: number; downIsGood?: boolean }, settings?: PageSettings) {
	target = document.createElement('div');
	document.body.appendChild(target);
	mounted = mount(DeltaDisplay, {
		target,
		props,
		context: settings ? new Map([[PAGE_SETTINGS_CONTEXT_KEY, () => settings]]) : undefined
	});
	flushSync();
	return target.firstElementChild!.className;
}

const config = {
	tags: {
		delta: deltaSchema,
		big_value: bigValueSchema,
		measure: measureSchema,
		benchmark_comparison: benchmarkSchema,
		target_comparison: targetSchema
	}
} as unknown as Config;

function attributesOf(markdown: string): Record<string, unknown> {
	const ast = Markdoc.parse(markdown);
	const [tag] = (Markdoc.transform(ast, config) as { children: Array<{ attributes: object }> })
		.children;
	return tag.attributes as Record<string, unknown>;
}

const comparisonOf = (markdown: string) =>
	attributesOf(markdown).comparison as Record<string, unknown>;

describe('DeltaDisplay with a page-level down_is_good', () => {
	it.each([
		{ page: undefined, component: undefined, expected: POSITIVE },
		{ page: true, component: undefined, expected: NEGATIVE },
		{ page: false, component: undefined, expected: POSITIVE },
		{ page: true, component: false, expected: POSITIVE },
		{ page: false, component: true, expected: NEGATIVE },
		{ page: undefined, component: true, expected: NEGATIVE }
	])(
		'page $page + component $component → increase is $expected',
		({ page, component, expected }) => {
			const settings = page === undefined ? undefined : { down_is_good: page };
			expect(renderDelta({ value: 0.1, downIsGood: component }, settings)).toContain(expected);
		}
	);

	it('colors a decrease as good under the page setting', () => {
		expect(renderDelta({ value: -0.1 }, { down_is_good: true })).toContain(POSITIVE);
	});
});

// A schema default of `false` makes every component look like it set the
// value explicitly, which silently disables the page setting.
describe('components leave down_is_good unset when the author omits it', () => {
	it.each([
		['delta', '{% delta data="d" value="sum(x)" comparison={compare_vs="prior period"} /%}'],
		['big_value', '{% big_value data="d" value="sum(x)" comparison={compare_vs="prior period"} /%}']
	])('%s comparison', (_, markdown) => {
		expect(comparisonOf(markdown)).toHaveProperty('compare_vs', 'prior period');
		expect(comparisonOf(markdown).down_is_good).toBeUndefined();
	});

	it('keeps an explicit component value', () => {
		const markdown =
			'{% big_value data="d" value="sum(x)" comparison={compare_vs="prior period" down_is_good=false} /%}';
		expect(comparisonOf(markdown).down_is_good).toBe(false);
	});

	it('table measure with viz="delta"', () => {
		const attributes = attributesOf(
			'{% measure value="sum(x)" viz="delta" delta_options={show_symbol=false} /%}'
		);
		const options = attributes.delta_options as Record<string, unknown>;
		expect(options.show_symbol).toBe(false);
		expect(options.down_is_good).toBeUndefined();
	});

	it.each([
		['benchmark_comparison', '{% benchmark_comparison name="Peers" agg="avg" value="x" /%}'],
		['target_comparison', '{% target_comparison name="Budget" target="100" /%}']
	])('%s option', (_, markdown) => {
		expect(attributesOf(markdown).down_is_good).toBeUndefined();
	});
});

describe('comparison_selector options', () => {
	it("keep the option's down_is_good when the component omits it", () => {
		const option = attributesOf(
			'{% target_comparison name="Budget" target="100" down_is_good=true /%}'
		);
		const selected = {
			compare_vs: 'target',
			name: 'Budget',
			target: '100',
			down_is_good: option.down_is_good
		} as ComparisonSelectorOutput;
		const component = comparisonOf(
			'{% big_value data="d" value="sum(x)" comparison={compare_vs="target"} /%}'
		);
		expect(mergeComparisonConfig(selected, component).down_is_good).toBe(true);
	});
});

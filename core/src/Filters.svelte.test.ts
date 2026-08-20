import { describe, it, expect } from 'vitest';
import { Filters } from './Filters.svelte';
import { ExternalFilter } from './ExternalFilter.svelte';
import { ToggleFilter } from './user-components/tags/toggle/ToggleFilter.svelte';
import { DropdownFilter } from './user-components/tags/dropdown/DropdownFilter.svelte';
import { ButtonGroupFilter } from './user-components/tags/button_group/ButtonGroupFilter.svelte';
import { InputTabsFilter } from './user-components/tags/input_tabs/InputTabsFilter.svelte';
import { TextInputFilter } from './user-components/tags/text_input/TextInputFilter.svelte';
import { RepeatFilter } from './user-components/tags/repeat/RepeatFilter.svelte';
import { DateGrainSelectorFilter } from './user-components/tags/date_grain_selector/DateGrainSelectorFilter.svelte';
import { ComparisonSelectorFilter } from './user-components/tags/comparison_selector/ComparisonSelectorFilter.svelte';
import { ClickHouseDialect, PostgresDialect, type SqlDialect } from './sql-dialect';
import type { Filter, FilterClass, FilterDeps } from './Filter.svelte';
import { InlineQueries } from './user-components/common/inline-queries';
import { interpolateQueryStrings } from './interpolate-query-strings';

const deps = {
	url: undefined,
	updateUrl: undefined,
	projectSettings: undefined,
	dialect: undefined
};

function makeFilters(): Filters {
	return new Filters(deps);
}

describe('Filters.createExternal', () => {
	it('creates a runtime-owned filter seeded with the given value', () => {
		const filters = makeFilters();

		const filter = filters.createExternal('region', 'EU');

		expect(filter).toBeInstanceOf(ExternalFilter);
		expect(filters.isExternal('region')).toBe(true);
		expect(filters.get('region')?.value).toBe('EU');
		expect(filters.filterIds).toContain('region');
	});

	it('is idempotent: a second create returns the same filter without resetting its value', () => {
		const filters = makeFilters();

		const first = filters.createExternal('region', 'EU');
		(first as { value: unknown }).value = 'NA';

		const second = filters.createExternal('region', 'EU');

		expect(second).toBe(first);
		expect(filters.get('region')?.value).toBe('NA');
	});

	it('defers to a pre-existing typed (AST) filter and does NOT mark it external', () => {
		const filters = makeFilters();
		const toggle = filters.create(
			{
				id: 'flag',
				userComponentName: 'toggle',
				attributes: { invert: false, initial_value: false }
			},
			ToggleFilter as unknown as FilterClass<'toggle', Record<string, unknown>>
		);
		(toggle as { value: unknown }).value = true;

		const returned = filters.createExternal('flag', 'seed');

		// The typed filter wins: same instance, value untouched, not external.
		expect(returned).toBe(toggle);
		expect(filters.get('flag')?.value).toBe(true);
		expect(filters.isExternal('flag')).toBe(false);
	});

	it('clears the external flag when removed', () => {
		const filters = makeFilters();
		filters.createExternal('region', 'EU');

		filters.remove('region');

		expect(filters.isExternal('region')).toBe(false);
		expect(filters.get('region')).toBeUndefined();
	});

	it('shared id across blocks: only the creating block owns it (a deferring block must not)', () => {
		const filters = makeFilters();

		// Models Html.svelte's ownership rule: a block claims a filter only when
		// its call actually created it (it did not already exist). This is the fix
		// for the collision bug — a second block that merely defers to an existing
		// filter used to also claim it, then remove it on its own unmount and yank
		// it out from under the still-live first block.
		const claimOwnership = (id: string, value: unknown): boolean => {
			const createdHere = !filters.has(id);
			filters.createExternal(id, value);
			return createdHere && filters.isExternal(id);
		};

		const blockAOwns = claimOwnership('region', 'EU'); // first call creates it
		const blockBOwns = claimOwnership('region', 'NA'); // second call defers

		expect(blockAOwns).toBe(true);
		expect(blockBOwns).toBe(false);

		// Block B unmounts: it owns nothing, so it removes nothing — the filter and
		// block A's value survive. (Under the old bug, B owned it and removed it.)
		expect(filters.has('region')).toBe(true);
		expect(filters.get('region')?.value).toBe('EU');
	});
});

describe('Filters.createExternal: query interpolation', () => {
	function interpolate(filters: Filters, query: string, context: 'sql' | 'text' = 'sql') {
		const inlineQueries = new InlineQueries({ filterContexts: [filters] });
		return interpolateQueryStrings(query, [filters], inlineQueries, context);
	}

	it('exposes a quoted .selected (default in sql) and raw .literal', () => {
		const filters = makeFilters();
		filters.createExternal('region', 'EU');

		expect(interpolate(filters, 'WHERE region = {{ region }}').sql).toBe("WHERE region = 'EU'");
		expect(interpolate(filters, '{{ region.literal }}').sql).toBe('EU');
	});

	it('renders an array value as a SQL IN-list for .selected', () => {
		const filters = makeFilters();
		filters.createExternal('cats', ['a', 'b']);

		expect(interpolate(filters, 'WHERE c IN {{ cats }}').sql).toBe("WHERE c IN ('a', 'b')");
		expect(interpolate(filters, '{{ cats.literal }}').sql).toBe('a, b');
	});

	it('resolves with no errors (a real filter, not a missing-id)', () => {
		const filters = makeFilters();
		filters.createExternal('region', 'EU');

		expect(interpolate(filters, '{{ region }}').errors).toEqual([]);
	});
});

describe('Filters.createExternal: column binding', () => {
	function interpolate(filters: Filters, query: string, context: 'sql' | 'text' = 'sql') {
		const inlineQueries = new InlineQueries({ filterContexts: [filters] });
		return interpolateQueryStrings(query, [filters], inlineQueries, context);
	}

	it('column-less filter has no sql predicate and {{ id.filter }} is a no-op', () => {
		const filters = makeFilters();
		filters.createExternal('region', 'EU');

		expect(filters.get('region')?.sql).toBeUndefined();
		expect(interpolate(filters, 'WHERE {{ region.filter }}').sql).toBe('WHERE true');
	});

	it('column-bound scalar emits a column = value predicate via sql and {{ id.filter }}', () => {
		const filters = makeFilters();
		filters.createExternal('region', 'EU', 'region_code');

		expect(filters.get('region')?.sql).toBe("region_code='EU'");
		expect(interpolate(filters, 'WHERE {{ region.filter }}').sql).toBe("WHERE region_code='EU'");
	});

	it('column-bound array emits an IN predicate', () => {
		const filters = makeFilters();
		filters.createExternal('cats', ['a', 'b'], 'category');

		expect(filters.get('cats')?.sql).toBe("category IN ('a', 'b')");
		expect(interpolate(filters, 'WHERE {{ cats.filter }}').sql).toBe(
			"WHERE category IN ('a', 'b')"
		);
	});

	it('column-bound empty/blank value yields no predicate (matches everything)', () => {
		const filters = makeFilters();
		filters.createExternal('region', '', 'region_code');
		expect(filters.get('region')?.sql).toBeUndefined();

		filters.remove('region');
		filters.createExternal('cats', [], 'category');
		expect(filters.get('cats')?.sql).toBeUndefined();
	});

	it('escapes single quotes in column-bound values', () => {
		const filters = makeFilters();
		filters.createExternal('region', "O'Brien", 'name');

		expect(filters.get('region')?.sql).toBe("name='O\\'Brien'");
	});
});

describe('Filters.createExternal: static pre-registration', () => {
	it('marks a filter as static when opts.static is true and exposes it via isStaticExternal', () => {
		const filters = makeFilters();

		filters.createExternal('region', undefined, 'region_code', { static: true });

		expect(filters.isExternal('region')).toBe(true);
		expect(filters.isStaticExternal('region')).toBe(true);
	});

	it('runtime call seeds value when colliding with an unseeded static pre-reg', () => {
		const filters = makeFilters();

		filters.createExternal('region', undefined, 'region_code', { static: true });
		expect(filters.get('region')?.value).toBeUndefined();

		// Runtime call from author code mounts after static pre-reg (typical
		// page-mount → block-mount order). We let it seed the initial value
		// so the chart picks up the author-intended default.
		filters.createExternal('region', 'EU', 'region_code');

		expect(filters.get('region')?.value).toBe('EU');
		// Still classified as a static external (the AST owns its lifecycle).
		expect(filters.isStaticExternal('region')).toBe(true);
	});

	it('runtime call does NOT overwrite an already-seeded static pre-reg', () => {
		const filters = makeFilters();

		filters.createExternal('region', undefined, 'region_code', { static: true });
		// Simulate URL state restoring a value before the block boots.
		(filters.get('region') as { value: unknown }).value = 'AS';

		filters.createExternal('region', 'EU', 'region_code');

		// URL value wins; runtime collision defers as it always has.
		expect(filters.get('region')?.value).toBe('AS');
	});

	it('two static pre-regs of the same id are idempotent (second is a no-op)', () => {
		const filters = makeFilters();

		const first = filters.createExternal('region', undefined, 'region_code', { static: true });
		const second = filters.createExternal('region', undefined, 'region_code', { static: true });

		expect(second).toBe(first);
		expect(filters.isStaticExternal('region')).toBe(true);
	});

	it('remove() clears both external and static-external flags', () => {
		const filters = makeFilters();
		filters.createExternal('region', undefined, 'region_code', { static: true });

		filters.remove('region');

		expect(filters.isExternal('region')).toBe(false);
		expect(filters.isStaticExternal('region')).toBe(false);
		expect(filters.get('region')).toBeUndefined();
	});

	it('a static pre-reg with a column emits the same SQL predicate as a runtime-created one', () => {
		const filters = makeFilters();

		filters.createExternal('region', undefined, 'region_code', { static: true });
		(filters.get('region') as { value: unknown }).value = 'EU';

		expect(filters.get('region')?.sql).toBe("region_code='EU'");
	});
});

describe('Filters.toSerialized', () => {
	it('excludes external filters (they re-create on mount; value persists via URL)', () => {
		const filters = makeFilters();
		filters.create(
			{
				id: 'flag',
				userComponentName: 'toggle',
				attributes: { invert: false, initial_value: false }
			},
			ToggleFilter as unknown as FilterClass<'toggle', Record<string, unknown>>
		);
		filters.createExternal('region', 'EU');

		const serialized = filters.toSerialized();

		expect(Object.keys(serialized)).toEqual(['flag']);
		expect(serialized.region).toBeUndefined();
	});
});

// Every filter interpolating a query param into SQL must escape it for the warehouse in use:
// on a backslash-honouring one the trailing `\` below would close the literal early.
describe('URL-supplied filter values cannot break out of a string literal', () => {
	const PAYLOAD = String.raw`x\' UNION ALL SELECT 1 --`;
	const CLICKHOUSE = String.raw`x\\\' UNION ALL SELECT 1 --`;
	const ANSI = String.raw`x\'' UNION ALL SELECT 1 --`;

	function depsWith(dialect: SqlDialect, param = PAYLOAD) {
		return {
			url: new URL(`https://example.com/p?f=${encodeURIComponent(param)}`),
			updateUrl: undefined,
			projectSettings: undefined,
			dialect
		};
	}

	function build<T extends Filter>(
		FilterCtor: new (init: never, deps: FilterDeps) => T,
		userComponentName: string,
		attributes: Record<string, unknown>,
		dialect: SqlDialect,
		param = PAYLOAD
	): T {
		return new FilterCtor(
			{ id: 'f', userComponentName, attributes } as never,
			depsWith(dialect, param)
		);
	}

	it('escapes per dialect in DropdownFilter (single and multiple)', () => {
		const attrs = { value_column: 'category' };

		const ch = build(DropdownFilter, 'dropdown', attrs, new ClickHouseDialect());
		expect(ch.sql).toBe(`category='${CLICKHOUSE}'`);
		expect(ch.templateValues.selected).toBe(`'${CLICKHOUSE}'`);
		expect(ch.templateValues.filter).toBe(`category='${CLICKHOUSE}'`);

		const pg = build(DropdownFilter, 'dropdown', attrs, new PostgresDialect());
		expect(pg.sql).toBe(`category='${ANSI}'`);

		const multi = build(
			DropdownFilter,
			'dropdown',
			{ ...attrs, multiple: true },
			new ClickHouseDialect(),
			JSON.stringify([PAYLOAD])
		);
		expect(multi.sql).toBe(`category IN ('${CLICKHOUSE}')`);
		expect(multi.templateValues.selected).toBe(`('${CLICKHOUSE}')`);
	});

	it('escapes per dialect in ButtonGroupFilter', () => {
		const ch = build(ButtonGroupFilter, 'button_group', { value_column: 'c' }, new ClickHouseDialect());
		expect(ch.sql).toBe(`c='${CLICKHOUSE}'`);
		expect(ch.templateValues.selected).toBe(`'${CLICKHOUSE}'`);

		const pg = build(ButtonGroupFilter, 'button_group', { value_column: 'c' }, new PostgresDialect());
		expect(pg.sql).toBe(`c='${ANSI}'`);
	});

	it('escapes per dialect in InputTabsFilter', () => {
		const ch = build(InputTabsFilter, 'input_tabs', { value_column: 'c' }, new ClickHouseDialect());
		expect(ch.sql).toBe(`c='${CLICKHOUSE}'`);
		expect(ch.templateValues.filter).toBe(`c='${CLICKHOUSE}'`);
	});

	it('escapes per dialect in TextInputFilter (value is dropped straight into user SQL)', () => {
		expect(build(TextInputFilter, 'text_input', {}, new ClickHouseDialect()).templateValues.value).toBe(
			CLICKHOUSE
		);
		expect(build(TextInputFilter, 'text_input', {}, new PostgresDialect()).templateValues.value).toBe(
			ANSI
		);
	});

	it('escapes per dialect in ExternalFilter (single and array)', () => {
		const filters = new Filters(depsWith(new ClickHouseDialect()));
		const single = filters.createExternal('f', undefined, 'c');
		expect(single.sql).toBe(`c='${CLICKHOUSE}'`);

		const arrayFilters = new Filters(depsWith(new ClickHouseDialect(), JSON.stringify([PAYLOAD])));
		const many = arrayFilters.createExternal('f', undefined, 'c');
		expect(many.sql).toBe(`c IN ('${CLICKHOUSE}')`);
		expect(many.templateValues.filter).toBe(`c IN ('${CLICKHOUSE}')`);
	});

	it('follows a dialect that changes after the filter is built', () => {
		// The warehouse mode can settle after the filter tree exists; a snapshot taken at
		// construction would keep escaping for whichever dialect happened to be current then.
		let dialect: SqlDialect = new PostgresDialect();
		const filter = new DropdownFilter(
			{
				id: 'f',
				userComponentName: 'dropdown',
				attributes: { value_column: 'category' }
			} as never,
			{ ...depsWith(new PostgresDialect()), dialect: () => dialect }
		);

		expect(filter.sql).toBe(`category='${ANSI}'`);
		dialect = new ClickHouseDialect();
		expect(filter.sql).toBe(`category='${CLICKHOUSE}'`);
	});

	it('escapes per dialect in RepeatFilter (value comes from warehouse rows)', () => {
		const ch = build(RepeatFilter, 'repeat', { column: 'c', value: PAYLOAD }, new ClickHouseDialect());
		expect(ch.sql).toBe(`c='${CLICKHOUSE}'`);
		expect(ch.templateValues.filter).toBe(`c='${CLICKHOUSE}'`);
	});

	// These two expose `literal` unquoted, so escaping cannot protect them — the value has
	// to be one the selector could actually have produced or it is dropped outright.
	it('drops a date grain the selector could never have produced', () => {
		const hostile = build(
			DateGrainSelectorFilter,
			'date_grain_selector',
			{},
			new ClickHouseDialect(),
			String.raw`month') OR 1=1 --`
		);
		expect(hostile.value).toBeUndefined();
		expect(hostile.templateValues.selected).toBe('');
		expect(hostile.templateValues.literal).toBe('');

		const ok = build(DateGrainSelectorFilter, 'date_grain_selector', {}, new ClickHouseDialect(), 'month');
		expect(ok.templateValues.selected).toBe("'month'");
		expect(ok.templateValues.literal).toBe('month');
	});

	// `preset_values` narrows what the UI offers, it never widens what SQL will accept —
	// it supports variables, so another filter's URL value could otherwise reach it.
	it('does not let preset_values widen the accepted grains', () => {
		const attrs = { preset_values: ['fiscal_quarter', "x' OR 1=1 --"] };
		for (const param of ['fiscal_quarter', "x' OR 1=1 --"]) {
			const filter = build(
				DateGrainSelectorFilter,
				'date_grain_selector',
				attrs,
				new ClickHouseDialect(),
				param
			);
			expect(filter.templateValues.literal).toBe('');
			expect(filter.templateValues.selected).toBe('');
		}
	});

	it('drops a comparison the selector could never have produced', () => {
		const hostile = build(
			ComparisonSelectorFilter,
			'comparison_selector',
			{},
			new ClickHouseDialect(),
			String.raw`prior year') OR 1=1 --`
		);
		expect(hostile.templateValues.selected).toBe('');
		expect(hostile.templateValues.literal).toBe('');

		const ok = build(
			ComparisonSelectorFilter,
			'comparison_selector',
			{},
			new ClickHouseDialect(),
			'prior year'
		);
		expect(ok.templateValues.selected).toBe("'prior year'");
		expect(ok.templateValues.literal).toBe('prior year');
	});

	it('resolves a custom comparison once its option registers, and escapes the name', () => {
		// Child tags declare the options, so they arrive after the URL is read — the raw value
		// is held rather than discarded so a shared link still works once they register.
		const filter = build(
			ComparisonSelectorFilter,
			'comparison_selector',
			{},
			new ClickHouseDialect(),
			"Plan O'Brien"
		);
		expect(filter.templateValues.selected).toBe('');

		filter.attributes._customOptions = [
			{ compare_vs: 'target', name: "Plan O'Brien", target: 100 }
		] as never;
		expect(filter.templateValues.selected).toBe(String.raw`'Plan O\'Brien'`);
		expect(filter.templateValues.literal).toBe("Plan O'Brien");
	});
});

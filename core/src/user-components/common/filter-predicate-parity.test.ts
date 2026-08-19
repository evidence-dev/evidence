// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { dialectFor, type SqlDialect, type WarehouseType } from '../../sql-dialect';
import { DropdownFilter } from '../tags/dropdown/DropdownFilter.svelte';
import { ButtonGroupFilter } from '../tags/button_group/ButtonGroupFilter.svelte';
import { InputTabsFilter } from '../tags/input_tabs/InputTabsFilter.svelte';
import { RepeatFilter } from '../tags/repeat/RepeatFilter.svelte';
import { SliderFilter } from '../tags/slider/SliderFilter.svelte';
import { DimensionGridFilter } from '../tags/dimension_grid/DimensionGridFilter.svelte';
import { TableFilterFilter } from '../tags/table_filter/TableFilterFilter.svelte';
import { RangeCalendarFilter } from '../tags/range_calendar/RangeCalendarFilter.svelte';
import { ExternalFilter } from '../../ExternalFilter.svelte';

/**
 * Pre-refactor→post-refactor parity net for the "render predicates in the consumer's
 * dialect" change (#1911). It reads only `filter.sql` — the API present on both `main`
 * and the branch — for every predicate-producing filter across all eight dialects, with
 * values that exercise escaping (`O'Brien`) and non-simple identifiers. Recorded against
 * `main`, then verified on the branch: since the consumer passes the filter's own
 * dialect, a moved snapshot means the refactor changed generated SQL.
 */

const WAREHOUSES: WarehouseType[] = [
	'clickhouse',
	'snowflake',
	'bigquery',
	'fabric',
	'databricks',
	'postgres',
	'cube',
	'motherduck'
];

function deps(dialect: SqlDialect) {
	return {
		url: undefined,
		updateUrl: undefined,
		projectSettings: undefined,
		dialect: () => dialect
	};
}

describe.each(WAREHOUSES)('filter predicate parity — %s', (warehouse) => {
	const dialect = dialectFor(warehouse);

	it('dropdown (scalar and list)', () => {
		const scalar = new DropdownFilter(
			{ id: 'd', userComponentName: 'dropdown', attributes: { value_column: 'category' } } as never,
			deps(dialect)
		);
		scalar.setDefault("O'Brien");
		const list = new DropdownFilter(
			{
				id: 'd',
				userComponentName: 'dropdown',
				attributes: { value_column: 'category', multiple: true }
			} as never,
			deps(dialect)
		);
		list.setDefault(['A', "O'Brien"]);
		expect({ scalar: scalar.sql, list: list.sql }).toMatchSnapshot();
	});

	it('button_group (scalar and list)', () => {
		const scalar = new ButtonGroupFilter(
			{
				id: 'b',
				userComponentName: 'button_group',
				attributes: { value_column: 'region' }
			} as never,
			deps(dialect)
		);
		scalar.setDefault("O'Brien");
		const list = new ButtonGroupFilter(
			{
				id: 'b',
				userComponentName: 'button_group',
				attributes: { value_column: 'region', multiple: true }
			} as never,
			deps(dialect)
		);
		list.setDefault(['A', "O'Brien"]);
		expect({ scalar: scalar.sql, list: list.sql }).toMatchSnapshot();
	});

	it('input_tabs (scalar)', () => {
		const filter = new InputTabsFilter(
			{ id: 't', userComponentName: 'input_tabs', attributes: { value_column: 'status' } } as never,
			deps(dialect)
		);
		filter.setDefault("O'Brien");
		expect(filter.sql).toMatchSnapshot();
	});

	it('external (scalar and list)', () => {
		const scalar = new ExternalFilter(
			{
				id: 'x',
				userComponentName: 'html',
				attributes: { initial_value: "O'Brien", column: 'category' }
			},
			deps(dialect)
		);
		const list = new ExternalFilter(
			{
				id: 'x',
				userComponentName: 'html',
				attributes: { initial_value: ['A', "O'Brien"], column: 'category' }
			},
			deps(dialect)
		);
		expect({ scalar: scalar.sql, list: list.sql }).toMatchSnapshot();
	});

	it('repeat (scalar)', () => {
		const filter = new RepeatFilter(
			{
				id: 'r',
				userComponentName: 'repeat',
				attributes: { value: "O'Brien", column: 'category' }
			} as never,
			deps(dialect)
		);
		expect(filter.sql).toMatchSnapshot();
	});

	it('slider (range and single)', () => {
		const range = new SliderFilter(
			{
				id: 's',
				userComponentName: 'slider',
				attributes: { value_column: 'amount', range: true }
			} as never,
			deps(dialect)
		);
		range.setDefault([10, 20]);
		const single = new SliderFilter(
			{ id: 's', userComponentName: 'slider', attributes: { value_column: 'amount' } } as never,
			deps(dialect)
		);
		single.setDefault(5);
		expect({ range: range.sql, single: single.sql }).toMatchSnapshot();
	});

	it('dimension_grid (scalar, list, quoted identifier)', () => {
		const filter = new DimensionGridFilter(
			{ id: 'g', userComponentName: 'dimension_grid', attributes: {} } as never,
			deps(dialect)
		);
		filter.setDefault({ category: ['A', "O'Brien"], region: 'West', 'order date': 'x' });
		expect(filter.sql).toMatchSnapshot();
	});

	it('table_filter (multi-column compound state)', () => {
		const filter = new TableFilterFilter(
			{
				id: 'tf',
				userComponentName: 'table_filter',
				attributes: { initial_values: { status: ['active', 'pending'], name: "O'Brien" } }
			} as never,
			deps(dialect)
		);
		expect(filter.sql).toMatchSnapshot();
	});

	it('range_calendar (closed range)', () => {
		const filter = new RangeCalendarFilter(
			{
				id: 'rc',
				userComponentName: 'range_calendar',
				attributes: { value_column: 'event_date' }
			} as never,
			deps(dialect)
		);
		filter.setDefault({ range: '2020-01-01 to 2020-01-31' } as never);
		expect(filter.sql).toMatchSnapshot();
	});
});

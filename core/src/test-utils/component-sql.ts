/**
 * Fixtures for component `sql.ts` golden tests: a real page context (Filters,
 * InlineQueries, VariableProcessor, MetricsCatalog) and a renderer that turns
 * `queries()` output into the SQL Query would send. No mocks.
 */
import { Filters } from '../Filters.svelte';
import type { FilterClass, FilterDeps } from '../Filter.svelte';
import { InlineQueries } from '../user-components/common/inline-queries';
import { VariableProcessor } from '../filter-variables/VariableProcessor';
import { DEFAULT_PROJECT_SETTINGS } from '../user-components/interfaces/project-settings';
import { generateSQLQuery } from '../user-components/common/sql-options';
import { MetricsCatalog } from '../metrics/metrics-catalog';
import { ClickHouseDialect, type SqlDialect } from '../sql-dialect';
import {
	componentSqlEnv,
	type CatalogColumn,
	type ComponentQuery,
	type ComponentSqlEnv
} from '../user-components/component-sql';
import { DropdownFilter } from '../user-components/tags/dropdown/DropdownFilter.svelte';
import { TextInputFilter } from '../user-components/tags/text_input/TextInputFilter.svelte';
import { ComparisonSelectorFilter } from '../user-components/tags/comparison_selector/ComparisonSelectorFilter.svelte';
import { DateGrainSelectorFilter } from '../user-components/tags/date_grain_selector/DateGrainSelectorFilter.svelte';

/** The anchor every golden test resolves relative date ranges against. */
export const ANCHOR_DATE = new Date('2026-06-30T00:00:00');

export const SALES_METRICS = `
base: csql.sales
date: order_date
default_date_grain: month
dimensions:
  region: region
  product_line: category
metrics:
  revenue:
    sql: sum(amount)
    fmt: usd
    label: Revenue
  order_count:
    sql: count(*)
  web_revenue:
    sql: sum(amount)
    filter: channel = 'Web'
  margin:
    sql: "{revenue} - sum(cost)"
`;

export type SqlFixtureOptions = {
	dialect?: SqlDialect;
	/**
	 * Dropdown id → selected value(s) (`undefined` = no selection), optionally with
	 * the `value_column` that makes it usable in `filters=[…]`.
	 */
	dropdowns?: Record<
		string,
		string | string[] | undefined | { value: string | string[] | undefined; column: string }
	>;
	textInputs?: Record<string, string | undefined>;
	comparisonSelectors?: Record<string, string>;
	dateGrainSelectors?: Record<string, string>;
	/** Inline ```sql fences by name. */
	inlineQueries?: Record<string, string>;
	/** metrics/*.yaml contents by file name; defaults to SALES_METRICS. */
	metrics?: Record<string, string>;
	/**
	 * Build the processor the way UserComponentModel does (dialect + QEv3 flag)
	 * rather than the way script components do (neither).
	 */
	modelProcessor?: boolean;
	/** No page context at all: resolvers pass values through untouched. */
	noProcessor?: boolean;
	/** Week start for configs built with week grains (table, combo charts). Default monday. */
	firstDayOfWeek?: 'sunday' | 'monday';
	/** Catalog columns by table name, for components that detect columns. */
	tableColumns?: Record<string, readonly CatalogColumn[]>;
	/** Run as the Evidence Query Engine (QEv3) would: unknown placeholders pass through. */
	queryEngineV3?: boolean;
};

export type SqlFixture = {
	env: ComponentSqlEnv;
	filters: Filters;
	inlineQueries: InlineQueries;
	/** The SQL each query would send, labelled by role. */
	render: (queries: readonly ComponentQuery[]) => string;
};

export function sqlFixture(options: SqlFixtureOptions = {}): SqlFixture {
	const dialect = options.dialect ?? new ClickHouseDialect();
	const deps: FilterDeps = {
		url: undefined,
		updateUrl: undefined,
		projectSettings: undefined,
		dialect,
		language: undefined
	} as FilterDeps;
	const filters = new Filters(deps);

	const create = (id: string, name: string, attributes: Record<string, unknown>, Class: unknown) =>
		filters.create(
			{ id, userComponentName: name, attributes },
			Class as FilterClass<string, Record<string, unknown>>
		);
	for (const [id, entry] of Object.entries(options.dropdowns ?? {})) {
		const { value, column } =
			entry !== null && typeof entry === 'object' && !Array.isArray(entry)
				? entry
				: { value: entry, column: undefined };
		create(
			id,
			'dropdown',
			{ initial_value: value, multiple: Array.isArray(value), value_column: column },
			DropdownFilter
		);
	}
	for (const [id, value] of Object.entries(options.textInputs ?? {})) {
		create(id, 'text_input', { initial_value: value }, TextInputFilter);
	}
	for (const [id, value] of Object.entries(options.comparisonSelectors ?? {})) {
		create(id, 'comparison_selector', { default_value: value }, ComparisonSelectorFilter);
	}
	for (const [id, value] of Object.entries(options.dateGrainSelectors ?? {})) {
		create(id, 'date_grain_selector', { default_value: value }, DateGrainSelectorFilter);
	}

	const inlineQueries = new InlineQueries({ filterContexts: [filters] }, options.inlineQueries);
	// QEv3: the query service flags both the inline queries and Model processors to
	// pass unknown `{{name}}` placeholders through for the engine to bind.
	inlineQueries.setPassThroughUnknown(options.queryEngineV3 === true);
	const processor = options.noProcessor
		? null
		: options.modelProcessor
			? new VariableProcessor(
					[filters],
					inlineQueries,
					undefined,
					dialect,
					options.queryEngineV3 === true
				)
			: new VariableProcessor([filters], inlineQueries);

	const env: ComponentSqlEnv = componentSqlEnv({
		variableProcessor: processor,
		dialect,
		metricsCatalog: new MetricsCatalog(options.metrics ?? { 'sales.yaml': SALES_METRICS }),
		projectSettings: {
			...DEFAULT_PROJECT_SETTINGS,
			first_day_of_week: options.firstDayOfWeek ?? 'monday'
		},
		filterContexts: [filters],
		inlineQueries,
		tableColumns: (table) => options.tableColumns?.[table],
		anchorDate: ANCHOR_DATE
	});
	// Relative ranges anchored to the clock resolve against the same fixed day.
	env.now = () => new Date(ANCHOR_DATE);

	const render = (queries: readonly ComponentQuery[]) =>
		queries
			.map(({ role, config }) => {
				if (typeof config === 'string') return `-- ${role}\n${config}`;
				const { sql, error } = generateSQLQuery(
					config,
					[filters],
					inlineQueries,
					ANCHOR_DATE,
					env.firstDayOfWeek,
					dialect
				);
				return `-- ${role}\n${error ? `ERROR: ${error}` : sql}`;
			})
			.join('\n\n');

	return { env, filters, inlineQueries, render };
}

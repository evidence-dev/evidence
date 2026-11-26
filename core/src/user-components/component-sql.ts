import isEqual from 'lodash/isEqual';
import { createResolvers, type Resolvers } from './common/use-variable-processing';
import type { VariableProcessor } from '../filter-variables/VariableProcessor';
import { DEFAULT_PROJECT_SETTINGS, type ProjectSettings } from './interfaces/project-settings';
import { parseDateStringAsLocalMidnight } from '../utils/date-utils';
import type { SQLQueryConfig } from './common/sql-options';
import type { SqlDialect } from '../sql-dialect';
import type { MetricsCatalog } from '../metrics/metrics-catalog';
import type { Filters } from '../Filters.svelte';
import type { InlineQueries } from './common/inline-queries';

/** Everything outside the component's own props and state that its SQL may depend on. */
export type ComponentSqlEnv = {
	/** createResolvers(variableProcessor): how variables and inputs enter attribute values. */
	resolvers: Resolvers;
	dialect: SqlDialect;
	metricsCatalog: MetricsCatalog | undefined;
	/** Project `first_day_of_week`, for the week grains some builders apply themselves. */
	firstDayOfWeek: 'sunday' | 'monday';
	/** Project date-range anchor, for the relative ranges some builders resolve themselves. */
	anchorDate: Date;
	/** The clock, for the components that anchor relative ranges to today instead. */
	now: () => Date;
	/**
	 * Page state a few components read directly rather than through `resolvers` or
	 * generateSQLQuery: filter predicates they render into their own SQL, inline
	 * queries they interpolate themselves, and catalog columns they detect from.
	 */
	filterContexts: (Filters | undefined)[];
	inlineQueries: InlineQueries | undefined;
	tableColumns: (table: string) => readonly CatalogColumn[] | undefined;
};

export type CatalogColumn = { name: string; jsType: string };

export type ComponentSqlEnvInput = {
	variableProcessor: VariableProcessor | null | undefined;
	dialect: SqlDialect;
	metricsCatalog: MetricsCatalog | undefined;
	projectSettings: (ProjectSettings & { computedDefaultDateRangeEnd?: string }) | undefined;
	filterContexts: (Filters | undefined)[];
	inlineQueries: InlineQueries | undefined;
	/** Only components that detect columns from the catalog need it. */
	tableColumns?: ComponentSqlEnv['tableColumns'];
	/** Defaults to the project anchor (its computed range end, else today). */
	anchorDate?: Date;
};

/** The env a rendered component's SQL sees: the one builder every runtime call site uses. */
export function componentSqlEnv(input: ComponentSqlEnvInput): ComponentSqlEnv {
	const now = () => new Date();
	return {
		resolvers: createResolvers(input.variableProcessor),
		dialect: input.dialect,
		metricsCatalog: input.metricsCatalog,
		firstDayOfWeek:
			input.projectSettings?.first_day_of_week ?? DEFAULT_PROJECT_SETTINGS.first_day_of_week,
		anchorDate: input.anchorDate ?? projectAnchorDate(input.projectSettings, now),
		now,
		filterContexts: input.filterContexts,
		inlineQueries: input.inlineQueries,
		tableColumns: input.tableColumns ?? (() => undefined)
	};
}

/** The project's computed default range end, else today: the anchor Query also falls back to. */
export function projectAnchorDate(
	projectSettings: { computedDefaultDateRangeEnd?: string } | undefined,
	now: () => Date
): Date {
	return projectSettings?.computedDefaultDateRangeEnd
		? parseDateStringAsLocalMidnight(projectSettings.computedDefaultDateRangeEnd)
		: now();
}

export type ComponentQuery<Config extends SQLQueryConfig | string = SQLQueryConfig | string> = {
	/** Stable per component: 'data', 'options', 'selected', 'reference', … */
	role: string;
	/** What `new Query(() => …)` receives today (a config, or a raw SQL string). */
	config: Config;
};

/**
 * Every query the component would issue, given its props, env and interactive state.
 * Pure: no runes or contexts; the clock, catalog and page state arrive only through
 * `env`. The one side effect is diagnostic logging (histogram and table warn when an
 * inline query fails to interpolate). [] when nothing would run.
 */
export type ComponentSql<
	Props,
	State = undefined,
	Config extends SQLQueryConfig | string = SQLQueryConfig | string
> = {
	queries: (props: Props, env: ComponentSqlEnv, state: State) => ComponentQuery<Config>[];
	/** The state a freshly rendered component starts in (e.g. dropdown selection). */
	initialState?: (props: Props) => State;
};

/**
 * Returns a function that hands back its previous result while `queries()` output is
 * structurally unchanged. Wrap the `$derived` that calls `queries()` in it: that call
 * reads every input signal directly, so without this Query would get a new config
 * (and restart its debounce) whenever any input re-resolved, even to the same value.
 * Each config keeps its previous object while it is unchanged, even if its role moved
 * (a series removed ahead of it), so one Query isn't re-triggered by a sibling's change.
 */
export function stableQueries<Config extends SQLQueryConfig | string = SQLQueryConfig | string>(): (
	next: ComponentQuery<Config>[]
) => ComponentQuery<Config>[] {
	let previous: ComponentQuery<Config>[] = [];
	return (next) => {
		const kept = next.map((query) => {
			const before =
				previous.find((p) => p.role === query.role && isEqual(p.config, query.config)) ??
				previous.find((p) => isEqual(p.config, query.config));
			return before === undefined ? query : { role: query.role, config: before.config };
		});
		if (
			kept.length === previous.length &&
			kept.every((q, i) => q.role === previous[i].role && q.config === previous[i].config)
		) {
			return previous;
		}
		previous = kept;
		return kept;
	};
}

/** The config of the query with `role`, or undefined when no such query would run. */
export function queryConfigForRole<Config extends SQLQueryConfig | string>(
	queries: readonly ComponentQuery<Config>[],
	role: string
): Config | undefined {
	return queries.find((query) => query.role === role)?.config;
}

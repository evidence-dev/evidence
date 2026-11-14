import { extract } from 'runed';
import { Filter, type FilterDeps, type FilterInit } from '../../../Filter.svelte';
import type { SqlDialect } from '../../../sql-dialect';
import type { UserComponentProps } from '../../types';
import type { schema } from './schema';
import { processDateRange } from '../../common/date-options';
import { resolveCustomRangeDefault, type CustomRangeRule } from '../../common/custom-ranges';
import { DEFAULT_PROJECT_SETTINGS } from '../../interfaces/project-settings';
import { parseDateStringAsLocalMidnight } from '../../../utils/date-utils';

type RangeCalendarAttributes = UserComponentProps<typeof schema>;

export type RangeCalendarValue = {
	range?: string; // single source of truth for URL/state
};

export class RangeCalendarFilter extends Filter<RangeCalendarValue> {
	// Override defaults: .between for SQL queries, .range for display text and column expressions
	static override defaultProperty = { sql: 'between', text: 'range', column: 'range' };

	attributes: Omit<UserComponentProps<typeof schema>, 'id'>;

	private get anchorDate() {
		// Use computed default date range end from project settings
		return this.projectSettings.computedDefaultDateRangeEnd
			? parseDateStringAsLocalMidnight(this.projectSettings.computedDefaultDateRangeEnd)
			: new Date();
	}

	private processRange(range: string | undefined) {
		return processDateRange(
			range,
			this.attributes.value_column,
			this.anchorDate,
			this.projectSettings.first_day_of_week,
			this.dialect
		);
	}

	/**
	 * The range string to process, applying `all_time_range` for the "all time" state (default, explicit
	 * pick, or cleared filter). Returns undefined only for all-time with all_time_range "unbounded"/"none" —
	 * those don't map to a bounded range and are special-cased by the callers (IS NOT NULL / empty).
	 */
	private effectiveRange(): string | undefined {
		const range = this.value && typeof this.value === 'object' ? this.value.range : undefined;
		if (range && range !== 'all time') return range;

		const allTime = this.attributes.all_time_range;
		if (!allTime || allTime === 'unbounded' || allTime === 'none') return undefined;

		// Bounded all_time_range: a preset key, a raw range expression, or a custom_ranges label (resolved
		// here to its underlying period key, mirroring how default_range is resolved in the constructor).
		return resolveCustomRangeDefault(
			allTime,
			this.attributes.custom_ranges as CustomRangeRule[] | undefined,
			this.anchorDate,
			this.projectSettings.first_day_of_week
		);
	}

	predicateSql(dialect?: SqlDialect): string | undefined {
		// Usable in a `filters=[...]` list only when a value_column is configured; otherwise the column
		// lives in the user's own template (`where="date {{id.between}}"`) and we can't build a predicate.
		const column = this.attributes.value_column;
		if (!column) return undefined;
		const range = this.effectiveRange();
		// All-time "unbounded"/"none" contributes no predicate (keeps NULL rows), consistent with .filter='true'.
		if (range === undefined) return undefined;
		// Date math (anchor + week start) is dialect-independent; only the date-literal syntax uses the dialect.
		return (
			processDateRange(
				range,
				column,
				this.anchorDate,
				this.projectSettings.first_day_of_week,
				dialect
			).whereClause || undefined
		);
	}

	// A single-click selection from the calendar UI sets "from X" (open-ended) while the user
	// is still choosing the end date, and an explicit open-ended range ("from X" / "until Y")
	// leaves one boundary undefined. Fall back to the corresponding boundary from `all_time_range`
	// when configured, or to today for the end of a "from X" selection, so raw SQL templates
	// referencing both `.start` and `.end` (`BETWEEN {{id.start}} AND {{id.end}}`) remain valid
	// SQL on the first click instead of emitting an empty token.
	private fallbackBounds() {
		const allTime = this.attributes.all_time_range;
		if (!allTime || allTime === 'unbounded' || allTime === 'none') {
			return this.processRange('today');
		}
		const resolved = resolveCustomRangeDefault(
			allTime,
			this.attributes.custom_ranges as CustomRangeRule[] | undefined,
			this.anchorDate,
			this.projectSettings.first_day_of_week
		);
		return resolved ? this.processRange(resolved) : this.processRange('today');
	}

	get templateValues() {
		const range = this.effectiveRange();

		// "All time" with no bounded target: `.between` is a fragment appended after a column (`date {{...}}`),
		// so it emits `IS NOT NULL` — the widest predicate valid in that position — so `where="date {{id.between}}"`
		// matches all rows instead of breaking. That excludes NULL-date rows; all_time_range="none" restores the
		// legacy empty string for `[[ ]]` / `| fallback`. `.start`/`.end` stay empty so non-WHERE uses (date
		// spines, axes, dateDiff) fail loudly. `.filter` / filters=[] stay a true no-op that KEEPS NULL rows —
		// a self-contained form can express `true`; the `.between` fragment can't (intentional difference).
		if (range === undefined) {
			return {
				start: '',
				end: '',
				between: this.attributes.all_time_range === 'none' ? '' : 'IS NOT NULL',
				range: 'all time',
				filter: 'true'
			};
		}

		// A real selection OR a bounded all_time_range — both resolve to concrete dates everywhere.
		const processed = this.processRange(range);
		const isExplicitAllTime = !this.value?.range || this.value.range === 'all time';
		let start = processed.startDateSql || '';
		let end = processed.endDateSql || '';
		if (!isExplicitAllTime && (!start || !end)) {
			const fb = this.fallbackBounds();
			if (!start && fb.startDateSql) start = fb.startDateSql;
			if (!end && fb.endDateSql) end = fb.endDateSql;
		}

		return {
			start,
			end,
			between: processed.betweenFragment,
			range: processed.range,
			filter: processed.whereClause || 'true'
		};
	}

	constructor(init: FilterInit<'range_calendar', RangeCalendarAttributes>, deps: FilterDeps) {
		const rawDefault = init.attributes.default_range ?? init.attributes.defaultRange;

		// A default_range may name a `custom_ranges` entry by its label ("FY2025"); resolve it to that
		// period's absolute key here — the one chokepoint where default_range becomes the filter value — so
		// it works for SSR queries too (the component's client-only effect can't), not just the client.
		const settings = extract(deps.projectSettings, DEFAULT_PROJECT_SETTINGS);
		const anchorDate = settings.computedDefaultDateRangeEnd
			? parseDateStringAsLocalMidnight(settings.computedDefaultDateRangeEnd)
			: new Date();
		const defaultAttr = resolveCustomRangeDefault(
			typeof rawDefault === 'string' ? rawDefault : undefined,
			init.attributes.custom_ranges as CustomRangeRule[] | undefined,
			anchorDate,
			settings.first_day_of_week
		);

		const initialValue: RangeCalendarValue | undefined =
			typeof defaultAttr === 'string' && defaultAttr.length ? { range: defaultAttr } : undefined;

		super(
			init.id,
			init.userComponentName,
			{
				// Query-only (can't be listed in a `filters=[...]` array) UNLESS a value_column is set — that's
				// exactly when `get sql()` can build a predicate. Without it the column lives in the user's own
				// template, so the calendar is only referenceable via `{{id.between}}` etc. Keeps the authoring
				// validator (filterExists) and editor autocomplete in sync with the runtime capability.
				queryOnly: !init.attributes.value_column,
				initialValue,
				// Persist only the range string in the URL param
				serialize: (value) => {
					if (!value?.range || value.range === 'all time') return undefined;
					return value.range;
				},
				deserialize: (raw) => ({ range: raw })
			},
			deps
		);

		this.attributes = $state(init.attributes);
	}
}

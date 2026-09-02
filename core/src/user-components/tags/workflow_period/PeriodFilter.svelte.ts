import { Filter, type FilterDeps, type FilterInit } from '../../../Filter.svelte';
import type { SqlDialect } from '../../../sql-dialect';
import type { UserComponentProps } from '../../types';
import type { schema } from './schema';
import { processDateRange } from '../../common/date-options';
import {
	buildReportingPeriods,
	isPeriodGrain,
	parsePeriodKey,
	periodBoundaryLabel,
	periodToRangeExpression,
	previousPeriod,
	nextPeriod,
	DEFAULT_PERIOD_COUNT,
	DEFAULT_PERIOD_GRAIN,
	type PeriodGrain,
	type ReportingPeriod
} from '../../common/reporting-periods';
import { parseDateStringAsLocalMidnight } from '../../../utils/date-utils';

type PeriodAttributes = UserComponentProps<typeof schema>;

export type PeriodValue = {
	/** The selected period's key, e.g. `2026-07`. Single source of truth for URL state. */
	key?: string;
};

export class PeriodFilter extends Filter<PeriodValue> {
	// Reads as a label in prose ("Jul 2026 Review"), as a date range in SQL.
	static override defaultProperty = { sql: 'between', text: 'label', column: 'label' };

	attributes: Omit<PeriodAttributes, 'id'>;

	get grain(): PeriodGrain {
		const grain = this.attributes.grain;
		return isPeriodGrain(grain) ? grain : DEFAULT_PERIOD_GRAIN;
	}

	private get anchorDate(): Date {
		return this.projectSettings.computedDefaultDateRangeEnd
			? parseDateStringAsLocalMidnight(this.projectSettings.computedDefaultDateRangeEnd)
			: new Date();
	}

	private get firstDayOfWeek() {
		return this.projectSettings.first_day_of_week === 'monday' ? 'monday' : 'sunday';
	}

	/** The periods offered by the picker, newest first. */
	get periods(): ReportingPeriod[] {
		return buildReportingPeriods({
			grain: this.grain,
			count: this.attributes.periods ?? DEFAULT_PERIOD_COUNT,
			anchorDate: this.anchorDate,
			firstDayOfWeek: this.firstDayOfWeek
		});
	}

	/**
	 * The selected period. An unparseable key falls back to the newest complete
	 * period rather than rendering an empty range.
	 */
	get period(): ReportingPeriod {
		const fromKey = parsePeriodKey(this.value?.key, this.grain, this.firstDayOfWeek);
		return fromKey ?? this.periods[0];
	}

	/**
	 * One period older, or undefined at the oldest on offer. Stepped rather than
	 * indexed so a selection from outside the window still moves sanely.
	 */
	get olderPeriod(): ReportingPeriod | undefined {
		const offered = this.periods;
		const candidate = previousPeriod(this.period, this.grain, this.firstDayOfWeek);
		return candidate.start < offered[offered.length - 1].start ? undefined : candidate;
	}

	/** The next period newer than the selection, or undefined at the newest complete one. */
	get newerPeriod(): ReportingPeriod | undefined {
		const candidate = nextPeriod(this.period, this.grain, this.firstDayOfWeek);
		return candidate.start > this.periods[0].start ? undefined : candidate;
	}

	private processPeriod(dialect?: SqlDialect) {
		return processDateRange(
			periodToRangeExpression(this.period),
			this.attributes.value_column,
			this.anchorDate,
			this.firstDayOfWeek,
			dialect
		);
	}

	predicateSql(dialect?: SqlDialect): string | undefined {
		// Without value_column the column lives in the author's own template.
		if (!this.attributes.value_column) return undefined;
		return this.processPeriod(dialect).whereClause || undefined;
	}

	get templateValues() {
		const period = this.period;
		const processed = this.processPeriod(this.dialect);

		return {
			start: processed.startDateSql || '',
			end: processed.endDateSql || '',
			// `.start`/`.end` are dialect SQL expressions; these are the pair to
			// write in prose, where `toDate(...)` would leak onto the page.
			start_label: periodBoundaryLabel(period.start),
			end_label: periodBoundaryLabel(period.end),
			between: processed.betweenFragment,
			filter: processed.whereClause || 'true',
			label: period.label,
			key: period.key,
			grain: this.grain
		};
	}

	constructor(init: FilterInit<'workflow_period', PeriodAttributes>, deps: FilterDeps) {
		super(
			init.id,
			init.userComponentName,
			{
				queryOnly: !init.attributes.value_column,
				serialize: (value) => value?.key,
				deserialize: (raw) => (raw ? { key: raw } : undefined)
			},
			deps
		);
		this.attributes = init.attributes;
	}
}

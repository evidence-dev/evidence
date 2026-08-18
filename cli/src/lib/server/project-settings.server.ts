/**
 * Resolve the CLI dev preview's project settings from `evidence.config.yaml`'s
 * `date:` block, mirroring Studio's `dateConfigToProjectSetting` +
 * `computeDefaultDateRangeEnd` so date pickers and calendars default the same
 * way locally as they do in the product.
 */

import type { ParsedProjectDate } from '@evidence/core/config/page-frontmatter-schema';
import type { ProjectSettings } from '@evidence/core/user-components/interfaces/project-settings';
import type { QueryService } from '@evidence/core/user-components/interfaces/query-service';

export type ResolvedProjectSettings = ProjectSettings & { computedDefaultDateRangeEnd?: string };

/** Format a Date as YYYY-MM-DD in local time (matches Studio's formatter). */
function formatDateAsLocal(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * Map the config `date:` block to runtime project settings, translating the
 * YAML `days_ago` to the runtime `daysAgo`. Mirrors Studio's
 * `dateConfigToProjectSetting`.
 */
export function dateConfigToProjectSettings(
	date: ParsedProjectDate | undefined
): Pick<ProjectSettings, 'first_day_of_week' | 'default_date_range_end'> {
	const result: Pick<ProjectSettings, 'first_day_of_week' | 'default_date_range_end'> = {
		first_day_of_week: date?.first_day_of_week ?? 'sunday',
		default_date_range_end: undefined
	};

	const end = date?.default_date_range_end;
	if (!end) return result;

	if (end.type === 'today') {
		result.default_date_range_end = { type: 'today' };
	} else if (end.type === 'relative') {
		result.default_date_range_end = { type: 'relative', daysAgo: end.days_ago };
	} else if (end.type === 'custom_sql') {
		result.default_date_range_end = { type: 'custom_sql', sql: end.sql };
	}

	return result;
}

/**
 * Compute the YYYY-MM-DD date-range anchor. `today`/`relative` resolve in JS;
 * `custom_sql` runs against the active connection. Any failure (or an unparsable
 * result) falls back to today. Mirrors Studio's `computeDefaultDateRangeEnd`.
 */
export async function computeDefaultDateRangeEnd(
	settings: Pick<ProjectSettings, 'default_date_range_end'>,
	queryService: QueryService
): Promise<string> {
	const end = settings.default_date_range_end;

	if (!end || end.type === 'today') {
		return formatDateAsLocal(new Date());
	}

	if (end.type === 'relative') {
		const date = new Date();
		date.setDate(date.getDate() - (end.daysAgo || 0));
		return formatDateAsLocal(date);
	}

	try {
		const result = await queryService.query(end.sql);
		if (result.error) return formatDateAsLocal(new Date());
		const rawValue = Object.values(result.rows[0] ?? {})[0];
		if (!rawValue) return formatDateAsLocal(new Date());

		const dateString = rawValue.toString();
		if (isNaN(new Date(dateString).getTime())) return formatDateAsLocal(new Date());

		// Date portion only — avoids timezone drift when parsed later.
		return dateString.split('T')[0];
	} catch {
		return formatDateAsLocal(new Date());
	}
}

/**
 * Full project-settings resolution for a CLI page: date config → runtime
 * settings + the computed date-range anchor consumed by RangeCalendar.
 */
export async function resolveProjectSettings(
	date: ParsedProjectDate | undefined,
	queryService: QueryService
): Promise<ResolvedProjectSettings> {
	const base = dateConfigToProjectSettings(date);
	return {
		...base,
		computedDefaultDateRangeEnd: await computeDefaultDateRangeEnd(base, queryService)
	};
}

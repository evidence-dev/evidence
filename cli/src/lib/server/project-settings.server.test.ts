import { describe, it, expect } from 'vitest';
import type {
	QueryService,
	QueryResult
} from '@evidence/core/user-components/interfaces/query-service';
import {
	dateConfigToProjectSettings,
	computeDefaultDateRangeEnd
} from '$lib/server/project-settings.server';

function fakeQueryService(impl: (sql: string) => QueryResult): QueryService {
	return {
		dialect: { name: 'clickhouse' },
		query: async (sql: string) => impl(sql)
	} as unknown as QueryService;
}

function ymd(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

describe('dateConfigToProjectSettings', () => {
	it('defaults to sunday and no date-range end when there is no config', () => {
		expect(dateConfigToProjectSettings(undefined)).toEqual({
			first_day_of_week: 'sunday',
			default_date_range_end: undefined
		});
	});

	it('reads first_day_of_week', () => {
		expect(dateConfigToProjectSettings({ first_day_of_week: 'monday' })).toMatchObject({
			first_day_of_week: 'monday'
		});
	});

	it('translates config `days_ago` to runtime `daysAgo`', () => {
		expect(
			dateConfigToProjectSettings({ default_date_range_end: { type: 'relative', days_ago: 7 } })
				.default_date_range_end
		).toEqual({ type: 'relative', daysAgo: 7 });
	});

	it('passes through today and custom_sql', () => {
		expect(
			dateConfigToProjectSettings({ default_date_range_end: { type: 'today' } })
				.default_date_range_end
		).toEqual({ type: 'today' });
		expect(
			dateConfigToProjectSettings({
				default_date_range_end: { type: 'custom_sql', sql: 'select max(d) from t' }
			}).default_date_range_end
		).toEqual({ type: 'custom_sql', sql: 'select max(d) from t' });
	});
});

describe('computeDefaultDateRangeEnd', () => {
	const neverQueried = fakeQueryService(() => {
		throw new Error('should not query for today/relative');
	});

	it('returns today for no config without querying', async () => {
		expect(
			await computeDefaultDateRangeEnd({ default_date_range_end: undefined }, neverQueried)
		).toBe(ymd(new Date()));
	});

	it('computes a relative offset in JS without querying', async () => {
		const expected = new Date();
		expected.setDate(expected.getDate() - 3);
		expect(
			await computeDefaultDateRangeEnd(
				{ default_date_range_end: { type: 'relative', daysAgo: 3 } },
				neverQueried
			)
		).toBe(ymd(expected));
	});

	it('runs custom_sql and returns the date portion', async () => {
		const svc = fakeQueryService(() => ({
			rows: [{ d: '2023-05-01T00:00:00Z' }],
			columns: [],
			error: null
		}));
		expect(
			await computeDefaultDateRangeEnd(
				{ default_date_range_end: { type: 'custom_sql', sql: 'select max(d) from t' } },
				svc
			)
		).toBe('2023-05-01');
	});

	it('falls back to today when custom_sql errors', async () => {
		const svc = fakeQueryService(() => ({ rows: [], columns: [], error: 'boom' }));
		expect(
			await computeDefaultDateRangeEnd(
				{ default_date_range_end: { type: 'custom_sql', sql: 'bad' } },
				svc
			)
		).toBe(ymd(new Date()));
	});

	it('falls back to today when custom_sql returns an unparsable value', async () => {
		const svc = fakeQueryService(() => ({
			rows: [{ d: 'not a date' }],
			columns: [],
			error: null
		}));
		expect(
			await computeDefaultDateRangeEnd(
				{ default_date_range_end: { type: 'custom_sql', sql: 'x' } },
				svc
			)
		).toBe(ymd(new Date()));
	});
});

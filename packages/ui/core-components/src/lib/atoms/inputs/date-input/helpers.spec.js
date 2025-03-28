import { beforeEach, describe, expect, it } from 'vitest';

import { dateValueToDate } from './helpers.js';
import { getLocalTimeZone } from '@internationalized/date';
import { CalendarDate } from '@internationalized/date';

describe.each([
	({ tz: 'America/Edmonton', isotime: '2025-03-28T00:00:00.000Z' },
	{ tz: 'UTC', isotime: '2025-03-28T00:00:00.000Z' },
	{ tz: 'Europe/Berlin', isotime: '2025-03-27T23:00:00.000Z' })
])('dateValueToDate, using timezone $tz', ({ tz, isotime }) => {
	/** @type {import('@internationalized/date').DateValue} */
	let value;
	beforeEach(() => {
		process.env.TZ = tz;
		value = new CalendarDate(2025, 3, 28);
	});
	it('ensure timezone mocking works', () => {
		const actualTz = getLocalTimeZone();
		expect(actualTz).toEqual(tz);
		expect(value.toDate(actualTz)).toEqual(new Date(isotime));
	});
	it('should return same day', () => {
		expect(dateValueToDate(value)).toEqual(new Date('2025-03-28T00:00:00.000Z'));
	});
});

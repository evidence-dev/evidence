import { describe, expect, it } from 'vitest';
import { athenaRowsToObjects, normalizeAthenaDate } from './normalize-rows';
import { mapAthenaColumns } from './map-columns';

describe('normalizeAthenaDate', () => {
	it.each([
		['2024-01-31', '2024-01-31'],
		['2024-01-31 00:00:00.000', '2024-01-31'],
		['2024-01-31 12:34:56.789', '2024-01-31 12:34:56'],
		['2024-01-31 12:34:56', '2024-01-31 12:34:56'],
		['2024-01-31 12:34:56.123456 UTC', '2024-01-31 12:34:56'],
		['2024-01-31 00:00:00.000 America/New_York', '2024-01-31'],
		['not a date', 'not a date']
	])('%s → %s', (input, expected) => {
		expect(normalizeAthenaDate(input)).toBe(expected);
	});
});

describe('athenaRowsToObjects', () => {
	const columns = mapAthenaColumns([
		{ Name: 'id', Type: 'bigint', Nullable: 'NOT_NULL' },
		{ Name: 'amount', Type: 'decimal' },
		{ Name: 'ratio', Type: 'double' },
		{ Name: 'active', Type: 'boolean' },
		{ Name: 'day', Type: 'date' },
		{ Name: 'ts', Type: 'timestamp' },
		{ Name: 'name', Type: 'varchar' },
		{ Name: 'tags', Type: 'array' }
	]);

	it('coerces string cells to each column jsType', () => {
		const rows = athenaRowsToObjects(
			[
				{
					Data: [
						{ VarCharValue: '42' },
						{ VarCharValue: '1234.50' },
						{ VarCharValue: '0.25' },
						{ VarCharValue: 'true' },
						{ VarCharValue: '2024-02-01' },
						{ VarCharValue: '2024-02-01 08:30:00.000' },
						{ VarCharValue: 'Widget' },
						{ VarCharValue: '[a, b]' }
					]
				}
			],
			columns
		);
		expect(rows).toEqual([
			{
				id: 42,
				amount: 1234.5,
				ratio: 0.25,
				active: true,
				day: '2024-02-01',
				ts: '2024-02-01 08:30:00',
				name: 'Widget',
				tags: '[a, b]'
			}
		]);
	});

	it('maps missing VarCharValue to null, never 0 or ""', () => {
		const rows = athenaRowsToObjects([{ Data: [{}, {}, {}, {}, {}, {}, {}, {}] }], columns);
		expect(Object.values(rows[0])).toEqual(Array(8).fill(null));
	});

	it('maps non-finite numbers to null', () => {
		const rows = athenaRowsToObjects(
			[{ Data: [{ VarCharValue: '1' }, { VarCharValue: 'NaN' }, { VarCharValue: 'Infinity' }] }],
			columns
		);
		expect(rows[0].amount).toBeNull();
		expect(rows[0].ratio).toBeNull();
	});

	it('keeps an empty string as an empty string for text columns', () => {
		const rows = athenaRowsToObjects(
			[{ Data: [{}, {}, {}, {}, {}, {}, { VarCharValue: '' }] }],
			columns
		);
		expect(rows[0].name).toBe('');
	});
});

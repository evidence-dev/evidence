import { describe, it, expect } from 'vitest';

import { Database } from 'duckdb-async';
import { tableFromIPC } from 'apache-arrow';
import { jsToIPC } from './jsToIPC.js';

/**
 *
 * @param {Record<string, unknown>[]} arr
 * @param {{ name: string; evidenceType: string; }[]} schema
 */
function ensure_consistency(arr, schema) {
	const fixed_arr = arr.map((row) => {
		/** @type {Record<string, unknown>} */
		const fixed_row = {};
		for (const { name, evidenceType } of schema) {
			if (row[name] == null) {
				fixed_row[name] = null;
			} else if (evidenceType === 'number') {
				fixed_row[name] = Number(row[name]);
			} else if (evidenceType === 'boolean') {
				fixed_row[name] = Boolean(row[name]);
			} else if (evidenceType === 'date') {
				fixed_row[name] = Number(row[name]);
			} else {
				fixed_row[name] = row[name];
			}
		}
		return fixed_row;
	});

	// console.log(tableFromIPC(jsToIPC(arr, schema)).schema)
	expect(
		tableFromIPC(jsToIPC(arr, schema))
			.toArray()
			.map((x) => x.toJSON())
	).toEqual(fixed_arr);
}

describe('buildMultipartParquet', () => {
	it('should serialize empty arrays with empty schemas', () => {
		ensure_consistency([], []);
	});

	it('should serialize empty arrays with non-empty schemas', () => {
		ensure_consistency([], [{ name: 'x', evidenceType: 'string' }]);
	});

	it('should serialize basic single row arrays/schemas', () => {
		ensure_consistency([{ x: 'hello' }], [{ name: 'x', evidenceType: 'string' }]);
	});

	it('should serialize basic multi row arrays/schemas', () => {
		ensure_consistency([{ x: 'hello' }, { x: 'world' }], [{ name: 'x', evidenceType: 'string' }]);
	});

	it('should serialize multi-property single row', () => {
		ensure_consistency(
			[{ x: 1, y: 'hello' }],
			[
				{ name: 'x', evidenceType: 'number' },
				{ name: 'y', evidenceType: 'string' }
			]
		);
	});

	it('should serialize multi-property multi row', () => {
		ensure_consistency(
			[
				{ x: 1, y: 'hello' },
				{ x: 2, y: 'world' }
			],
			[
				{ name: 'x', evidenceType: 'number' },
				{ name: 'y', evidenceType: 'string' }
			]
		);
	});

	it('should serialize a larger dataset', () => {
		const arr = [];
		for (let i = 0; i < 1000; i++) {
			arr.push({ x: i, y: `hello${i}` });
		}
		ensure_consistency(arr, [
			{ name: 'x', evidenceType: 'number' },
			{ name: 'y', evidenceType: 'string' }
		]);
	});

	it('should serialize needful things', async () => {
		const db = await Database.create('../../../needful_things.duckdb');
		const data = await db.all('SELECT *, (rowid % 59) == 0 as booly FROM orders limit 1');
		const schema = [
			{ name: 'id', evidenceType: 'number' },
			{
				name: 'order_datetime',
				evidenceType: 'date'
			},
			{
				name: 'order_month',
				evidenceType: 'date'
			},
			{
				name: 'first_name',
				evidenceType: 'string'
			},
			{
				name: 'last_name',
				evidenceType: 'string'
			},
			{ name: 'email', evidenceType: 'string' },
			{ name: 'address', evidenceType: 'string' },
			{ name: 'state', evidenceType: 'string' },
			{ name: 'zipcode', evidenceType: 'number' },
			{ name: 'item', evidenceType: 'string' },
			{ name: 'category', evidenceType: 'string' },
			{ name: 'sales', evidenceType: 'number' },
			{ name: 'channel', evidenceType: 'string' },
			{
				name: 'channel_group',
				evidenceType: 'string'
			},
			{
				name: 'channel_month',
				evidenceType: 'string'
			},
			{
				name: 'booly',
				evidenceType: 'boolean'
			}
		];

		ensure_consistency(data, schema);
	});

	it('should serialize very nully needful things', async () => {
		const db = await Database.create('../../../needful_things.duckdb');
		const data = await db.all(`
			SELECT
			IF(0 == (rowid % 2), id, NULL) as id,
			IF(0 == (rowid % 3), order_datetime, NULL) as order_datetime,
			IF(0 == (rowid % 5), order_month, NULL) as order_month,
			IF(0 == (rowid % 7), first_name, NULL) as first_name,
			IF(0 == (rowid % 11), last_name, NULL) as last_name,
			IF(0 == (rowid % 13), email, NULL) as email,
			IF(0 == (rowid % 17), address, NULL) as address,
			IF(0 == (rowid % 19), state, NULL) as state,
			IF(0 == (rowid % 23), zipcode, NULL) as zipcode,
			IF(0 == (rowid % 29), item, NULL) as item,
			IF(0 == (rowid % 31), category, NULL) as category,
			IF(0 == (rowid % 37), sales, NULL) as sales,
			IF(0 == (rowid % 41), channel, NULL) as channel,
			IF(0 == (rowid % 43), channel_group, NULL) as channel_group,
			IF(0 == (rowid % 47), channel_month, NULL) as channel_month,
			IF(0 == (rowid % 53), 0 == (rowid % 59), NULL) as booly
			FROM orders limit 2
		`);
		const schema = [
			{ name: 'id', evidenceType: 'number' },
			{
				name: 'order_datetime',
				evidenceType: 'date'
			},
			{
				name: 'order_month',
				evidenceType: 'date'
			},
			{
				name: 'first_name',
				evidenceType: 'string'
			},
			{
				name: 'last_name',
				evidenceType: 'string'
			},
			{ name: 'email', evidenceType: 'string' },
			{ name: 'address', evidenceType: 'string' },
			{ name: 'state', evidenceType: 'string' },
			{ name: 'zipcode', evidenceType: 'number' },
			{ name: 'item', evidenceType: 'string' },
			{ name: 'category', evidenceType: 'string' },
			{ name: 'sales', evidenceType: 'number' },
			{ name: 'channel', evidenceType: 'string' },
			{
				name: 'channel_group',
				evidenceType: 'string'
			},
			{
				name: 'channel_month',
				evidenceType: 'string'
			},
			{
				name: 'booly',
				evidenceType: 'boolean'
			}
		];

		ensure_consistency(data, schema);
	});

	it('should serialize full nulls', async () => {
		ensure_consistency(
			[{ x: null, y: null }],
			[
				{ name: 'x', evidenceType: 'number' },
				{ name: 'y', evidenceType: 'string' }
			]
		);
	});
});

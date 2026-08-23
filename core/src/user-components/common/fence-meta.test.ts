import { describe, it, expect } from 'vitest';
import { parseFenceMeta, serializeFenceMeta, withFenceName, fenceQueryName } from './fence-meta';

describe('parseFenceMeta', () => {
	it('treats a bare token as the query name', () => {
		expect(parseFenceMeta('orders')).toEqual({ name: 'orders', attrs: {}, rest: '' });
	});

	it('splits the name from trailing attributes', () => {
		expect(parseFenceMeta('orders connection=snowflake')).toEqual({
			name: 'orders',
			attrs: { connection: 'snowflake' },
			rest: 'connection=snowflake'
		});
	});

	it('parses several attributes', () => {
		const { name, attrs } = parseFenceMeta('orders connection=snowflake materialize=true');
		expect(name).toBe('orders');
		expect(attrs).toEqual({ connection: 'snowflake', materialize: 'true' });
	});

	it('supports quoted values so a connection name may contain spaces', () => {
		expect(parseFenceMeta('orders connection="prod warehouse"').attrs).toEqual({
			connection: 'prod warehouse'
		});
		expect(parseFenceMeta("orders connection='prod warehouse'").attrs).toEqual({
			connection: 'prod warehouse'
		});
	});

	it('tolerates extra whitespace between name and attributes', () => {
		expect(parseFenceMeta('  orders    connection=snowflake  ')).toEqual({
			name: 'orders',
			attrs: { connection: 'snowflake' },
			rest: 'connection=snowflake'
		});
	});

	it('yields no name when the fence has attributes but no name', () => {
		// An unnamed fence must not register a query, so `name` has to stay empty
		// rather than capturing `connection=snowflake` as the query name.
		expect(parseFenceMeta('connection=snowflake')).toEqual({
			name: '',
			attrs: { connection: 'snowflake' },
			rest: 'connection=snowflake'
		});
	});

	it('returns an empty result for missing or blank meta', () => {
		const empty = { name: '', attrs: {}, rest: '' };
		expect(parseFenceMeta(undefined)).toEqual(empty);
		expect(parseFenceMeta(null)).toEqual(empty);
		expect(parseFenceMeta('')).toEqual(empty);
		expect(parseFenceMeta('   ')).toEqual(empty);
	});

	it('keeps a namespaced component query name intact', () => {
		// Custom-component queries register as `<tag>:<query>`; the colon must not
		// be treated as a separator here.
		expect(parseFenceMeta('my_widget:sales')).toEqual({
			name: 'my_widget:sales',
			attrs: {},
			rest: ''
		});
		expect(parseFenceMeta('my_widget:sales connection=fabric')).toEqual({
			name: 'my_widget:sales',
			attrs: { connection: 'fabric' },
			rest: 'connection=fabric'
		});
	});
});

describe('serializeFenceMeta', () => {
	it('round-trips every shape', () => {
		for (const input of [
			'orders',
			'orders connection=snowflake',
			'orders connection=snowflake materialize=true',
			'orders connection="prod warehouse"',
			'my_widget:sales connection=fabric',
			'connection=snowflake',
			''
		]) {
			expect(serializeFenceMeta(parseFenceMeta(input))).toBe(input.trim());
		}
	});

	it('preserves attribute text the parser does not model', () => {
		// `rest` is verbatim, so an unrecognised trailing token survives a rename.
		const input = 'orders connection=snowflake somethingNew';
		expect(serializeFenceMeta(parseFenceMeta(input))).toBe(input);
	});
});

describe('withFenceName', () => {
	it('renames a plain fence', () => {
		expect(withFenceName('orders', 'my_widget:orders')).toBe('my_widget:orders');
	});

	it('preserves attributes across a rename', () => {
		// Regression guard: the namespacing pass used to assign the bare name back
		// to `meta`, which dropped `connection=` and silently re-pointed the query
		// at the default connection.
		expect(withFenceName('orders connection=snowflake', 'my_widget:orders')).toBe(
			'my_widget:orders connection=snowflake'
		);
	});

	it('preserves quoted attribute values across a rename', () => {
		expect(withFenceName('orders connection="prod warehouse"', 'w:orders')).toBe(
			'w:orders connection="prod warehouse"'
		);
	});

	it('names a previously unnamed fence without duplicating its attributes', () => {
		expect(withFenceName('connection=snowflake', 'orders')).toBe('orders connection=snowflake');
	});
});

describe('fenceQueryName', () => {
	it('returns the name, ignoring attributes', () => {
		expect(fenceQueryName('orders connection=snowflake')).toBe('orders');
	});

	it('returns empty for an unnamed fence', () => {
		expect(fenceQueryName('connection=snowflake')).toBe('');
		expect(fenceQueryName(undefined)).toBe('');
	});
});

import { describe, it, expect } from 'vitest';
import { InlineQueries } from './inline-queries';

function queries(
	entries: { name: string; sql?: string }[] = [],
	sqlFiles: Record<string, string> = {}
): InlineQueries {
	const iq = new InlineQueries({ filterContexts: undefined }, {}, sqlFiles);
	iq.setConnectionNames(['evidence', 'postgres']);
	for (const { name, sql = 'select 1' } of entries) {
		iq.set(name, sql);
	}
	return iq;
}

describe('splitConnectionPrefix', () => {
	it('splits a registered connection prefix', () => {
		expect(queries().splitConnectionPrefix('postgres:orders')).toEqual({
			connection: 'postgres',
			table: 'orders'
		});
	});

	it('leaves an unknown prefix whole', () => {
		expect(queries().splitConnectionPrefix('notaconn:orders')).toEqual({
			table: 'notaconn:orders'
		});
	});

	it('leaves a colon-free reference whole', () => {
		expect(queries().splitConnectionPrefix('orders')).toEqual({ table: 'orders' });
	});

	it('recognises connection names case-exactly and reports them', () => {
		const iq = queries();
		expect(iq.isConnectionName('postgres')).toBe(true);
		expect(iq.isConnectionName('Postgres')).toBe(false);
		expect(iq.connectionNames()).toEqual(['evidence', 'postgres']);
	});
});

describe('getInterpolated strips a known connection prefix', () => {
	it('returns the bare table so the warehouse never sees the prefix', () => {
		expect(queries().getInterpolated('postgres:orders')).toBe('orders');
	});

	it('leaves an unknown prefix for the caller fallback (undefined)', () => {
		expect(queries().getInterpolated('notaconn:orders')).toBeUndefined();
	});

	it('resolves a prefixed reference to a registered query', () => {
		const iq = queries([{ name: 'revenue', sql: 'select 1' }]);
		expect(iq.getInterpolated('postgres:revenue')).toContain('select 1');
	});

	it('ordering: a registered query wins over prefix parsing', () => {
		// A query literally named `postgres:legacy` (system-minted) resolves as the
		// query, not as connection `postgres` + table `legacy`.
		const iq = queries([{ name: 'postgres:legacy', sql: 'select 42' }]);
		expect(iq.getInterpolated('postgres:legacy')).toContain('select 42');
	});
});

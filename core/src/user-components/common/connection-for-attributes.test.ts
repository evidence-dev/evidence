import { describe, it, expect } from 'vitest';
import { connectionForAttributes, connectionForReferenceString } from './connection-for-attributes';
import { InlineQueries } from './inline-queries';

const CONNECTIONS = ['snowflake', 'fabric'];

function queries(
	entries: { name: string; sql?: string; connection?: string }[] = [],
	sqlFiles: Record<string, string> = {}
): InlineQueries {
	const inlineQueries = new InlineQueries({ filterContexts: undefined }, {}, sqlFiles);
	inlineQueries.setConnectionNames(CONNECTIONS);
	for (const { name, sql = 'select 1', connection } of entries) {
		inlineQueries.set(name, sql, connection);
	}
	return inlineQueries;
}

describe('connectionForReferenceString', () => {
	it('uses the connection a query declared', () => {
		const q = queries([{ name: 'revenue', connection: 'snowflake' }]);
		expect(connectionForReferenceString('revenue', q)).toBe('snowflake');
	});

	it('returns undefined for a query with no declared connection', () => {
		const q = queries([{ name: 'revenue' }]);
		expect(connectionForReferenceString('revenue', q)).toBeUndefined();
	});

	it('reads an explicit prefix on a bare table name', () => {
		expect(connectionForReferenceString('fabric:dbo.gl_actuals', queries())).toBe('fabric');
	});

	it('returns undefined for an unqualified table so the page default applies', () => {
		// Deliberate: catalog-wide search happens in validation, not on the render
		// path, so an unqualified name behaves exactly as it did before connections.
		expect(connectionForReferenceString('orders', queries())).toBeUndefined();
	});

	it('prefers a registered query over reading its name as a prefix', () => {
		// `my_widget:sales` is a namespaced custom-component query, not connection
		// `my_widget`.
		const q = queries([{ name: 'my_widget:sales' }]);
		expect(connectionForReferenceString('my_widget:sales', q)).toBeUndefined();
	});

	it('honours the connection a namespaced component query declared', () => {
		const q = queries([{ name: 'my_widget:sales', connection: 'fabric' }]);
		expect(connectionForReferenceString('my_widget:sales', q)).toBe('fabric');
	});

	it('prefers a component query over a same-named connection prefix', () => {
		// A component tag named after a connection: the registry wins.
		const q = queries([{ name: 'snowflake:orders' }]);
		expect(connectionForReferenceString('snowflake:orders', q)).toBeUndefined();
	});

	it('treats a sql file as a query rather than a prefix', () => {
		const q = queries([], { 'reports:weekly': 'select 1' });
		expect(connectionForReferenceString('reports:weekly', q)).toBeUndefined();
	});

	it('ignores a leading colon', () => {
		expect(connectionForReferenceString(':orders', queries())).toBeUndefined();
	});

	it('handles blank and whitespace input', () => {
		expect(connectionForReferenceString('', queries())).toBeUndefined();
		expect(connectionForReferenceString('   ', queries())).toBeUndefined();
	});

	it('cannot recognise a prefix without an inline-query context', () => {
		// Without the connection registry there is no way to know `fabric` is a
		// connection rather than part of the table name, so it stays unqualified.
		expect(connectionForReferenceString('fabric:orders', undefined)).toBeUndefined();
		expect(connectionForReferenceString('orders', undefined)).toBeUndefined();
	});
});

describe('connectionForAttributes', () => {
	it('resolves from the data attribute', () => {
		const q = queries([{ name: 'revenue', connection: 'snowflake' }]);
		expect(connectionForAttributes({ data: 'revenue' }, q)).toBe('snowflake');
	});

	it('resolves a connection prefix on the data attribute', () => {
		expect(connectionForAttributes({ data: 'fabric:dbo.gl' }, queries())).toBe('fabric');
	});

	it('returns undefined when no attribute names a connection', () => {
		expect(connectionForAttributes({ data: 'orders', x: 'date' }, queries())).toBeUndefined();
		expect(connectionForAttributes({}, queries())).toBeUndefined();
		expect(connectionForAttributes(undefined, queries())).toBeUndefined();
	});

	it('ignores non-string attribute values', () => {
		expect(connectionForAttributes({ data: 42 }, queries())).toBeUndefined();
	});
});

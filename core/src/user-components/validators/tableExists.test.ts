import { describe, it, expect } from 'vitest';
import { tableExists } from './tableExists';
import type { ValidationContext } from './types';

const node = (attrs: Record<string, unknown>) => ({
	attributes: attrs,
	location: { start: { line: 1 }, end: { line: 1 } }
});

const metadataStub = (over: Partial<Record<'loading' | 'loadFailed', boolean>> = {}) => ({
	loading: false,
	loadFailed: false,
	tables: [],
	getTable: () => undefined,
	...over
});

// A loaded catalog resolving the given (case-insensitive) table names — for the ambient metadata.
const metadataWith = (tableNames: string[]) =>
	({
		loading: false,
		loadFailed: false,
		tables: tableNames.map((name) => ({ name })),
		getTable: (n: string) =>
			tableNames.find((t) => t.toLowerCase() === n.toLowerCase()) ? { name: n } : undefined
	}) as unknown as ValidationContext['metadata'];

const ctx = (metadata: unknown): ValidationContext =>
	({
		metadata,
		filters: undefined,
		inlineQueries: undefined,
		trees: undefined
	}) as unknown as ValidationContext;

const run = (metadata: unknown) =>
	// @ts-expect-error config arg unused by tableExists
	tableExists('data')(node({ data: 'orders' }), {}, ctx(metadata));

describe('tableExists', () => {
	it('flags a missing table once the catalog has loaded', () => {
		const errors = run(metadataStub());
		expect(errors).toHaveLength(1);
		expect(errors[0].id).toBe('invalid-table');
	});

	it('stays silent while the catalog is still loading', () => {
		expect(run(metadataStub({ loading: true }))).toEqual([]);
	});

	// Regression: a failed Snowflake catalog scan (timeout) leaves loading=false +
	// empty tables. Without the loadFailed gate every component would be flagged
	// invalid and the editor preview would blank out entirely.
	it('stays silent when the catalog load failed', () => {
		expect(run(metadataStub({ loadFailed: true }))).toEqual([]);
	});

	it('stays silent when there is no metadata at all', () => {
		expect(run(undefined)).toEqual([]);
	});
});

// Stub inline-queries exposing just the connection surface tableExists reads.
const iqStub = (connections: string[], queryNames: string[] = []) => ({
	connectionNames: () => connections,
	isConnectionName: (n: string) => connections.includes(n),
	getPublicNames: () => queryNames,
	getAllNames: () => queryNames,
	isSqlFile: () => false
});

const connCtx = (
	over: Partial<ValidationContext> & { connections?: string[]; queryNames?: string[] } = {}
): ValidationContext =>
	({
		metadata: metadataStub(),
		filters: undefined,
		inlineQueries: iqStub(over.connections ?? ['default', 'snowflake'], over.queryNames),
		trees: undefined,
		...over
	}) as unknown as ValidationContext;

const runData = (data: string, context: ValidationContext) =>
	// @ts-expect-error config arg unused by tableExists
	tableExists('data')(node({ data }), {}, context);

describe('tableExists — connection references', () => {
	it('hints at an unknown connection when the stripped table is real (mistyped connection)', () => {
		// `snowflke:orders` — the stripped `orders` exists, so this is almost certainly a mistyped
		// connection in front of a real table; surface the connection hint rather than a literal miss.
		const errors = runData('snowflke:orders', connCtx({ metadata: metadataWith(['orders']) }));
		expect(errors).toHaveLength(1);
		expect(errors[0].id).toBe('unknown-connection');
		expect(errors[0].message).toContain('snowflke');
	});

	it('treats an unregistered prefix as a literal reference when the stripped table is not real', () => {
		// `public:something` — `public` is not a connection AND `something` is not a table, so it is a
		// stray colon / colon convention, not connection syntax. It must validate as an ordinary
		// (missing) table name — NOT hard-error as "no connection named public".
		const errors = runData('public:something', connCtx({ metadata: metadataWith(['orders']) }));
		expect(errors).toHaveLength(1);
		expect(errors[0].id).toBe('invalid-table');
		expect(errors[0].message).not.toContain('no connection named');
	});

	it('leaves a real colon-containing literal reference alone (no connection error)', () => {
		// A table literally named with a colon resolves as itself — the unregistered prefix must not
		// shadow a real literal.
		const errors = runData('weird:name', connCtx({ metadata: metadataWith(['weird:name']) }));
		expect(errors).toEqual([]);
	});

	it('passes a table that exists in the named connection catalog', () => {
		const errors = runData('snowflake:orders', {
			...connCtx(),
			metadataForConnection: () => metadataStub({}) && { ...metadataStub(), getTable: () => ({}) }
		} as unknown as ValidationContext);
		expect(errors).toEqual([]);
	});

	it('errors on a missing table in the named connection catalog', () => {
		const errors = runData('snowflake:ghost', {
			...connCtx(),
			metadataForConnection: () => metadataStub()
		} as unknown as ValidationContext);
		expect(errors).toHaveLength(1);
		expect(errors[0].id).toBe('invalid-table');
		expect(errors[0].message).toContain('connection "snowflake"');
	});

	// Regression (multi-connection report): the prefixed path must resolve a bare, differently-cased
	// name against a `<schema>.<table>` catalog exactly like the bare `data=` path does — otherwise
	// `snowflake:orders` false-errors while `orders` validates, purely because of case/qualification.
	const catalogWith = (tableNames: string[]) =>
		({
			loading: false,
			loadFailed: false,
			tables: tableNames.map((name) => ({ name })),
			// Case-insensitive exact match, mirroring Metadata.getTable on a case-folding dialect.
			getTable: (n: string) =>
				tableNames.find((t) => t.toLowerCase() === n.toLowerCase()) ? {} : undefined
		}) as unknown as NonNullable<
			ReturnType<NonNullable<ValidationContext['metadataForConnection']>>
		>;

	it('resolves a bare lowercase name against a schema-qualified catalog entry', () => {
		const errors = runData('snowflake:orders', {
			...connCtx(),
			metadataForConnection: () => catalogWith(['PUBLIC.ORDERS'])
		} as unknown as ValidationContext);
		expect(errors).toEqual([]);
	});

	it('resolves a schema-qualified reference regardless of case', () => {
		const errors = runData('snowflake:public.orders', {
			...connCtx(),
			metadataForConnection: () => catalogWith(['PUBLIC.ORDERS'])
		} as unknown as ValidationContext);
		expect(errors).toEqual([]);
	});

	it('still errors when the table is genuinely absent from the connection catalog', () => {
		const errors = runData('snowflake:PUBLIC.GHOST', {
			...connCtx(),
			metadataForConnection: () => catalogWith(['PUBLIC.ORDERS'])
		} as unknown as ValidationContext);
		expect(errors).toHaveLength(1);
		expect(errors[0].id).toBe('invalid-table');
		expect(errors[0].message).toContain('connection "snowflake"');
	});

	it('is dormant when no connection names are registered (colon ref falls through)', () => {
		// No connections ⇒ block skipped; `foo:bar` is treated as an ordinary (missing) table name.
		const errors = runData('foo:bar', connCtx({ connections: [] }));
		expect(errors).toHaveLength(1);
		expect(errors[0].id).toBe('invalid-table');
		expect(errors[0].message).not.toContain('no connection named');
	});

	it('exempts a component-scoped query name that contains a colon', () => {
		const errors = runData('kpi_card:revenue', connCtx({ queryNames: ['kpi_card:revenue'] }));
		expect(errors).toEqual([]);
	});
});

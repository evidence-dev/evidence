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

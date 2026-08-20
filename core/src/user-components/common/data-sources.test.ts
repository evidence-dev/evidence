import { describe, it, expect } from 'vitest';
import { validateDataSources } from './data-sources';

const node = (attributes: Record<string, unknown>) =>
	({ attributes, location: undefined }) as unknown as Parameters<
		ReturnType<typeof validateDataSources>
	>[0];

const config = {} as Parameters<ReturnType<typeof validateDataSources>>[1];
const context = {} as Parameters<ReturnType<typeof validateDataSources>>[2];
const run = (sources: Parameters<typeof validateDataSources>[0], attrs: Record<string, unknown>) =>
	validateDataSources(sources)(node(attrs), config, context);

describe('validateDataSources', () => {
	describe('single-group (co-dependency)', () => {
		const sources = [{ requires: ['data', 'value_column'], forbids: [] }];

		it('passes when the full group is present', () => {
			expect(run(sources, { data: 'orders', value_column: 'region' })).toEqual([]);
		});

		it('errors when a required attr is missing', () => {
			const errs = run(sources, { data: 'orders' });
			expect(errs).toHaveLength(1);
			expect(errs[0].message).toMatch(/data.*value_column/);
		});

		it('errors when nothing is present', () => {
			expect(run(sources, {})).toHaveLength(1);
		});
	});

	describe('two-group XOR (raw vs metric)', () => {
		const sources = [
			{ requires: ['data', 'value'], forbids: ['metric'] },
			{ requires: ['metric'], forbids: ['data', 'value'] }
		];

		it('passes with the raw group only', () => {
			expect(run(sources, { data: 'orders', value: 'sum(amount)' })).toEqual([]);
		});

		it('passes with the metric group only', () => {
			expect(run(sources, { metric: 'revenue' })).toEqual([]);
		});

		it('errors when raw is partial and metric absent', () => {
			expect(run(sources, { data: 'orders' })).toHaveLength(1);
		});

		it('errors when both groups mix (metric + data)', () => {
			const errs = run(sources, { metric: 'revenue', data: 'orders' });
			expect(errs).toHaveLength(1);
			expect(errs[0].message).toMatch(/Set.*data.*value.*metric|metric.*data/i);
		});

		it('errors when both groups mix (metric + value)', () => {
			expect(run(sources, { metric: 'revenue', value: 'sum(amount)' })).toHaveLength(1);
		});

		it('errors on an empty node', () => {
			expect(run(sources, {})).toHaveLength(1);
		});
	});

	describe('three-way with an empty entry', () => {
		const sources = [
			{ requires: ['data', 'value'], forbids: ['metric'] },
			{ requires: ['metric'], forbids: ['data', 'value'] },
			// The empty entry MUST forbid the other-mode attrs, otherwise it would
			// match every input and swallow the real errors.
			{ requires: [], forbids: ['data', 'value', 'metric'] }
		];

		it('passes with truly no source attrs', () => {
			expect(run(sources, {})).toEqual([]);
		});

		it('still errors on a partial raw arrangement', () => {
			expect(run(sources, { data: 'orders' })).toHaveLength(1);
		});

		it('still errors on mixing modes', () => {
			expect(run(sources, { metric: 'revenue', data: 'orders' })).toHaveLength(1);
		});
	});

	describe('empty-string / empty-array attrs count as absent', () => {
		const sources = [{ requires: ['data'], forbids: ['metric'] }];

		it('treats empty string as missing', () => {
			expect(run(sources, { data: '' })).toHaveLength(1);
		});

		it('treats empty array as missing', () => {
			expect(run(sources, { data: [] })).toHaveLength(1);
		});

		it('treats an empty-string forbid as absent (so does not trigger the forbid clause)', () => {
			// metric="" should NOT count as "metric present" and block the raw group.
			expect(run(sources, { data: 'orders', metric: '' })).toEqual([]);
		});
	});
});

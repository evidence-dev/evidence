import { describe, it, expect } from 'vitest';
import {
	isSandboxEnvelope,
	SANDBOX_MESSAGE_SOURCE,
	SANDBOX_PROTOCOL_VERSION,
	MAP_QUERY_REQUEST,
	validateFilterSetMessage,
	validateFilterCreateMessage
} from './sandbox-protocol';

describe('custom_map sandbox-protocol', () => {
	it('accepts an envelope from this source', () => {
		expect(isSandboxEnvelope({ source: SANDBOX_MESSAGE_SOURCE, v: 1, instanceId: 'x' })).toBe(true);
	});

	it('rejects other sandbox consumers (cross-consumer isolation)', () => {
		expect(isSandboxEnvelope({ source: 'evidence-echart-sandbox', v: 1, instanceId: 'x' })).toBe(
			false
		);
		expect(isSandboxEnvelope({ source: 'evidence-html-sandbox', v: 1, instanceId: 'x' })).toBe(
			false
		);
	});

	it('rejects non-envelopes', () => {
		expect(isSandboxEnvelope(null)).toBe(false);
		expect(isSandboxEnvelope({})).toBe(false);
		expect(isSandboxEnvelope('evidence-custom-map-sandbox')).toBe(false);
	});

	it('has a unique source, is at version 3, and shares the query RPC kind', () => {
		expect(SANDBOX_MESSAGE_SOURCE).toBe('evidence-custom-map-sandbox');
		expect(SANDBOX_PROTOCOL_VERSION).toBe(3);
		expect(MAP_QUERY_REQUEST).toBe('query');
	});
});

describe('filter message validators', () => {
	it('accepts a well-formed filter-set and preserves the value', () => {
		expect(validateFilterSetMessage({ type: 'filter-set', id: 'bbox', value: [1, 2] })).toEqual({
			type: 'filter-set',
			id: 'bbox',
			value: [1, 2]
		});
	});

	it('rejects filter-set with a bad type or empty id', () => {
		expect(validateFilterSetMessage({ type: 'nope', id: 'x', value: 1 })).toBeNull();
		expect(validateFilterSetMessage({ type: 'filter-set', id: '', value: 1 })).toBeNull();
		expect(validateFilterSetMessage(null)).toBeNull();
	});

	it('accepts filter-create with a bare-identifier column', () => {
		expect(
			validateFilterCreateMessage({
				type: 'filter-create',
				id: 'region',
				value: 'US',
				column: 'r.region'
			})
		).toEqual({ type: 'filter-create', id: 'region', value: 'US', column: 'r.region' });
	});

	it('rejects a filter-create column that is not a bare SQL identifier (injection guard)', () => {
		expect(
			validateFilterCreateMessage({
				type: 'filter-create',
				id: 'x',
				value: 1,
				column: 'a; drop table t'
			})
		).toBeNull();
		expect(
			validateFilterCreateMessage({ type: 'filter-create', id: 'x', value: 1, column: '"Quoted"' })
		).toBeNull();
	});

	it('allows filter-create without a column', () => {
		expect(validateFilterCreateMessage({ type: 'filter-create', id: 'x', value: 1 })).toEqual({
			type: 'filter-create',
			id: 'x',
			value: 1
		});
	});
});

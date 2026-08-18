import { describe, it, expect } from 'vitest';
import {
	isSandboxEnvelope,
	SANDBOX_MESSAGE_SOURCE,
	SANDBOX_PROTOCOL_VERSION,
	USER_CODE_GLOBAL_NAMES
} from './sandbox-protocol';

describe('isSandboxEnvelope', () => {
	it('accepts messages carrying the sandbox source discriminator', () => {
		expect(
			isSandboxEnvelope({
				source: SANDBOX_MESSAGE_SOURCE,
				v: SANDBOX_PROTOCOL_VERSION,
				instanceId: 'abc',
				type: 'ready'
			})
		).toBe(true);
	});

	it('rejects unrelated postMessage traffic', () => {
		expect(isSandboxEnvelope({ source: 'some-other-lib', type: 'ready' })).toBe(false);
		expect(isSandboxEnvelope({ type: 'ready' })).toBe(false);
	});

	it('rejects non-object payloads without throwing', () => {
		expect(isSandboxEnvelope(null)).toBe(false);
		expect(isSandboxEnvelope(undefined)).toBe(false);
		expect(isSandboxEnvelope('evidence-echart-sandbox')).toBe(false);
		expect(isSandboxEnvelope(42)).toBe(false);
	});
});

describe('user-code globals contract', () => {
	it('exposes exactly the documented globals — no undocumented namespace pollution', () => {
		// Order matters: it's reused verbatim as both the new Function parameter
		// list and the call arguments, so lock it. Composition matters too —
		// any name here becomes a reserved parameter the author can't shadow
		// with const/let, so we expose ONLY names mentioned in the schema
		// description AND uncommon enough as locals not to collide.
		// `rows` and `dimensions` were dropped after they caused
		// "Cannot declare a const variable twice: 'rows'" in real use.
		expect(USER_CODE_GLOBAL_NAMES).toEqual([
			'data',
			'columns',
			'echarts',
			'theme',
			'fmt'
		]);
	});

	it('does NOT include common local-variable names that would shadow author code', () => {
		// Regression guard: any future addition must not include names that
		// chart authors frequently use as locals.
		const dangerouslyCommon = ['rows', 'row', 'dimensions', 'dim', 'series', 'options', 'option', 'chart', 'i', 'x', 'y', 'value', 'item', 'index'];
		for (const name of dangerouslyCommon) {
			expect(USER_CODE_GLOBAL_NAMES).not.toContain(name);
		}
	});
});

describe('protocol version', () => {
	it('is bumped past v1 (the version that lacked the log message type)', () => {
		// Stale cached sandbox runtimes assert SANDBOX_PROTOCOL_VERSION equality
		// on both sides. Bumping past v1 forces a refetch after the log-pipeline
		// changes ship — without this, an old runtime would silently fail to
		// forward console errors and there'd be no signal something is wrong.
		expect(SANDBOX_PROTOCOL_VERSION).toBeGreaterThanOrEqual(2);
	});
});

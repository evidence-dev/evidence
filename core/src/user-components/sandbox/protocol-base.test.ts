import { describe, it, expect } from 'vitest';
import { isSandboxEnvelope, validateHeightMessage } from './protocol-base';

const ECHART_SOURCE = 'evidence-echart-sandbox';
const HTML_SOURCE = 'evidence-html-sandbox';

describe('isSandboxEnvelope', () => {
	it('accepts a message tagged with the expected source', () => {
		expect(
			isSandboxEnvelope(
				{ source: ECHART_SOURCE, v: 2, instanceId: 'a', type: 'ready' },
				ECHART_SOURCE
			)
		).toBe(true);
	});

	it('rejects a message from a different consumer (echart vs html cross-talk)', () => {
		// Critical property: two sandbox types on one page must not pollute each
		// other's listeners. The discriminator is the only thing keeping them
		// apart since both go through window.postMessage.
		expect(
			isSandboxEnvelope(
				{ source: HTML_SOURCE, v: 2, instanceId: 'b', type: 'ready' },
				ECHART_SOURCE
			)
		).toBe(false);
	});

	it('rejects unrelated postMessage traffic (no source field)', () => {
		expect(isSandboxEnvelope({ type: 'ready' }, ECHART_SOURCE)).toBe(false);
		expect(isSandboxEnvelope({ source: 'react-devtools', type: 'init' }, ECHART_SOURCE)).toBe(
			false
		);
	});

	it('rejects non-object payloads without throwing', () => {
		expect(isSandboxEnvelope(null, ECHART_SOURCE)).toBe(false);
		expect(isSandboxEnvelope(undefined, ECHART_SOURCE)).toBe(false);
		expect(isSandboxEnvelope(42, ECHART_SOURCE)).toBe(false);
		expect(isSandboxEnvelope(ECHART_SOURCE, ECHART_SOURCE)).toBe(false);
	});

	it('does NOT check protocol version itself (caller does that separately)', () => {
		// Version checks live with the consumer because each consumer versions
		// independently; isSandboxEnvelope only enforces the discriminator.
		expect(
			isSandboxEnvelope(
				{ source: ECHART_SOURCE, v: 999, instanceId: 'a', type: 'ready' },
				ECHART_SOURCE
			)
		).toBe(true);
	});
});

describe('validateHeightMessage', () => {
	it('accepts a finite non-negative number', () => {
		expect(validateHeightMessage({ type: 'height', contentHeight: 240 })).toEqual({
			type: 'height',
			contentHeight: 240
		});
		expect(validateHeightMessage({ type: 'height', contentHeight: 0 })).toEqual({
			type: 'height',
			contentHeight: 0
		});
	});

	it('rejects NaN, Infinity, and negative heights (would break layout calc)', () => {
		expect(validateHeightMessage({ type: 'height', contentHeight: Number.NaN })).toBeNull();
		expect(validateHeightMessage({ type: 'height', contentHeight: Infinity })).toBeNull();
		expect(validateHeightMessage({ type: 'height', contentHeight: -Infinity })).toBeNull();
		expect(validateHeightMessage({ type: 'height', contentHeight: -1 })).toBeNull();
	});

	it('rejects non-number contentHeight (string coercion would silently break CSS)', () => {
		expect(validateHeightMessage({ type: 'height', contentHeight: '240' })).toBeNull();
		expect(validateHeightMessage({ type: 'height', contentHeight: null })).toBeNull();
		expect(validateHeightMessage({ type: 'height', contentHeight: undefined })).toBeNull();
	});

	it('rejects wrong message type', () => {
		expect(validateHeightMessage({ type: 'rendered', contentHeight: 240 })).toBeNull();
		expect(validateHeightMessage({ contentHeight: 240 })).toBeNull();
	});

	it('rejects non-object inputs without throwing', () => {
		expect(validateHeightMessage(null)).toBeNull();
		expect(validateHeightMessage(undefined)).toBeNull();
		expect(validateHeightMessage(240)).toBeNull();
		expect(validateHeightMessage('height')).toBeNull();
	});
});

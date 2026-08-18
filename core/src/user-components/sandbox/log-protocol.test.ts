import { describe, it, expect } from 'vitest';
import { validateLogMessage } from './log-protocol';

describe('validateLogMessage', () => {
	it('accepts a well-formed entry (level, source, message)', () => {
		const validated = validateLogMessage({
			type: 'log',
			entry: { level: 'error', source: 'script', message: 'boom' }
		});
		expect(validated).toEqual({
			type: 'log',
			entry: { level: 'error', source: 'script', message: 'boom' }
		});
	});

	it('preserves a string stack when present, drops it when not', () => {
		const withStack = validateLogMessage({
			type: 'log',
			entry: {
				level: 'warn',
				source: 'console',
				message: 'something',
				stack: 'at fn (foo.js:1:1)'
			}
		});
		expect(withStack?.entry.stack).toBe('at fn (foo.js:1:1)');

		const withoutStack = validateLogMessage({
			type: 'log',
			entry: { level: 'warn', source: 'console', message: 'something' }
		});
		expect(withoutStack?.entry).not.toHaveProperty('stack');
	});

	it('rejects an out-of-enum level', () => {
		expect(
			validateLogMessage({
				type: 'log',
				entry: { level: 'debug', source: 'script', message: 'm' }
			})
		).toBeNull();
		expect(
			validateLogMessage({
				type: 'log',
				entry: { level: 'fatal', source: 'script', message: 'm' }
			})
		).toBeNull();
	});

	it('rejects an out-of-enum source', () => {
		expect(
			validateLogMessage({
				type: 'log',
				entry: { level: 'error', source: 'unknown', message: 'm' }
			})
		).toBeNull();
	});

	it('rejects non-string message / stack', () => {
		expect(
			validateLogMessage({
				type: 'log',
				entry: { level: 'error', source: 'script', message: 42 }
			})
		).toBeNull();
		expect(
			validateLogMessage({
				type: 'log',
				entry: { level: 'error', source: 'script', message: 'm', stack: 99 }
			})
		).toBeNull();
	});

	it('rejects wrong message type and missing entry', () => {
		expect(validateLogMessage({ type: 'rendered', entry: {} })).toBeNull();
		expect(validateLogMessage({ type: 'log' })).toBeNull();
		expect(validateLogMessage({ type: 'log', entry: null })).toBeNull();
	});

	it('rejects non-object inputs without throwing', () => {
		expect(validateLogMessage(null)).toBeNull();
		expect(validateLogMessage(undefined)).toBeNull();
		expect(validateLogMessage('log')).toBeNull();
	});

	it('does not let extra properties on entry survive (returns a clean entry)', () => {
		// The buffer consumer should never see fields that weren't validated.
		const validated = validateLogMessage({
			type: 'log',
			entry: {
				level: 'error',
				source: 'script',
				message: 'm',
				evil: '<script>alert(1)</script>'
			}
		});
		expect(validated?.entry).toEqual({ level: 'error', source: 'script', message: 'm' });
		expect(validated?.entry).not.toHaveProperty('evil');
	});
});

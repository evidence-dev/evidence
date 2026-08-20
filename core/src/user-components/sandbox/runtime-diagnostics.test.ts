// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	errorToLogEntry,
	installConsoleForwarding,
	installErrorForwarding
} from './runtime-diagnostics';
import type { SandboxLogEntry } from './log-protocol';

/**
 * These tests exercise the producer-side primitives that run INSIDE a
 * sandboxed iframe. They run in jsdom (the real `console`, the real
 * `window`) rather than mocking the platform — the whole job of these
 * helpers is to bridge platform APIs to a postLog callback, and mocking
 * the platform would test only the wiring.
 */

describe('errorToLogEntry', () => {
	it('unwraps an Error into level/source/message/stack', () => {
		const err = new Error('boom');
		const entry = errorToLogEntry(err);
		expect(entry.level).toBe('error');
		expect(entry.source).toBe('script');
		expect(entry.message).toBe('boom');
		expect(entry.stack).toBe(err.stack);
	});

	it('coerces non-Error throws (string) into the entry shape', () => {
		const entry = errorToLogEntry('plain string');
		expect(entry.message).toBe('plain string');
		expect(entry.stack).toBeUndefined();
	});

	it('coerces unhandled-rejection-style reasons (object) safely', () => {
		const entry = errorToLogEntry({ code: 42 });
		expect(typeof entry.message).toBe('string');
	});
});

describe('installConsoleForwarding', () => {
	let originalError: typeof console.error;
	let originalWarn: typeof console.warn;

	beforeEach(() => {
		originalError = console.error;
		originalWarn = console.warn;
	});

	afterEach(() => {
		console.error = originalError;
		console.warn = originalWarn;
	});

	it('still calls the original console method (devtools output preserved)', () => {
		const originalSpy = vi.fn();
		console.error = originalSpy;

		const captured: SandboxLogEntry[] = [];
		installConsoleForwarding((e) => captured.push(e));

		console.error('something broke');

		expect(originalSpy).toHaveBeenCalledWith('something broke');
		expect(captured).toHaveLength(1);
		expect(captured[0].message).toBe('something broke');
		expect(captured[0].level).toBe('error');
		expect(captured[0].source).toBe('console');
	});

	it('forwards console.warn entries with level: warn', () => {
		const captured: SandboxLogEntry[] = [];
		installConsoleForwarding((e) => captured.push(e));

		console.warn('encode references unknown column "foo"');

		expect(captured).toHaveLength(1);
		expect(captured[0].level).toBe('warn');
		expect(captured[0].message).toContain('encode references unknown column');
	});

	it('joins multi-arg console calls and surfaces the stack from any Error arg', () => {
		const captured: SandboxLogEntry[] = [];
		installConsoleForwarding((e) => captured.push(e));

		const err = new Error('detail');
		console.error('Rendering failed:', err);

		expect(captured[0].message).toContain('Rendering failed:');
		expect(captured[0].message).toContain('detail');
		expect(captured[0].stack).toBe(err.stack);
	});

	it('a throw from the original console method must not mask the forwarded log', () => {
		const captured: SandboxLogEntry[] = [];
		console.error = () => {
			throw new Error('devtools busted');
		};

		installConsoleForwarding((e) => captured.push(e));

		expect(() => console.error('important')).not.toThrow();
		expect(captured).toHaveLength(1);
		expect(captured[0].message).toBe('important');
	});
});

describe('installErrorForwarding', () => {
	let listeners: Map<string, EventListener[]>;
	let originalAdd: typeof window.addEventListener;

	beforeEach(() => {
		// Capture listeners on a real window without permanently modifying it.
		listeners = new Map();
		originalAdd = window.addEventListener;
		window.addEventListener = vi.fn((type: string, listener: EventListener) => {
			const list = listeners.get(type) ?? [];
			list.push(listener);
			listeners.set(type, list);
		}) as typeof window.addEventListener;
	});

	afterEach(() => {
		window.addEventListener = originalAdd;
	});

	it('forwards uncaught errors as log entries', () => {
		const captured: SandboxLogEntry[] = [];
		installErrorForwarding((e) => captured.push(e));

		const handler = listeners.get('error')?.[0];
		expect(handler).toBeDefined();

		const error = new TypeError('cannot read property');
		handler?.({ error, message: 'cannot read property' } as unknown as Event);

		expect(captured).toHaveLength(1);
		expect(captured[0].message).toBe('cannot read property');
		expect(captured[0].stack).toBe(error.stack);
	});

	it('falls back to event.message when event.error is missing (legacy browsers)', () => {
		const captured: SandboxLogEntry[] = [];
		installErrorForwarding((e) => captured.push(e));

		const handler = listeners.get('error')?.[0];
		handler?.({ error: undefined, message: 'Script error' } as unknown as Event);

		expect(captured[0].message).toBe('Script error');
	});

	it('forwards unhandled promise rejections as log entries', () => {
		const captured: SandboxLogEntry[] = [];
		installErrorForwarding((e) => captured.push(e));

		const handler = listeners.get('unhandledrejection')?.[0];
		expect(handler).toBeDefined();

		const reason = new Error('await blew up');
		handler?.({ reason } as unknown as Event);

		expect(captured).toHaveLength(1);
		expect(captured[0].message).toBe('await blew up');
	});
});

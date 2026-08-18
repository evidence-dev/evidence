/**
 * Producer-side primitives that run INSIDE a sandboxed iframe and forward
 * diagnostics to the parent. Consumers pass in their own `postLog` callback
 * wired into their own postMessage protocol; this module never touches the
 * channel directly so it can be reused unchanged across custom_echart,
 * html, etc.
 */
import type { SandboxLogEntry } from './log-protocol';

export type PostLog = (entry: SandboxLogEntry) => void;

function summarizeArg(value: unknown): string {
	if (value instanceof Error) return value.message;
	if (typeof value === 'string') return value;
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

/**
 * Normalize anything throwable (Error, string, plain value) into a log entry.
 * Useful when a consumer wants to layer extra behavior (e.g. an overlay) on
 * top of error forwarding without duplicating the unwrap dance.
 */
export function errorToLogEntry(error: unknown): SandboxLogEntry {
	return {
		level: 'error',
		source: 'script',
		message: error instanceof Error ? error.message : String(error),
		stack: error instanceof Error ? error.stack : undefined
	};
}

/**
 * Wrap console.error / console.warn so user code's deliberate diagnostics
 * (including library warnings — e.g. ECharts emits useful console.warn for
 * misconfigured options) reach the AI's debug pipeline. The original calls
 * still hit DevTools as before.
 */
export function installConsoleForwarding(postLog: PostLog): void {
	for (const level of ['error', 'warn'] as const) {
		const original = console[level].bind(console);
		console[level] = (...args: unknown[]) => {
			try {
				original(...args);
			} catch {
				/* never let a forwarding failure mask the original log */
			}
			const message = args.map(summarizeArg).join(' ');
			const stackArg = args.find((arg) => arg instanceof Error) as Error | undefined;
			postLog({ level, source: 'console', message, stack: stackArg?.stack });
		};
	}
}

/**
 * Catch uncaught throws and unhandled promise rejections, forwarding each
 * as a log entry. Consumers that ALSO want a visual overlay (custom_echart
 * paints a red error box) should keep their own window.error listener that
 * does the overlay AND calls postLog separately, rather than using this
 * installer — to avoid double-firing.
 */
export function installErrorForwarding(postLog: PostLog): void {
	window.addEventListener('error', (event) => {
		postLog(errorToLogEntry(event.error ?? event.message));
	});
	window.addEventListener('unhandledrejection', (event) => {
		postLog(errorToLogEntry(event.reason));
	});
}

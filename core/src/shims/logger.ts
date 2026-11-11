/**
 * Logger shim - provides a simple console-based logger with pino-like interface.
 * Consumers that want real pino logging can swap the backing logger via `setLogger`.
 */

type LogFn = (objOrMsg: unknown, msg?: string, ...args: unknown[]) => void;

export interface Logger {
	trace: LogFn;
	debug: LogFn;
	info: LogFn;
	warn: LogFn;
	error: LogFn;
	fatal: LogFn;
	child: (bindings: Record<string, unknown>) => Logger;
}

type Level = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

let backingLogger: Logger | undefined;

/** Route every core log line through `next` (e.g. a request-aware pino logger); `undefined` restores console output. */
export const setLogger = (next: Logger | undefined): void => {
	backingLogger = next;
};

const consoleLog = (level: Level, ...callArgs: Parameters<LogFn>) => {
	const [objOrMsg, msg, ...args] = callArgs;
	const method = level === 'fatal' ? 'error' : level;
	if (typeof objOrMsg !== 'string' && msg) {
		// eslint-disable-next-line no-console
		console[method](msg, objOrMsg, ...args);
	} else {
		// eslint-disable-next-line no-console
		console[method](...callArgs);
	}
};

const createLogFn =
	(level: Level): LogFn =>
	(...callArgs) => {
		if (backingLogger) {
			backingLogger[level](...callArgs);
		} else {
			consoleLog(level, ...callArgs);
		}
	};

export const logger: Logger = {
	trace: createLogFn('trace'),
	debug: createLogFn('debug'),
	info: createLogFn('info'),
	warn: createLogFn('warn'),
	error: createLogFn('error'),
	fatal: createLogFn('fatal'),
	child: (bindings) => (backingLogger ? backingLogger.child(bindings) : logger)
};

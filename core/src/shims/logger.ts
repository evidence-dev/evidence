/**
 * Logger shim - provides a simple console-based logger with pino-like interface.
 * Can be overridden by consumers that want real pino logging.
 */

type LogFn = (objOrMsg: unknown, msg?: string, ...args: unknown[]) => void;

interface Logger {
	trace: LogFn;
	debug: LogFn;
	info: LogFn;
	warn: LogFn;
	error: LogFn;
	fatal: LogFn;
	child: (bindings: Record<string, unknown>) => Logger;
}

const createLogFn =
	(level: 'trace' | 'debug' | 'info' | 'warn' | 'error'): LogFn =>
	(objOrMsg, msg, ...args) => {
		if (typeof objOrMsg === 'string') {
			// eslint-disable-next-line no-console
			console[level](objOrMsg, msg, ...args);
		} else if (msg) {
			// eslint-disable-next-line no-console
			console[level](msg, objOrMsg, ...args);
		} else {
			// eslint-disable-next-line no-console
			console[level](objOrMsg);
		}
	};

export const logger: Logger = {
	trace: createLogFn('trace'),
	debug: createLogFn('debug'),
	info: createLogFn('info'),
	warn: createLogFn('warn'),
	error: createLogFn('error'),
	fatal: createLogFn('error'),
	child: () => logger
};

import { isDebug, onEnableDebug } from '../lib/debug.js';

/**
 * @typedef {Object} LogDriver
 * @property {(level: keyof EvidenceLogger.EvidenceLogLevels, message: string, meta: any) => unknown} log
 */

export class EvidenceLogger {
	static EvidenceLogLevels = {
		fatal: 0,
		error: 1,
		warn: 2,
		info: 3,
		debug: 4,
		verbose: 5
	};

	/** @type {LogDriver} */
	#logger;

	/** @type {EvidenceLogger.EvidenceLogLevels[keyof EvidenceLogger.EvidenceLogLevels]} */
	logLevel = 3;
	constructor() {
		onEnableDebug(() => (this.logLevel = 4));
		// TODO: Add winston, pino, or a similar library (?)
		this.#logger = {
			/**
			 *
			 * @param {keyof typeof EvidenceLogger.EvidenceLogLevels} level
			 * @param {string} message
			 * @param {Record<string, any>} meta
			 */
			log: (level, message, meta) => {
				/** @type {any[]} */
				const args = [message];
				if (meta) args.push(meta);
				if (EvidenceLogger.EvidenceLogLevels[level] > this.logLevel) return;
				switch (level) {
					case 'fatal':
					case 'error':
						console.error(`[${level.toUpperCase()}]: `, ...args);
						break;
					case 'warn':
						console.warn(`[${level.toUpperCase()}]: `, ...args);
						break;
					default:
					case 'info':
						console.info(`[${level.toUpperCase()}]: `, ...args);
						break;
					case 'debug':
						console.debug(`[${level.toUpperCase()}]: `, ...args);
						break;
					case 'verbose':
						console.debug(`[${level.toUpperCase()}]: `, ...args);
						break;
				}
			}
		};
	}

	/**
	 * @param {string} message
	 * @param {string[]} [detail]
	 * @param {Record<string, any>} [meta]
	 * @param {Record<string, any>} [debugMeta]
	 */
	die(message, detail, meta, debugMeta) {
		this.fatal(`${message}\n${detail ? detail.join('\n') : ''}`, {
			...meta,
			...(isDebug() ? debugMeta : {})
		});
		if (typeof process !== 'undefined') process.exit(1);
	}

	/**
	 *
	 * @param {keyof typeof EvidenceLogger.EvidenceLogLevels} level
	 * @returns {(message: string, meta?: Record<string, any>) => void}
	 */
	#log = (level) => (message, meta) => {
		let out = message;
		this.#logger.log(level, out, meta);
	};

	/**
	 * @param {string} message
	 * @param {Record<string, any>} [meta]
	 */
	fatal = this.#log('fatal');

	/**
	 * @param {string} message
	 * @param {Record<string, any>} [meta]
	 */
	error = this.#log('error');

	/**
	 * @param {string} message
	 * @param {Record<string, any>} [meta]
	 */
	warn = this.#log('warn');

	/**
	 * @param {string} message
	 * @param {Record<string, any>} [meta]
	 */
	info = this.#log('info');

	/**
	 * @param {string} message
	 * @param {Record<string, any>} [meta]
	 */
	debug = this.#log('debug');

	/**
	 * @param {string} message
	 * @param {Record<string, any>} [meta]
	 */
	verbose = this.#log('verbose');

	/** @type {string[]} */
	#measureStack = [];

	/**
	 * @param {string} topic
	 * @returns
	 */
	measure = (topic) => {
		if (!isDebug()) {
			return {
				meta: () => {},
				done: () => {}
			};
		}

		// Start
		const before = performance.now();
		/** @type {Record<string, any>} */
		const meta = {};

		this.#measureStack.push(topic);

		return {
			/**
			 * @param {string} key
			 * @param {any} value
			 */
			meta: (key, value) => {
				meta[key] = value;
			},
			done: () => {
				const after = performance.now();
				const duration = after - before;

				this.#measureStack.pop();
				this.#log('debug')(`Measure: "${topic}"`, {
					duration,
					meta,
					parents: this.#measureStack
				});
			}
		};
	};
}

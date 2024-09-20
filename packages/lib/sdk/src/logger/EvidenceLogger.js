import { isDebug } from '../lib/debug.js';
import chalk from 'chalk';

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
	constructor() {
		if (typeof process !== 'undefined') {
			/** @type {Parameters<LogDriver['log']>[]} */
			const queue = [];
			this.#logger = {
				log: (...args) => queue.push(args)
			};

			import('winston').then((winston) => {
				this.#logger = winston.createLogger({
					level: isDebug() ? 'debug' : 'info',
					format: winston.format.cli({
						levels: EvidenceLogger.EvidenceLogLevels,
						colors: {
							fatal: 'red',
							error: 'red',
							warn: 'yellow',
							info: 'green',
							debug: 'blue',
							verbose: 'gray'
						}
					}),

					levels: EvidenceLogger.EvidenceLogLevels,
					transports: [
						new winston.transports.Console({
							stderrLevels: ['fatal', 'error'],
							consoleWarnLevels: ['warn']
						})
					]
				});

				queue.forEach((queued) => this.#logger.log(...queued));
			});
		} else {
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
					switch (level) {
						case 'fatal':
						case 'error':
							console.error(
								`%c[${level.toUpperCase()}]: `,
								'color: red; font-weight: bold',
								...args
							);
							break;
						case 'warn':
							console.warn(
								`%c[${level.toUpperCase()}]: `,
								'color: yellow; font-weight: bold',
								...args
							);
							break;
						default:
						case 'info':
							console.info(
								`%c[${level.toUpperCase()}]: `,
								'color: green; font-weight: bold',
								...args
							);
							break;
						case 'debug':
							console.debug(
								`%c[${level.toUpperCase()}]: `,
								'color: blue; font-weight: bold',
								...args
							);
							break;
						case 'verbose':
							console.debug(
								`%c[${level.toUpperCase()}]: `,
								'color: gray; font-weight: bold',
								...args
							);
							break;
					}
				}
			};
		}
	}

	/**
	 * @param {string} message
	 * @param {string[]} [detail]
	 * @param {Record<string, any>} [meta]
	 * @param {Record<string, any>} [debugMeta]
	 */
	die(message, detail, meta, debugMeta) {
		this.fatal(
			`${chalk.bold.redBright(message)}\n${chalk.dim(` | ${detail ? detail.join('\n | ') : ''}`)}`,
			{
				...meta,
				...(isDebug() ? debugMeta : {})
			}
		);
		if (typeof process !== 'undefined') process.exit(1);
	}

	/**
	 *
	 * @param {keyof typeof EvidenceLogger.EvidenceLogLevels} level
	 * @returns {(message: string, meta?: Record<string, any>) => void}
	 */
	#log = (level) => (message, meta) => {
		let out = message;
		if (isDebug() && typeof process !== 'undefined') {
			out += '\n' + chalk.dim(` | ${JSON.stringify(meta)}`);
		}
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
}

import winston from 'winston';
import { isDebug } from '../lib/debug.js';
import chalk from 'chalk';

export class EvidenceLogger {
	static EvidenceLogLevels = {
		fatal: 0,
		error: 1,
		warn: 2,
		info: 3,
		debug: 4
	};

	/** @type {winston.Logger} */
	#logger;
	constructor() {
		this.#logger = winston.createLogger({
			level: isDebug() ? 'debug' : 'info',
			format: winston.format.cli({
				levels: EvidenceLogger.EvidenceLogLevels,
				colors: {
					fatal: 'red',
					error: 'red',
					warn: 'yellow',
					info: 'green',
					debug: 'blue'
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
		this.#logger.level = 'debug';
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
		if (isDebug()) {
			console.log('including metadata');
			out += '\n' + chalk.dim(` | ${JSON.stringify(meta)}`);
		}
		this.#logger.log(level, out);
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
}

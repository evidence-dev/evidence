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
			transports: [new winston.transports.Console({
                stderrLevels: ['fatal', 'error'],
                consoleWarnLevels: ['warn'],
            })]
		});
		this.#logger.level = 'debug';
	}

	/**
	 * @param {string} message
	 * @param {string[]} [detail]
	 * @param {Record<string, any>} [meta]
	 */
	die(message, detail, meta) {
		this.fatal(
			`${chalk.bold.redBright(message)}\n${chalk.dim(` | ${detail ? detail.join('\n | ') : ''}`)}`,
			meta
		);
		if (typeof process !== 'undefined') process.exit(1);
	}

	/**
	 * @param {string} message
	 * @param {Record<string, any>} [meta]
	 */
	fatal(message, meta) {
		this.#logger.log('fatal', message, meta);
	}

	/**
	 * @param {string} message
	 * @param {Record<string, any>} [meta]
	 */
	error(message, meta) {
		this.#logger.log('error', message, meta);
	}

	/**
	 * @param {string} message
	 * @param {Record<string, any>} [meta]
	 */
	warn(message, meta) {
		this.#logger.log('warn', message, meta);
	}

	/**
	 * @param {string} message
	 * @param {Record<string, any>} [meta]
	 */
	info(message, meta) {
		this.#logger.log('info', message, meta);
	}

	/**
	 * @param {string} message
	 * @param {Record<string, any>} [meta]
	 */
	debug(message, meta) {
		this.#logger.log('debug', message, meta);
	}
}

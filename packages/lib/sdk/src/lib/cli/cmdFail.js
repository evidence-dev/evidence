import chalk from 'chalk';
import { logFatal } from '../tokens.js';
import { EvidenceError } from '../EvidenceError.js';
import { isDebug } from '../debug.js';

/**
 *
 * @param {string | Error | EvidenceError} message
 * @param {string | string[]} [detail] String message or an array of lines
 */
export const cmdFail = (message, detail) => {
	if (message instanceof EvidenceError) {
		detail = message.context;
		message = message.message;
	} else if (message instanceof Error) {
		if (isDebug()) detail = message.stack;
		message = message.message;
	}
	console.error(`${logFatal} ${chalk.red(message)}`);
	if (detail) {
		let detailMsg = '';

		const newline = '\n' + ' '.repeat(6);
		if (Array.isArray(detail)) {
			detailMsg = detail.join(newline);
		} else {
			detailMsg = detail.split('\n').join(newline);
		}

		console.error(`      ${chalk.dim(detailMsg)}`);
	}
	process.exit(1);
};

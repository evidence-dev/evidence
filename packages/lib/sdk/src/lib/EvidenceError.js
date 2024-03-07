/**
 * @extends {Error}
 * @property {string[]} context
 */
export class EvidenceError extends Error {
	/**
	 * @param {string} message
	 * @param {string[] | string} [context]
	 * @param {ErrorOptions} [opts]
	 */
	constructor(message, context, opts) {
		super(message, opts);

		this.context = context ?? [];
		if (!Array.isArray(this.context)) this.context = [];
	}
}

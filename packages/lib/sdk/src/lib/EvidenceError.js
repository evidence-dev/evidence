/**
 * @extends {Error}
 * @property {string[]} context
 * @property {any} metadata
 */
export class EvidenceError extends Error {
	/**
	 * @param {string} message
	 * @param {string[] | string} [context]
	 * @param {ErrorOptions} [opts]
	 * @param {any} [metadata]
	 */
	constructor(message, context, opts, metadata) {
		super(message, opts);

		this.context = Array.isArray(context) ? context : [context ?? ''];
		if (!context) this.context = /** @type {string[]} */ ([]);
		this.#metadata = metadata;
		if (!Array.isArray(this.context)) this.context = [];
	}

	/** @type {string[]} */
	context = [];

	/** @type {any} */
	#metadata;

	set metadata(data) {
		this.#metadata = data;
	}
	get metadata() {
		if (!this.#metadata) this.#metadata = {};
		return this.#metadata;
	}
}

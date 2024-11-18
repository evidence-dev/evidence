/** @typedef {import("../schemas/plugin-package.schema.js").DatasourcePackage} DatasourcePackage */
/** @typedef {import("./schemas/datasourcePlugin.schema.js").Datasource} Datasource */

import { EvidenceError } from '../../lib/EvidenceError.js';

/** @typedef {[DatasourcePackage, Datasource]} DatasourceTuple */
export class Datasources {
	/** @type {Record<string, DatasourceTuple>} */
	#byPackage = {};

	get byPackage() {
		return this.#byPackage;
	}

	/** @type {Record<string, DatasourceTuple>} */
	#bySource = {};

	get bySource() {
		return this.#bySource;
	}

	/**
	 * Forced map of source name to package name
	 * @type {Record<string,string>}
	 */
	#overrides = {};

	/**
	 * @param {DatasourcePackage} pack
	 * @param {Datasource} source
	 * @param {string[]} [overrides]
	 */
	add(pack, source, overrides) {
		if (!pack.evidence.datasources?.length)
			throw new EvidenceError(
				`${pack.name} is not a valid datasource!`,
				'package.json is missing evidence.datasources array'
			);

		overrides?.forEach((override) => {
			if (Object.keys(this.#overrides).includes(override))
				throw new EvidenceError(
					`${override} has already been overriden by ${this.#bySource[override]}`
				);
			this.#overrides[override] = pack.name;
			this.#bySource[override] = [pack, source];
		});

		pack.evidence.datasources.flat().forEach((sourceName) => {
			if (this.#overrides[sourceName] && this.#overrides[sourceName] !== pack.name) {
				console.debug(
					`Ignoring source type "${sourceName}" from ${pack.name}, already overriden by ${this.#overrides[sourceName]}`
				);
			}
			this.#bySource[sourceName] = [pack, source];
		});

		this.#byPackage[pack.name] = [pack, source];
	}

	/** @param {string} packageName */
	getByPackageName(packageName) {
		return this.#byPackage[packageName];
	}
	/** @param {string} sourceName */
	getBySource(sourceName) {
		return this.#bySource[sourceName];
	}

	/** @returns {string[]} */
	getCanonicalSources() {
		return Object.values(this.#byPackage)
			.map(([pack]) => {
				if (!pack.evidence.datasources) {
					throw new EvidenceError(
						'Non-Datasource plugin was loaded as a plugin. (This is an Evidence Error)'
					);
				}
				return pack.evidence.datasources.map((source) =>
					Array.isArray(source) ? source[0] : source
				);
			})
			.flat();
	}
}

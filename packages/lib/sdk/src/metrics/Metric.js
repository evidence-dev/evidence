import { Query, hashQuery } from '../usql/index.js';
import { applyCut, metricDefToSql } from './metricDefToSql.js';
import { sql as taggedSql } from '@uwdata/mosaic-sql';

export class Metric extends Query {
	/** @type {string} */
	name = '';

	/** @type {string} */
	description = '';

	/** @type {Object} */
	get chartSpec()  {
		return {
			x: 'grain',
			y: this.#metric?.name,
			series: this.#cut?.dimensions
		}
	};

	/** @type {{value: string, label: string}[]} */
	timeGrains = [];

	/** @type {string[]} */
	activeDimensions = [];

	/** @type {import("./types.js").MetricSpec | undefined} */
	#metric = undefined;
	/**
	 * @protected
	 * @param {import("./types.js").MetricSpec} metric
	 * */
	registerMetric = (metric) => {
		if (!this.#metric) {
			this.#metric = metric;
		}
	};

	/** @type {import("./types.js").MetricCut | undefined} */
	#cut = undefined;
	/**
	 * @protected
	 * @param {import("./types.js").MetricCut} cut
	 */
	registerCut = (cut) => {
		if (!this.#cut) this.#cut = cut;
	};

	/**
	 * @param {Parameters<import('../usql/types.js').CreateQuery<any>>} args
	 * @returns {import('./types.js').MetricValue}
	 */
	static create(...args) {
		console.warn('Use Metric.createMetric rather than Metric.create');
		return /** @type {import('./types.js').MetricValue} */ (super.create.bind(this)(...args));
	}

	/**
	 * @param {import('./types.js').MetricSpec} metric
	 * @param {import('../usql/types.js').QueryReactivityOpts} reactiveOpts
	 * @param {import('../usql/types.js').QueryOpts} queryOpts
	 */
	static createMetric = (metric, reactiveOpts, queryOpts) => {
		if (!metric) throw new Error('Metric must be defined');
		const factory = super.createReactive(
			{
				...reactiveOpts,
				callback: (newMetric, cut) => {
					if (!Metric.isMetric(newMetric)) throw new Error('Expected return value to be Metric');
					if (!(newMetric instanceof Metric)) throw new Error('Expected return value to be Metric');
					newMetric.registerMetric(metric);
					newMetric.registerCut(cut);
					reactiveOpts.callback(newMetric);
				}
			},
			{ ...queryOpts, id: `Metric-${metric.name}` }
		);
		/**
		 * @param {any} cut
		 */
		return (cut) => {
			factory(metricDefToSql(metric, cut), undefined, cut);
		};
	};

	/**
	 * Groups a metric by some time grain and set of dimensions
	 * @param {string[]} dimensions
	 * @param {import("./types.js").MetricTimeGrains} grain
	 * @returns {import('./types.js').MetricValue}
	 */
	cut(dimensions, grain) {
		if (!this.#metric) throw new Error('Metric must be defined');
		const q = applyCut(this.#metric, { dimensions, grain });

		const out = /** @type {import('./types.js').MetricValue} */ (
			this.derive(q, {
				id: `Metric-${this.#metric.name}-cut-${hashQuery(JSON.stringify({ dimensions, grain }))}`
			})
		);
		out.registerCut({ dimensions, grain });
		out.registerMetric(this.#metric);

		return out;
	}

	/**
	 * Expands to include child metrics as rows
	 */
	expand() {}

	/**
	 * Filters the metric on dimension or set of dimensions
	 * @param {Record<string, string>} filters
	 */
	filter(filters) {
		if (!this.#metric || !this.#cut) throw new Error(`Metric was not registered, not ready to filter yet`)
		let out = applyCut(this.#metric, this.#cut);
		for (const [ dimension, value ] of Object.entries(filters)) {
			if (!this.#metric?.dimensions.includes(dimension)){
				console.warn(`Unknown dimension: ${dimension}`);
				continue
			}
			out = out.where(taggedSql`"${dimension}" = '${value}'`);
		}

		return this.derive(out)
	}

	/**
	 * @ignore
	 * @private
	 */
	get isMetric() {
		return true;
	}

	/**
	 * @param {unknown} m
	 * @returns {q is Metric}
	 */
	static isMetric = (m) => {
		// TODO: Should we type-narrow on row type as well
		// Type narrow
		if (typeof m !== 'object' || !m) return false;

		const hasDuckType = 'isMetric' in m && m['isMetric'] === true;

		return hasDuckType;
	};
}

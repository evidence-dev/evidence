import { Query } from '../usql/index.js';
import { metricDefToSql } from './metricDefToSql.js';

export class Metric extends Query {
	/** @type {string} */
	name = '';

	/** @type {string} */
	description = '';

	/** @type {Object} */
	chartSpec = {
		x: '',
		y: '',
		series: ''
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
		if (this.#metric) throw new Error('Metric already registered');
		this.#metric = metric;
	};

	/** @type {import("./types.js").MetricCut | undefined} */
	#cut = undefined;
	/**
	 * @protected
	 * @param {import("./types.js").MetricCut} cut
	 */
	registerCut = (cut) => {
		if (this.#cut) throw new Error('Cut already registered');
		this.#cut = cut;
	};

	/** @returns {import('../usql/index.js').QueryValue<any>} */
	static create() {
		throw new Error('Use Metric.createMetric');
	}

	/**
	 * @param {import('./types.js').MetricSpec} metric
	 * @param {import('../usql/types.js').QueryReactivityOpts} reactiveOpts
	 * @param {import('../usql/types.js').QueryOpts} queryOpts
	 */
	static createMetric(metric, reactiveOpts, queryOpts) {
		
		if (!metric) throw new Error('Metric must be defined');
		const factory = super.createReactive.bind(Metric)(
			{
				...reactiveOpts,
				callback: (newMetric, cut) => {
					if (!(newMetric instanceof Metric)) throw new Error('Expected return value to be Metric');
					console.log(newMetric)
					newMetric.registerMetric(metric);
					// newMetric.registerCut(cut);
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
	}

	/**
	 * @param {string[]} dimensions
	 * @param {import("./types.js").MetricTimeGrains} grain
	 * @returns {import('../usql/query/Query.js').QueryValue}
	 */
	cut(dimensions, grain) {
		/** @type {import('../usql/query/Query.js').QueryValue<any>} */
		let out = this.value;
		if (dimensions?.length) {
			out = out.groupBy(dimensions, false);
		}
		if (grain) {
			out = out.groupBy([grain], false);
		}
		// TODO: is out a Metric or a Query?
		return out;
	}


	constructor(...args) {super(...args)}
}

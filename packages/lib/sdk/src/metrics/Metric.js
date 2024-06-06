import { Query } from '../usql/index.js';

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

	/** @type {Metric[]} */
	dependencies = [];

	/** @type {{value: string, label: string}[]} */
	timeGrains = [];

    /** @type {string[]} */
    activeDimensions = [];

	// constructor(...args) {
	// 	super(...args);
	// }

	// /**
	//  * @param {import("./types.js").MetricDef} metric
	//  * @param {Parameters<typeof Query['create']>} args
	//  */
	// static create(metric, ...args) {
	// 	const out = super.create(...args);
    //     if (!(out instanceof Metric)) {
    //         throw new Error('Expected returned value to be a metric, not a query')
    //     }

	// 	out.name = metric.name;
	// 	out.description = metric.description;
	// 	out.chartSpec = {
	// 		x: 'grain',
	// 		y: metric.name,
	// 		series: [] // figure out how to use activeDimensions
	// 	};
	// 	return out;
	// }

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
}

// timeSeriesStore.js
import { Query as QueryBuilder, sql as taggedSql } from '@evidence-dev/sdk/query-builder';
import { Query } from '@evidence-dev/sdk/usql';
import { query } from '@evidence-dev/universal-sql/client-duckdb';
import { writable } from 'svelte/store';
import { get } from 'svelte/store';

export class TimeSeriesStore {
	/** @type {QueryValue<RowType>} */
	#value = [];
	#xValue = undefined;

	/// Data
	/** @type {RowType[]} */
	#data = [];

	#metricsStore = writable([]);

	#lastDate = new Date();

	#filteredData = [];

	subscribeToMetrics = (callback) => {
		return this.#metricsStore.subscribe(callback);
	};

	//runs whenever data changes
	updateData = async (data, x) => {
		//need to fix update data re-running probably due to metrics causing a update each time it get updated
		this.#xValue = x;
		// Wait for all the metrics to be loaded
		await Promise.all(get(this.#metricsStore).map((metric) => metric.promise));

		// Run buildNewQuery after data has been updated and all metrics have been loaded
		this.buildNewQuery(data);
	};

	updateMetrics = (metrics) => {
		return new Promise((resolve) => {
			this.#metricsStore.update((m) => [...m, metrics]);
			resolve();
		});
	};

	buildNewQuery = async (data, x) => {
		const newQueryBuild = new QueryBuilder();
		newQueryBuild
			.select(`${this.#xValue}`, {
				...get(this.#metricsStore).reduce(
					(acc, obj) => ({ ...acc, [obj.label]: taggedSql`${obj.metric}` }),
					{}
				)
			})
			.from(taggedSql`(${data.originalText}) GROUP BY ALL ORDER BY ${this.#xValue} ASC`);
		let metricQuery = Query.create(newQueryBuild.toString(), query);
		console.log(newQueryBuild.toString());

		this.#data = await metricQuery.fetch();
		this.#lastDate =
			this.#data.length > 0
				? new Date(this.#data[this.#data.length - 1][this.#xValue])
				: new Date();

		this.filterData('1Y');

		this.publish('buildNewQuery');
	};

	filterData = (selectedTimeRange) => {
		this.#filteredData = this.filterDataByTimeRange(this.#data, this.#lastDate, selectedTimeRange);
		this.#value = this.#filteredData;
		this.publish('filterData');
	};

	filterDataByTimeRange(data, lastDate, timeRange) {
		const endDate = new Date(lastDate);
		let startDate;

		if (typeof timeRange === 'string') {
			timeRange = timeRange.toUpperCase();
		}

		switch (timeRange) {
			case '1W':
				startDate = new Date(endDate);
				startDate.setDate(startDate.getDate() - 7);
				break;
			case '1M':
				startDate = new Date(endDate);
				startDate.setMonth(startDate.getMonth() - 1);
				break;
			case '3M':
				startDate = new Date(endDate);
				startDate.setMonth(startDate.getMonth() - 3);
				break;
			case '1Y':
				startDate = new Date(endDate);
				startDate.setFullYear(startDate.getFullYear() - 1);
				break;
			case 'YTD':
				startDate = new Date(endDate.getFullYear(), 0, 1);
				break;
			case 'All':
				return [...data];
			default:
				startDate = new Date(endDate);
				startDate.setFullYear(startDate.getFullYear() - 1);
		}

		return data.filter((item) => {
			return new Date(item[this.#xValue]) >= startDate && new Date(item[this.#xValue]) <= endDate;
		});
	}
	////////////////////////////////////
	/// < Implement Store Contract > ///
	////////////////////////////////////
	/** @type {Set<import('../types.js').Subscriber<QueryValue<RowType>>>} */
	#subscribers = new Set();

	/**
	 * @param {import('../types.js').Subscriber<QueryValue<RowType>>} fn
	 * @returns {() => void} Unsubscribe function
	 */
	subscribe = (fn) => {
		this.#subscribers.add(fn);
		fn(this.#value);
		return () => this.#subscribers.delete(fn);
	};

	#publishIdx = 0;
	/**
	 * @protected
	 */
	publish = () => {
		if (this.#publishIdx++ > 100000) throw new Error('Query published too many times.');

		this.#subscribers.forEach((fn) => fn(this.#value));
	};
	//////////////////////////////////////
	/// </ Implement Store Contract /> ///
	//////////////////////////////////////
}

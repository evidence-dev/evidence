// timeSeriesStore.js
import { Query as QueryBuilder, sql as taggedSql } from '@evidence-dev/sdk/query-builder';
import { Query } from '@evidence-dev/sdk/usql';
import { query } from '@evidence-dev/universal-sql/client-duckdb';

export class TimeSeriesStore {
	/** @type {QueryValue<RowType>} */
	#xValue = undefined;

	/// Data
	/** @type {RowType[]} */
	#data = [];

	#metricStore = [];

	#lastDate = new Date();

	#filteredData = [];

	#value = { data: this.#data, metricsStore: this.#metricStore };

	#error = undefined;

	//runs whenever data changes
	updateData = async (data, x) => {
		//need to fix update data re-running probably due to metrics causing a update each time it get updated
		this.#xValue = x;

		// Wait for all the metrics to be loaded
		await Promise.all(this.#metricStore.map((metric) => metric.promise));
		this.value = { ...this.#value, metricsStore: this.#metricStore };

		// Run buildNewQuery after data has been updated and all metrics have been loaded
		this.buildNewQuery(data);
	};

	updateMetrics = (metrics) => {
		return new Promise((resolve) => {
			this.#metricStore.push(metrics);
			resolve();
		});
	};

	buildNewQuery = async (data) => {
		try {
			// Ensure that #xValue is valid and not causing issues
			if (!this.#xValue) {
				throw new Error('Invalid xValue: Cannot proceed with query building.');
			}

			// Create a new query builder instance
			const newQueryBuild = new QueryBuilder();

			// Build the select clause dynamically using reduce
			const selectFields = this.#metricStore.reduce(
				(acc, obj) => ({ ...acc, [obj.label]: taggedSql`${obj.metric}` }),
				{}
			);

			// Attempt to build the query
			newQueryBuild
				.select(`${this.#xValue}`, selectFields)
				.from(taggedSql`(${data.originalText}) GROUP BY ALL ORDER BY ${this.#xValue} ASC`);
			// Try to create and execute the query
			const queryResult = Query.create(newQueryBuild.toString(), query);

			this.#data = await queryResult.fetch();

			if (queryResult.error) {
				this.#error = queryResult.error;
			}
			// Set the last date based on the fetched data
			this.#lastDate =
				this.#data.length > 0
					? new Date(this.#data[this.#data.length - 1][this.#xValue])
					: new Date();

			// Apply the filter for '1Y'
			this.filterData('1Y');

			// Publish the event after the query is built
			this.publish('buildNewQuery');
		} catch (error) {
			// Handle any errors that occur during the query building or fetching process
			console.error('Error during query execution:', error.message);
			// Optionally, notify the user or reset the UI if needed
		}
	};

	filterData = (selectedTimeRange) => {
		this.#filteredData = this.filterDataByTimeRange(this.#data, this.#lastDate, selectedTimeRange);
		this.#value = { ...this.#value, data: this.#filteredData };
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
		fn({ value: this.#value, error: this.#error });
		return () => this.#subscribers.delete(fn);
	};

	#publishIdx = 0;
	/**
	 * @protected
	 */
	publish = () => {
		if (this.#publishIdx++ > 100000) throw new Error('Query published too many times.');

		this.#subscribers.forEach((fn) => fn({ value: this.#value, error: this.#error }));
	};
	//////////////////////////////////////
	/// </ Implement Store Contract /> ///
	//////////////////////////////////////
}

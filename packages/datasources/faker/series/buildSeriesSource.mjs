import fs from 'fs/promises';
import cloneDeep from 'lodash.clonedeep';
import path from 'path';
import yaml from 'yaml';

/**
 *
 * @param {string} sourceDir Assumed to exist already
 * @param {string} libDir Assumed to exist already
 * @param {string} connectionName
 */
export const buildSeriesSource = async (sourceDir, libDir, connectionName) => {
	const baseNumericTable = {
		rows: 100,
		fuzz: 0,
		series: {
			type: 'numeric',
			columns: {
				x: {
					type: 'number'
				},
				y: {
					category: 'number',
					item: 'int',
					options: [
						{
							min: 0,
							max: 1000
						}
					]
				},
				series: {
					count: 4
				}
			}
		}
	};

	const nameMods = {
		xGaps: 'xgaps',
		yNulls: 'ynulls',
		seriesAlwaysExists: 'seriesgaps'
	};

	/** @type {*} */
	let queries = {};

	for (const xGaps of [false, true]) {
		for (const yNulls of [false, true]) {
			for (const seriesAlwaysExists of [false, true]) {
				let tableName = 'numeric_series';
				const table = cloneDeep(baseNumericTable);
				if (xGaps) {
					table.series.columns.x.gaps = true;
					tableName += `_${nameMods['xGaps']}`;
				}
				if (yNulls) {
					table.series.columns.y.nulls = true;
					tableName += `_${nameMods['yNulls']}`;
				}
				if (!seriesAlwaysExists) {
					table.series.columns.series.alwaysExists = false;
					tableName += `_${nameMods['seriesAlwaysExists']}`;
				}

				await fs.writeFile(path.join(sourceDir, `${tableName}.yaml`), yaml.stringify(table));

				let q = queries;
				if (!q['numeric_series']) q['numeric_series'] = {};
				q = q['numeric_series'];
				if (!q[xGaps.toString()]) q[xGaps.toString()] = {};
				q = q[xGaps.toString()];
				if (!q[yNulls.toString()]) q[yNulls.toString()] = {};
				q = q[yNulls.toString()];
				if (!q[seriesAlwaysExists.toString()]) q[seriesAlwaysExists.toString()] = {};
				q = q[seriesAlwaysExists.toString()];

				q['text'] = `SELECT * FROM ${connectionName}.${tableName}`;
				q['store'] = `Query.create("${q['text']}", query)`;
			}
		}
	}
	return queries;
};

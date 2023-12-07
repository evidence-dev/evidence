import { Faker, en } from '@faker-js/faker';
import yaml from 'yaml';
import path from 'path';
import { filter } from './filter.mjs';
import fs from 'fs/promises';
import chalk from 'chalk';

function sigmoid(x) {
	return 1 / (1 + Math.exp(-x));
}

/** @type {(mean: number, standardDeviation: number) => import("@faker-js/faker).Randomizer}*/
const randomBiasedNumber = (mean, standardDeviation) => ({
	next: () => {
		// const randomValue = Math.random()

		// return Math.abs(randomValue * standardDeviation + mean);
		const u = 1 - Math.random(); // Converting [0,1) to (0,1]
		const v = 1 - Math.random();
		const randomValue = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

		const scaledValue = randomValue * standardDeviation + mean;
		const boundedValue = sigmoid(scaledValue); // Scale to [0, 1] using sigmoid function

		return boundedValue;
	}
});

/** @typedef {"number" | "id" | "uuid" | "animal" } ColumnType */

/**
 * @typedef {Object} OutputColumnType
 * @property {string} name
 * @property {'boolean' | 'number' | 'string' | 'date'} evidenceType
 * @property {'precise' | 'inferred'} typeFidelity
 */

/**
 * @param {unknown} t
 * @return {Omit<OutputColumnType, "name">}
 */
const getColumnType = (t) => {
	switch (typeof t) {
		case 'number':
			return {
				evidenceType: 'number',
				typeFidelity: 'precise'
			};
		case 'string':
			return {
				evidenceType: 'string',
				typeFidelity: 'precise'
			};
		case 'boolean':
			return {
				evidenceType: 'boolean',
				typeFidelity: 'precise'
			};
		default:
			if (t instanceof Date) {
				return {
					evidenceType: 'date',
					typeFidelity: 'precise'
				};
			}
			console.log(t, JSON.stringify(t));
			throw new Error('could not infer type of ', t);
	}
};

/**
 * @param {Record<string, unknown>} row
 */
const buildOutputTypes = (row) => {
	/** @type {OutputColumnType[]} */
	const outputColumnTypes = [];
	for (const colName in row) {
		outputColumnTypes.push({
			name: colName,
			...getColumnType(row[colName])
		});
	}
	return outputColumnTypes;
};

const getFakerValue = (
	category,
	item,
	options,
	targetField,
	colName,
	withBias,
	faker,
	biasedFaker
) => {
	const _faker = withBias ? biasedFaker : faker;
	if (!(category in _faker))
		throw new Error(
			`(${colName}) ${category} is not a valid category; please see https://fakerjs.dev/api/`
		);
	if (!(item in _faker[category]))
		throw new Error(
			`(${colName}) ${category}.${item} does not exist; please see https://fakerjs.dev/api/`
		);
	const value = _faker[category][item](options);
	if (targetField) return value[targetField];
	return value;
};

const buildRow = async (schema, tableName, rowNum, faker, biasedFaker) => {
	const output = {};
	for (const colName in schema) {
		if (schema[colName].type === 'id') {
			output[colName] = rowNum;
		} else if (schema[colName].type === 'fk') {
			const targetTablePath = schema[colName].target?.tablePath;
			if (!targetTablePath) {
				throw new Error(
					`Failed to get table path for ${colName}. This is a bug in faker-datasource`
				);
			}

			const _faker = schema[colName].withBias ? biasedFaker : faker;
			const targetTable = await tableMap.get(targetTablePath);
			const targetRow = _faker.helpers.arrayElement(targetTable.rows);
			const targetField = schema[colName].target?.field ?? 'id';
			if (!(targetField in targetRow)) {
				throw new Error(
					`Target (${schema[colName].target?.table}) does not contain field ${targetField}`
				);
			}
			output[colName] = targetRow[targetField];
		} else if ('oneof' in schema[colName]) {
			const _faker = schema[colName].withBias ? biasedFaker : faker;
			const fieldType = _faker.helpers.arrayElement(schema[colName].oneof);
			const { category, item, options, targetField, withBias } = fieldType;
			output[colName] = getFakerValue(
				category,
				item,
				options,
				targetField,
				colName,
				withBias,
				faker,
				biasedFaker
			);
		} else {
			const { category, item, options, targetField, withBias } = schema[colName];
			output[colName] = getFakerValue(
				category,
				item,
				options,
				targetField,
				colName,
				withBias,
				faker,
				biasedFaker
			);
		}
	}
	return output;
};

/** @type {Map<string, Promise<{ rows: any[], columnTypes: OutputColumnType[] }>>} */
const tableMap = new Map();
/** @type {Map<string, string[]>} */
const relations = new Map();

/**
 *
 * @param {string} directory
 * @param {Faker} biasedFaker
 * @returns
 */
const generateTable = (directory, faker, biasedFaker) => async (content, filepath) => {
	let res, rej;
	const wrappingPromise = new Promise((resolve, reject) => {
		res = resolve;
		rej = reject;
	});

	if (tableMap.has(filepath)) {
		return tableMap.get(filepath);
	}

	tableMap.set(filepath, wrappingPromise);
	try {
		const definition = yaml.parse(content);

		const name = filepath.split(path.sep).pop().split('.').shift();
		const rows = [];

		if ('literal' in definition) {
			if (!Array.isArray(definition.literal))
				throw new Error(
					`${filepath
						.split(path.sep)
						.pop()} is trying to be a literal table, but does not have an array!`
				);
			rows.push(...definition.literal.map((row, rowIdx) => ({ id: rowIdx, ...row })));
		} else {
			if (!('rows' in definition))
				throw new Error(
					`${filepath.split(path.sep).pop()} is missing required required field "rows"`
				);
			if (!(typeof definition.rows === 'number'))
				throw new Error(`${filepath.split(path.sep).pop()} "rows" must be a number`);
			if (!('schema' in definition))
				throw new Error(
					`${filepath.split(path.sep).pop()} is missing required required field "schema"`
				);
			if (!(typeof definition.schema === 'object'))
				throw new Error(`${filepath.split(path.sep).pop()} "schema" must be an object`);

			const foreignKeys = Object.values(definition.schema).filter((col) => col.type === 'fk');
			const foreignKeyTargets = foreignKeys
				.map((col) => {
					// TODO: Notify about this better; maybe wrap fk and fkt into reduce of entries?
					if (!('target' in col)) {
						console.warn(`Foreign Key ${col} is missing a target file!`);
						return false;
					}
					if (typeof col.target !== 'object') {
						console.warn(`Foreignt Key ${col} has a malformed target; must be object`);
						return false;
					}
					if (!('table' in col.target)) {
						console.warn(`Foreign Key ${col} is missing a target table!`);
						return false;
					}
					col.target.tablePath = path.join(directory, col.target.table);
					return col.target.tablePath;
				})
				.reduce((acc, v) => (v && !acc.includes(v) ? [...acc, v] : acc), []);

			relations.set(filepath, foreignKeyTargets);

			for (const fkt of foreignKeyTargets) {
				// Check for a circular reference
				if (relations.has(fkt) && relations.get(fkt).includes(filepath)) {
					throw new Error(
						`Circular dependency found in foreign keys; ${filepath} -> ${fkt} -> ${filepath}`
					);
				}
				// Ensure that all dependency tables are generated
				if (!tableMap.has(fkt)) {
					const content = await fs.readFile(fkt).then((r) => r.toString());
					await generateTable(directory, faker, biasedFaker)(content, fkt);
				}
			}

			let rowCount = definition.rows;
			if ('fuzz' in definition) {
				if (typeof definition.fuzz !== 'number') {
					console.warn('Row fuzz was detected but is not a number, skipping');
				} else {
					rowCount += faker.number.int({ min: -1 * definition.fuzz, max: definition.fuzz });
				}
			}
			for (let i = 0; i < rowCount; i++) {
				rows.push(await buildRow(definition.schema, name, i, faker, biasedFaker));
			}
		}

		const filteredRows = filter(rows, definition.filters ?? []);

		const output = {
			rows: filteredRows,
			columnTypes: buildOutputTypes(rows[0]),
			expectedRowCount: filteredRows.length
		};

		res(output);

		return output;
	} catch (e) {
		rej(e);
		throw e;
	}
};

function recursiveFlatten(obj) {
	return Object.fromEntries(
		Object.entries(obj).map(([k, v]) => {
			if (typeof v === 'object') {
				if (Array.isArray(v)) {
					return [k, v.flat()];
				}
				if (v.prototype === undefined || v.prototype === null) {
					return [k, recursiveFlatten(v)];
				} else {
					return [k, v];
				}
			} else {
				return [k, v];
			}
		})
	);
}

/**
 * @param {{locale?: import("@faker-js/faker").LocaleDefinition}} options
 * @param {string} directory
 */
export const getRunner = (options, directory) => {
	const locale = [en];
	tableMap.clear();

	if (options.locale) {
		options.locale.title = options.locale.title ?? 'Custom Locale';
		locale.splice(0, 0, recursiveFlatten(options.locale));
	}

	const biasedFaker = new Faker({
		randomizer: randomBiasedNumber(Math.random(), 1),
		locale: locale
	});

	const faker = new Faker({
		locale: locale
	});

	console.warn(
		chalk.bold.dim.yellow(
			'  You are using the faker-datasource, this is not recommended for production use.\n'
		)
	);
	return generateTable(directory, faker, biasedFaker);
};

export const testConnection = () => Promise.resolve(true);
export const options = {};

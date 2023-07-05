import { faker } from '@faker-js/faker';
import yaml from 'yaml';
import path from 'path';
import { filter } from './filter.mjs';
import fs from 'fs/promises';
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

const getFakerValue = (category, item, options, targetField, colName) => {
	if (!(category in faker))
		throw new Error(
			`(${colName}) ${category} is not a valid category; please see https://fakerjs.dev/api/`
		);
	if (!(item in faker[category]))
		throw new Error(
			`(${colName}) ${category}.${item} does not exist; please see https://fakerjs.dev/api/`
		);
	const value = faker[category][item](options);
	if (targetField) return value[targetField];
	return value;
};

const buildRow = async (schema, tableName, rowNum) => {
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
			const targetTable = await tableMap.get(targetTablePath);
			const targetRow = faker.helpers.arrayElement(targetTable.rows);
			const targetField = schema[colName].target?.field ?? 'id';
			if (!(targetField in targetRow)) {
				throw new Error(
					`Target (${schema[colName].target?.table}) does not contain field ${targetField}`
				);
			}
			output[colName] = targetRow[targetField];
		} else if ('oneof' in schema[colName]) {
			const fieldType = faker.helpers.arrayElement(schema[colName].oneof);
			const { category, item, options, targetField } = fieldType;
			output[colName] = getFakerValue(category, item, options, targetField, colName);
		} else {
			const { category, item, options, targetField } = schema[colName];
			output[colName] = getFakerValue(category, item, options, targetField, colName);
		}
	}
	return output;
};

/** @type {Map<string, Promise<{ rows: any[], columnTypes: OutputColumnType[] }>>} */
const tableMap = new Map();
/** @type {Map<string, string[]>} */
const relations = new Map();

const generateTable = (directory) => async (content, filepath) => {
	let res, rej;
	const wrappingPromise = new Promise((resolve, reject) => {
		res = resolve;
		rej = reject;
	});

	if (tableMap.has(filepath)) {
		return tableMap.get(filepath);
	}
	console.log(`  |  | Generating ${filepath}`);

	tableMap.set(filepath, wrappingPromise);
	try {
		const definition = yaml.parse(content);

		if (!('rows' in definition))
			throw new Error(`${filepath.split('/').pop()} is missing required required field "rows"`);
		if (!(typeof definition.rows === 'number'))
			throw new Error(`${filepath.split('/').pop()} "rows" must be a number`);
		if (!('schema' in definition))
			throw new Error(`${filepath.split('/').pop()} is missing required required field "schema"`);
		if (!(typeof definition.schema === 'object'))
			throw new Error(`${filepath.split('/').pop()} "schema" must be an object`);

		const name = filepath.split('/').pop().split('.').shift();

		const rows = [];

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
				await generateTable(directory)(content, fkt);
			}
		}

		console.log(`  | | Creating rows for ${name}`);
		let rowCount = definition.rows;
		if ('fuzz' in definition) {
			if (typeof definition.fuzz !== 'number') {
				console.warn('Row fuzz was detected but is not a number, skipping');
			} else {
				rowCount += faker.number.int({ min: -1 * definition.fuzz, max: definition.fuzz });
			}
		}
		for (let i = 0; i < rowCount; i++) {
			rows.push(await buildRow(definition.schema, name, i));
		}

		console.log(`  | | Filtering ${name}`);
		const filteredRows = filter(rows, definition.filters ?? []);

		const output = {
			rows: filteredRows,
			columnTypes: buildOutputTypes(rows[0])
		};

		res(output);

		return output;
	} catch (e) {
		rej(e);
		throw e;
	}
};

/**
 * @param {{}} options
 * @param {string} directory
 */
export const getRunner = (options, directory) => {
	console.warn('You are using the faker-datasource, this is not recommended for production use.');
	return generateTable(directory);
};

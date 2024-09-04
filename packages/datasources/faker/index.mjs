import { Faker, en } from '@faker-js/faker';
import yaml from 'yaml';
import path from 'path';
import { filter } from './filter.mjs';
import fs from 'fs/promises';
import chalk from 'chalk';
import seedrandom from 'seedrandom';
import { FakerTableSchema } from './schemas/index.mjs';
import { cleanZodErrors } from './lib.mjs';
import { genNumericSeries } from './series/numeric.series.mjs';

/** @typedef {() => Faker} FakerFactory */

/** @param {number} x */
function sigmoid(x) {
	return 1 / (1 + Math.exp(-x));
}

/** @type {(mean: number, standardDeviation: number) => import("@faker-js/faker").Randomizer} */
const randomBiasedNumber = (mean, standardDeviation) => {
	let rng = seedrandom(); // Create a new random number generator instance

	/**
	 * @param {number} s
	 * @returns void
	 */
	const seed = (s) => {
		rng = seedrandom(s.toString(), { global: false });
	};

	const next = () => {
		const u = 1 - rng(); // Converting [0,1) to (0,1]
		const v = 1 - rng();
		const randomValue = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

		const scaledValue = randomValue * standardDeviation + mean;
		const boundedValue = sigmoid(scaledValue); // Scale to [0, 1] using sigmoid function

		return boundedValue;
	};

	return { seed, next };
};

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
			throw new Error('could not infer type');
	}
};

/**
 * @param {Record<string, unknown>[]} data
 */
const buildOutputTypes = (data) => {
	/** @type {OutputColumnType[]} */
	const outputColumnTypes = [];
	for (const colName in data[0]) {
		let found = false;
		for (let i = 0; i < data.length; i++) {
			if (data[i][colName] !== null) {
				outputColumnTypes.push({
					name: colName,
					...getColumnType(data[i][colName])
				});
				found = true;
				break;
			}
		}
		if (!found) throw new Error(`Could not infer type for ${colName}`);
	}
	return outputColumnTypes;
};

const getFakerValue = (
	/** @type {string} */ category,
	/** @type {string} */ item,
	/** @type {any} */ options,
	/** @type {string | number | symbol | undefined} */ targetField,
	/** @type {string} */ colName,
	/** @type {any} */ withBias,
	/** @type {any} */ faker,
	/** @type {any} */ biasedFaker
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
	const value = _faker[category][item](...(options ?? []));
	if (targetField) return value[targetField];
	return value;
};

const buildRow = async (
	/** @type {Record<string, import("zod").infer<typeof import("./schemas/faker.schema.mjs").ColumnSchema>>}*/ schema,
	/** @type {number} */ rowNum,
	/** @type {Faker} */ faker,
	/** @type {Faker} */ biasedFaker
) => {
	/** @type {Record<string, string | number | boolean | Date>} */
	const output = {};
	for (const colName in schema) {
		const col = schema[colName];
		if ('type' in col) {
			switch (col.type) {
				case 'fk': {
					const targetTablePath = col.target?.tablePath;
					if (!targetTablePath) {
						throw new Error(
							`Failed to get table path for ${colName}. This is a bug in faker-datasource`
						);
					}

					const _faker = col.withBias ? biasedFaker : faker;
					const targetTable = await tableMap.get(targetTablePath);
					if (!targetTable) throw new Error(`ReferenceError: ${targetTable} does not exist`);
					const targetRow = _faker.helpers.arrayElement(targetTable.rows);
					const targetField = col.target?.field ?? 'id';
					if (!(targetField in targetRow)) {
						throw new Error(`Target (${col.target?.table}) does not contain field ${targetField}`);
					}

					output[colName] = targetRow[targetField];
					break;
				}
				case 'id':
					output[colName] = rowNum;
					break;
			}
		} else if ('oneof' in col) {
			const _faker = col.withBias ? biasedFaker : faker;
			const fieldType = _faker.helpers.arrayElement(col.oneof);
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
			const { category, item, options, targetField, withBias } = col;
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
 * @param {string} directory
 * @param {FakerFactory} getFaker
 * @param {FakerFactory} getBiasedFaker
 */
const generateTable =
	(directory, getFaker, getBiasedFaker) =>
	/**
	 * @param {string} content
	 * @param {string} filepath
	 */
	async (content, filepath) => {
		const faker = getFaker();
		const biasedFaker = getBiasedFaker();

		if (!filepath.endsWith('yaml')) return null;
		/** @type {(v: any) => void} */
		let res = () => {},
			/** @type {(v: any) => void} */
			rej = () => {};
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

			/** @type {*[]} */
			const rows = [];

			const r = FakerTableSchema.safeParse(definition);

			if (!r.success) {
				console.error(`${filepath.split(path.sep).pop()} is invalid`);
				console.error(yaml.stringify(cleanZodErrors(r.error.format())));
				return null;
			}

			if ('literal' in r.data) {
				rows.push(
					r.data.literal.map((/** @type {Object} */ r, /** @type {number} */ rIdx) => ({
						id: rIdx,
						...r
					}))
				);
			} else {
				let rowCount = r.data.rows;
				if (r.data.fuzz) rowCount += faker.number.int({ min: -1 * r.data.fuzz, max: r.data.fuzz });

				if ('series' in r.data) {
					// Series
					switch (r.data.series.type) {
						case 'categorical':
							break;
						case 'numeric':
							rows.push(...genNumericSeries(r.data.series, rowCount, faker, biasedFaker));
					}
				} else {
					// Schema

					// Handle foreign keys
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
						const relation = relations.get(fkt);
						if (relation && relation.includes(filepath)) {
							throw new Error(
								`Circular dependency found in foreign keys; ${filepath} -> ${fkt} -> ${filepath}`
							);
						}
						// Ensure that all dependency tables are generated
						if (!tableMap.has(fkt)) {
							const content = await fs.readFile(fkt).then((r) => r.toString());
							await generateTable(directory, getFaker, getBiasedFaker)(content, fkt);
						}
					}

					for (let i = 0; i < rowCount; i++) {
						rows.push(await buildRow(definition.schema, i, faker, biasedFaker));
					}
				}
			}

			const filteredRows = filter(rows, definition.filters ?? []);

			const output = {
				rows: filteredRows,
				columnTypes: buildOutputTypes(rows),
				expectedRowCount: filteredRows.length
			};

			res(output);

			return output;
		} catch (e) {
			rej(e);
			throw e;
		}
	};

/**
 * @param {{ [s: string]: any; } | ArrayLike<any>} obj
 * @returns {any | ArrayLike<any>}
 */
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
 * @param {{locale?: import("@faker-js/faker").LocaleDefinition, seed?: string}} options
 * @param {string} directory
 */
export const getRunner = (options, directory) => {
	tableMap.clear();
	const locale = [en];

	if (options.locale) {
		options.locale.title = options.locale.title ?? 'Custom Locale';
		locale.splice(0, 0, recursiveFlatten(options.locale));
	}

	/** @type {number | undefined} */
	let seed = 0;

	if (typeof options.seed === 'string')
		for (let i = 0; i < options.seed.length; i++) seed += options.seed.charCodeAt(i);
	else if (typeof options.seed === 'number') seed = options.seed;
	else seed = undefined;

	/** @type {FakerFactory} */
	const getFaker = () => {
		const f = new Faker({
			locale: locale
		});
		f.seed(seed);
		return f;
	};

	/** @type {FakerFactory} */
	const getBiasedFaker = () => {
		const f = new Faker({
			randomizer: randomBiasedNumber(Math.random(), 1),
			locale: locale
		});
		f.seed(seed);
		return f;
	};

	console.warn(
		chalk.bold.dim.yellow(
			'  You are using the faker-datasource, this is not recommended for production use.\n'
		)
	);

	// We pass factory functions here to ensure that each table is generated with a freshly seeded faker instance
	return generateTable(directory, getFaker, getBiasedFaker);
};

export const testConnection = () => Promise.resolve(true);
export const options = {
	seed: {
		title: 'Seed',
		required: false,
		type: 'string'
	}
};

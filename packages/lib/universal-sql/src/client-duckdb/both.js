import { Type } from 'apache-arrow';

/**
 * Converts an Apache Arrow type to an Evidence type.
 *
 * @param {import("apache-arrow").Type} type
 */
function apacheToEvidenceType(type) {
	switch (
		type.typeId // maybe just replace with `typeof`
	) {
		case Type.Date:
			return 'date';
		case Type.Float:
		case Type.Int:
			return 'number';
		case Type.Bool:
			return 'boolean';
		case Type.Dictionary:
		default:
			return 'string';
	}
}

/**
 * Converts an Apache Arrow table to a Javascript array.
 * @param {import("apache-arrow").Table} table
 * @returns {any[]}
 */
export function arrowTableToJSON(table) {
	if (table == null) return [];
	const arr = table.toArray();

	Object.defineProperty(arr, '_evidenceColumnTypes', {
		enumerable: false,
		value: table.schema.fields.map((field) => ({
			name: field.name,
			evidenceType: apacheToEvidenceType(field.type),
			typeFidelity: 'precise'
		}))
	});

	const date_cols = table.schema.fields.filter((field) => field.type.typeId === Type.Date);
	const list_cols = table.schema.fields.filter((field) => field.type.typeId === Type.List);

	for (const row of arr) {
		for (const col of date_cols) {
			row[col.name] = new Date(row[col.name]);
		}
		for (const col of list_cols) {
			row[col.name] = arrowVectorToJSON(row[col.name]);
		}
	}

	return arr;
}

/**
 * Converts an Apache Arrow vector to a Javascript array.
 * @param {import("apache-arrow").Vector} vector
 * @returns {any[]}
 */
function arrowVectorToJSON(vector) {
	if (vector == null) return [];
	const arr = vector.toArray();

	const date_cols = vector.type?.children?.filter((field) => field.type.typeId === Type.Date) ?? [];
	const list_cols = vector.type?.children?.filter((field) => field.type.typeId === Type.List) ?? [];

	for (const row of arr) {
		for (const col of date_cols) {
			row[col.name] = new Date(row[col.name]);
		}
		for (const col of list_cols) {
			row[col.name] = arrowVectorToJSON(row[col.name]);
		}
	}

	return arr;
}

/**
 * Creates a new Promise object and returns it along with its resolve and reject functions.
 *
 * @return {{resolve: CallableFunction, reject: CallableFunction, promise: Promise<void>}} An object containing the resolve and reject functions, as well as the Promise object.
 */
export function getPromise() {
	let resolve, reject;
	let promise = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { resolve, reject, promise };
}

export function withTimeout(p) {
	return Promise.race([
		p,
		new Promise((_, rej) =>
			// If the database isn't initialized after 5 seconds, throw an error
			setTimeout(() => rej(new Error('Timeout while initializing database')), 5000)
		)
	]);
}

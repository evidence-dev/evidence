/**
 * Renames the '_errors' property to 'errors' in the given object and its nested objects recursively.
 * It also removes any empty errors arrays
 *
 * @param {any} obj - The object to rename the '_errors' property in.
 * @return {Object} The object with the renamed property.
 */
export function cleanZodErrors(obj) {
	for (const key in obj) {
		if (typeof obj[key] === 'object') {
			cleanZodErrors(obj[key]); // recursively traverse nested objects
		}
		if (key === '_errors') {
			if (obj['_errors'].length) {
				obj['errors'] = obj['_errors'];
			}
			delete obj['_errors'];
		}
	}
	return obj;
}
